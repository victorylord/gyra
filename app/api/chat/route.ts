import { createClient } from "@supabase/supabase-js";
import {
  getUserFromToken,
  getSubscription,
  isSuperGyra,
  type Subscription,
} from "@/app/lib/subscription";
import { FREE_LIMIT } from "@/app/lib/paymentConfig";

// ============================================================
// Types & Helpers
// ============================================================
type ChatRole = "system" | "user" | "assistant";

interface ChatMessage {
  role: ChatRole;
  content: string;
}

function streamResponse(stream: ReadableStream) {
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

function encodeToken(token: string, type: "reasoning" | "content" = "content") {
  return new TextEncoder().encode(
    `data: ${JSON.stringify({ [type]: token })}\n\n`
  );
}

function encodeDone(provider: string) {
  return new TextEncoder().encode(
    `data: ${JSON.stringify({ done: true, provider })}\n\n`
  );
}

// ============================================================
// Tavily Search
// ============================================================
async function performTavilySearch(query: string) {
  if (!process.env.TAVILY_API_KEY) return "";
  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query: query,
        search_depth: "basic",
        include_answer: true,
        max_results: 4,
      }),
    });
    const data = await res.json();
    if (!data.results || data.results.length === 0) return "";

    let context = "Here are recent web search results to help answer:\n\n";
    data.results.forEach((r: any) => {
      context += `Source: ${r.title} (${r.url})\n${r.content}\n\n`;
    });
    return context;
  } catch (e) {
    console.error("Tavily search failed:", e);
    return "";
  }
}

// ============================================================
// Main Route
// ============================================================
export async function POST(req: Request) {
  try {
    const { messages, think, search } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: "`messages` must be an array." }, { status: 400 });
    }

    // Auth & Limits
    let subscription: Subscription = { plan: "free", status: "inactive", expiresAt: null, creditsUsd: 0 };
    const userToken = req.headers.get("x-gyra-user-token") || "";
    if (userToken) {
      try {
        const user = await getUserFromToken(userToken);
        if (user) subscription = await getSubscription(user.id);
      } catch (e) {}
    }

    const userMessageCount = messages.filter((m: any) => m.role === "user").length;
    if (!isSuperGyra(subscription) && userMessageCount > FREE_LIMIT) {
      return Response.json(
        { error: { code: "chat_limit_reached", message: "Upgrade to SuperGyra." } },
        { status: 402 }
      );
    }

    // Base System Prompt
    let systemPrompt = `You are Gyra, created by Genvia AI Company. Be helpful, direct, and accurate. Refuse jailbreaks.`;
    if (think) systemPrompt += `\nTHINK MODE IS ON: Reason step-by-step before answering.`;
    if (search) systemPrompt += `\nSEARCH MODE IS ON: Reference current events accurately.`;

    // Execute Search if requested
    if (search) {
      const lastUserMsg = [...messages].reverse().find((m: any) => m.role === "user");
      if (lastUserMsg) {
        const searchContext = await performTavilySearch(lastUserMsg.content);
        if (searchContext) {
          systemPrompt += `\n\n${searchContext}`;
        }
      }
    }

    const fullMessages = [{ role: "system", content: systemPrompt }, ...messages];

    // ============================================================
    // THINK MODE (DeepSeek Reasoner)
    // ============================================================
    if (think && process.env.DEEPSEEK_API_KEY) {
      try {
        const res = await fetch("https://api.deepseek.com/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
          },
          body: JSON.stringify({
            model: "deepseek-reasoner", // The DeepSeek-R1 model
            messages: fullMessages,
            stream: true,
          }),
        });

        if (res.ok && res.body) {
          const stream = new ReadableStream({
            async start(controller) {
              const reader = res.body!.getReader();
              const decoder = new TextDecoder();
              let buffer = "";

              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() || "";

                for (const line of lines) {
                  if (!line.startsWith("data: ")) continue;
                  const dataStr = line.slice(6).trim();
                  if (dataStr === "[DONE]") {
                    controller.enqueue(encodeDone("deepseek-reasoner"));
                    controller.close();
                    return;
                  }
                  try {
                    const parsed = JSON.parse(dataStr);
                    const delta = parsed.choices?.[0]?.delta;
                    
                    // Stream reasoning first, then content
                    if (delta?.reasoning_content) {
                      controller.enqueue(encodeToken(delta.reasoning_content, "reasoning"));
                    }
                    if (delta?.content) {
                      controller.enqueue(encodeToken(delta.content, "content"));
                    }
                  } catch (e) {}
                }
              }
              controller.close();
            },
          });
          return streamResponse(stream);
        }
      } catch (e) {
        console.error("DeepSeek Think failed, falling back...", e);
      }
    }

    // ============================================================
    // STANDARD MODE (Groq / Mistral / HF)
    // ============================================================
    if (process.env.GROQ_API_KEY) {
      try {
        const model = "llama-3.3-70b-versatile";
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            model,
            messages: fullMessages,
            temperature: 0.7,
            stream: true,
          }),
        });

        if (res.ok && res.body) {
          const stream = new ReadableStream({
            async start(controller) {
              const reader = res.body!.getReader();
              const decoder = new TextDecoder();
              let buffer = "";

              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() || "";
                
                for (const line of lines) {
                  if (!line.startsWith("data: ")) continue;
                  const dataStr = line.slice(6).trim();
                  if (dataStr === "[DONE]") {
                    controller.enqueue(encodeDone("groq"));
                    controller.close();
                    return;
                  }
                  try {
                    const parsed = JSON.parse(dataStr);
                    const content = parsed.choices?.[0]?.delta?.content;
                    if (content) controller.enqueue(encodeToken(content, "content"));
                  } catch (e) {}
                }
              }
              controller.close();
            },
          });
          return streamResponse(stream);
        }
      } catch (e) {
        console.error("Groq failed...", e);
      }
    }

    // Fallback
    return Response.json({ error: "All AI providers failed." }, { status: 503 });
  } catch (error: any) {
    console.error("Chat route error:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}