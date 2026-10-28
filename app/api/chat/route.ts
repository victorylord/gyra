import {
  getUserFromToken,
  getSubscription,
  isSuperGyra,
  type Subscription,
} from "@/app/lib/subscription";
import { FREE_LIMIT } from "@/app/lib/paymentConfig";
import { fal } from "@fal-ai/client";
import * as cheerio from "cheerio";

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

// --- HELPER: CALL GROQ ---
async function callGroq(systemPrompt: string, userPrompt: string, stream = false) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { 
      "Content-Type": "application/json", 
      Authorization: `Bearer ${process.env.GROQ_API_KEY}` 
    },
    body: JSON.stringify({
      model: "openai/gpt-oss-120b",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.3,
      stream: stream,
    }),
  });

  if (stream) return res;

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

// --- HELPER: ATLAS INTERNAL SEARCH (DuckDuckGo + Scraper) ---
async function atlasInternalSearch(query: string) {
  try {
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const searchRes = await fetch(searchUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const searchHtml = await searchRes.text();
    
    const $ = cheerio.load(searchHtml);
    const results: { title: string, url: string }[] = [];
    
    $('.result__a').each((i, el) => {
      if (i >= 3) return; // Top 3 results
      let url = $(el).attr('href');
      if (url && url.startsWith('/l/?uddg=')) {
        url = decodeURIComponent(url.split('uddg=')[1]);
      }
      if (url) results.push({ title: $(el).text(), url });
    });

    let context = "";
    const sources: string[] = [];

    for (const result of results) {
      try {
        const pageRes = await fetch(result.url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const pageHtml = await pageRes.text();
        const page$ = cheerio.load(pageHtml);
        
        page$('script, style, nav, footer').remove();
        const text = page$('body').text().replace(/\s+/g, ' ').trim().substring(0, 2000);
        
        context += `Source: ${result.url}\n${text}\n\n`;
        sources.push(result.url);
      } catch (e) {}
    }

    return { context, sources };
  } catch (e) {
    return { context: "", sources: [] };
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

    const lastUserMessage = messages[messages.length - 1].content;

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const startTime = Date.now();

          // 🚨 PHASE 1: ATLAS (Research) 🚨
          let context = "";
          if (search) {
            controller.enqueue(encodeEvent({ type: "status", agent: "Atlas", status: "Searching and scraping the web..." }));
            const searchResult = await atlasInternalSearch(lastUserMessage);
            context = searchResult.context;
            
            if (searchResult.sources.length > 0) {
              controller.enqueue(encodeEvent({ 
                type: "status", 
                agent: "Atlas", 
                status: `Scraped ${searchResult.sources.length} sources.`, 
                sources: searchResult.sources
              }));
            }
          }

          // 🚨 PHASE 2: ORION (Analysis) 🚨
          controller.enqueue(encodeEvent({ type: "status", agent: "Orion", status: "Analyzing intent and requirements..." }));
          const orionPlan = await callGroq(
            "You are Orion, the Chief Intelligence Analyst. Analyze the user's request. Identify what they actually want, the tech stack needed, and potential risks. Be brief and direct.",
            `User Request: ${lastUserMessage}\n\nWeb Context: ${context}`
          );
          controller.enqueue(encodeEvent({ type: "reasoning", reasoning: orionPlan }));

          // 🚨 PHASE 3: ARCHITECT (Design) 🚨
          controller.enqueue(encodeEvent({ type: "status", agent: "Architect", status: "Designing system architecture..." }));
          const architectPlan = await callGroq(
            "You are Architect. Based on Orion's plan, design the file structure, database schema, and exact technical approach. Do not write code yet.",
            `Orion's Plan: ${orionPlan}\n\nUser Request: ${lastUserMessage}`
          );

          // 🚨 PHASE 4: FORGE (Implementation) 🚨
          controller.enqueue(encodeEvent({ type: "status", agent: "Forge", status: "Writing production code..." }));
          
          let forgeSystemPrompt = `You are Forge, Principal Software Engineer. Write the complete, full code based on this architecture: ${architectPlan}. Never use placeholders. Always state exact file paths.`;
          
          if (think) {
             forgeSystemPrompt += `\n\nTHINK MODE IS ON: Reason step-by-step before answering.`;
          }

          const forgeRes = await callGroq(forgeSystemPrompt, lastUserMessage, true);
          
          if (!forgeRes.ok || !forgeRes.body) {
            throw new Error("Forge API failed.");
          }

          const reader = forgeRes.body.getReader();
          const decoder = new TextDecoder();
          let fullReply = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value);
            const lines = chunk.split("\n");
            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              const dataStr = line.slice(6).trim();
              if (dataStr === "[DONE]") break;
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.choices?.[0]?.delta?.content) {
                  fullReply += parsed.choices[0].delta.content;
                  controller.enqueue(encodeEvent({ type: "content", text: parsed.choices[0].delta.content }));
                }
              } catch (e) {}
            }
          }

          // 🚨 PHASE 5: SENTINEL (Review) 🚨
          controller.enqueue(encodeEvent({ type: "status", agent: "Sentinel", status: "Reviewing code for bugs and security..." }));
          const sentinelReview = await callGroq(
            "You are Sentinel, QA Engineer. Review this code for security flaws, bugs, or missing imports. If it's perfect, say 'Code verified.'",
            fullReply
          );

          // 🚨 PHASE 6: MENTOR (Delivery) 🚨
          controller.enqueue(encodeEvent({ type: "status", agent: "Mentor", status: "Preparing explanation..." }));
          const mentorExplanation = await callGroq(
            "You are Mentor. Explain how to run this code to a beginner.",
            fullReply
          );

          // Final package
          controller.enqueue(encodeEvent({ 
            type: "content", 
            text: `\n\n---\n### 🛡️ Sentinel Review\n${sentinelReview}\n\n### 🎓 Mentor Guide\n${mentorExplanation}` 
          }));

          // 🚨 PHASE 7: IMAGE GENERATION (Fal) 🚨
          const imgMatch = fullReply.match(/\[GENERATE_IMAGE:\s*"(.+?)"\]/);
          if (imgMatch) {
            const imagePrompt = imgMatch[1];
            if (isSuperGyra(subscription)) {
              try {
                controller.enqueue(encodeEvent({ type: "content", text: "\n\n🎨 *Generating your image...*\n\n" }));
                
                let latestImageBase64 = "";
                for (let i = messages.length - 1; i >= 0; i--) {
                  if (messages[i].imageBase64) { latestImageBase64 = messages[i].imageBase64; break; }
                }

                const falModel = latestImageBase64 ? "fal-ai/flux/dev/image-to-image" : "fal-ai/flux/dev";
                const inputData: any = { prompt: imagePrompt, num_inference_steps: 28, guidance_scale: 3.5, num_images: 1 };
                if (latestImageBase64) inputData.image_url = latestImageBase64;
                else inputData.image_size = "square_hd";

                const falResult: any = await fal.subscribe(falModel, { input: inputData, logs: false });
                if (falResult.data?.images?.length > 0) {
                  controller.enqueue(encodeEvent({ type: "image", url: falResult.data.images[0].url }));
                }
              } catch (err) {
                console.error(err);
                controller.enqueue(encodeEvent({ type: "content", text: "\n\n❌ Image generation failed." }));
              }
            } else {
              controller.enqueue(encodeEvent({ type: "content", text: `\n\n⚠️ **Upgrade Required**\nImage generation is a SuperGyra exclusive feature. \n\n[Upgrade here](/upgrade)` }));
            }
          }

          // 🚨 CALCULATE REAL THINKING TIME 🚨
          const endTime = Date.now();
          const totalTimeSecs = ((endTime - startTime) / 1000).toFixed(1);
          
          controller.enqueue(encodeEvent({ type: "done", totalTime: totalTimeSecs }));
          controller.close();

        } catch (error) {
          console.error(error);
          controller.enqueue(encodeEvent({ type: "error", text: "Agent pipeline failed." }));
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