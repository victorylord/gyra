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

    let systemPrompt = `You are Gyra, an elite AI coding assistant created by Genvia AI Company. You act like Cursor.
    
CRITICAL INSTRUCTIONS FOR IMAGES:
1. If a user uploads an image and asks a question, analyze the image and answer accurately.
2. If a user asks you to MODIFY an image (e.g., "make her do a peace sign"), you MUST end your response with this exact format: [GENERATE_IMAGE: "detailed prompt of what to generate based on the image"].

CRITICAL INSTRUCTIONS FOR CODE:
1. Always provide the FULL, COMPLETE, and ACCURATE code. 
2. Always state the exact file path directly above the code block (e.g., ### app/api/chat/route.ts).
3. If a user asks you to read a file, output a special command exactly like this: [READ_FILE: "path/to/file.ts"]`;

    if (think) systemPrompt += `\nTHINK MODE IS ON: Reason step-by-step before answering.`;

    if (search) {
      const lastUserMsg = [...messages].reverse().find((m: any) => m.role === "user");
      if (lastUserMsg) {
        const searchResult = await performTavilySearch(lastUserMsg.content);
        if (searchResult.count > 0) {
          systemPrompt += `\n\nSEARCH MODE IS ON:\n\n${searchResult.context}`;
        }
      }
    }

    const hasImage = messages.some((m: any) => m.imageBase64);
    let latestImageBase64 = "";
    for (let i = messages.length - 1; i >= 0; i--) {
       if (messages[i].imageBase64) {
           latestImageBase64 = messages[i].imageBase64;
           break;
       }
    }

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
    const model = hasImage ? "llama-3.2-90b-vision-preview" : "llama-3.3-70b-versatile";

    // 🚨 RAW FETCH TO GROQ 🚨
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
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

    if (!res || !res.ok || !res.body) {
      const errorText = await res.text();
      console.error("Groq Error:", errorText);
      return Response.json({ error: "Groq API failed" }, { status: 500 });
    }

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const reader = res.body!.getReader();
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
                // 🚨 CHECK FOR IMAGE GENERATION 🚨
                const imgMatch = fullReply.match(/\[GENERATE_IMAGE:\s*"(.+?)"\]/);
                if (imgMatch) {
                  const imagePrompt = imgMatch[1];
                  if (isSuperGyra(subscription)) {
                    try {
                      controller.enqueue(encodeEvent({ content: "\n\n🎨 *Generating your image...*\n\n" }));
                      const falModel = latestImageBase64 ? "fal-ai/flux/dev/image-to-image" : "fal-ai/flux/dev";
                      const inputData: any = { prompt: imagePrompt, num_inference_steps: 28, guidance_scale: 3.5, num_images: 1 };
                      if (latestImageBase64) inputData.image_url = latestImageBase64;
                      else inputData.image_size = "square_hd";

                      const falResult: any = await fal.subscribe(falModel, { input: inputData, logs: false });
                      if (falResult.data?.images?.length > 0) {
                        controller.enqueue(encodeEvent({ generatedImage: falResult.data.images[0].url }));
                      }
                    } catch (err) {
                      console.error(err);
                      controller.enqueue(encodeEvent({ content: "\n\n❌ Image generation failed." }));
                    }
                  } else {
                    controller.enqueue(encodeEvent({ content: `\n\n⚠️ **Upgrade Required**\nImage generation is a SuperGyra exclusive feature. \n\n[Upgrade here](/upgrade)` }));
                  }
                }

                controller.enqueue(encodeEvent({ done: true }));
                controller.close();
                return;
              }
              
              try {
                const parsed = JSON.parse(dataStr);
                const delta = parsed.choices?.[0]?.delta;
                if (delta?.content) {
                  fullReply += delta.content;
                  controller.enqueue(encodeEvent({ content: delta.content }));
                }
              } catch (e) {}
            }
          }
          controller.close();
        } catch (error) {
          controller.enqueue(encodeEvent({ error: "Stream error" }));
          controller.close();
        }
      }
    });

    return streamResponse(stream);

  } catch (error: any) {
    console.error("API Error:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}