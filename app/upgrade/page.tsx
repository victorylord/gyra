"use client";

import { Suspense, useState, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase, getAccessToken } from "../supabase";
import {
  BANK,
  CRYPTO,
  PRICING,
  type PlanId,
  NGN_PER_USD,
} from "../lib/paymentConfig";
import Logo from "../Logo";

type Step = "amount" | "method" | "pay" | "proof" | "done";

const WALLETS = {
  media: {
    id: "media",
    label: "Media Wallet",
    icon: "🎬",
    description:
      "Used for YouTube transcripts, TikTok metadata, Spotify search, and audio transcription.",
    presets: [5, 10, 25, 50, 100],
    accent: "purple" as const,
    costLabel: "$0.90 per request",
  },
  network: {
    id: "network",
    label: "Network Wallet",
    icon: "🌐",
    description:
      "Used for IP lookup, DNS, WHOIS, SSL checks, and website screenshots.",
    presets: [5, 10, 25, 50, 100],
    accent: "cyan" as const,
    costLabel: "$0.05 per request",
  },
  ai: {
    id: "ai",
    label: "AI Wallet",
    icon: "🧠",
    description:
      "Used for video generation, voice synthesis, and premium AI features.",
    presets: [5, 10, 25, 50, 100],
    accent: "blue" as const,
    costLabel: "Pay-per-use",
  },
};

const ACCENT_CLASSES = {
  purple: {
    border: "border-purple-500/30",
    bg: "bg-purple-500/10",
    text: "text-purple-300",
  },
  cyan: {
    border: "border-cyan-500/30",
    bg: "bg-cyan-500/10",
    text: "text-cyan-300",
  },
  blue: {
    border: "border-blue-500/30",
    bg: "bg-blue-500/10",
    text: "text-blue-300",
  },
};

