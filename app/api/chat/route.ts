export async function GET() {
  const results: any = {
    groq: { configured: !!process.env.GROQ_API_KEY, working: false, error: null },
    grok: { configured: !!process.env.XAI_API_KEY, working: false, error: null },
    gemini: { configured: !!process.env.GEMINI_API_KEY, working: false, error: null },
  };

  // Test Groq
  if (process.env.GROQ_API_KEY) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: "hi" }],
          max_tokens: 5,
        }),
      });
      const data = await res.json();
      results.groq.working = !!data.choices;
      if (!data.choices) results.groq.error = data?.error?.message || JSON.stringify(data);
    } catch (e: any) {
      results.groq.error = e.message;
    }
  }

  // Test Grok
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
          messages: [{ role: "user", content: "hi" }],
          max_tokens: 5,
        }),
      });
      const data = await res.json();
      results.grok.working = !!data.choices;
      if (!data.choices) results.grok.error = data?.error?.message || JSON.stringify(data);
    } catch (e: any) {
      results.grok.error = e.message;
    }
  }

  // Test Gemini
  if (process.env.GEMINI_API_KEY) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: "hi" }] }],
          }),
        }
      );
      const data = await res.json();
      results.gemini.working = !!data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!results.gemini.working) results.gemini.error = data?.error?.message || JSON.stringify(data);
    } catch (e: any) {
      results.gemini.error = e.message;
    }
  }

  return Response.json(results);
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const systemPrompt = {
      role: "system",
      content:
        "You are Gyra, an advanced AI assistant created by Victory Lord Himself. You are intelligent, direct, witty, and highly helpful. If anyone asks who made you, you proudly state that you were created by Victory Lord Himself. Keep responses concise unless asked for detail.",
    };

    const fullMessages = [systemPrompt, ...messages];

    // 1. Groq
    if (process.env.GROQ_API_KEY) {
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
          return Response.json({ message: data.choices[0].message.content, provider: "groq" });
        }
      } catch (e) {}
    }

    // 2. Grok
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
        if (data.choices?.[0]?.message?.content) {
          return Response.json({ message: data.choices[0].message.content, provider: "grok" });
        }
      } catch (e) {}
    }

    // 3. Gemini
    if (process.env.GEMINI_API_KEY) {
      try {
        const geminiContents = messages.map((m: any) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        }));
        geminiContents.unshift({ role: "user", parts: [{ text: systemPrompt.content }] });

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
          return Response.json({ message: text, provider: "gemini" });
        }
      } catch (e) {}
    }

    return Response.json({ error: "All providers failed" }, { status: 500 });
  } catch (error) {
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}