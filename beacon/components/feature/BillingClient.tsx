"use client";

import { useState } from "react";
import {
  Home, CheckCircle2, ShieldCheck, FileText, Download,
  Check, Calendar, Zap, MessageSquare, AlertCircle
} from "lucide-react";

interface Transaction {
  id: string;
  amount: number;
  date: string;
  method: string;
  ref: string;
  verified: boolean;
}

export function BillingClient({ userName }: { userName: string }) {
  const [activeTab, setActiveTab] = useState<"payment" | "admin">("admin");
  const [ledgerBalance, setLedgerBalance] = useState<number>(24.50);
  const [cashReceived, setCashReceived] = useState<string>("15.00");
  const [selectedQuickAmount, setSelectedQuickAmount] = useState<number | "custom">(15.00);
  const [auditReason, setAuditReason] = useState("Field cash collection during meter audit");
  const [smsReceipt, setSmsReceipt] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);

  // Initial transactions
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: "tx-1",
      amount: 22.00,
      date: "Sept 26, 2023",
      method: "M-Pesa",
      ref: "Ref: QX781K9",
      verified: true,
    },
    {
      id: "tx-2",
      amount: 18.50,
      date: "Aug 27, 2023",
      method: `Cash Agent (${userName.split(" ")[0]} D.)`,
      ref: "Field Receipt #REC-8041",
      verified: true,
    },
    {
      id: "tx-3",
      amount: 20.00,
      date: "July 29, 2023",
      method: "Airtel Money",
      ref: "Ref: AM-90214",
      verified: true,
    },
  ]);

  const cashNum = parseFloat(cashReceived) || 0;
  const remaining = Math.max(0, ledgerBalance - cashNum);

  const handleSelectQuick = (amt: number | "custom") => {
    setSelectedQuickAmount(amt);
    if (amt !== "custom") {
      setCashReceived(amt.toFixed(2));
    }
  };

  const handleConfirmPayment = () => {
    if (cashNum <= 0) return;
    setIsSubmitting(true);
    setTimeout(() => {
      const newTx: Transaction = {
        id: `tx-${Date.now()}`,
        amount: cashNum,
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        method: `Cash Agent (${userName.split(" ")[0]} D.)`,
        ref: `Field Receipt #REC-${Math.floor(1000 + Math.random() * 9000)}`,
        verified: true,
      };
      setTransactions([newTx, ...transactions]);
      setLedgerBalance(remaining);
      setPaymentSuccess(`Successfully recorded $${cashNum.toFixed(2)} partial cash payment! Offline receipt queued.`);
      setIsSubmitting(false);
      setTimeout(() => setPaymentSuccess(null), 5000);
    }, 600);
  };

  const handleDownloadReceipt = (tx: Transaction) => {
    const content = `BEACON UTILITY GRID - RECEIPT\nTransaction ID: ${tx.id}\nCustomer: Amina & Jo (#BKN-88219-LOD)\nAmount: $${tx.amount.toFixed(2)} USD\nDate: ${tx.date}\nMethod: ${tx.method} (${tx.ref})\nAudit Reason: ${auditReason}\nStatus: VERIFIED & RECONCILED\nIssuer: ${userName}\n`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `receipt_${tx.id}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Customer Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
              <Home className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900 leading-tight">
                  Amina &amp; Jo
                </h2>
                <span className="bg-emerald-100 text-emerald-800 text-[9.5px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  Active Grid
                </span>
              </div>
              <p className="text-xs font-mono text-slate-500 font-semibold mt-0.5">
                #BKN-88219-LOD
              </p>
            </div>
          </div>
        </div>

        <div className="pt-1 text-xs space-y-1 text-slate-600">
          <p className="flex items-center gap-1.5">
            <span className="text-blue-600">📍</span>
            <span>Lodwar Central Microgrid (Cluster 4)</span>
          </p>
          <p className="flex items-center gap-1.5">
            <span className="text-amber-500">⚡</span>
            <span className="font-medium">Meter: MT-4029</span>
          </p>
        </div>
      </div>

      {/* Current Balance Due Card (Dark Navy) */}
      <div className="bg-[#0f172a] text-white rounded-2xl p-4 shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase">
            CURRENT BALANCE DUE
          </span>
          <span className="bg-slate-800 text-slate-300 text-[10px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Due Oct 28, 2023
          </span>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-black tracking-tight text-white">
            ${ledgerBalance.toFixed(2)}
          </span>
          <span className="text-xs font-bold text-slate-400">USD</span>
        </div>

        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Cycle: Sept 15 - Oct 15, 2023</span>
          </div>
          <span className="font-bold text-slate-300">48.2 kWh</span>
        </div>

        <div className="flex items-center gap-2 pt-0.5">
          <span className="text-[11px] text-slate-400">🏷 Tariff Rate:</span>
          <span className="bg-blue-600/90 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-md">
            Lifeline Tier 1 subsidized
          </span>
        </div>
      </div>

      {/* Tab Switcher: Payment View vs Amara Admin */}
      <div className="bg-slate-200/60 p-1 rounded-2xl grid grid-cols-2 gap-1 text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab("payment")}
          className={`py-2 rounded-xl flex items-center justify-center gap-2 transition-all ${
            activeTab === "payment"
              ? "bg-white text-slate-900 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <span>👤 Payment View</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("admin")}
          className={`py-2 rounded-xl flex items-center justify-center gap-2 transition-all ${
            activeTab === "admin"
              ? "bg-white text-blue-600 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          <span>Amara Admin</span>
        </button>
      </div>

      {/* Amara Admin Form */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-4">
        {/* Section Title */}
        <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-3 flex items-start gap-2.5">
          <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-xs font-extrabold text-slate-900">
              Amara Admin: Record Field / Cash Partial Payment
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
              Collect cash on-site and sync offline receipt ledger with mesh beacon.
            </p>
          </div>
        </div>

        {paymentSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-800 font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{paymentSuccess}</span>
          </div>
        )}

        {/* Input: Recorded Cash Received ($) */}
        <div className="space-y-1.5">
          <label className="text-xs font-extrabold text-slate-800">
            Recorded Cash Received ($)
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-black text-slate-500">
              $
            </span>
            <input
              type="number"
              inputMode="decimal"
              step="0.5"
              value={cashReceived}
              onChange={(e) => {
                setCashReceived(e.target.value);
                setSelectedQuickAmount("custom");
              }}
              className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl pl-8 pr-4 py-2.5 text-xl font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        {/* Quick selection pills */}
        <div className="grid grid-cols-4 gap-1.5 text-xs font-bold">
          {[10.00, 15.00, 24.50].map((amt) => {
            const isSelected = selectedQuickAmount === amt;
            return (
              <button
                key={amt}
                type="button"
                onClick={() => handleSelectQuick(amt)}
                className={`py-2 rounded-xl border transition-colors ${
                  isSelected
                    ? "bg-blue-100 text-blue-700 border-blue-300 shadow-2xs"
                    : "bg-[#f8fafc] text-slate-700 border-slate-200 hover:border-slate-300"
                }`}
              >
                ${amt.toFixed(2)}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => handleSelectQuick("custom")}
            className={`py-2 rounded-xl border transition-colors ${
              selectedQuickAmount === "custom"
                ? "bg-blue-100 text-blue-700 border-blue-300 shadow-2xs"
                : "bg-[#f8fafc] text-slate-700 border-slate-200 hover:border-slate-300"
            }`}
          >
            Custom
          </button>
        </div>

        {/* Ledger Breakdown Box */}
        <div className="bg-[#f8fafc] border border-slate-200/80 rounded-xl p-3.5 space-y-2 text-xs">
          <div className="flex items-center justify-between text-slate-600">
            <span>Original Ledger Balance:</span>
            <span className="font-bold text-slate-900">${ledgerBalance.toFixed(2)}</span>
          </div>

          <div className="flex items-center justify-between text-emerald-600 font-semibold">
            <span className="flex items-center gap-1.5">
              <span>💵</span> Partial Cash Applied:
            </span>
            <span>-${cashNum.toFixed(2)}</span>
          </div>

          <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-sm font-black text-slate-900">
            <span>Remaining Balance:</span>
            <span>${remaining.toFixed(2)}</span>
          </div>
        </div>

        {/* Administrative Audit Reason */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-600">
            Administrative Audit Reason
          </label>
          <select
            value={auditReason}
            onChange={(e) => setAuditReason(e.target.value)}
            className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none"
          >
            <option value="Field cash collection during meter audit">
              Field cash collection during meter audit
            </option>
            <option value="Grid connection subsidy settlement">
              Grid connection subsidy settlement
            </option>
            <option value="Household hardship relief credit">
              Household hardship relief credit
            </option>
            <option value="Reconciliation of offline payment token">
              Reconciliation of offline payment token
            </option>
          </select>
        </div>

        {/* Checkbox: Dispatch SMS receipt */}
        <label className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-slate-50 cursor-pointer">
          <input
            type="checkbox"
            checked={smsReceipt}
            onChange={(e) => setSmsReceipt(e.target.checked)}
            className="mt-0.5 rounded text-blue-600 focus:ring-0 w-4 h-4 cursor-pointer"
          />
          <div className="text-xs">
            <p className="font-bold text-slate-900 flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
              Generate &amp; Dispatch SMS Receipt
            </p>
            <p className="text-[11px] text-slate-500">
              Sends code instantly via offline SIM relay
            </p>
          </div>
        </label>

        {/* Confirm Payment Button */}
        <button
          type="button"
          onClick={handleConfirmPayment}
          disabled={isSubmitting || cashNum <= 0}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-extrabold text-xs py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
        >
          {isSubmitting ? (
            <span>Processing Payment...</span>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm &amp; Record Partial Payment</span>
            </>
          )}
        </button>
      </div>

      {/* Payment History Section */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <h3 className="font-extrabold text-slate-900">Payment History</h3>
          <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
            {transactions.length} VERIFIED TRANSACTIONS
          </span>
        </div>

        {/* History Filters */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <select className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700">
            <option>📅 Date: Last 6 Months</option>
            <option>All Time</option>
          </select>
          <select className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700">
            <option>⚙ Status: All</option>
            <option>Verified Only</option>
          </select>
        </div>

        {/* Transaction Cards List */}
        <div className="space-y-2">
          {transactions.map((tx) => (
            <div
              key={tx.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-xs flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 stroke-[2]" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-slate-900">
                      ${tx.amount.toFixed(2)}
                    </span>
                    <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                      Paid &amp; Verified
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    {tx.date} • {tx.method}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    ({tx.ref})
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleDownloadReceipt(tx)}
                className="w-8 h-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center flex-shrink-0 transition-colors shadow-2xs"
                title="Download Receipt"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Clock({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" strokeWidth="2" />
      <path strokeLinecap="round" strokeWidth="2" d="M12 6v6l4 2" />
    </svg>
  );
}

