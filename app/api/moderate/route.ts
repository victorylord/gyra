import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    // MOCK LOGIC: In a real app, you would send this base64 string to an NSFW API.
    // For now, we simulate a check by looking for a specific string in the base64 
    // or just randomly failing 10% of the time for testing.
    
    // Simulate network delay (1.5 seconds)
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Example: If the base64 contains "nude" (just for testing)
    const isNSFW = false; // Change to true to test the red "Violates Terms" UI

    if (isNSFW) {
      return NextResponse.json({ safe: false, reason: "Violates terms" }, { status: 400 });
    }

    return NextResponse.json({ safe: true });
  } catch (error) {
    return NextResponse.json({ error: "Moderation failed" }, { status: 500 });
  }
}