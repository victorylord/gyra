export type PlanId = "monthly" | "yearly";

export const PRICING = {
  monthly: {
    id: "monthly" as const,
    label: "Monthly",
    price: 10000,
    displayPrice: "₦10,000",
    durationDays: 30,
    save: null as string | null,
  },
  yearly: {
    id: "yearly" as const,
    label: "Yearly",
    price: 118800,
    displayPrice: "₦118,800",
    durationDays: 365,
    save: "Save 17%",
  },
};

export const BANK = {
  bankName: "Opay",
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

export function cryptoNote(planId: PlanId): string {
  const usd = planId === "monthly" ? "~$6 USD" : "~$72 USD";
  return `Send the equivalent of ${usd} in the selected crypto.`;
}