import { NextResponse } from "next/server";
import { Resend } from "resend";

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

    const { data, error } = await resend.emails.send({
      from: "Gyra Projects <projects@updates.gyra.ng>", 
      to: [email],
      subject: `You've been invited to collaborate on ${projectName}`,
      html: `
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <title>Project Invitation</title>
  <style>
    body, table, td, a { -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
    table, td { mso-table-lspace:0pt; mso-table-rspace:0pt; }
    img { -ms-interpolation-mode:bicubic; border:0; outline:none; text-decoration:none; }
    table { border-collapse:collapse !important; }
    body { margin:0 !important; padding:0 !important; width:100% !important; height:100% !important; }
    @media screen and (max-width:600px) {
      .container { width:100% !important; max-width:100% !important; }
      .mobile-pad { padding-left:22px !important; padding-right:22px !important; }
      .mobile-title { font-size:34px !important; line-height:40px !important; }
    }
  </style>
</head>
<body style="margin:0; padding:0; background-color:#081321;">
  <div style="display:none; font-size:1px; color:#081321; line-height:1px; max-height:0; max-width:0; opacity:0; overflow:hidden;">You have been invited to collaborate on a project on Gyra.</div>
  
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#081321;">
  <tr><td align="center" style="padding:34px 12px;">
    <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:600px; background:#101f32; border:1px solid #20364d;">
      
      <!-- Header -->
      <tr><td class="mobile-pad" style="padding:28px 42px; border-bottom:1px solid #263b50;">
        <table role="presentation" width="100%"><tr>
          <td style="font-family:Arial,Helvetica,sans-serif; font-size:22px; font-weight:700; letter-spacing:2px; color:#f4fbff;">GYRA<span style="color:#5bd6ea;">.</span></td>
          <td align="right" style="font-family:Arial,Helvetica,sans-serif; font-size:10px; font-weight:700; letter-spacing:1.5px; color:#91a8bc;">PROJECT INVITATION</td>
        </tr></table>
      </td></tr>

      <!-- Title & Intro -->
      <tr><td class="mobile-pad" style="padding:42px 42px 8px;">
        <p style="margin:0 0 16px; font-family:Arial,Helvetica,sans-serif; font-size:11px; font-weight:700; letter-spacing:2px; color:#5bd6ea;">YOU'VE BEEN INVITED</p>
        <h1 class="mobile-title" style="margin:0; font-family:Arial,Helvetica,sans-serif; font-size:40px; line-height:47px; letter-spacing:-1.2px; color:#f4fbff; font-weight:700;">A new project<br>is waiting for you.</h1>
        <p style="margin:18px 0 0; font-family:Arial,Helvetica,sans-serif; font-size:15px; line-height:25px; color:#9db1c3;">A user has shared a workspace with you on Gyra.ng.</p>
      </td></tr>

      <!-- Project Details -->
      <tr><td class="mobile-pad" style="padding:28px 42px 10px; font-family:Arial,Helvetica,sans-serif; font-size:15px; line-height:26px; color:#c2d0dc;">
        <p style="margin:0 0 18px;">Hello,</p>
        <p style="margin:0 0 18px;">You have been granted access to view and collaborate on a specific project. Click the link below to open the workspace and review the files and conversations inside.</p>
      </td></tr>

      <!-- Project Name Card -->
      <tr><td class="mobile-pad" style="padding:0 42px 24px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#172b40; border:1px solid #29465d; border-radius:6px;"><tr><td style="padding:18px 20px;">
          <p style="margin:0 0 6px; font-family:Arial,Helvetica,sans-serif; font-size:10px; font-weight:700; letter-spacing:1.6px; color:#5bd6ea;">PROJECT NAME</p>
          <p style="margin:0; font-family:Arial,Helvetica,sans-serif; font-size:18px; font-weight:700; color:#f4fbff;">${projectName}</p>
        </td></tr></table>
      </td></tr>

      <!-- CTA Button -->
      <tr><td class="mobile-pad" style="padding:0 42px 38px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#172b40; border:1px solid #29465d;"><tr><td style="padding:18px 20px;">
          <p style="margin:0 0 14px; font-family:Arial,Helvetica,sans-serif; font-size:14px; line-height:22px; color:#dce8f0;">Click below to access the project workspace.</p>
          <table role="presentation" cellpadding="0" cellspacing="0"><tr><td bgcolor="#5bd6ea" style="border-radius:3px;">
            <a href="${projectLink}" target="_blank" style="display:inline-block; padding:13px 20px; font-family:Arial,Helvetica,sans-serif; font-size:13px; font-weight:700; color:#082034; text-decoration:none;">Open Project&nbsp; &rarr;</a>
          </td></tr></table>
        </td></tr></table>
      </td></tr>

      <!-- Footer -->
      <tr><td class="mobile-pad" style="padding:22px 42px 26px; border-top:1px solid #263b50; font-family:Arial,Helvetica,sans-serif;">
        <p style="margin:0 0 5px; font-size:14px; font-weight:700; color:#f4fbff;">Gyra Team</p>
        <p style="margin:0 0 10px; font-size:12px; color:#91a8bc;">Genvia AI Company</p>
        <p style="margin:0; font-size:11px; color:#71889d;">If you were not expecting this invitation, you can safely ignore this email.</p>
      </td></tr>
      
    </table>
    <p style="margin:15px 0 0; font-family:Arial,Helvetica,sans-serif; font-size:10px; color:#71889d;">© 2026 Gyra · Intelligence, Simplified.</p>
  </td></tr>
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