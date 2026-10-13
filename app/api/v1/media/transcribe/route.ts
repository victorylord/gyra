import { authorizeMediaRequest, jsonError } from "@/app/lib/mediaAuth";

const GROQ_STT_URL = "https://api.groq.com/openai/v1/audio/transcriptions";
const MAX_BYTES = 25 * 1024 * 1024;

export async function POST(req: Request) {
  const auth = await authorizeMediaRequest(req, "/api/v1/media/transcribe");
  if (!auth.ok) return auth.response;

  try {
    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      return jsonError("invalid_request", "Expected multipart/form-data.", 400);
    }

    const audio = form.get("audio");
    if (!(audio instanceof Blob)) {
      return jsonError("invalid_request", "Missing `audio` field.", 400);
    }

    if (audio.size > MAX_BYTES) {
      return jsonError(
        "payload_too_large",
        "Audio file too large (max 25MB).",
        413
      );
    }

    if (!process.env.GROQ_API_KEY) {
      return jsonError(
        "provider_unavailable",
        "Transcription is not configured.",
        503
      );
    }

    const groqForm = new FormData();
    groqForm.append("file", audio, "audio.webm");
    groqForm.append("model", "whisper-large-v3-turbo");
    groqForm.append("response_format", "verbose_json");
    groqForm.append("temperature", "0");

    const res = await fetch(GROQ_STT_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: groqForm,
      signal: AbortSignal.timeout(60_000),
    });

    if (!res.ok) {
      console.error("groq stt non-OK:", res.status);
      return jsonError("provider_error", "Transcription failed.", 502);
    }

    const data = await res.json();

    return Response.json({
      text: data?.text || "",
      language: data?.language || null,
      duration: data?.duration || null,
      segments: data?.segments || [],
      balanceAfter: auth.balanceAfter,
    });
  } catch (err: any) {
    console.error("media transcribe error:", err);
    return jsonError(
      "internal_error",
      err?.message || "Transcription failed.",
      500
    );
  }
}