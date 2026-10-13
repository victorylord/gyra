export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  return new Response(
    `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Gyra Media API</title>
  <style>
    body {
      background: #000;
      color: #fff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 24px;
      text-align: center;
    }
    .card {
      max-width: 480px;
      background: #0a0a0a;
      border: 1px solid #27272a;
      border-radius: 24px;
      padding: 40px 32px;
    }
    h1 {
      font-size: 20px;
      font-weight: 600;
      margin: 0 0 12px;
    }
    p {
      color: #a1a1aa;
      font-size: 14px;
      line-height: 1.6;
      margin: 0 0 24px;
    }
    a {
      display: inline-block;
      background: #fff;
      color: #000;
      padding: 12px 24px;
      border-radius: 999px;
      text-decoration: none;
      font-weight: 500;
      font-size: 14px;
    }
    .code {
      color: #60a5fa;
      font-family: ui-monospace, monospace;
      font-size: 12px;
      word-break: break-all;
      margin-top: 12px;
      padding: 12px;
      background: #000;
      border: 1px solid #27272a;
      border-radius: 8px;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>Gyra Media API</h1>
    <p>
      ${
        error
          ? `Spotify returned an error: <strong>${error}</strong>.`
          : code
          ? "Authorization code received. You can close this window."
          : "This is the Spotify OAuth callback for Gyra. The Media API uses client credentials — no user login required."
      }
    </p>
    <a href="https://gyra.ng/api">← Back to Gyra API</a>
    ${
      code
        ? `<div class="code">code=${code.slice(0, 20)}...</div>`
        : ""
    }
  </div>
</body>
</html>`,
    {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    }
  );
}