import {
  getUserFromToken,
  getSubscription,
  isSuperGyra,
  type Subscription,
} from "@/app/lib/subscription";
import { FREE_LIMIT } from "@/app/lib/paymentConfig";
import { fal } from "@fal-ai/client";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText, tool } from "ai";
import { z } from "zod";

fal.config({
  credentials: process.env.FAL_KEY,
});

// Configure Groq (baseURL MUST be capitalized)
const groq = createOpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY,
});

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
3. If you need to see a file to fix a bug, use the 'read_file' tool. DO NOT guess the code, ask for the file.`;

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

    // Define Tools
    const tools = {
      read_file: tool({
        description: "Read the contents of a specific file in the user's project.",
        parameters: z.object({
          filePath: z.string().describe("The exact path to the file"),
        }),
      }),
    };

    // Use Vercel AI SDK for streaming
    const modelName = hasImage ? "llama-3.2-90b-vision-preview" : "llama-3.3-70b-versatile";
    
    const result = await streamText({
      model: groq(modelName),
      system: systemPrompt,
      messages: formattedMessages as any,
      tools,
      maxSteps: 5,
      onFinish: async ({ text }) => {
        // 🚨 INTERCEPT IMAGE GENERATION 🚨
        const imgMatch = text.match(/\[GENERATE_IMAGE:\s*"(.+?)"\]/);
        if (imgMatch) {
          const imagePrompt = imgMatch[1];
          if (!isSuperGyra(subscription)) return;

          try {
            const falModel = latestImageBase64 ? "fal-ai/flux/dev/image-to-image" : "fal-ai/flux/dev";
            const inputData: any = {
              prompt: imagePrompt,
              num_inference_steps: 28,
              guidance_scale: 3.5,
              num_images: 1,
              enable_safety_checker: true,
            };
            if (latestImageBase64) inputData.image_url = latestImageBase64;
            else inputData.image_size = "square_hd";

            await fal.subscribe(falModel, {
              input: inputData,
              logs: false,
            });
          } catch (err) {
            console.error("Fal AI Error:", err);
          }
        }
      }
    });

    return result.toDataStreamResponse();

  } catch (error: any) {
    console.error("Chat API Error:", error);
    return Response.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}