import { createClient } from "@supabase/supabase-js";

export type Subscription = {
  plan: "free" | "supergyra";
  status: "active" | "inactive" | "expired" | "pending";
  expiresAt: string | null;
  creditsUsd: number;
};

function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function getSubscription(userId: string): Promise<Subscription> {
  const admin = getAdmin();
  if (!admin) {
    return {
      plan: "free",
      status: "inactive",
      expiresAt: null,
      creditsUsd: 0,
    };
  }

  const { data } = await admin
    .from("subscriptions")
    .select("plan, status, expires_at, credits_usd")
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) {
    return {
      plan: "free",
      status: "inactive",
      expiresAt: null,
      creditsUsd: 0,
    };
  }

  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return {
      plan: "free",
      status: "expired",
      expiresAt: data.expires_at,
      creditsUsd: Number(data.credits_usd || 0),
    };
  }

  return {
    plan: (data.plan as any) || "free",
    status: (data.status as any) || "inactive",
    expiresAt: data.expires_at,
    creditsUsd: Number(data.credits_usd || 0),
  };
}

export async function getUserFromToken(token: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;

  const admin = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

export function isSuperGyra(sub: Subscription): boolean {
  return sub.plan === "supergyra" && sub.status === "active";
}