import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { email, projectName, projectId, inviterName } = await req.json();

    if (!email || !projectName || !projectId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://gyra.ng";
    const projectLink = `\( {baseUrl}/project/ \){projectId}`;
    const declineLink = `\( {baseUrl}/project/ \){projectId}/decline`;

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
          <title>Project Invitation — Gyra</title>
        </head>
        <body style="margin:0; padding:0; background-color:#050506; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">

          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#050506; padding:48px 16px;">
            <tr>
              <td align="center">

                <!-- Main Card -->
                <table width="100%" style="max-width:520px; background-color:#0e0e11; border:1px solid #1c1c21; border-radius:32px; overflow:hidden;">

                  <!-- Top Accent Line -->
                  <tr>
                    <td style="height:3px; background:linear-gradient(90deg, #3b82f6 0%, #8b5cf6 50%, #3b82f6 100%);"></td>
                  </tr>

                  <!-- Logo Header -->
                  <tr>
                    <td align="center" style="padding:44px 44px 8px 44px;">
                      <table border="0" cellspacing="0" cellpadding="0">
                        <tr>
                          <td style="padding-right:14px;">
                            <img src="https://gyra.ng/gyra-logo.png" width="40" height="40" style="display:block; border-radius:12px;" alt="Gyra" />
                          </td>
                          <td style="vertical-align:middle;">
                            <span style="color:#f4f4f5; font-size:28px; font-weight:700; letter-spacing:-0.8px;">Gyra</span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Headline -->
                  <tr>
                    <td style="padding:28px 44px 0 44px; text-align:center;">
                      <h1 style="color:#fafafa; font-size:26px; font-weight:700; margin:0; letter-spacing:-0.6px; line-height:1.2;">
                        You've been invited
                      </h1>
                      <p style="color:#a1a1aa; font-size:15.5px; line-height:1.65; margin:14px 0 0 0;">
                        Someone wants you to collaborate on a project inside Gyra.
                      </p>
                    </td>
                  </tr>

                  <!-- Project Details Card -->
                  <tr>
                    <td style="padding:32px 44px 0 44px;">
                      <table width="100%" style="background-color:#161619; border:1px solid #252529; border-radius:20px;">
                        <tr>
                          <td style="padding:24px 26px;">
                            <table width="100%" border="0" cellspacing="0" cellpadding="0">
                              <tr>
                                <td style="padding-bottom:16px;">
                                  <p style="color:#6b6b73; font-size:11px; text-transform:uppercase; letter-spacing:1.5px; font-weight:700; margin:0;">Project</p>
                                  <p style="color:#fafafa; font-size:19px; font-weight:600; margin:6px 0 0 0; letter-spacing:-0.3px;">${projectName}</p>
                                </td>
                              </tr>
                              <tr>
                                <td style="border-top:1px solid #252529; padding-top:16px;">
                                  <p style="color:#6b6b73; font-size:11px; text-transform:uppercase; letter-spacing:1.5px; font-weight:700; margin:0;">Invited by</p>
                                  <p style="color:#d4d4d8; font-size:15px; font-weight:500; margin:6px 0 0 0;">${inviterName || "A Gyra user"}</p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Action Buttons -->
                  <tr>
                    <td style="padding:36px 44px 12px 44px; text-align:center;">
                      <table border="0" cellspacing="0" cellpadding="0" style="margin:0 auto;">
                        <tr>
                          <td align="center" style="border-radius:100px; background-color:#3b82f6;">
                            <a href="${projectLink}" target="_blank" style="display:inline-block; padding:15px 40px; font-size:15.5px; font-weight:700; color:#ffffff; text-decoration:none; border-radius:100px; letter-spacing:-0.2px;">
                              Open Project →
                            </a>
                          </td>
                        </tr>
                      </table>
                      <table border="0" cellspacing="0" cellpadding="0" style="margin:16px auto 0 auto;">
                        <tr>
                          <td align="center">
                            <a href="${declineLink}" target="_blank" style="display:inline-block; padding:12px 28px; font-size:13.5px; font-weight:500; color:#71717a; text-decoration:none; border-radius:100px; border:1px solid #2a2a2f;">
                              Decline
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Divider -->
                  <tr>
                    <td style="padding:28px 44px 0 44px;">
                      <table width="100%" border="0" cellspacing="0" cellpadding="0">
                        <tr>
                          <td style="height:1px; background-color:#1c1c21;"></td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="padding:24px 44px 40px 44px; text-align:center;">
                      <p style="color:#52525b; font-size:12.5px; line-height:1.6; margin:0;">
                        If you weren't expecting this, you can safely ignore it.<br>
                        No action is needed.
                      </p>
                      <p style="color:#3f3f46; font-size:11px; margin:16px 0 0 0; letter-spacing:0.3px;">
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