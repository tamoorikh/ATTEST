import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

export interface UploadOptions {
  orgId: string;
  filename: string;
  buffer: Buffer;
  mimeType?: string;
  bucketName?: string;
  sha256?: string;
}

export interface UploadResult {
  storagePath: string;
  provider: "supabase" | "local";
  projectRef?: string;
  bucketName?: string;
  size: number;
}

export interface DownloadResult {
  buffer: Buffer;
  mimeType?: string;
  size: number;
}

export interface StorageHealth {
  status: "ok" | "degraded" | "error";
  provider: "supabase" | "local";
  projectRef?: string;
  bucketName: string;
  bucketExists: boolean;
  message: string;
}

class StorageService {
  private supabaseClient: ReturnType<typeof createClient> | null = null;
  private verifiedBuckets: Set<string> = new Set();

  private getProvider(): "supabase" | "local" {
    if (process.env.STORAGE_PROVIDER === "supabase") return "supabase";
    if (process.env.STORAGE_PROVIDER === "local") return "local";
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return "supabase";
    }
    return "local";
  }

  private getProjectRef(): string {
    const url = process.env.SUPABASE_URL || "";
    try {
      const parsed = new URL(url);
      const hostParts = parsed.hostname.split(".");
      return hostParts[0] || "unknown-project";
    } catch {
      return "unknown-project";
    }
  }

  private getSupabaseAdmin() {
    if (this.supabaseClient) return this.supabaseClient;

    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error(
        "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for Supabase Storage operation."
      );
    }

    this.supabaseClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    return this.supabaseClient;
  }

  /**
   * Ensures the private evidence bucket exists in Supabase.
   * Auto-creates the bucket server-side via service role key on first use if missing.
   */
  async ensureBucketExists(bucketName: string = "evidence"): Promise<boolean> {
    if (this.verifiedBuckets.has(bucketName)) return true;

    const supabase = this.getSupabaseAdmin();
    const projectRef = this.getProjectRef();

    try {
      const { data: bucket, error: getErr } = await supabase.storage.getBucket(bucketName);

      if (bucket && !getErr) {
        this.verifiedBuckets.add(bucketName);
        return true;
      }

      console.warn(
        `[Storage:supabase] Bucket "${bucketName}" not found on project "${projectRef}". Creating private bucket server-side...`
      );

      const { error: createErr } = await supabase.storage.createBucket(bucketName, {
        public: false,
        fileSizeLimit: 25 * 1024 * 1024, // 25MB statutory limit
        allowedMimeTypes: ["application/pdf", "text/csv", "text/plain", "image/png", "image/jpeg"],
      });

      if (createErr && !createErr.message.toLowerCase().includes("already exists")) {
        console.error(`[Storage:supabase] Failed to create bucket "${bucketName}":`, createErr);
        throw createErr;
      }

      console.log(
        `[Storage:supabase] Successfully created private bucket "${bucketName}" on project "${projectRef}".`
      );
      this.verifiedBuckets.add(bucketName);
      return true;
    } catch (err: any) {
      console.error(`[Storage:supabase] Error ensuring bucket "${bucketName}" exists:`, err);
      throw err;
    }
  }

  /**
   * Upload a file either to Supabase Storage (private bucket) or local filesystem fallback.
   */
  async uploadFile(options: UploadOptions): Promise<UploadResult> {
    const { orgId, filename, buffer, mimeType = "application/octet-stream", sha256 } = options;
    const provider = this.getProvider();
    const targetBucket = options.bucketName || process.env.SUPABASE_STORAGE_BUCKET || "evidence";
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9_\-\.]/g, "_");

    if (provider === "supabase") {
      const supabase = this.getSupabaseAdmin();
      const projectRef = this.getProjectRef();

      // Step C2: Ensure bucket exists on first use in Supabase mode
      await this.ensureBucketExists(targetBucket);

      const filePrefix = sha256 ? sha256.substring(0, 16) : Date.now().toString();
      const relativeStoragePath = `${orgId}/${filePrefix}_${sanitizedFilename}`;

      const { error: uploadError } = await supabase.storage
        .from(targetBucket)
        .upload(relativeStoragePath, buffer, {
          contentType: mimeType,
          upsert: true,
        });

      if (uploadError) {
        console.error(`[Storage:supabase] Upload failed to project "${projectRef}":`, uploadError);
        throw new Error(`Supabase storage upload failed: ${uploadError.message}`);
      }

      console.log(
        `[Storage:supabase] Successfully stored "${filename}" (${buffer.length} bytes) in bucket "${targetBucket}" on project "${projectRef}" at path: ${relativeStoragePath}`
      );

      return {
        storagePath: `supabase:${targetBucket}:${relativeStoragePath}`,
        provider: "supabase",
        projectRef,
        bucketName: targetBucket,
        size: buffer.length,
      };
    } else {
      // Local storage fallback
      const storageDir = path.join(process.cwd(), "storage", orgId);
      if (!fs.existsSync(storageDir)) {
        fs.mkdirSync(storageDir, { recursive: true });
      }

      const filePrefix = sha256 ? sha256 : Date.now().toString();
      const storageFilename = `${filePrefix}_${sanitizedFilename}`;
      const localAbsPath = path.join(storageDir, storageFilename);
      fs.writeFileSync(localAbsPath, buffer);

      const relativePath = path.relative(process.cwd(), localAbsPath);
      console.log(
        `[Storage:local] Stored "${filename}" (${buffer.length} bytes) locally at path: ${relativePath}`
      );

      return {
        storagePath: relativePath,
        provider: "local",
        bucketName: targetBucket,
        size: buffer.length,
      };
    }
  }

  /**
   * Download a file buffer given its storage path (handles both supabase: and local:).
   */
  async downloadFile(storagePath: string): Promise<DownloadResult> {
    if (storagePath.startsWith("supabase:")) {
      const parts = storagePath.split(":");
      const bucketName = parts[1] || "evidence";
      const filePath = parts.slice(2).join(":");

      const supabase = this.getSupabaseAdmin();
      const projectRef = this.getProjectRef();

      const { data, error } = await supabase.storage.from(bucketName).download(filePath);
      if (error || !data) {
        throw new Error(
          `Failed to download file from Supabase (${projectRef}/${bucketName}/${filePath}): ${error?.message || "File not found"}`
        );
      }

      const arrayBuffer = await data.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      return {
        buffer,
        mimeType: data.type,
        size: buffer.length,
      };
    } else {
      // Local path
      const absolutePath = path.resolve(process.cwd(), storagePath);
      if (!fs.existsSync(absolutePath)) {
        throw new Error(`Local file not found at path: ${storagePath}`);
      }

      const buffer = fs.readFileSync(absolutePath);
      return {
        buffer,
        size: buffer.length,
      };
    }
  }

  /**
   * Health check for storage system (admin pre-launch verification).
   */
  async checkHealth(): Promise<StorageHealth> {
    const provider = this.getProvider();
    const bucketName = process.env.SUPABASE_STORAGE_BUCKET || "evidence";

    if (provider === "supabase") {
      const projectRef = this.getProjectRef();
      try {
        const supabase = this.getSupabaseAdmin();
        const { data: bucket, error } = await supabase.storage.getBucket(bucketName);

        if (error || !bucket) {
          // Attempt to create if missing
          try {
            await this.ensureBucketExists(bucketName);
            return {
              status: "ok",
              provider: "supabase",
              projectRef,
              bucketName,
              bucketExists: true,
              message: `Bucket "${bucketName}" was auto-created on Supabase project "${projectRef}".`,
            };
          } catch (createErr: any) {
            return {
              status: "error",
              provider: "supabase",
              projectRef,
              bucketName,
              bucketExists: false,
              message: `Bucket "${bucketName}" does not exist on Supabase project "${projectRef}" and auto-creation failed: ${createErr.message}`,
            };
          }
        }

        return {
          status: "ok",
          provider: "supabase",
          projectRef,
          bucketName,
          bucketExists: true,
          message: `Connected to Supabase project "${projectRef}". Private bucket "${bucketName}" is accessible (public=${bucket.public}).`,
        };
      } catch (err: any) {
        return {
          status: "error",
          provider: "supabase",
          projectRef,
          bucketName,
          bucketExists: false,
          message: `Failed to connect to Supabase storage on project "${projectRef}": ${err.message}`,
        };
      }
    } else {
      // Local storage
      const storageDir = path.join(process.cwd(), "storage");
      const exists = fs.existsSync(storageDir);
      if (!exists) {
        fs.mkdirSync(storageDir, { recursive: true });
      }

      return {
        status: "ok",
        provider: "local",
        bucketName: "local-storage",
        bucketExists: true,
        message: `Local file storage is active at ${storageDir} (development/offline fallback mode).`,
      };
    }
  }
}

export const storage = new StorageService();
