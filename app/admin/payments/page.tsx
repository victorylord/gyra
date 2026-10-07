"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAccessToken } from "../../supabase";

type Payment = {
  id: string;
  user_id: string;
  email: string;
  plan: string;
  amount_ngn: number;
  method: string;
  reference: string;
  screenshot_url: string | null;
  screenshotSignedUrl?: string | null;
  status: string;
  admin_note: string | null;
  submitted_at: string;
  reviewed_at: string | null;
};

type Filter = "pending" | "approved" | "rejected" | "all";

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("pending");
  const [processing, setProcessing] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = async () => {
    const token = await getAccessToken();
    if (!token) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    const res = await fetch("/api/admin/payments", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    const data = await res.json();
    setPayments(data.payments || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 45_000);
    return () => clearInterval(id);
  }, []);

  const approve = async (id: string) => {
    if (!confirm("Approve this payment and activate SuperGyra for this user?"))
      return;
    setProcessing(id);
    const token = await getAccessToken();
    if (!token) return;

    const res = await fetch(`/api/admin/payments/${id}/approve`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(`Approval failed: ${data?.error?.message || "Unknown error"}`);
    } else {
      alert("Approved. User is now SuperGyra.");
    }

    setProcessing(null);
    load();
  };

  const reject = async (id: string) => {
    const note = prompt("Reason for rejection (optional):");
    if (note === null) return;

    setProcessing(id);
    const token = await getAccessToken();
    if (!token) return;

    await fetch(`/api/admin/payments/${id}/reject`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ note }),
    });

    setProcessing(null);
    load();
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center mb-6">
          <svg
            className="w-12 h-12 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <h1 className="text-3xl font-bold mb-4">Access Denied</h1>
        <p className="text-zinc-500 mb-8">
          This area is reserved for Gyra administrators.
        </p>
        <Link
          href="/dashboard"
          className="bg-white text-black px-6 py-3 rounded-full font-medium hover:bg-zinc-200 transition-colors"
        >
          Back to Dashboard
        </Link>
      </main>
    );
  }

  const counts = {
    pending: payments.filter((p) => p.status === "pending").length,
    approved: payments.filter((p) => p.status === "approved").length,
    rejected: payments.filter((p) => p.status === "rejected").length,
    all: payments.length,
  };

  const filtered =
    filter === "all" ? payments : payments.filter((p) => p.status === filter);

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Top bar */}
      <div className="border-b border-zinc-800/50 px-6 py-4 flex items-center justify-between sticky top-0 bg-black/95 backdrop-blur z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center font-bold text-lg">
            G
          </div>
          <div>
            <span className="font-bold tracking-tight text-lg block leading-none">
              Gyra Admin
            </span>
            <span className="text-[10px] text-zinc-500">Payment Approvals</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            ← Main Admin
          </Link>
          <Link
            href="/dashboard"
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            App
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { label: "Pending", value: counts.pending, color: "text-yellow-400" },
            { label: "Approved", value: counts.approved, color: "text-green-400" },
            { label: "Rejected", value: counts.rejected, color: "text-red-400" },
            { label: "All time", value: counts.all, color: "text-zinc-300" },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5"
            >
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">
                {s.label}
              </p>
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {(["pending", "approved", "rejected", "all"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                filter === f
                  ? "bg-white text-black"
                  : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {counts[f] > 0 && ` (${counts[f]})`}
            </button>
          ))}
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-12 text-center">
            <p className="text-zinc-500">
              No {filter === "all" ? "" : filter} payments.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((p) => {
              const expanded = expandedId === p.id;
              return (
                <div
                  key={p.id}
                  className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden"
                >
                  {/* Row header */}
                  <button
                    onClick={() => setExpandedId(expanded ? null : p.id)}
                    className="w-full flex items-center gap-4 p-5 text-left hover:bg-zinc-900/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <p className="font-semibold text-sm truncate">
                          {p.email}
                        </p>
                        <StatusPill status={p.status} />
                      </div>
                      <p className="text-xs text-zinc-500">
                        {p.plan} · ₦{p.amount_ngn.toLocaleString()} ·{" "}
                        {p.method.toUpperCase()} ·{" "}
                        {new Date(p.submitted_at).toLocaleString()}
                      </p>
                    </div>
                    <svg
                      className={`w-5 h-5 text-zinc-500 transition-transform ${
                        expanded ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {/* Expanded body */}
                  {expanded && (
                    <div className="border-t border-zinc-800 p-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5 text-sm">
                        <Detail label="User ID" value={p.user_id} mono />
                        <Detail label="Plan" value={p.plan} capitalize />
                        <Detail
                          label="Amount"
                          value={`₦${p.amount_ngn.toLocaleString()}`}
                          mono
                        />
                        <Detail
                          label="Method"
                          value={p.method.toUpperCase()}
                        />
                        <Detail
                          label="Reference"
                          value={p.reference}
                          mono
                          full
                        />
                        {p.reviewed_at && (
                          <Detail
                            label="Reviewed"
                            value={new Date(p.reviewed_at).toLocaleString()}
                          />
                        )}
                        {p.admin_note && (
                          <Detail
                            label="Admin note"
                            value={p.admin_note}
                            full
                          />
                        )}
                      </div>

                      {p.screenshotSignedUrl ? (
                        <div className="mb-5">
                          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">
                            Screenshot
                          </p>
                          <a
                            href={p.screenshotSignedUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="block"
                          >
                            <img
                              src={p.screenshotSignedUrl}
                              alt="Payment proof"
                              className="w-full max-h-96 object-contain rounded-xl border border-zinc-800 bg-black"
                            />
                          </a>
                        </div>
                      ) : (
                        <div className="mb-5 bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-xs text-zinc-500">
                          No screenshot uploaded
                        </div>
                      )}

                      {p.status === "pending" && (
                        <div className="flex flex-col md:flex-row gap-2">
                          <button
                            onClick={() => approve(p.id)}
                            disabled={processing === p.id}
                            className="flex-1 bg-green-600 hover:bg-green-500 py-3 rounded-full text-sm font-semibold transition-colors disabled:opacity-50"
                          >
                            {processing === p.id
                              ? "Approving…"
                              : "✓ Approve & activate SuperGyra"}
                          </button>
                          <button
                            onClick={() => reject(p.id)}
                            disabled={processing === p.id}
                            className="md:w-40 bg-red-600/20 border border-red-600/50 text-red-400 hover:bg-red-600/30 py-3 rounded-full text-sm font-medium transition-colors disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <p className="text-center text-xs text-zinc-600 mt-12">
          Refreshes automatically every 45 seconds
        </p>
      </div>
    </main>
  );
}

function StatusPill({ status }: { status: string }) {
  const styles =
    status === "pending"
      ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
      : status === "approved"
      ? "bg-green-500/10 text-green-400 border-green-500/30"
      : "bg-red-500/10 text-red-400 border-red-500/30";

  return (
    <span
      className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${styles}`}
    >
      {status}
    </span>
  );
}

function Detail({
  label,
  value,
  mono,
  capitalize,
  full,
}: {
  label: string;
  value: string;
  mono?: boolean;
  capitalize?: boolean;
  full?: boolean;
}) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">
        {label}
      </p>
      <p
        className={`${mono ? "font-mono text-xs" : ""} ${
          capitalize ? "capitalize" : ""
        } break-all`}
      >
        {value}
      </p>
    </div>
  );
}