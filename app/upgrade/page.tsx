"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase, getAccessToken } from "../supabase";
import { BANK, CRYPTO, PRICING, cryptoNote, type PlanId } from "../lib/paymentConfig";
import Logo from "../Logo";

type Step = "plan" | "method" | "pay" | "proof" | "done";

export default function UpgradePage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("plan");
  const [plan, setPlan] = useState<PlanId>("monthly");
  const [method, setMethod] = useState<"ngn" | "crypto" | null>(null);
  const [cryptoNetwork, setCryptoNetwork] = useState<keyof typeof CRYPTO>("TRX");

  const [reference, setReference] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert(`${label} copied`);
    } catch {}
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
          .upload(path, screenshot, {
            cacheControl: "3600",
            upsert: false,
          });
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

      const res = await fetch("/api/v1/payments/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          plan,
          method,
          reference: reference.trim(),
          screenshotUrl,
        }),
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

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-blue-500/8 rounded-full blur-[180px]" />
      </div>

      <div className="relative z-10 border-b border-zinc-800/50 px-6 py-4 flex items-center justify-between sticky top-0 bg-black/80 backdrop-blur">
        <Link href="/" className="flex items-center gap-3">
          <Logo size={26} animated={false} />
          <span className="font-bold tracking-widest text-sm">GYRA</span>
          <span className="text-zinc-600 text-xs tracking-widest">SUPERGYRA</span>
        </Link>
        <Link
          href="/dashboard"
          className="text-sm text-zinc-400 hover:text-white transition-colors"
        >
          ← Back to chat
        </Link>
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-6 py-12">
        {step === "plan" && <PlanStep plan={plan} setPlan={setPlan} onNext={() => setStep("method")} />}
        {step === "method" && (
          <MethodStep
            plan={plan}
            onBack={() => setStep("plan")}
            onPick={(m) => {
              setMethod(m);
              setStep("pay");
            }}
          />
        )}
        {step === "pay" && method && (
          <PayStep
            plan={plan}
            method={method}
            cryptoNetwork={cryptoNetwork}
            setCryptoNetwork={setCryptoNetwork}
            onBack={() => setStep("method")}
            onNext={() => setStep("proof")}
            copy={copyToClipboard}
          />
        )}
        {step === "proof" && (
          <ProofStep
            reference={reference}
            setReference={setReference}
            screenshot={screenshot}
            setScreenshot={setScreenshot}
            uploading={uploading}
            error={error}
            onBack={() => setStep("pay")}
            onSubmit={submitProof}
            fileInputRef={fileInputRef}
          />
        )}
        {step === "done" && (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center mb-6">
              <span className="text-3xl">✓</span>
            </div>
            <h1 className="text-3xl font-bold mb-3">Payment submitted</h1>
            <p className="text-zinc-400 max-w-md mx-auto leading-relaxed mb-8">
              We're verifying your payment. Activation within 30 minutes.
              You'll get a notification when SuperGyra is live on your account.
            </p>
            <Link
              href="/dashboard"
              className="inline-block bg-white text-black px-8 py-3 rounded-full font-medium hover:bg-zinc-200 transition-colors"
            >
              Back to chat
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}

// ============================================================
// STEP 1 — Plan picker
// ============================================================
function PlanStep({
  plan,
  setPlan,
  onNext,
}: {
  plan: PlanId;
  setPlan: (p: PlanId) => void;
  onNext: () => void;
}) {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-2 text-center">
        Upgrade to SuperGyra
      </h1>
      <p className="text-zinc-400 text-center mb-10">
        Choose the plan that fits you
      </p>

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
                {id === "monthly" ? "Billed monthly" : "Billed yearly"}
              </p>
              {active && (
                <div className="absolute bottom-4 right-4 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              )}
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
        onClick={onNext}
        className="w-full bg-white text-black py-4 rounded-full font-semibold hover:bg-zinc-200 transition-colors"
      >
        Continue →
      </button>
    </div>
  );
}

// ============================================================
// STEP 2 — Method picker
// ============================================================
function MethodStep({
  plan,
  onBack,
  onPick,
}: {
  plan: PlanId;
  onBack: () => void;
  onPick: (m: "ngn" | "crypto") => void;
}) {
  return (
    <div>
      <button
        onClick={onBack}
        className="text-sm text-zinc-500 hover:text-white mb-6"
      >
        ← Back
      </button>

      <h1 className="text-3xl font-bold tracking-tight mb-2">
        How would you like to pay?
      </h1>
      <p className="text-zinc-400 mb-10">
        {PRICING[plan].displayPrice} · {PRICING[plan].label} plan
      </p>

      <div className="flex flex-col gap-4">
        <button
          onClick={() => onPick("ngn")}
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
          onClick={() => onPick("crypto")}
          className="text-left p-6 rounded-2xl border border-zinc-800 bg-zinc-950 hover:border-zinc-700 transition-all"
        >
          <div className="flex items-center gap-4">
            <span className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-2xl">
              ₿
            </span>
            <div className="flex-1">
              <p className="font-semibold mb-1">Cryptocurrency</p>
              <p className="text-xs text-zinc-500">
                BTC · TON · TRX · BNB
              </p>
            </div>
            <span className="text-zinc-600">→</span>
          </div>
        </button>
      </div>
    </div>
  );
}

// ============================================================
// STEP 3 — Payment instructions
// ============================================================
function PayStep({
  plan,
  method,
  cryptoNetwork,
  setCryptoNetwork,
  onBack,
  onNext,
  copy,
}: {
  plan: PlanId;
  method: "ngn" | "crypto";
  cryptoNetwork: keyof typeof CRYPTO;
  setCryptoNetwork: (n: keyof typeof CRYPTO) => void;
  onBack: () => void;
  onNext: () => void;
  copy: (text: string, label: string) => void;
}) {
  return (
    <div>
      <button
        onClick={onBack}
        className="text-sm text-zinc-500 hover:text-white mb-6"
      >
        ← Back
      </button>

      <h1 className="text-2xl font-bold tracking-tight mb-2">
        Send {PRICING[plan].displayPrice}
      </h1>
      <p className="text-zinc-400 mb-8 text-sm">
        Transfer the exact amount, then submit proof on the next step.
      </p>

      {method === "ngn" && (
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 mb-6">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-5">
            Bank transfer details
          </p>

          <InfoRow label="Bank" value={BANK.bankName} onCopy={copy} />
          <InfoRow
            label="Account number"
            value={BANK.accountNumber}
            onCopy={copy}
            mono
          />
          <InfoRow
            label="Account holder"
            value={BANK.accountHolder}
            onCopy={copy}
          />
          <InfoRow
            label="Amount"
            value={`₦${PRICING[plan].price.toLocaleString()}`}
            onCopy={copy}
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
            {(Object.keys(CRYPTO) as (keyof typeof CRYPTO)[]).map((net) => (
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
            ))}
          </div>

          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3">
            Send to
          </p>
          <div className="flex items-center gap-3 bg-black border border-zinc-800 rounded-xl p-4">
            <p className="text-xs font-mono text-zinc-300 break-all flex-1">
              {CRYPTO[cryptoNetwork]}
            </p>
            <button
              onClick={() => copy(CRYPTO[cryptoNetwork], `${cryptoNetwork} address`)}
              className="text-xs bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-3 py-2 rounded-lg shrink-0"
            >
              Copy
            </button>
          </div>

          <p className="text-xs text-zinc-500 mt-4 leading-relaxed">
            {cryptoNote(plan)} Send only {cryptoNetwork} to this address.
            Sending other assets will result in loss.
          </p>
        </div>
      )}

      <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4 mb-6">
        <p className="text-xs text-blue-300 leading-relaxed">
          <strong>Important:</strong> Send the exact amount shown. Save your
          transaction reference or hash — you'll need it on the next step to
          prove payment.
        </p>
      </div>

      <button
        onClick={onNext}
        className="w-full bg-white text-black py-4 rounded-full font-semibold hover:bg-zinc-200 transition-colors"
      >
        I've sent the payment →
      </button>
    </div>
  );
}

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
// STEP 4 — Proof of payment
// ============================================================
function ProofStep({
  reference,
  setReference,
  screenshot,
  setScreenshot,
  uploading,
  error,
  onBack,
  onSubmit,
  fileInputRef,
}: {
  reference: string;
  setReference: (v: string) => void;
  screenshot: File | null;
  setScreenshot: (f: File | null) => void;
  uploading: boolean;
  error: string | null;
  onBack: () => void;
  onSubmit: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <div>
      <button
        onClick={onBack}
        className="text-sm text-zinc-500 hover:text-white mb-6"
      >
        ← Back
      </button>

      <h1 className="text-2xl font-bold tracking-tight mb-2">
        Prove your payment
      </h1>
      <p className="text-zinc-400 mb-8 text-sm">
        We'll verify within 30 minutes.
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
          Screenshot (optional but recommended)
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
            <span>Click to upload receipt or transaction screenshot</span>
          )}
        </button>
      </label>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <button
        onClick={onSubmit}
        disabled={uploading}
        className="w-full bg-white text-black py-4 rounded-full font-semibold hover:bg-zinc-200 transition-colors disabled:opacity-50"
      >
        {uploading ? "Submitting…" : "Submit payment"}
      </button>

      <p className="text-xs text-zinc-600 mt-4 text-center leading-relaxed">
        By submitting you confirm the payment is genuine. Fraudulent
        submissions will result in account suspension.
      </p>
    </div>
  );
}