export type PlanId = "monthly" | "yearly";

export const PRICING = {
  monthly: {
    id: "monthly" as const,
    label: "Monthly",
    price: 10000,
    displayPrice: "₦10,000",
    durationDays: 30,
    save: null as string | null,
    creditsIncluded: 5,
  },
  yearly: {
    id: "yearly" as const,
    label: "Yearly",
    price: 118800,
    displayPrice: "₦118,800",
    durationDays: 365,
    save: "Save 17%",
    creditsIncluded: 60,
  },
};

export const BANK = {
  bankName: "MoMo Payment Service Bank",
  accountNumber: "7025431762",
  accountHolder: "Nelly Eke",
};

export const CRYPTO = {
  BTC: "bc1qnx9sekn74xgacmxmwyhavnv90euhevvgspzhse",
  TON: "UQAlvxyux-XEI5TvlyF4951WTToxZ_dlm0jRxEbxiNf0PWg6",
  TRX: "TWpmk5uVTb4bT3HA4iYPmvXw6UgugnPX3f",
  BNB: "0xaABEfb87515D31b8444923C546eD6e2dc4d5c5EC",
};

export const FREE_LIMIT = 20;
export const NGN_PER_USD = 1600;
export const VIDEO_COST_USD = 2.0;
export const VOICE_COST_USD = 2.0;

/** Preset credit packages (in USD) */
export const CREDIT_PACKAGES = [
  { usd: 5, label: "$5", ngn: 8000, popular: false },
  { usd: 10, label: "$10", ngn: 16000, popular: true },
  { usd: 25, label: "$25", ngn: 40000, popular: false },
  { usd: 50, label: "$50", ngn: 80000, popular: false },
  { usd: 100, label: "$100", ngn: 160000, popular: false },
];

export function ngnToUsd(ngn: number): number {
  return Math.floor((ngn / NGN_PER_USD) * 100) / 100;
}

export function usdToNgn(usd: number): number {
  return Math.round(usd * NGN_PER_USD);
}

export function cryptoNote(planId: PlanId): string {
  const usd = planId === "monthly" ? "~$6 USD" : "~$72 USD";
  return `Send the equivalent of ${usd} in the selected crypto.`;
}