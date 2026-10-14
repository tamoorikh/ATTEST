import React from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { WorkpaperClient } from "./workpaper-client";

export default async function ExceptionWorkpaperPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const exception = await prisma.exception.findUnique({
    where: { id },
    include: {
      org: {
        include: { companyProfile: true },
      },
      bankTx: true,
      ledgerEntry: true,
      evidence: true,
      comments: {
        include: { author: true },
        orderBy: { createdAt: "asc" },
      },
      reviewNotes: {
        include: { author: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!exception) {
    notFound();
  }

  // Calculate priority score & days waiting
  const createdDate = new Date(exception.createdAt);
  const now = new Date();
  const diffMs = Math.max(0, now.getTime() - createdDate.getTime());
  const daysWaiting = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)) || 3);

  const severityWeights: Record<string, number> = {
    CRITICAL: 40,
    HIGH: 30,
    MEDIUM: 20,
    LOW: 10,
    INFO: 5,
  };
  const sevScore = severityWeights[exception.severity] ?? 25;
  const amountScore = Math.min(40, Math.round((exception.amountPaise / 40000000) * 40));
  const ageScore = Math.min(20, daysWaiting * 5);
  const score = Math.min(100, Math.max(10, sevScore + amountScore + ageScore));

  return (
    <WorkpaperClient
      exception={exception}
      org={exception.org}
      score={score}
      daysWaiting={daysWaiting}
    />
  );
}
