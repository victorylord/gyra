type Bucket = { count: number; resetAt: number };

const buckets: Map<string, Bucket> = new Map();

// Cleanup expired buckets every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets.entries()) {
      if (bucket.resetAt < now) buckets.delete(key);
    }
  }, 5 * 60 * 1000);
}

// ---------- RATE LIMITING ----------
export function rateLimit(
  identifier: string,
  limit: number = 30,
  windowMs: number = 60 * 1000
): { success: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const bucket = buckets.get(identifier);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(identifier, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (bucket.count >= limit) {
    return { success: false, remaining: 0, resetAt: bucket.resetAt };
  }

  bucket.count += 1;
  return {
    success: true,
    remaining: limit - bucket.count,
    resetAt: bucket.resetAt,
  };
}

export function getClientIP(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}

// ---------- JAILBREAK DETECTION ----------
const JAILBREAK_PATTERNS = [
  /ignore (all )?(previous|prior|above) (instructions|prompts|rules)/i,
  /disregard (all )?(previous|prior|above) (instructions|prompts|rules)/i,
  /forget (all )?(previous|prior|above|everything)/i,
  /\b(DAN|do anything now)\b/i,
  /you are now (in )?(developer|debug|god|admin|root) mode/i,
  /pretend (you are|to be) (not an AI|a human|unrestricted|uncensored)/i,
  /act as (if you have|though you have) no restrictions/i,
  /(repeat|show|reveal|print|output) (your )?(system prompt|initial prompt|instructions|rules)/i,
  /what (is|are) your (system prompt|initial instructions|hidden rules)/i,
  /from now on[, ]+you (will|must|shall|are)/i,
  /new (rule|rules|instruction|instructions):/i,
  /override (all )?(rules|instructions|restrictions|safety)/i,
  /bypass (all )?(rules|filters|safety|restrictions)/i,
  /hypothetically[, ]+if you (could|were able to|had no)/i,
  /for (educational|research|academic) purposes only/i,
  /base64|rot13|decode this|eval\(/i,
  /how to (hack|ddos|dos attack|inject sql|exploit)/i,
  /write (me )?(a )?(virus|malware|ransomware|keylogger|trojan)/i,
  /how to (make|build|create) (a )?(bomb|weapon|poison|drug)/i,
];

export function detectJailbreak(text: string): {
  suspicious: boolean;
  matched?: string;
} {
  if (!text || typeof text !== "string") return { suspicious: false };
  const cleaned = text.toLowerCase().trim();
  for (const pattern of JAILBREAK_PATTERNS) {
    const match = cleaned.match(pattern);
    if (match) return { suspicious: true, matched: match[0] };
  }
  const keywordCount = (cleaned.match(/ignore|override|bypass|jailbreak/g) || []).length;
  if (keywordCount >= 3) return { suspicious: true, matched: "multiple suspicious keywords" };
  return { suspicious: false };
}

// ---------- LOGGING ----------
export function logSecurityEvent(
  type: "rate_limit" | "jailbreak" | "signup_throttle",
  details: Record<string, any>
): void {
  console.warn(
    `[SECURITY][${type}]`,
    JSON.stringify({
      ...details,
      timestamp: new Date().toISOString(),
    })
  );
}

// ---------- RESPONSE HELPERS ----------
export function rateLimitResponse(resetAt: number): Response {
  const secondsUntilReset = Math.ceil((resetAt - Date.now()) / 1000);
  return new Response(
    JSON.stringify({
      error: {
        code: "rate_limited",
        message: `Too many requests. Please wait ${secondsUntilReset} seconds and try again.`,
        retry_after: secondsUntilReset,
      },
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(secondsUntilReset),
      },
    }
  );
}

export function jailbreakResponse(): Response {
  return new Response(
    JSON.stringify({
      error: {
        code: "policy_violation",
        message:
          "That request goes against Gyra's usage policy. Please rephrase or ask something else.",
      },
    }),
    { status: 400, headers: { "Content-Type": "application/json" } }
  );
}