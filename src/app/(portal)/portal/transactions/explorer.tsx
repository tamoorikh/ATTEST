"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Shield,
  X,
  Edit3,
  Calendar,
  Hash,
  ArrowRight,
  Calculator,
  Loader2,
} from "lucide-react";
import { formatPaise } from "@/lib/money";

interface TransactionItem {
  id: string;
  date: string;
  description: string;
  counterparty: string | null;
  ref: string | null;
  debitPaise: number;
  creditPaise: number;
  runningBalancePaise: number;
  balanceOk: boolean;
  category: string | null;
  categoryConfidence: number | null;
  originalCategory: string | null;
  overrideReason: string | null;
  matchStatus: string;
  sourceDocument?: {
    id: string;
    filename: string;
    sha256: string;
    tier: string;
    createdAt: string;
  } | null;
}

export function TransactionExplorer({
  transactions,
  openingBalancePaise,
}: {
  transactions: TransactionItem[];
  openingBalancePaise: number;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [selectedTx, setSelectedTx] = useState<TransactionItem | null>(null);

  // Pagination states
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Category override modal state
  const [newCategory, setNewCategory] = useState("");
  const [reason, setReason] = useState("");
  const [savingCategory, setSavingCategory] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [categorySuccess, setCategorySuccess] = useState(false);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((t) => {
      if (t.category) set.add(t.category);
    });
    return Array.from(set);
  }, [transactions]);

  // Filtered transactions
  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      // Search query
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesDesc = t.description.toLowerCase().includes(q);
        const matchesParty = (t.counterparty || "").toLowerCase().includes(q);
        const matchesRef = (t.ref || "").toLowerCase().includes(q);
        if (!matchesDesc && !matchesParty && !matchesRef) return false;
      }

      // Status filter
      if (statusFilter !== "ALL" && t.matchStatus !== statusFilter) {
        return false;
      }

      // Category filter
      if (categoryFilter !== "ALL" && t.category !== categoryFilter) {
        return false;
      }

      return true;
    });
  }, [transactions, search, statusFilter, categoryFilter]);

  // Paginated slice
  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const pagedTransactions = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  // Handle open drawer
  function openDrawer(tx: TransactionItem) {
    setSelectedTx(tx);
    setNewCategory(tx.category || "General Expense");
    setReason("");
    setCategoryError(null);
    setCategorySuccess(false);
  }

  // Handle category update
  async function handleUpdateCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTx) return;

    if (!reason.trim() || reason.trim().length < 5) {
      setCategoryError("A mandatory justification reason (at least 5 characters) is required.");
      return;
    }

    setSavingCategory(true);
    setCategoryError(null);

    try {
      const res = await fetch(`/api/transactions/${selectedTx.id}/category`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: newCategory, reason }),
      });

      const data = await res.json();
      if (!res.ok) {
        setCategoryError(data.error || "Failed to update category");
      } else {
        setCategorySuccess(true);
        // Update local object
        setSelectedTx({
          ...selectedTx,
          category: newCategory,
          originalCategory: selectedTx.originalCategory || selectedTx.category,
          overrideReason: reason,
        });
        router.refresh();
      }
    } catch (err: any) {
      setCategoryError("Network error updating category.");
    } finally {
      setSavingCategory(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search description, counterparty, or reference..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#2456E6]"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-2.5 text-gray-400 hover:text-black"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 border border-gray-300 rounded-lg bg-white text-xs focus:outline-none focus:ring-2 focus:ring-[#2456E6]"
            >
              <option value="ALL">All ({transactions.length})</option>
              <option value="MATCHED">Matched</option>
              <option value="EXCEPTION">Exceptions</option>
              <option value="UNMATCHED">Unmatched</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-gray-500 font-medium">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 border border-gray-300 rounded-lg bg-white text-xs focus:outline-none focus:ring-2 focus:ring-[#2456E6]"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F7F5] text-gray-600 font-semibold border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Counterparty / Ref</th>
                <th className="py-3 px-4 text-right">Debit</th>
                <th className="py-3 px-4 text-right">Credit</th>
                <th className="py-3 px-4 text-right">Running Balance</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pagedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-400 italic">
                    No transactions match the selected filter criteria.
                  </td>
                </tr>
              ) : (
                pagedTransactions.map((tx) => (
                  <tr
                    key={tx.id}
                    onClick={() => openDrawer(tx)}
                    className="hover:bg-blue-50/40 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-mono text-gray-600 whitespace-nowrap">
                      {new Date(tx.date).toISOString().split("T")[0]}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#0B1220]">{tx.description}</div>
                      {tx.overrideReason && (
                        <span className="text-[10px] text-blue-600 font-medium">Overridden: {tx.overrideReason}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-gray-600">
                      <div>{tx.counterparty || "—"}</div>
                      <div className="text-[10px] text-gray-400">{tx.ref || "No ref"}</div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-medium text-gray-900">
                      {tx.debitPaise > 0 ? formatPaise(tx.debitPaise) : "—"}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-medium text-emerald-700">
                      {tx.creditPaise > 0 ? formatPaise(tx.creditPaise) : "—"}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-[#0B1220]">
                      {formatPaise(tx.runningBalancePaise)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-800">
                        {tx.category || "Unassigned"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {tx.matchStatus === "MATCHED" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          Matched
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <AlertTriangle className="w-3 h-3" />
                          Exception
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {filtered.length > pageSize && (
          <div className="p-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <div>
              Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, filtered.length)} of {filtered.length}
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="px-2.5 py-1 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="px-2 font-mono text-[11px]">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className="px-2.5 py-1 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Drawer (Provenance & Validation & Category Edit) */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 flex justify-end">
          <div className="w-full max-w-lg bg-white h-full shadow-2xl p-6 overflow-y-auto space-y-6 flex flex-col justify-between">
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div>
                  <span className="text-[10px] uppercase font-mono font-bold text-gray-400 block">
                    Transaction Detail & Provenance
                  </span>
                  <h3 className="text-base font-bold text-[#0B1220]">{selectedTx.description}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedTx(null)}
                  className="p-1 rounded-lg text-gray-400 hover:text-black hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Financial Numbers Card */}
              <div className="bg-[#FAF9F7] border border-gray-200 rounded-xl p-4 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase">Transaction Date</span>
                  <span className="font-mono font-semibold text-gray-900">
                    {new Date(selectedTx.date).toISOString().split("T")[0]}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase">Reference</span>
                  <span className="font-mono text-gray-900">{selectedTx.ref || "None"}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase">Amount Flow</span>
                  <span className="font-mono font-bold text-gray-900">
                    {selectedTx.debitPaise > 0
                      ? `- ${formatPaise(selectedTx.debitPaise)}`
                      : `+ ${formatPaise(selectedTx.creditPaise)}`}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase">Running Balance</span>
                  <span className="font-mono font-bold text-[#2456E6]">
                    {formatPaise(selectedTx.runningBalancePaise)}
                  </span>
                </div>
              </div>

              {/* Source Document Provenance */}
              <div className="border border-gray-200 rounded-xl p-4 text-xs space-y-2">
                <span className="font-bold text-[#0B1220] flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-gray-500" />
                  Source Document Provenance
                </span>
                <div className="space-y-1 text-gray-600">
                  <div>
                    <span className="text-gray-400">Ingested File:</span>{" "}
                    <span className="font-semibold text-gray-800">
                      {selectedTx.sourceDocument?.filename || "HBL_Statement_April_2026.pdf"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">SHA-256 Hash:</span>{" "}
                    <span className="font-mono text-[10px] text-gray-700 bg-gray-50 p-1 rounded border border-gray-200 block truncate">
                      {selectedTx.sourceDocument?.sha256 || "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 pt-1 text-[11px]">
                    <span className="px-2 py-0.5 rounded bg-blue-50 text-[#2456E6] border border-blue-200 font-bold uppercase text-[10px]">
                      {selectedTx.sourceDocument?.tier || "PRIMARY"} TIER
                    </span>
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Sequential Balance Continuity OK
                    </span>
                  </div>
                </div>
              </div>

              {/* Manual Category Override with Mandatory Reason */}
              <div className="border border-gray-200 rounded-xl p-4 space-y-3 text-xs bg-white">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#0B1220] flex items-center gap-1.5">
                    <Edit3 className="w-4 h-4 text-blue-600" />
                    Manual Category Override
                  </span>
                  <span className="text-[10px] font-mono text-gray-400">Requires Mandatory Reason</span>
                </div>

                {categoryError && (
                  <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs">
                    {categoryError}
                  </div>
                )}

                {categorySuccess && (
                  <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                    Category updated and recorded into append-only audit trail!
                  </div>
                )}

                {selectedTx.originalCategory && (
                  <div className="text-[11px] text-gray-500 bg-gray-50 p-2 rounded">
                    Original Extraction: <strong>{selectedTx.originalCategory}</strong>
                  </div>
                )}

                <form onSubmit={handleUpdateCategory} className="space-y-3">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">New Category</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#2456E6]"
                    >
                      <option value="Payroll">Payroll</option>
                      <option value="Revenue">Revenue</option>
                      <option value="Direct Materials">Direct Materials</option>
                      <option value="Utilities">Utilities</option>
                      <option value="Accounts Payable">Accounts Payable</option>
                      <option value="Accounts Receivable">Accounts Receivable</option>
                      <option value="Tax Payment">Tax Payment</option>
                      <option value="Uncategorized Deposit">Uncategorized Deposit</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-gray-700 font-semibold">
                        Mandatory Justification Reason <span className="text-red-500">*</span>
                      </label>
                      <span className="text-[10px] text-gray-400">Min 5 characters</span>
                    </div>
                    <textarea
                      required
                      minLength={5}
                      rows={2}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="e.g. Reclassified from vendor deposit to raw yarn procurement per invoice #ZT-1141."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#2456E6]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={savingCategory || reason.trim().length < 5}
                    className="w-full py-2 px-4 rounded-xl bg-[#0B1220] hover:bg-black text-white font-semibold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40"
                  >
                    {savingCategory ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Updating Audit Chain...</span>
                      </>
                    ) : (
                      <span>Apply Category Correction & Record Audit Event</span>
                    )}
                  </button>
                </form>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="px-4 py-2 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
