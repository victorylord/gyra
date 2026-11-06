import { NextResponse } from "next/server";
import { supabase } from "../../../supabase";

function encodeEvent(data: any) {
  return new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`);
}

export async function POST(req: Request) {
  try {
    const { projectId } = await req.json();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // 1. Fetch files attached to this project
          const { data: files } = await supabase
            .from("project_files")
            .select("name, content")
            .eq("project_id", projectId);

          if (!files || files.length === 0) {
            controller.enqueue(encodeEvent({ type: "error", text: "No files found." }));
            controller.close();
            return;
          }

          const fileContext = files.map((f: any) => `[File: ${f.name}]\n${f.content}`).join("\n\n");

          // 2. Simulate the 6-Agent Reading Process
          controller.enqueue(encodeEvent({ type: "status", agent: "Orion", status: "Analyzing document structure..." }));
          await new Promise(r => setTimeout(r, 1200));
          
          controller.enqueue(encodeEvent({ type: "status", agent: "Atlas", status: "Extracting core entities..." }));
          await new Promise(r => setTimeout(r, 1200));
          
          controller.enqueue(encodeEvent({ type: "status", agent: "Architect", status: "Mapping semantic relationships..." }));
          await new Promise(r => setTimeout(r, 1200));

          controller.enqueue(encodeEvent({ type: "status", agent: "Forge", status: "Generating comprehensive summary..." }));

          // 3. Send to Groq for the summary and 10 prompts
          const systemPrompt = `You are Gyra, an elite AI analyst. A user has uploaded files to this project. 
Read the following file contents and provide a comprehensive summary of what the file is about.
Then, provide exactly 10 highly specific, engaging prompts the user can ask to dive deeper into this file.

FORMAT YOUR RESPONSE EXACTLY LIKE THIS:
### 📄 File Summary
[Your detailed summary here]

### 💡 10 Suggested Prompts
1. [Prompt 1]
2. [Prompt 2]
...
10. [Prompt 10]

FILE CONTENT:
${fileContext}`;

          const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { 
              "Content-Type": "application/json", 
              Authorization: `Bearer ${process.env.GROQ_API_KEY}` 
            },
            body: JSON.stringify({
              model: "openai/gpt-oss-120b",
              messages: [{ role: "system", content: systemPrompt }, { role: "user", content: "Please analyze these files." }],
              stream: true,
            }),
          });

          if (!groqRes.ok || !groqRes.body) throw new Error("Groq API failed.");

          const reader = groqRes.body.getReader();
          const decoder = new TextDecoder();
          
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
                  controller.enqueue(encodeEvent({ type: "content", text: parsed.choices[0].delta.content }));
                }
              } catch (e) {}
            }
          }

          controller.enqueue(encodeEvent({ type: "done" }));
          controller.close();
        } catch (error) {
          console.error(error);
          controller.enqueue(encodeEvent({ type: "error", text: "Failed to read files." }));
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/event-stream" }
    });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}