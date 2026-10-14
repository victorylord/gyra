import { createClient } from "@supabase/supabase-js";
import { getUserFromToken } from "@/app/lib/subscription";
import { PRICING, type PlanId, ngnToUsd } from "@/app/lib/paymentConfig";

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

    const kind = payment.kind || "subscription";
    const creditsUsd = ngnToUsd(payment.amount_ngn);

    // Mark payment approved
    await admin
      .from("payments")
      .update({
        status: "approved",
        credits_usd: creditsUsd,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id);

    // If subscription kind, activate SuperGyra
    if (kind === "subscription") {
      const plan = payment.plan as PlanId;
      const pricing = PRICING[plan];

      if (pricing) {
        const { data: existingSub } = await admin
          .from("subscriptions")
          .select("expires_at")
          .eq("user_id", payment.user_id)
          .maybeSingle();

        const baseDate =
          existingSub?.expires_at &&
          new Date(existingSub.expires_at) > new Date()
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
    }

    // Add credits to the correct wallet
    if (creditsUsd > 0) {
      // Which wallet?
      let walletColumn = "credits_usd";
      if (payment.plan?.startsWith("wallet:")) {
        const w = payment.plan.split(":")[1];
        if (w === "media") walletColumn = "media_credits_usd";
        else if (w === "network") walletColumn = "network_credits_usd";
        else walletColumn = "credits_usd";
      }

      // Read current wallet value
      const { data: currentSub } = await admin
        .from("subscriptions")
        .select(walletColumn)
        .eq("user_id", payment.user_id)
        .maybeSingle();

      const currentBalance = Number((currentSub as any)?.[walletColumn] || 0);
      const newBalance = currentBalance + creditsUsd;

      // Upsert
      await admin.from("subscriptions").upsert(
        {
          user_id: payment.user_id,
          [walletColumn]: newBalance,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

      // Log transaction
      await admin.from("credit_transactions").insert({
        user_id: payment.user_id,
        amount_usd: creditsUsd,
        type: walletColumn === "media_credits_usd" ? "media_topup" : "topup",
        description: `Payment approved: ₦${payment.amount_ngn.toLocaleString()} → ${walletColumn}`,
        reference: payment.reference,
      });
    }

    return Response.json({
      ok: true,
      creditsUsd,
      wallet: payment.plan?.startsWith("wallet:")
        ? payment.plan.split(":")[1]
        : "ai",
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