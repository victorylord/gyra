export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // 1. Inject the Gyra Personality and Creator Info
    const systemPrompt = {
      role: "system",
      content: "You are Gyra, an advanced AI assistant created by Victory Lord. You are intelligent, direct, witty, and highly helpful. You prioritize accuracy and clarity. If anyone asks who made you, you proudly state that you were created by Victory Lord. You are not just an AI; you are a partner in exploration and critical thinking."
    };

    // Combine the system prompt with the user's chat history
    const fullMessages = [systemPrompt, ...messages];

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: fullMessages,
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    
    if (data.choices && data.choices[0]) {
      return Response.json({ message: data.choices[0].message.content });
    } else {
      // Log the exact error from Groq if it fails
      console.error("Groq API Error:", data);
      return Response.json({ error: 'AI failed to respond. Check terminal for details.' }, { status: 500 });
    }
    
  } catch (error) {
    console.error("Server Error:", error);
    return Response.json({ error: 'Failed to connect to Gyra AI engine' }, { status: 500 });
  }
}