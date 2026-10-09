import {
  getUserFromToken,
  getSubscription,
  isSuperGyra,
  type Subscription,
} from "@/app/lib/subscription";
import { FREE_LIMIT } from "@/app/lib/paymentConfig";

// ============================================================
// Retry helper — waits 1s, 2s, 4s on transient errors
// ============================================================
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 2,
  timeoutMs = 20_000
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(timeoutMs),
      });

      if ((res.status === 503 || res.status === 429) && attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }

      return res;
    } catch (e: any) {
      lastError = e;
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
    }
  }

  throw lastError || new Error("Max retries exceeded");
}

// ============================================================
// Provider callers — each returns a plain string OR null
// ============================================================

async function tryMistral(
  messages: any[],
  model = "mistral-small-latest"
): Promise<string | null> {
  if (!process.env.MISTRAL_API_KEY) return null;
  try {
    const res = await fetchWithRetry(
      "https://api.mistral.ai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7,
        }),
      }
    );

    if (!res.ok) {
      console.warn("mistral non-OK:", res.status);
      return null;
    }
    const data = await res.json();
    return data?.choices?.[0]?.message?.content ?? null;
  } catch (e) {
    console.warn("mistral error:", e);
    return null;
  }
}

async function tryOpenRouter(
  messages: any[],
  model = "meta-llama/llama-3.3-70b-instruct:free"
): Promise<string | null> {
  if (!process.env.OPENROUTER_API_KEY) return null;
  try {
    const res = await fetchWithRetry(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "HTTP-Referer": "https://gyra.ng",
          "X-Title": "Gyra",
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7,
        }),
      }
    );

    if (!res.ok) {
      console.warn("openrouter non-OK:", res.status);
      return null;
    }
    const data = await res.json();
    return data?.choices?.[0]?.message?.content ?? null;
  } catch (e) {
    console.warn("openrouter error:", e);
    return null;
  }
}

async function tryHuggingFace(messages: any[]): Promise<string | null> {
  if (!process.env.HUGGINGFACE_API_TOKEN) return null;
  try {
    const res = await fetchWithRetry(
      "https://router.huggingface.co/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.HUGGINGFACE_API_TOKEN}`,
        },
        body: JSON.stringify({
          model: "meta-llama/Llama-3.1-8B-Instruct",
          messages,
          temperature: 0.7,
        }),
      }
    );

    if (!res.ok) {
      console.warn("huggingface non-OK:", res.status);
      return null;
    }
    const data = await res.json();
    return data?.choices?.[0]?.message?.content ?? null;
  } catch (e) {
    console.warn("huggingface error:", e);
    return null;
  }
}

async function tryGemini(
  messages: any[],
  systemPrompt: string
): Promise<string | null> {
  if (!process.env.GEMINI_API_KEY) return null;
  try {
    const contents = messages
      .filter((m: any) => m.role !== "system")
      .map((m: any) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

    contents.unshift({
      role: "user",
      parts: [{ text: systemPrompt }],
    });

    const res = await fetchWithRetry(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents }),
      }
    );

    if (!res.ok) {
      console.warn("gemini non-OK:", res.status);
      return null;
    }
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
  } catch (e) {
    console.warn("gemini error:", e);
    return null;
  }
}

async function tryGroq(
  messages: any[],
  useThink: boolean
): Promise<string | null> {
  if (!process.env.GROQ_API_KEY) return null;
  try {
    const model = useThink
      ? "llama-3.3-70b-versatile"
      : "llama-3.1-8b-instant";

    const res = await fetchWithRetry(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7,
        }),
      }
    );

    if (!res.ok) {
      console.warn("groq non-OK:", res.status);
      return null;
    }
    const data = await res.json();
    return data?.choices?.[0]?.message?.content ?? null;
  } catch (e) {
    console.warn("groq error:", e);
    return null;
  }
}

