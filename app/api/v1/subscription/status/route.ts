import { getUserFromToken, getSubscription } from "@/app/lib/subscription";

export async function GET(req: Request) {
  try {
    const token = (req.headers.get("authorization") || "")
      .replace("Bearer ", "")
      .trim();
    if (!token) {
      return Response.json(
        { error: { code: "unauthorized", message: "Missing token." } },
        { status: 401 }
      );
    }

    const user = await getUserFromToken(token);
    if (!user) {
      return Response.json(
        { error: { code: "unauthorized", message: "Invalid token." } },
        { status: 401 }
      );
    }

    const sub = await getSubscription(user.id);
    return Response.json({
      plan: sub.plan,
      status: sub.status,
      expiresAt: sub.expiresAt,
      isSuperGyra: sub.plan === "supergyra" && sub.status === "active",
    });
  } catch (err: any) {
    return Response.json(
      { error: { code: "internal_error", message: err?.message } },
      { status: 500 }
    );
  }
}