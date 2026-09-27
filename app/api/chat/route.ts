export async function POST(req: Request) {
  try {
    const { messages, think, search } = await req.json();

    const lastUserMsg = [...messages]
      .reverse()
      .find((m: any) => m.role === "user");

    const hasImage = lastUserMsg?.imageBase64 ? true : false;
    const hasFile = lastUserMsg?.fileBase64 ? true : false;
    const hasAttachment = hasImage || hasFile;

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

    // ============ VISION (Gemini) ============
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
              if (match) {
                parts.push({
                  inline_data: { mime_type: match[1], data: match[2] },
                });
              }
            }
            if (m.fileBase64) {
              const match = m.fileBase64.match(/^data:(.+);base64,(.+)$/);
              if (match) {
                parts.push({
                  inline_data: { mime_type: match[1], data: match[2] },
                });
              }
            }
          }

          if (parts.length > 0) {
            geminiContents.push({ role, parts });
          }
        }

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
          const words = text.split(/(\s+)/);
          const stream = new ReadableStream({
            async start(controller) {
              for (const word of words) {
                controller.enqueue(
                  new TextEncoder().encode(
                    `data: ${JSON.stringify({ token: word })}\n\n`
                  )
                );
                await new Promise((r) => setTimeout(r, 15));
              }
              controller.enqueue(
                new TextEncoder().encode(
                  `data: ${JSON.stringify({
                    done: true,
                    provider: "gemini-vision",
                  })}\n\n`
                )
              );
              controller.close();
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
      } catch (e) {
        console.warn("Gemini vision failed:", e);
      }
    }

    // ============ TEXT (Groq streaming) ============
    if (process.env.GROQ_API_KEY) {
      try {
        const model = think
          ? "llama-3.3-70b-versatile"
          : "llama-3.1-8b-instant";

        const groqRes = await fetch(
          "https://api.groq.com/openai/v1/chat/completions",
          {
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
          }
        );

        if (groqRes.ok && groqRes.body) {
          const stream = new ReadableStream({
            async start(controller) {
              const reader = groqRes.body!.getReader();
              const decoder = new TextDecoder();
              let buffer = "";

              try {
                while (true) {
                  const { done, value } = await reader.read();
                  if (done) break;
                  buffer += decoder.decode(value, { stream: true });
                  const lines = buffer.split("\n");
                  buffer = lines.pop() || "";
                  for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed.startsWith("data:")) continue;
                    const d = trimmed.slice(5).trim();
                    if (d === "[DONE]") {
                      controller.enqueue(
                        new TextEncoder().encode(
                          `data: ${JSON.stringify({
                            done: true,
                            provider: "groq",
                          })}\n\n`
                        )
                      );
                      controller.close();
                      return;
                    }
                    try {
                      const parsed = JSON.parse(d);
                      const token = parsed.choices?.[0]?.delta?.content;
                      if (token) {
                        controller.enqueue(
                          new TextEncoder().encode(
                            `data: ${JSON.stringify({ token })}\n\n`
                          )
                        );
                      }
                    } catch (e) {}
                  }
                }
                controller.enqueue(
                  new TextEncoder().encode(
                    `data: ${JSON.stringify({ done: true, provider: "groq" })}\n\n`
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
      } catch (err) {
        console.warn("Groq streaming failed:", err);
      }
    }

    // ============ FALLBACK (Hugging Face) ============
    if (process.env.HUGGINGFACE_API_TOKEN) {
      try {
        const res = await fetch(
          "https://router.huggingface.co/v1/chat/completions",
          {
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
          }
        );
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content;

        if (text) {
          const words = text.split(/(\s+)/);
          const stream = new ReadableStream({
            async start(controller) {
              for (const word of words) {
                controller.enqueue(
                  new TextEncoder().encode(
                    `data: ${JSON.stringify({ token: word })}\n\n`
                  )
                );
                await new Promise((r) => setTimeout(r, 20));
              }
              controller.enqueue(
                new TextEncoder().encode(
                  `data: ${JSON.stringify({
                    done: true,
                    provider: "huggingface",
                  })}\n\n`
                )
              );
              controller.close();
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
      } catch (e) {
        console.warn("Hugging Face failed:", e);
      }
    }

    return Response.json(
      { error: "All providers failed" },
      { status: 500 }
    );
  } catch (error) {
    console.error("Server error:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}