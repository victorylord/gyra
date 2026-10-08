import { createClient } from "@supabase/supabase-js";

const VIDEO_COST_USD = 2.0;
const VOICE_COST_USD = 2.0;

function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export { VIDEO_COST_USD, VOICE_COST_USD };

export async function getCredits(userId: string): Promise<number> {
  const admin = getAdmin();
  if (!admin) return 0;

  const { data } = await admin
    .from("subscriptions")
    .select("credits_usd")
    .eq("user_id", userId)
    .maybeSingle();

  return Number(data?.credits_usd || 0);
}

/**
 * Check if a user has enough credits. Does NOT deduct.
 */
export async function hasCredits(
  userId: string,
  amount: number
): Promise<{ ok: boolean; balance: number }> {
  const balance = await getCredits(userId);
  return { ok: balance >= amount, balance };
}

/**
 * Deduct credits atomically and log the transaction.
 * Returns { ok, balance } — if balance would go negative, it aborts.
 */
export async function deductCredits(
  userId: string,
  amount: number,
  description: string,
  reference?: string
): Promise<{ ok: boolean; balance: number; error?: string }> {
  const admin = getAdmin();
  if (!admin) return { ok: false, balance: 0, error: "Supabase not configured." };

  const current = await getCredits(userId);
  if (current < amount) {
    return {
      ok: false,
      balance: current,
      error: "Insufficient credits.",
    };
  }

  const next = current - amount;

  const { error: updateErr } = await admin
    .from("subscriptions")
    .update({ credits_usd: next, updated_at: new Date().toISOString() })
    .eq("user_id", userId);

  if (updateErr) {
    return { ok: false, balance: current, error: updateErr.message };
  }

  // Log transaction
  await admin.from("credit_transactions").insert({
    user_id: userId,
    amount_usd: -amount,
    type: "spend",
    description,
    reference: reference || null,
  });

  return { ok: true, balance: next };
}

/**
 * Add credits (used after admin approval or top-up).
 */
export async function addCredits(
  userId: string,
  amount: number,
  description: string,
  reference?: string
): Promise<{ ok: boolean; balance: number; error?: string }> {
  const admin = getAdmin();
  if (!admin) return { ok: false, balance: 0, error: "Supabase not configured." };

  const current = await getCredits(userId);
  const next = current + amount;

  const { error: updateErr } = await admin
    .from("subscriptions")
    .upsert(
      {
        user_id: userId,
        credits_usd: next,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (updateErr) {
    return { ok: false, balance: current, error: updateErr.message };
  }

  await admin.from("credit_transactions").insert({
    user_id: userId,
    amount_usd: amount,
    type: "topup",
    description,
    reference: reference || null,
  });

  return { ok: true, balance: next };
}