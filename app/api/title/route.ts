export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    if (!message) return Response.json({ title: "New Conversation" });

    // Use Groq's fastest model specifically for generating a short title
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content: "You generate concise 2-4 word titles for chat conversations. Output ONLY the title, no quotes, no punctuation at the end.",
          },
          { role: "user", content: message },
        ],
        temperature: 0.3,
        max_tokens: 15,
      }),
    });

    const data = await res.json();
    let title = data.choices?.[0]?.message?.content?.trim() || "New Conversation";
    
    // Clean up any weird AI output
    title = title.replace(/["']/g, "").substring(0, 30);

    return Response.json({ title });
  } catch (e) {
    return Response.json({ title: "New Conversation" });
  }
}