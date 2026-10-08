import { fal } from "@fal-ai/client";
import { createClient } from "@supabase/supabase-js";

const MODEL = "fal-ai/ltx-video-13b-distilled";

function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase env.");
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const status = await fal.queue.status(MODEL, {
      requestId: id,
      logs: true,
    });

    const admin = getAdmin();

    if (status.status === "COMPLETED") {
      const result = await fal.queue.result(MODEL, { requestId: id });
      const videoUrl = (result.data as any)?.video?.url || null;

      await admin
        .from("video_jobs")
        .update({
          status: "completed",
          video_url: videoUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("request_id", id);

      return Response.json({
        status: "completed",
        videoUrl,
      });
    }

    await admin
      .from("video_jobs")
      .update({
        status: status.status.toLowerCase(),
        updated_at: new Date().toISOString(),
      })
      .eq("request_id", id);

    return Response.json({
      status: status.status.toLowerCase(),
    });
  } catch (err: any) {
    console.error("video status error:", err);

    try {
      const admin = getAdmin();
      await admin
        .from("video_jobs")
        .update({
          status: "error",
          error: err?.message || "Unknown error",
          updated_at: new Date().toISOString(),
        })
        .eq("request_id", id);
    } catch {}

    return Response.json(
      { error: { code: "status_failed", message: err?.message || "Failed" } },
      { status: 500 }
    );
  }
}