import { NextResponse } from "next/server";
import { Resend } from "resend";

// Ensure the API key is loaded
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { email, projectName, projectId } = await req.json();

    if (!email || !projectName || !projectId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Make sure NEXT_PUBLIC_SITE_URL is in your .env (e.g., https://gyra.ng)
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://gyra.ng";
    const projectLink = `${baseUrl}/project/${projectId}`;

    // 🚨 CRITICAL: The from address MUST match your verified subdomain exactly
    const { data, error } = await resend.emails.send({
      from: "Gyra Projects <projects@updates.gyra.ng>", 
      to: [email],
      subject: `Project shared with you: "${projectName}"`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #0a0a0f; color: #ffffff; padding: 40px; border-radius: 16px;">
          <div style="text-align: center; margin-bottom: 30px;">
             <h1 style="color: #ffffff; margin: 0;">Gyra</h1>
          </div>
          
          <p style="font-size: 16px; line-height: 1.5; color: #d4d4d8;">
            A user has shared a project with you on Gyra.ng. You may access the project via the details below:
          </p>
          
          <div style="background-color: #1c1c1e; padding: 20px; border-radius: 12px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0; color: #a1a1aa;"><strong>Project Name:</strong> ${projectName}</p>
          </div>

          <p style="font-size: 16px; line-height: 1.5; color: #d4d4d8;">
            Click the following link to start using this project:
          </p>

          <a href="${projectLink}" style="display: inline-block; background-color: #3b82f6; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; margin: 20px 0;">
            Open Project
          </a>

          <p style="font-size: 14px; line-height: 1.5; color: #71717a; margin-top: 30px;">
            If you are not expecting an invitation to access a project, please ignore this email.
          </p>
          
          <div style="margin-top: 40px; border-top: 1px solid #27272a; padding-top: 20px;">
            <p style="font-size: 12px; color: #71717a;">© 2026 Gyra · Genvia AI Company</p>
          </div>
        </div>
      `,
    });

    if (error) {
      // 🚨 This will log the exact error from Resend in your Vercel logs
      console.error("Resend API Error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Server Error:", error);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}