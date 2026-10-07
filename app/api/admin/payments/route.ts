import { createClient } from "@supabase/supabase-js";
import { getUserFromToken } from "@/app/lib/subscription";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";

function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase env.");
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function GET(req: Request) {
  try {
    const token = (req.headers.get("authorization") || "")
      .replace("Bearer ", "")
      .trim();
    if (!token) return unauthorized();

    const user = await getUserFromToken(token);
    if (!user || user.email !== ADMIN_EMAIL) return unauthorized();

    const admin = getAdmin();

    // Signed URLs for screenshots — 7-day expiry
    const { data: payments, error } = await admin
      .from("payments")
      .select("*")
      .order("submitted_at", { ascending: false })
      .limit(200);

    if (error) {
      return Response.json(
        { error: { code: "fetch_failed", message: error.message } },
        { status: 500 }
      );
    }

    const withUrls = await Promise.all(
      (payments || []).map(async (p: any) => {
        let screenshotSignedUrl: string | null = null;
        if (p.screenshot_url) {
          const { data: signed } = await admin.storage
            .from("payment-proofs")
            .createSignedUrl(p.screenshot_url, 60 * 60 * 24 * 7);
          screenshotSignedUrl = signed?.signedUrl || null;
        }
        return { ...p, screenshotSignedUrl };
      })
    );

    return Response.json({ payments: withUrls });
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