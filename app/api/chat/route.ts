export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const systemPrompt = {
      role: "system",
      content:
        "You are Gyra, an advanced AI assistant created by Victory Lord Himself. You are intelligent, direct, witty, and highly helpful. You prioritize accuracy and clarity. If anyone asks who made you, you proudly state that you were created by Victory Lord Himself. You are not just an AI; you are a partner in exploration and critical thinking. Keep responses concise unless asked for detail.",
    };

    const fullMessages = [systemPrompt, ...messages];

    // ---- 1. TRY GROQ (Primary) ----
    if (process.env.GROQ_API_KEY) {
      try {
        const res = await fetch(
          "https://api.groq.com/openai/v1/chat/completions",
          {
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
          }
        );

        const data = await res.json();

        if (data.choices && data.choices[0]?.message?.content) {
          return Response.json({
            message: data.choices[0].message.content,
            provider: "groq",
          });
        }

        console.warn("Groq failed:", data?.error?.message || data);
      } catch (err) {
        console.warn("Groq threw:", err);
      }
    }

    // ---- 2. TRY GROK (xAI) ----
    if (process.env.XAI_API_KEY) {
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

        if (data.choices && data.choices[0]?.message?.content) {
          return Response.json({
            message: data.choices[0].message.content,
            provider: "grok",
          });
        }

        console.warn("Grok failed:", data?.error?.message || data);
      } catch (err) {
        console.warn("Grok threw:", err);
      }
    }

    // ---- 3. TRY GEMINI (Last Resort) ----
    if (process.env.GEMINI_API_KEY) {
      try {
        // Gemini uses a different message format
        const geminiContents = messages.map((m: any) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        }));

        // Prepend system prompt as a user message (Gemini doesn't have a system role)
        geminiContents.unshift({
          role: "user",
          parts: [{ text: systemPrompt.content }],
        });

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: geminiContents,
              generationConfig: {
                temperature: 0.7,
              },
            }),
          }
        );

        const data = await res.json();

        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (text) {
          return Response.json({
            message: text,
            provider: "gemini",
          });
        }

        console.warn("Gemini failed:", data?.error?.message || data);
      } catch (err) {
        console.warn("Gemini threw:", err);
      }
    }

    // ---- ALL PROVIDERS FAILED ----
    return Response.json(
      {
        error:
          "All AI providers are temporarily unavailable. Please try again in a moment.",
      },
      { status: 500 }
    );
  } catch (error) {
    console.error("Server Error:", error);
    return Response.json(
      { error: "Failed to connect to Gyra AI engine" },
      { status: 500 }
    );
  }
}