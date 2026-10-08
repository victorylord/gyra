import { createClient } from "@supabase/supabase-js";
import { getUserFromToken } from "@/app/lib/subscription";
import { PRICING, type PlanId, ngnToUsd } from "@/app/lib/paymentConfig";
import { addCredits } from "@/app/lib/credits";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";

function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase env.");
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = (req.headers.get("authorization") || "")
      .replace("Bearer ", "")
      .trim();
    if (!token) return unauthorized();

    const user = await getUserFromToken(token);
    if (!user || user.email !== ADMIN_EMAIL) return unauthorized();

    const admin = getAdmin();

    const { data: payment, error } = await admin
      .from("payments")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error || !payment) {
      return Response.json(
        { error: { code: "not_found", message: "Payment not found." } },
        { status: 404 }
      );
    }

    if (payment.status === "approved") {
      return Response.json({ ok: true, message: "Already approved." });
    }

    const plan = payment.plan as PlanId;
    const pricing = PRICING[plan];

    // Convert NGN to USD credits
    const creditsUsd = ngnToUsd(payment.amount_ngn);

    // 1. Mark payment approved
    await admin
      .from("payments")
      .update({
        status: "approved",
        credits_usd: creditsUsd,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id);

    // 2. If plan-based subscription (SuperGyra), activate subscription
    if (pricing) {
      const { data: existingSub } = await admin
        .from("subscriptions")
        .select("expires_at")
        .eq("user_id", payment.user_id)
        .maybeSingle();

      const baseDate =
        existingSub?.expires_at && new Date(existingSub.expires_at) > new Date()
          ? new Date(existingSub.expires_at)
          : new Date();
      const expiresAt = new Date(
        baseDate.getTime() + pricing.durationDays * 24 * 60 * 60 * 1000
      );

      await admin.from("subscriptions").upsert(
        {
          user_id: payment.user_id,
          plan: "supergyra",
          status: "active",
          payment_method: payment.method,
          amount_ngn: payment.amount_ngn,
          reference: payment.reference,
          started_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );
    }

    // 3. Add credits from the payment amount
    if (creditsUsd > 0) {
      await addCredits(
        payment.user_id,
        creditsUsd,
        `Payment approved: ₦${payment.amount_ngn.toLocaleString()}`,
        payment.reference
      );
    }

    return Response.json({
      ok: true,
      creditsUsd,
    });
  } catch (err: any) {
    return Response.json(
      { error: { code: "internal_error", message: err?.message } },
      { status: 500 }
    );
  }
}

function unauthorized() {
  return Response.json(
    { error: { code: "unauthorized", message: "Admin only." } },
    { status: 401 }
  );
}