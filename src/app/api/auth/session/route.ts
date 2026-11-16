import { NextRequest, NextResponse } from "next/server";
import { getSession, getUser, deleteSession } from "@/lib/subscriptions";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const sessionToken = request.cookies.get("mg_session")?.value;
  if (!sessionToken) {
    return NextResponse.json({ authenticated: false, user: null });
  }

  const session = await getSession(sessionToken);
  if (!session) {
    const res = NextResponse.json({ authenticated: false, user: null });
    res.cookies.delete("mg_session");
    return res;
  }

  const user = await getUser(session.email);
  if (!user) {
    return NextResponse.json({
      authenticated: true,
      user: { email: session.email, verified: true, artists: {} },
    });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      email: user.email,
      verified: user.verified,
      artists: user.artists,
    },
  });
}

export async function POST(request: NextRequest) {
  const sessionToken = request.cookies.get("mg_session")?.value;
  if (sessionToken) {
    await deleteSession(sessionToken);
  }

  const res = NextResponse.json({ success: true });
  res.cookies.delete("mg_session");
  return res;
}
