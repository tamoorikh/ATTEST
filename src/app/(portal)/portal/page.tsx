import React from "react";
import { prisma } from "@/lib/prisma";
import { PortalDashboardClient } from "./dashboard-client";

export default async function PortalDashboardPage() {
  // Retrieve demo organization details and metrics
  const org = await prisma.organization.findFirst({
    where: { isDemo: true },
    include: {
      bankAccounts: true,
      bankTransactions: {
        orderBy: { date: "asc" },
      },
      exceptions: {
        include: {
          bankTx: {
            select: { counterparty: true },
          },
        },
        orderBy: { severity: "asc" },
      },
      certificates: {
        take: 1,
        orderBy: { createdAt: "desc" },
        include: {
          signedBy: {
            select: { name: true },
          },
        },
      },
      processingRuns: {
        take: 1,
        orderBy: { createdAt: "desc" },
      },
      auditEvents: {
        take: 5,
        orderBy: { createdAt: "desc" },
      },
    },
  });

  const transactions = org?.bankTransactions || [];
  const allExceptions = org?.exceptions || [];
  const certificate = org?.certificates[0] || null;
  const matchedCount = transactions.filter((t) => t.matchStatus === "MATCHED").length;
  const latestBalance = transactions[transactions.length - 1]?.runningBalancePaise ?? 163650000;
  const recentAuditEvents = (org?.auditEvents || []).map((e) => ({
    id: e.id,
    action: e.action,
    createdAt: e.createdAt,
    details: e.metadataJson,
  }));

  const exceptionsData = allExceptions.map((e) => ({
    id: e.id,
    type: e.type,
    severity: e.severity,
    status: e.status,
    title: e.title,
    explanation: e.explanation,
    amountPaise: e.amountPaise,
    counterparty: e.bankTx?.counterparty,
  }));

  return (
    <PortalDashboardClient
      userName="Tariq Mahmood"
      orgName={org?.name || "Meridian Textiles (Pvt) Ltd"}
      latestBalance={latestBalance}
      transactionsCount={transactions.length}
      matchedCount={matchedCount}
      exceptions={exceptionsData}
      certificate={certificate}
      recentAuditEvents={recentAuditEvents}
    />
  );
}
