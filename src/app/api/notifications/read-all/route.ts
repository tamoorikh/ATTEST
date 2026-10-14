import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const orgId = session.user.orgId;

    await prisma.notification.updateMany({
      where: { userId, orgId, read: false },
      data: { read: true },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error marking all notifications as read:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
