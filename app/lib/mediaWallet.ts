import { createClient } from "@supabase/supabase-js";

const MEDIA_COST_USD = 0.90;

function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export { MEDIA_COST_USD };

export async function getMediaCredits(userId: string): Promise<number> {
  const admin = getAdmin();
  if (!admin) return 0;

  const { data } = await admin
    .from("subscriptions")
    .select("media_credits_usd")
    .eq("user_id", userId)
    .maybeSingle();

  return Number(data?.media_credits_usd || 0);
}

export async function hasMediaCredits(
  userId: string,
  amount: number = MEDIA_COST_USD
): Promise<{ ok: boolean; balance: number }> {
  const balance = await getMediaCredits(userId);
  return { ok: balance >= amount, balance };
}

export async function deductMediaCredits(
  userId: string,
  description: string,
  reference?: string,
  amount: number = MEDIA_COST_USD
): Promise<{ ok: boolean; balance: number; error?: string }> {
  const admin = getAdmin();
  if (!admin) return { ok: false, balance: 0, error: "Supabase not configured." };

  const current = await getMediaCredits(userId);
  if (current < amount) {
    return { ok: false, balance: current, error: "Insufficient media credits." };
  }

  const next = current - amount;

  const { error } = await admin
    .from("subscriptions")
    .update({
      media_credits_usd: next,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (error) {
    return { ok: false, balance: current, error: error.message };
  }

  await admin.from("credit_transactions").insert({
    user_id: userId,
    amount_usd: -amount,
    type: "media_spend",
    description,
    reference: reference || null,
  });

  return { ok: true, balance: next };
}

export async function addMediaCredits(
  userId: string,
  amount: number,
  description: string,
  reference?: string
): Promise<{ ok: boolean; balance: number; error?: string }> {
  const admin = getAdmin();
  if (!admin) return { ok: false, balance: 0, error: "Supabase not configured." };

  const current = await getMediaCredits(userId);
  const next = current + amount;

  const { error } = await admin
    .from("subscriptions")
    .upsert(
      {
        user_id: userId,
        media_credits_usd: next,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (error) return { ok: false, balance: current, error: error.message };

  await admin.from("credit_transactions").insert({
    user_id: userId,
    amount_usd: amount,
    type: "media_topup",
    description,
    reference: reference || null,
  });

  return { ok: true, balance: next };
}