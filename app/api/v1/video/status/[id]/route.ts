import { fal } from "@fal-ai/client";

const MODEL = "fal-ai/ltx-video-13b-distilled";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const status = await fal.queue.status(MODEL, {
      requestId: id,
      logs: true,
    });

    if (status.status === "COMPLETED") {
      const result = await fal.queue.result(MODEL, { requestId: id });
      const videoUrl = (result.data as any)?.video?.url || null;
      return Response.json({
        status: "completed",
        videoUrl,
        raw: result.data,
      });
    }

    return Response.json({
      status: status.status.toLowerCase(),
      logs: (status as any).logs || [],
    });
  } catch (err: any) {
    console.error("video status error:", err);
    return Response.json(
      { error: { code: "status_failed", message: err?.message || "Failed" } },
      { status: 500 }
    );
  }
}