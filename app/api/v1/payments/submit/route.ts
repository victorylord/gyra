import { createClient } from "@supabase/supabase-js";
import { getUserFromToken } from "@/app/lib/subscription";
import { PRICING, type PlanId } from "@/app/lib/paymentConfig";

function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase env.");
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(req: Request) {
  try {
    const token = (req.headers.get("authorization") || "")
      .replace("Bearer ", "")
      .trim();

    if (!token) {
      return Response.json(
        { error: { code: "unauthorized", message: "Missing token." } },
        { status: 401 }
      );
    }

    const user = await getUserFromToken(token);
    if (!user) {
      return Response.json(
        { error: { code: "unauthorized", message: "Invalid token." } },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const plan = String(body?.plan || "") as PlanId;
    const method = String(body?.method || "");
    const reference = String(body?.reference || "").trim();
    const screenshotUrl = body?.screenshotUrl
      ? String(body.screenshotUrl)
      : null;

    if (plan !== "monthly" && plan !== "yearly") {
      return Response.json(
        { error: { code: "invalid_plan", message: "Invalid plan." } },
        { status: 400 }
      );
    }

    if (!method || !["ngn", "crypto"].includes(method)) {
      return Response.json(
        {
          error: { code: "invalid_method", message: "Invalid payment method." },
        },
        { status: 400 }
      );
    }

    if (!reference) {
      return Response.json(
        {
          error: {
            code: "missing_reference",
            message: "Transaction reference or hash is required.",
          },
        },
        { status: 400 }
      );
    }

    const pricing = PRICING[plan];
    const admin = getAdmin();

    const { data, error } = await admin
      .from("payments")
      .insert({
        user_id: user.id,
        email: user.email,
        plan,
        amount_ngn: pricing.price,
        method,
        reference,
        screenshot_url: screenshotUrl,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      console.error("payment submit error:", error);
      return Response.json(
        { error: { code: "insert_failed", message: error.message } },
        { status: 500 }
      );
    }

    return Response.json({ ok: true, paymentId: data.id });
  } catch (err: any) {
    console.error("payment submit exception:", err);
    return Response.json(
      { error: { code: "internal_error", message: err?.message } },
      { status: 500 }
    );
  }
}