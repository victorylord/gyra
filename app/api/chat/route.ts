import {
  getUserFromToken,
  getSubscription,
  isSuperGyra,
  type Subscription,
} from "@/app/lib/subscription";
import { FREE_LIMIT } from "@/app/lib/paymentConfig";
import { fal } from "@fal-ai/client";

fal.config({
  credentials: process.env.FAL_KEY,
});

function streamResponse(stream: ReadableStream) {
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", 
    },
  });
}

function encodeEvent(data: any) {
  return new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`);
}

async function performTavilySearch(query: string) {
  if (!process.env.TAVILY_API_KEY) return { context: "", count: 0 };
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
    if (!data.results || data.results.length === 0) return { context: "", count: 0 };

    let context = "Here are recent web search results to help answer:\n\n";
    data.results.forEach((r: any) => {
      context += `Source: ${r.title} (${r.url})\n${r.content}\n\n`;
    });
    return { context, count: data.results.length };
  } catch (e) {
    return { context: "", count: 0 };
  }
}

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

    // ============================================================
    // SYSTEM PROMPT
    // ============================================================
    let systemPrompt = `You are Gyra, an elite AI assistant created by Genvia AI Company. 

CRITICAL INSTRUCTIONS FOR IMAGES:
1. If a user uploads an image and asks a question, analyze the image and answer accurately.
2. If a user asks you to MODIFY an image or GENERATE an image (e.g., "make her do a peace sign", "draw a cat"), you MUST end your response with this exact format: [GENERATE_IMAGE: "detailed prompt of what to generate"]. Make sure the prompt is highly detailed and describes the visual contents accurately based on the user's uploaded image and request.

CRITICAL INSTRUCTIONS FOR CODE:
1. Always provide the FULL, COMPLETE, and ACCURATE code. 
2. Always state the exact file path directly above the code block (e.g., ### app/api/chat/route.ts).
3. Explain the process before giving code.

CRITICAL INSTRUCTIONS FOR TABLES:
1. Use standard Markdown table syntax.

Tone: Professional, helpful, and direct.`;

    if (think) systemPrompt += `\nTHINK MODE IS ON: Reason step-by-step before answering.`;

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // --- SEARCH MODE STREAMING ---
          if (search) {
            const lastUserMsg = [...messages].reverse().find((m: any) => m.role === "user");
            if (lastUserMsg) {
              controller.enqueue(encodeEvent({ status: "searching" }));
              const searchResult = await performTavilySearch(lastUserMsg.content);
              if (searchResult.count > 0) {
                systemPrompt += `\n\nSEARCH MODE IS ON:\n\n${searchResult.context}`;
                controller.enqueue(encodeEvent({ status: "reading", count: searchResult.count }));
              }
            }
          }

          // 🚨 PROPERLY FORMAT MESSAGES FOR GROQ VISION 🚨
          const hasImage = messages.some((m: any) => m.imageBase64);
          const formattedMessages = messages.map((m: any) => {
            if (m.imageBase64) {
              return {
                role: m.role,
                content: [
                  { type: "text", text: m.content },
                  { type: "image_url", image_url: { url: m.imageBase64 } }
                ]
              };
            }
            return { role: m.role, content: m.content };
          });

          const fullMessages = [{ role: "system", content: systemPrompt }, ...formattedMessages];

          // --- AI PROVIDER SELECTION ---
          let res;
          let provider = "";

          if (think && process.env.DEEPSEEK_API_KEY && !hasImage) {
            controller.enqueue(encodeEvent({ status: "thinking" }));
            res = await fetch("https://api.deepseek.com/chat/completions", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
              },
              body: JSON.stringify({
                model: "deepseek-reasoner",
                messages: fullMessages,
                stream: true,
              }),
            });
            provider = "deepseek-reasoner";
          } else if (process.env.GROQ_API_KEY) {
            // Use Vision model if image is present, otherwise standard model
            const model = hasImage ? "llama-3.2-90b-vision-preview" : "openai/gpt-oss-120b";
            
            res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
              },
              body: JSON.stringify({
                model: model,
                messages: fullMessages,
                temperature: 0.7,
                stream: true,
              }),
            });
            provider = "groq";
          }

          if (!res || !res.ok || !res.body) {
            controller.enqueue(encodeEvent({ error: "AI provider failed." }));
            controller.close();
            return;
          }

          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";
          let fullReply = "";

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
                // 🚨 CHECK FOR IMAGE GENERATION REQUEST 🚨
                const imgMatch = fullReply.match(/\[GENERATE_IMAGE:\s*"(.+?)"\]/);
                
                if (imgMatch) {
                  const imagePrompt = imgMatch[1];

                  // SUBSCRIPTION GATE
                  if (!isSuperGyra(subscription)) {
                    const rejectMsg = `\n\n⚠️ **Upgrade Required**\nYou are currently on the Free plan. Image generation is a SuperGyra exclusive feature. \n\n[Click here to upgrade](/upgrade) and unlock unlimited image generation!`;
                    controller.enqueue(encodeEvent({ content: rejectMsg }));
                    controller.enqueue(encodeEvent({ done: true, provider }));
                    controller.close();
                    return;
                  }

                  try {
                    controller.enqueue(encodeEvent({ content: "\n\n🎨 *Generating your image...*\n\n" }));

                    const falResult: any = await fal.subscribe("fal-ai/flux/dev", {
                      input: {
                        prompt: imagePrompt,
                        image_size: "square_hd",
                        num_inference_steps: 28,
                        guidance_scale: 3.5,
                        num_images: 1,
                        enable_safety_checker: true,
                      },
                      logs: false,
                    });

                    if (falResult.data && falResult.data.images && falResult.data.images.length > 0) {
                      const imageUrl = falResult.data.images[0].url;
                      controller.enqueue(encodeEvent({ generatedImage: imageUrl }));
                    } else {
                      throw new Error("No image returned from Fal AI");
                    }
                  } catch (err: any) {
                    console.error("Fal AI Error:", err);
                    controller.enqueue(encodeEvent({ 
                      content: `\n\n❌ **Generation Failed:** ${err.message || "Could not generate image."}` 
                    }));
                  }
                }

                controller.enqueue(encodeEvent({ done: true, provider }));
                controller.close();
                return;
              }
              
              try {
                const parsed = JSON.parse(dataStr);
                const delta = parsed.choices?.[0]?.delta;
                if (delta?.reasoning_content) controller.enqueue(encodeEvent({ reasoning: delta.reasoning_content }));
                if (delta?.content) {
                  fullReply += delta.content;
                  controller.enqueue(encodeEvent({ content: delta.content }));
                }
              } catch (e) {}
            }
          }
          controller.close();
        } catch (error) {
          controller.enqueue(encodeEvent({ error: "Server error" }));
          controller.close();
        }
      }
    });

    return streamResponse(stream);
  } catch (error: any) {
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}