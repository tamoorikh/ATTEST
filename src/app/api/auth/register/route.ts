import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { appendAuditEvent } from "@/lib/audit";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  orgName: z.string().min(2, "Organization name must be at least 2 characters"),
  role: z.enum(["Owner", "FinanceManager", "Accountant", "CA-reviewer"]).default("Owner"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = registerSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation error", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, email, password, orgName, role } = result.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const slugBase = orgName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    const slug = `${slugBase}-${randomSuffix}`;

    const created = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email: normalizedEmail,
          passwordHash,
        },
      });

      const org = await tx.organization.create({
        data: {
          name: orgName,
          slug,
          isDemo: false,
        },
      });

      await tx.companyProfile.create({
        data: {
          orgId: org.id,
          legalName: orgName,
          jurisdiction: "PK",
        },
      });

      const membership = await tx.membership.create({
        data: {
          userId: user.id,
          orgId: org.id,
          role,
        },
      });

      return { user, org, membership };
    });

    await appendAuditEvent({
      orgId: created.org.id,
      actorId: created.user.id,
      action: "USER_REGISTERED",
      entityType: "User",
      entityId: created.user.id,
      metadata: { email: normalizedEmail, role },
    });

    return NextResponse.json(
      {
        message: "Account registered successfully",
        userId: created.user.id,
        orgId: created.org.id,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error occurred during registration" },
      { status: 500 }
    );
  }
}
