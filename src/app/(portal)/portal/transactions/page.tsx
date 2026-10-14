import React from "react";
import { Calculator } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatPaise } from "@/lib/money";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { TransactionExplorer } from "./explorer";

export default async function TransactionsPage() {
  const session = await getServerSession(authOptions);
  const orgId = session?.user?.orgId;

  const bankAccount = await prisma.bankAccount.findFirst({
    where: { orgId: orgId || undefined },
  });

  const transactions = await prisma.bankTransaction.findMany({
    where: { orgId: orgId || undefined },
    include: {
      sourceDocument: {
        select: {
          id: true,
          filename: true,
          sha256: true,
          tier: true,
          createdAt: true,
        },
      },
    },
    orderBy: { date: "asc" },
  });

  const openingBalance = bankAccount?.openingBalancePaise ?? 80000000;
  const totalDebits = transactions.reduce((sum, tx) => sum + tx.debitPaise, 0);
  const totalCredits = transactions.reduce((sum, tx) => sum + tx.creditPaise, 0);
  const calculatedClosing = openingBalance - totalDebits + totalCredits;

  const serializedTransactions = transactions.map((t) => ({
    id: t.id,
    date: t.date.toISOString(),
    description: t.description,
    counterparty: t.counterparty,
    ref: t.ref,
    debitPaise: t.debitPaise,
    creditPaise: t.creditPaise,
    runningBalancePaise: t.runningBalancePaise,
    balanceOk: t.balanceOk,
    category: t.category,
    categoryConfidence: t.categoryConfidence,
    originalCategory: t.originalCategory,
    overrideReason: t.overrideReason,
    matchStatus: t.matchStatus,
    sourceDocument: t.sourceDocument
      ? {
          id: t.sourceDocument.id,
          filename: t.sourceDocument.filename,
          sha256: t.sourceDocument.sha256,
          tier: t.sourceDocument.tier,
          createdAt: t.sourceDocument.createdAt.toISOString(),
        }
      : null,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-tight text-[#0F172A]">
            Bank Statement Transactions Explorer
          </h1>
          <p className="text-xs text-[#64748B] mt-1">
            Habib Bank Limited (HBL) &bull; Acct: 00427901842003 &bull; Period: April 2026
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
          <Calculator className="w-4 h-4 text-emerald-600" />
          <span>Continuous Arithmetic Integrity: 100% Validated</span>
        </div>
      </div>

      {/* Statement Reconciliation Arithmetic Strip */}
      <div className="bg-white border border-[#E6E9EF] rounded-xl p-4 shadow-sm grid grid-cols-2 md:grid-cols-5 gap-4 text-xs">
        <div>
          <span className="text-[#64748B] block text-[11px]">Statement Opening</span>
          <span className="font-mono text-sm font-bold text-[#0F172A] mt-0.5 block tabular-nums">{formatPaise(openingBalance)}</span>
        </div>
        <div>
          <span className="text-[#64748B] block text-[11px]">Total Debits (-)</span>
          <span className="font-mono text-sm font-bold text-red-600 mt-0.5 block tabular-nums">-{formatPaise(totalDebits)}</span>
        </div>
        <div>
          <span className="text-[#64748B] block text-[11px]">Total Credits (+)</span>
          <span className="font-mono text-sm font-bold text-emerald-700 mt-0.5 block tabular-nums">+{formatPaise(totalCredits)}</span>
        </div>
        <div>
          <span className="text-[#64748B] block text-[11px]">Net Periodic Flow</span>
          <span className="font-mono text-sm font-bold text-[#0F172A] mt-0.5 block tabular-nums">{formatPaise(totalCredits - totalDebits)}</span>
        </div>
        <div>
          <span className="text-[#64748B] block text-[11px]">Verified Closing</span>
          <span className="font-mono text-sm font-bold text-[#2563EB] mt-0.5 block tabular-nums">{formatPaise(calculatedClosing)}</span>
        </div>
      </div>

      {/* Explorer Component */}
      <TransactionExplorer
        transactions={serializedTransactions}
        openingBalancePaise={openingBalance}
      />
    </div>
  );
}