// ============================================================
// The actual page uses useSearchParams, so it MUST be
// inside a Suspense boundary for Next.js prerendering.
// ============================================================
function UpgradePageInner() {
  const searchParams = useSearchParams();
  const walletParam = searchParams.get("wallet");

  const wallet =
    walletParam && walletParam in WALLETS
      ? WALLETS[walletParam as keyof typeof WALLETS]
      : null;

  const [step, setStep] = useState<Step>("amount");
  const [plan, setPlan] = useState<PlanId>("monthly");
  const [usdAmount, setUsdAmount] = useState(10);
  const [customAmount, setCustomAmount] = useState("");
  const [method, setMethod] = useState<"ngn" | "crypto" | null>(null);
  const [cryptoNetwork, setCryptoNetwork] =
    useState<keyof typeof CRYPTO>("TRX");

  const [reference, setReference] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const ngnAmount = wallet
    ? Math.round(usdAmount * NGN_PER_USD)
    : PRICING[plan].price;

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert(`${label} copied`);
    } catch {}
  };

  const pickCustom = (raw: string) => {
    setCustomAmount(raw);
    const parsed = parseFloat(raw);
    if (!isNaN(parsed) && parsed > 0) setUsdAmount(parsed);
  };

  const submitProof = async () => {
    setError(null);
    if (!reference.trim()) {
      setError("Enter the transaction reference or hash.");
      return;
    }
    setUploading(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        setError("You must be logged in.");
        setUploading(false);
        return;
      }

      let screenshotUrl: string | null = null;

      if (screenshot) {
        const ext = screenshot.name.split(".").pop() || "jpg";
        const path = `${userData.user.id}/${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from("payment-proofs")
          .upload(path, screenshot, { cacheControl: "3600", upsert: false });

        if (uploadErr) {
          setError(`Upload failed: ${uploadErr.message}`);
          setUploading(false);
          return;
        }
        screenshotUrl = path;
      }

      const token = await getAccessToken();
      if (!token) {
        setError("Session expired. Please log in again.");
        setUploading(false);
        return;
      }

      const isWalletTopup = wallet !== null;

      const payload = isWalletTopup
        ? {
            kind: "credits",
            wallet: wallet.id,
            usdAmount,
            method,
            reference: reference.trim(),
            screenshotUrl,
          }
        : {
            kind: "subscription",
            plan,
            method,
            reference: reference.trim(),
            screenshotUrl,
          };

      const res = await fetch("/api/v1/payments/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data?.error?.message || "Submit failed.");
        setUploading(false);
        return;
      }

      setStep("done");
    } catch (err: any) {
      setError(err?.message || "Unknown error.");
    }
    setUploading(false);
  };

  const accentClasses = wallet
    ? ACCENT_CLASSES[wallet.accent]
    : null;

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-blue-500/8 rounded-full blur-[180px]" />
      </div>

      <div className="relative z-10 border-b border-zinc-800/50 px-6 py-4 flex items-center justify-between sticky top-0 bg-black/80 backdrop-blur">
        <Link href="/" className="flex items-center gap-3">
          <Logo size={26} animated={false} />
          <span className="font-bold tracking-widest text-sm">GYRA</span>
          <span className="text-zinc-600 text-xs tracking-widest">
            {wallet ? wallet.label.toUpperCase() : "SUPERGYRA"}
          </span>
        </Link>
        <Link
          href={wallet ? "/console" : "/dashboard"}
          className="text-sm text-zinc-400 hover:text-white transition-colors"
        >
          ← Back
        </Link>
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-6 py-12">
        {step === "amount" && (
          <>
            <div className="text-center mb-10">
              {wallet ? (
                <>
                  <div
                    className={`inline-flex items-center gap-2 ${accentClasses?.bg} ${accentClasses?.border} border px-4 py-2 rounded-full mb-6`}
                  >
                    <span className="text-lg">{wallet.icon}</span>
                    <span
                      className={`text-sm font-medium ${accentClasses?.text}`}
                    >
                      {wallet.label}
                    </span>
                  </div>
                  <h1 className="text-3xl font-bold tracking-tight mb-3">
                    Add credits
                  </h1>
                  <p className="text-zinc-400 max-w-md mx-auto leading-relaxed">
                    {wallet.description} {wallet.costLabel}.
                  </p>
                </>
              ) : (
                <>
                  <h1 className="text-3xl font-bold tracking-tight mb-2">
                    Upgrade to SuperGyra
                  </h1>
                  <p className="text-zinc-400">
                    Choose the plan that fits you
                  </p>
                </>
              )}
            </div>

            {wallet ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                  {wallet.presets.map((amt) => {
                    const active = usdAmount === amt && !customAmount;
                    return (
                      <button
                        key={amt}
                        onClick={() => {
                          setUsdAmount(amt);
                          setCustomAmount("");
                        }}
                        className={`relative p-5 rounded-2xl border transition-all text-left ${
                          active
                            ? `${accentClasses?.border} ${accentClasses?.bg}`
                            : "border-zinc-800 bg-zinc-950 hover:border-zinc-700"
                        }`}
                      >
                        <p className="text-2xl font-bold mb-1">${amt}</p>
                        <p className="text-xs text-zinc-500">
                          ≈ ₦{(amt * NGN_PER_USD).toLocaleString()}
                        </p>
                      </button>
                    );
                  })}
                </div>

                <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 mb-8">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3">
                    Custom amount (USD)
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl text-zinc-400">$</span>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={customAmount}
                      onChange={(e) => pickCustom(e.target.value)}
                      placeholder="Enter amount"
                      className="flex-1 bg-black border border-zinc-800 rounded-xl px-4 py-3 text-lg outline-none focus:border-blue-500"
                    />
                  </div>
                  {usdAmount > 0 && (
                    <p className="text-xs text-zinc-500 mt-3">
                      You&apos;ll pay ≈{" "}
                      <span className="text-white font-mono">
                        ₦{ngnAmount.toLocaleString()}
                      </span>{" "}
                      ({NGN_PER_USD} NGN per $1)
                    </p>
                  )}
                </div>

                <button
                  onClick={() => setStep("method")}
                  disabled={usdAmount < 1}
                  className="w-full bg-white text-black py-4 rounded-full font-semibold hover:bg-zinc-200 transition-colors disabled:opacity-40"
                >
                  Continue with ${usdAmount} →
                </button>
              </>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                  {(Object.keys(PRICING) as PlanId[]).map((id) => {
                    const p = PRICING[id];
                    const active = plan === id;
                    return (
                      <button
                        key={id}
                        onClick={() => setPlan(id)}
                        className={`relative text-left p-6 rounded-2xl border transition-all ${
                          active
                            ? "border-blue-500 bg-blue-500/10"
                            : "border-zinc-800 bg-zinc-950 hover:border-zinc-700"
                        }`}
                      >
                        {p.save && (
                          <span className="absolute top-4 right-4 text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-semibold">
                            {p.save}
                          </span>
                        )}
                        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">
                          {p.label}
                        </p>
                        <p className="text-3xl font-bold tracking-tight mb-1">
                          {p.displayPrice}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {id === "monthly"
                            ? "Billed monthly"
                            : "Billed yearly"}
                        </p>
                      </button>
                    );
                  })}
                </div>

                <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 mb-8">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-4">
                    What you unlock
                  </p>
                  <div className="flex flex-col gap-3">
                    {[
                      "Unlimited conversations with Gyra",
                      "AI video generation in Studio",
                      "AI image generation",
                      "Animate your photos into videos",
                      "2x longer conversations",
                      "Priority response speed",
                    ].map((f) => (
                      <div key={f} className="flex items-center gap-3">
                        <span className="w-4 h-4 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center shrink-0">
                          <span className="text-[9px] text-blue-400">✓</span>
                        </span>
                        <span className="text-sm text-zinc-300">{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setStep("method")}
                  className="w-full bg-white text-black py-4 rounded-full font-semibold hover:bg-zinc-200 transition-colors"
                >
                  Continue →
                </button>
              </>
            )}
          </>
        )}

        {step === "method" && (
          <>
            <button
              onClick={() => setStep("amount")}
              className="text-sm text-zinc-500 hover:text-white mb-6"
            >
              ← Back
            </button>

            <h1 className="text-3xl font-bold tracking-tight mb-2">
              How would you like to pay?
            </h1>
            <p className="text-zinc-400 mb-10">
              {wallet
                ? `$${usdAmount} credits · ≈ ₦${ngnAmount.toLocaleString()}`
                : `${PRICING[plan].displayPrice} · ${PRICING[plan].label} plan`}
            </p>

            <div className="flex flex-col gap-4">
              <button
                onClick={() => {
                  setMethod("ngn");
                  setStep("pay");
                }}
                className="text-left p-6 rounded-2xl border border-zinc-800 bg-zinc-950 hover:border-zinc-700 transition-all"
              >
                <div className="flex items-center gap-4">
                  <span className="w-12 h-12 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-2xl">
                    🇳🇬
                  </span>
                  <div className="flex-1">
                    <p className="font-semibold mb-1">Nigeria (NGN)</p>
                    <p className="text-xs text-zinc-500">
                      Bank transfer to {BANK.bankName}
                    </p>
                  </div>
                  <span className="text-zinc-600">→</span>
                </div>
              </button>

              <button
                onClick={() => {
                  setMethod("crypto");
                  setStep("pay");
                }}
                className="text-left p-6 rounded-2xl border border-zinc-800 bg-zinc-950 hover:border-zinc-700 transition-all"
              >
                <div className="flex items-center gap-4">
                  <span className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-2xl">
                    ₿
                  </span>
                  <div className="flex-1">
                    <p className="font-semibold mb-1">Cryptocurrency</p>
                    <p className="text-xs text-zinc-500">BTC · TON · TRX · BNB</p>
                  </div>
                  <span className="text-zinc-600">→</span>
                </div>
              </button>
            </div>
          </>
        )}

        {step === "pay" && method && (
          <>
            <button
              onClick={() => setStep("method")}
              className="text-sm text-zinc-500 hover:text-white mb-6"
            >
              ← Back
            </button>

            <h1 className="text-2xl font-bold tracking-tight mb-2">
              Send ₦{ngnAmount.toLocaleString()}
            </h1>
            <p className="text-zinc-400 mb-8 text-sm">
              Transfer the exact amount, then submit proof on the next step.
            </p>

            {method === "ngn" && (
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 mb-6">
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-5">
                  Bank transfer details
                </p>
                <InfoRow
                  label="Bank"
                  value={BANK.bankName}
                  onCopy={copyToClipboard}
                />
                <InfoRow
                  label="Account number"
                  value={BANK.accountNumber}
                  onCopy={copyToClipboard}
                  mono
                />
                <InfoRow
                  label="Account holder"
                  value={BANK.accountHolder}
                  onCopy={copyToClipboard}
                />
                <InfoRow
                  label="Amount"
                  value={`₦${ngnAmount.toLocaleString()}`}
                  onCopy={copyToClipboard}
                  mono
                />
              </div>
            )}

            {method === "crypto" && (
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 mb-6">
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-4">
                  Choose network
                </p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {(Object.keys(CRYPTO) as (keyof typeof CRYPTO)[]).map(
                    (net) => (
                      <button
                        key={net}
                        onClick={() => setCryptoNetwork(net)}
                        className={`px-4 py-2 rounded-full text-sm border transition-all ${
                          cryptoNetwork === net
                            ? "bg-white text-black border-white"
                            : "bg-transparent text-zinc-400 border-zinc-800 hover:border-zinc-600"
                        }`}
                      >
                        {net}
                      </button>
                    )
                  )}
                </div>

                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3">
                  Send to
                </p>
                <div className="flex items-center gap-3 bg-black border border-zinc-800 rounded-xl p-4">
                  <p className="text-xs font-mono text-zinc-300 break-all flex-1">
                    {CRYPTO[cryptoNetwork]}
                  </p>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        CRYPTO[cryptoNetwork],
                        `${cryptoNetwork} address`
                      )
                    }
                    className="text-xs bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-3 py-2 rounded-lg shrink-0"
                  >
                    Copy
                  </button>
                </div>
              </div>
            )}

            <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4 mb-6">
              <p className="text-xs text-blue-300 leading-relaxed">
                <strong>Important:</strong> Send the exact amount shown. Save
                your transaction reference or hash — you&apos;ll need it on the
                next step to prove payment.
              </p>
            </div>

            <button
              onClick={() => setStep("proof")}
              className="w-full bg-white text-black py-4 rounded-full font-semibold hover:bg-zinc-200 transition-colors"
            >
              I&apos;ve sent the payment →
            </button>
          </>
        )}

        {step === "proof" && (
          <>
            <button
              onClick={() => setStep("pay")}
              className="text-sm text-zinc-500 hover:text-white mb-6"
            >
              ← Back
            </button>

            <h1 className="text-2xl font-bold tracking-tight mb-2">
              Prove your payment
            </h1>
            <p className="text-zinc-400 mb-8 text-sm">
              We&apos;ll verify within 30 minutes and credit your account.
            </p>

            <label className="block mb-6">
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">
                Transaction reference / hash
              </p>
              <input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g. OPAY-1234567 or 0xabc123..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-4 text-sm outline-none focus:border-blue-500"
              />
            </label>

            <label className="block mb-8">
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">
                Screenshot (recommended)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-zinc-950 border border-dashed border-zinc-700 rounded-xl px-4 py-6 text-sm text-zinc-400 hover:border-zinc-500 transition-colors"
              >
                {screenshot ? (
                  <span className="text-white">📎 {screenshot.name}</span>
                ) : (
                  <span>Click to upload receipt screenshot</span>
                )}
              </button>
            </label>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <button
              onClick={submitProof}
              disabled={uploading}
              className="w-full bg-white text-black py-4 rounded-full font-semibold hover:bg-zinc-200 transition-colors disabled:opacity-50"
            >
              {uploading
                ? "Submitting…"
                : wallet
                ? `Submit payment for $${usdAmount}`
                : `Submit payment`}
            </button>
          </>
        )}

        {step === "done" && (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center mb-6">
              <span className="text-3xl">✓</span>
            </div>
            <h1 className="text-3xl font-bold mb-3">Payment submitted</h1>
            <p className="text-zinc-400 max-w-md mx-auto leading-relaxed mb-8">
              {wallet
                ? `We're verifying your payment. Your $${usdAmount} credits will appear within 30 minutes.`
                : "We're verifying your payment. SuperGyra will activate within 30 minutes."}
            </p>
            <Link
              href={wallet ? "/console" : "/dashboard"}
              className="inline-block bg-white text-black px-8 py-3 rounded-full font-medium hover:bg-zinc-200 transition-colors"
            >
              {wallet ? "Back to Console" : "Back to chat"}
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}

// ============================================================
// InfoRow — bank/crypto detail row with copy
// ============================================================
function InfoRow({
  label,
  value,
  onCopy,
  mono,
}: {
  label: string;
  value: string;
  onCopy: (text: string, label: string) => void;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-zinc-800/60 last:border-b-0">
      <div>
        <p className="text-xs text-zinc-500 mb-1">{label}</p>
        <p className={`text-base ${mono ? "font-mono" : "font-medium"}`}>
          {value}
        </p>
      </div>
      <button
        onClick={() => onCopy(value, label)}
        className="text-xs bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-3 py-2 rounded-lg"
      >
        Copy
      </button>
    </div>
  );
}

// ============================================================
// Default export — wraps the inner component in Suspense
// so Next.js can prerender it at build time.
// ============================================================
export default function UpgradePage() {
  return (
    <Suspense fallback={null}>
      <UpgradePageInner />
    </Suspense>
  );
}