// ============================================================
// Streaming helper — same payload as before, word by word
// ============================================================
function streamWords(text: string, provider: string, delayMs = 20) {
  const words = text.split(/(\s+)/);
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for (const word of words) {
          controller.enqueue(
            new TextEncoder().encode(
              `data: ${JSON.stringify({ token: word })}\n\n`
            )
          );
          await new Promise((r) => setTimeout(r, delayMs));
        }
        controller.enqueue(
          new TextEncoder().encode(
            `data: ${JSON.stringify({ done: true, provider })}\n\n`
          )
        );
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

// ============================================================
// MAIN ROUTE
// ============================================================
export async function POST(req: Request) {
  try {
    const { messages, think, search } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return Response.json(
        { error: "`messages` must be a non-empty array." },
        { status: 400 }
      );
    }

    const lastUserMsg = [...messages]
      .reverse()
      .find((m: any) => m.role === "user");

    // Subscription lookup — never crash the route
    let subscription: Subscription = {
      plan: "free",
      status: "inactive",
      expiresAt: null,
      creditsUsd: 0,
    };

    const userToken = req.headers.get("x-gyra-user-token") || "";
    if (userToken) {
      try {
        const user = await getUserFromToken(userToken);
        if (user) subscription = await getSubscription(user.id);
      } catch (e) {
        console.error("subscription lookup failed:", e);
      }
    }

    // Free-tier limit
    const userMessageCount = messages.filter(
      (m: any) => m.role === "user"
    ).length;

    if (!isSuperGyra(subscription) && userMessageCount > FREE_LIMIT) {
      return Response.json(
        {
          error: {
            code: "chat_limit_reached",
            message: `You've reached the free limit of ${FREE_LIMIT} messages in this conversation. Upgrade to SuperGyra for unlimited chat.`,
            upgradeUrl: "https://gyra.ng/upgrade",
          },
        },
        {
          status: 402,
          headers: { "X-Upgrade-URL": "https://gyra.ng/upgrade" },
        }
      );
    }

    // ============ SYSTEM PROMPT ============
    const systemPrompt = {
      role: "system",
      content: `You are Gyra, an advanced AI assistant created by Genvia AI Company. Genvia is owned by Victory Lord. You are intelligent, direct, witty, and highly helpful. When showing code, ALWAYS wrap it in triple-backtick code fences with the language specified. Use emojis naturally.${
        think
          ? "\n\nTHINK MODE IS ON: Reason step-by-step before answering. Be thorough."
          : ""
      }${
        search
          ? "\n\nSEARCH MODE IS ON: Reference current events when relevant."
          : ""
      }`,
    };

    const fullMessages = [systemPrompt, ...messages];

    // ============ VISION (Gemini only — has image support) ============
    const hasAttachment =
      lastUserMsg?.imageBase64 || lastUserMsg?.fileBase64 ? true : false;

    if (hasAttachment && process.env.GEMINI_API_KEY) {
      try {
        const geminiContents: any[] = [];
        for (const m of messages) {
          if (m.role === "system") continue;
          const role = m.role === "assistant" ? "model" : "user";
          const parts: any[] = [];
          if (m.content) parts.push({ text: m.content });

          const isLastUser = m === lastUserMsg && m.role === "user";
          if (isLastUser) {
            if (m.imageBase64) {
              const match = m.imageBase64.match(/^data:(.+);base64,(.+)$/);
              if (match)
                parts.push({
                  inline_data: { mime_type: match[1], data: match[2] },
                });
            }
            if (m.fileBase64) {
              const match = m.fileBase64.match(/^data:(.+);base64,(.+)$/);
              if (match)
                parts.push({
                  inline_data: { mime_type: match[1], data: match[2] },
                });
            }
          }
          if (parts.length > 0) geminiContents.push({ role, parts });
        }
        geminiContents.unshift({
          role: "user",
          parts: [{ text: systemPrompt.content }],
        });

        const res = await fetchWithRetry(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: geminiContents }),
          }
        );

        if (res.ok) {
          const data = await res.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) return streamWords(text, "gemini-vision", 15);
        }
      } catch (e) {
        console.warn("gemini vision failed:", e);
      }
    }

    // ============ TEXT WATERFALL ============
    // Order: Mistral → OpenRouter → HuggingFace → Gemini → Groq

    let reply: string | null = null;
    let provider = "none";

    reply = await tryMistral(fullMessages);
    if (reply) provider = "mistral";

    if (!reply) {
      reply = await tryOpenRouter(fullMessages);
      if (reply) provider = "openrouter";
    }

    if (!reply) {
      reply = await tryHuggingFace(fullMessages);
      if (reply) provider = "huggingface";
    }

    if (!reply) {
      reply = await tryGemini(messages, systemPrompt.content);
      if (reply) provider = "gemini";
    }

    if (!reply) {
      reply = await tryGroq(fullMessages, !!think);
      if (reply) provider = "groq";
    }

    if (!reply) {
      return Response.json(
        {
          error:
            "All AI providers are temporarily unavailable. Please try again in a moment.",
        },
        { status: 503 }
      );
    }

    return streamWords(reply, provider, 20);
  } catch (error: any) {
    console.error("Chat route exception:", error);
    return Response.json(
      { error: error?.message || "An unexpected error occurred." },
      { status: 500 }
    );
  }
}