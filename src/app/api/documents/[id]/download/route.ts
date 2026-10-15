import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { storage } from "@/lib/storage";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const doc = await prisma.sourceDocument.findUnique({
    where: { id },
  });

  if (!doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  // Strict tenant boundary check
  if (doc.orgId !== session.user.orgId) {
    return NextResponse.json({ error: "Tenant boundary violation" }, { status: 403 });
  }

  if (!doc.storagePath) {
    return NextResponse.json({ error: "File has no storage path on server" }, { status: 404 });
  }

  try {
    const { buffer: fileBuffer } = await storage.downloadFile(doc.storagePath);

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        "Content-Type": doc.mime || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(doc.filename)}"`,
        "Content-Length": fileBuffer.length.toString(),
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err: any) {
    console.error(`Download error for doc ${doc.id}:`, err);
    return NextResponse.json({ error: "File not found on storage" }, { status: 404 });
  }
}
