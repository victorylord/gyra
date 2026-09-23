import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

// ---------- PUBLIC DEVELOPER API ----------
// Usage: POST https://gyra.ng/api/v1/chat
// Header: Authorization: Bearer gyra_xxxxxxxx
// Body: { "messages": [{"role":"user","content":"Hello Gyra"}] }
export async function POST(req: Request) {
  try {
    // 1. Extract API key
    const authHeader = req.headers.get("authorization") || "";
    const apiKey = authHeader.replace("Bearer ", "").trim();

    if (!apiKey || !apiKey.startsWith("gyra_")) {
      return Response.json(
        {
          error: {
            code: "invalid_api_key",
            message:
              "Missing or invalid API key. Include header: Authorization: Bearer gyra_xxx",
          },
        },
        { status: 401 }
      );
    }

    // 2. Validate key
    const { data: keyData, error: keyError } = await supabaseAdmin
      .from("api_keys")
      .select("*")
      .eq("key", apiKey)
      .eq("active", true)
      .single();

    if (keyError || !keyData) {
      return Response.json(
        {
          error: {
            code: "invalid_api_key",
            message: "This API key does not exist or has been revoked.",
          },
        },
        { status: 401 }
      );
    }

    // 3. Parse body
    const body = await req.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return Response.json(
        {
          error: {
            code: "invalid_request",
            message:
              'Request body must include "messages" as an array of objects with role and content.',
          },
        },
        { status: 400 }
      );
    }

    // 4. Build the request
    const systemPrompt = {
      role: "system",
      content:
        "You are Gyra, an advanced AI assistant created by Genvia AI Company, owned by Victory Lord. You are intelligent, direct, witty, and highly helpful. If anyone asks who made you, you proudly state that you were created by Victory Lord under Genvia AI Company. Keep responses concise unless the user asks for detail.",
    };

    const fullMessages = [systemPrompt, ...messages];

    let aiReply: string | null = null;
    let provider = "none";

    // --- Try Hugging Face ---
    if (process.env.HUGGINGFACE_API_TOKEN) {
      try {
        const res = await fetch("https://router.huggingface.co/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.HUGGINGFACE_API_TOKEN}`,
          },
          body: JSON.stringify({
            model: "meta-llama/Llama-3.1-8B-Instruct",
            messages: fullMessages,
            temperature: 0.7,
          }),
        });
        const data = await res.json();
        if (data.choices?.[0]?.message?.content) {
          aiReply = data.choices[0].message.content;
          provider = "huggingface";
        }
      } catch (e) {}
    }

    // --- Try Groq ---
    if (!aiReply && process.env.GROQ_API_KEY) {
      try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: fullMessages,
            temperature: 0.7,
          }),
        });
        const data = await res.json();
        if (data.choices?.[0]?.message?.content) {
          aiReply = data.choices[0].message.content;
          provider = "groq";
        }
      } catch (e) {}
    }

    // --- Try Grok ---
    if (!aiReply && process.env.XAI_API_KEY) {
      try {
        const res = await fetch("https://api.x.ai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.XAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "grok-2-latest",
            messages: fullMessages,
            temperature: 0.7,
          }),
        });
        const data = await res.json();
        if (data.choices?.[0]?.message?.content) {
          aiReply = data.choices[0].message.content;
          provider = "grok";
        }
      } catch (e) {}
    }

    // --- Try Gemini ---
    if (!aiReply && process.env.GEMINI_API_KEY) {
      try {
        const geminiContents = messages.map((m: any) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        }));
        geminiContents.unshift({
          role: "user",
          parts: [{ text: systemPrompt.content }],
        });

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: geminiContents }),
          }
        );
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          aiReply = text;
          provider = "gemini";
        }
      } catch (e) {}
    }

    if (!aiReply) {
      return Response.json(
        {
          error: {
            code: "ai_unavailable",
            message: "All AI providers are temporarily unavailable.",
          },
        },
        { status: 503 }
      );
    }

    // 5. Update usage stats
    await supabaseAdmin
      .from("api_keys")
      .update({
        last_used: new Date().toISOString(),
        request_count: (keyData.request_count || 0) + 1,
      })
      .eq("id", keyData.id);

    // 6. Return OpenAI-compatible response
    return Response.json({
      id: `chatcmpl-${Date.now()}`,
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: "gyra-1.0",
      provider,
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: aiReply,
          },
          finish_reason: "stop",
        },
      ],
      usage: {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
      },
    });
  } catch (error: any) {
    console.error("API Error:", error);
    return Response.json(
      {
        error: {
          code: "server_error",
          message: "An unexpected error occurred.",
        },
      },
      { status: 500 }
    );
  }
}