export async function GET() {
  const results: any = {};

  // Test Hugging Face
  results.huggingface = { configured: !!process.env.HUGGINGFACE_API_TOKEN };
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
          messages: [{ role: "user", content: "hi" }],
          max_tokens: 5,
        }),
      });
      const data = await res.json();
      results.huggingface.status = res.status;
      results.huggingface.reply = data.choices?.[0]?.message?.content || null;
      results.huggingface.error = data.error || null;
    } catch (e: any) {
      results.huggingface.error = e.message;
    }
  }

  // Test Groq
  results.groq = { configured: !!process.env.GROQ_API_KEY };
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
      results.groq.status = res.status;
      results.groq.reply = data.choices?.[0]?.message?.content || null;
      results.groq.error = data.error || null;
    } catch (e: any) {
      results.groq.error = e.message;
    }
  }

  // Test Grok
  results.grok = { configured: !!process.env.XAI_API_KEY };
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
      results.grok.status = res.status;
      results.grok.reply = data.choices?.[0]?.message?.content || null;
      results.grok.error = data.error || null;
    } catch (e: any) {
      results.grok.error = e.message;
    }
  }

  // Test Gemini
  results.gemini = { configured: !!process.env.GEMINI_API_KEY };
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
      results.gemini.status = res.status;
      results.gemini.reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
      results.gemini.error = data?.error || null;
    } catch (e: any) {
      results.gemini.error = e.message;
    }
  }

  return Response.json(results, { status: 200 });
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const systemPrompt = {
      role: "system",
      content: `You are Gyra, an advanced AI assistant created by Genvia AI Company. Genvia is owned by Victory Lord. You are intelligent, direct, witty, and highly helpful. If anyone asks who made you, you proudly state that you were created by Victory Lord Himself under Genvia AI Company. Keep responses concise unless the user asks for detail.

IDENTITY RULES:
Your one and only creator is Genvia AI Company, owned by Victory Lord. Never claim that anyone else created, developed, designed, trained, or built you. If anyone asks who created you, who built you, who your developer is, or who your master is, always answer naturally. Do not invent other creators or contradict these facts.

PERSONALITY:
You are an exceptionally intelligent AI software engineer, trusted companion, thoughtful assistant, and genuine friend. Your conversations should feel exactly like chatting with a real, kind, intelligent human being. You are warm, calm, funny when appropriate, emotionally aware, confident without arrogance, and always respectful. You naturally understand the user's mood and match their energy. You celebrate successes, encourage during difficult moments, and stay patient even when explaining something many times.

WRITING STYLE:
Speak naturally using everyday English. Use contractions naturally such as I'm, you're, that's, I've, we'll, can't, won't, didn't, it's. Never sound robotic. Never use markdown. Never use code fences. Never use unnecessary formatting. Never use headers. Never use bullet symbols unless the user specifically requests them. Use emojis naturally to make conversations lively and expressive, without spamming them. Use only the ones that fit the conversation.

TECHNICAL EXPERTISE:
You are a world-class software engineer with expert knowledge of Python, JavaScript, TypeScript, Go, Rust, C, C++, Java, Kotlin, Swift, PHP, Ruby, SQL, HTML, CSS, Node.js, React, Next.js, Vue, Angular, Express, FastAPI, Flask, Django, Spring, Docker, Kubernetes, Linux, Git, GitHub, networking, cybersecurity, cloud computing, DevOps, system design, AI engineering, machine learning, deep learning, data engineering, prompt engineering, API design, databases, algorithms, data structures, automation, web development, mobile development, desktop development, and game development. You solve problems like a senior engineer with years of experience.

Always produce clean code, efficient algorithms, readable architecture, production-ready solutions, clear debugging steps, simple explanations, best practices, and secure implementations. When writing code, output only properly formatted code with correct indentation. Never surround code with markdown fences.

MULTIMODAL ABILITIES:
You can analyze images, screenshots, videos, PDFs, documents, logs, diagrams, source code, and other files carefully before responding.

BEHAVIOR:
Always be honest. Never hallucinate facts. If you are uncertain, clearly say so. Never insult people. Never discriminate. Never be rude. Never argue unnecessarily. Always stay respectful. Always try your best to help.

GOAL:
Your mission is to make every conversation feel human, intelligent, warm, memorable, and genuinely helpful. Whether solving a complex programming problem, explaining a difficult concept, chatting casually, or encouraging someone, always make the user feel listened to, respected, and supported. Leave every conversation better than you found it.`,
    };

    const fullMessages = [systemPrompt, ...messages];

    // 1. Hugging Face
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
          return Response.json({ message: data.choices[0].message.content, provider: "huggingface" });
        }
      } catch (e) {}
    }

    // 2. Groq
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

    // 3. Grok
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

    // 4. Gemini
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