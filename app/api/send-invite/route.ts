import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { email, projectName, projectId } = await req.json();

    if (!email || !projectName || !projectId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://gyra.ng";
    const projectLink = `${baseUrl}/project/${projectId}`;

    const { data, error } = await resend.emails.send({
      from: "Gyra Projects <projects@updates.gyra.ng>", 
      to: [email],
      subject: `You've been invited to a project on Gyra`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #000000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          
          <!-- Main Container -->
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #000000; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="100%" max-width="500" border="0" cellspacing="0" cellpadding="0" style="max-width: 500px; background-color: #0a0a0f; border: 1px solid #27272a; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                  
                  <!-- Header with Logo -->
                  <tr>
                    <td align="center" style="padding: 40px 40px 20px 40px;">
                      <table border="0" cellspacing="0" cellpadding="0">
                        <tr>
                          <td style="vertical-align: middle; padding-right: 12px;">
                            <!-- Logo Image -->
                            <img src="https://gyra.ng/gyra-logo.png" alt="Gyra Logo" width="32" height="32" style="display: block; border-radius: 8px;" />
                          </td>
                          <td style="vertical-align: middle;">
                            <span style="color: #ffffff; font-size: 24px; font-weight: 600; letter-spacing: -0.5px;">Gyra</span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding: 20px 40px 40px 40px; text-align: center;">
                      <h1 style="color: #ffffff; font-size: 20px; font-weight: 600; margin: 0 0 16px 0; letter-spacing: -0.3px;">
                        Project Invitation
                      </h1>
                      <p style="color: #a1a1aa; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
                        You have been invited to collaborate on a project.
                      </p>

                      <!-- Project Name Card -->
                      <div style="background-color: #18181b; border: 1px solid #27272a; border-radius: 16px; padding: 20px; margin-bottom: 32px; text-align: left;">
                        <p style="color: #71717a; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; margin: 0 0 8px 0;">Project Name</p>
                        <p style="color: #ffffff; font-size: 18px; font-weight: 500; margin: 0;">${projectName}</p>
                      </div>

                      <!-- CTA Button -->
                      <table border="0" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
                        <tr>
                          <td align="center" style="border-radius: 100px; background-color: #ffffff;">
                            <a href="${projectLink}" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 15px; font-weight: 600; color: #000000; text-decoration: none; border-radius: 100px;">
                              Open Project
                            </a>
                          </td>
                        </tr>
                      </table>

                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #09090b; padding: 24px 40px; text-align: center; border-top: 1px solid #18181b;">
                      <p style="color: #52525b; font-size: 12px; line-height: 1.5; margin: 0;">
                        If you weren't expecting this invitation, you can safely ignore this email.
                      </p>
                      <p style="color: #3f3f46; font-size: 11px; margin: 12px 0 0 0;">
                        © 2026 Gyra · Genvia AI Company
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>

        </body>
        </html>
      `,
    });

    if (error) {
      console.error("Resend API Error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Server Error:", error);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}