import { createClient } from "@supabase/supabase-js";
import { tickAndGet, deriveEndpoints } from "@/app/lib/simulatedStats";

export const revalidate = 0;

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function GET() {
  try {
    const sim = await tickAndGet();

    // Real endpoint counts
    const realMap = new Map<string, number>();
    const supabase = getSupabase();
    if (supabase) {
      try {
        const now = new Date();
        const startOfTodayUTC = new Date(
          Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
        ).toISOString();

        const { data } = await supabase
          .from("api_requests")
          .select("endpoint")
          .gte("created_at", startOfTodayUTC)
          .limit(50000);

        for (const row of data || []) {
          const ep = (row as any).endpoint;
          realMap.set(ep, (realMap.get(ep) || 0) + 1);
        }
      } catch (e) {
        console.error("supabase real endpoints failed:", e);
      }
    }

    // Simulated endpoints derived from today total
    const simEndpoints = deriveEndpoints(sim.today, 20);

    // Merge
    const combined = new Map<string, number>();
    for (const e of simEndpoints) combined.set(e.endpoint, e.count);
    for (const [ep, count] of realMap.entries()) {
      combined.set(ep, (combined.get(ep) || 0) + count);
    }

    const sorted = Array.from(combined.entries())
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