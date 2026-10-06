import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase env vars.");
  return createClient(url, key, { auth: { persistSession: false } });
}

export const revalidate = 0;

export async function GET() {
  try {
    const supabase = getSupabase();

    const startOfTodayUTC = new Date(
      Date.UTC(
        new Date().getUTCFullYear(),
        new Date().getUTCMonth(),
        new Date().getUTCDate()
      )
    ).toISOString();

    // Fetch today's rows (up to 50k — fine for now)
    const { data, error } = await supabase
      .from("api_requests")
      .select("endpoint")
      .gte("created_at", startOfTodayUTC)
      .limit(50000);

    if (error) throw error;

    // Aggregate in JS — fast enough at this scale
    const counts: Record<string, number> = {};
    for (const row of data || []) {
      const ep = (row as any).endpoint;
      counts[ep] = (counts[ep] || 0) + 1;
    }

    const sorted = Object.entries(counts)
      .map(([endpoint, count]) => ({ endpoint, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return Response.json({
      endpoints: sorted,
      updatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return Response.json(
      { error: { message: err?.message || "Failed" } },
      { status: 500 }
    );
  }
}