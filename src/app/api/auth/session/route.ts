import { NextRequest, NextResponse } from "next/server";
import { getUser, deleteSession } from "@/lib/subscriptions";
import { authenticateRequest } from "@/lib/api-response";
import { AUTH_CONFIG } from "@/lib/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  "Cache-Control": "private, no-cache, no-store, max-age=0, must-revalidate",
  Pragma: "no-cache",
};

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth.authenticated || !auth.session) {
    const res = NextResponse.json(
      { authenticated: false, user: null },
      { headers: NO_CACHE_HEADERS }
    );
    if (auth.errorResponse) {
      res.cookies.delete(AUTH_CONFIG.COOKIE_NAME);
    }
    return res;
  }

  const user = await getUser(auth.session.email);
  if (!user) {
    return NextResponse.json(
      {
        authenticated: true,
        user: { email: auth.session.email, verified: true, artists: {} },
      },
      { headers: NO_CACHE_HEADERS }
    );
  }

  return NextResponse.json(
    {
      authenticated: true,
      user: {
        email: user.email,
        verified: user.verified,
        artists: user.artists,
      },
    },
    { headers: NO_CACHE_HEADERS }
  );
}

export async function POST(request: NextRequest) {
  const sessionToken = request.cookies.get(AUTH_CONFIG.COOKIE_NAME)?.value;
  if (sessionToken) {
    await deleteSession(sessionToken);
  }

  const res = NextResponse.json({ success: true }, { headers: NO_CACHE_HEADERS });
  res.cookies.delete(AUTH_CONFIG.COOKIE_NAME);
  return res;
}
