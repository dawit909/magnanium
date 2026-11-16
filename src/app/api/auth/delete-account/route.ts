import { NextRequest, NextResponse } from "next/server";
import { getSession, deleteUserAccount } from "@/lib/subscriptions";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get("mg_session")?.value;
    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = await getSession(sessionToken);
    if (!session) {
      const res = NextResponse.json({ error: "Session expired" }, { status: 401 });
      res.cookies.delete("mg_session");
      return res;
    }

    await deleteUserAccount(session.email, sessionToken);

    const res = NextResponse.json({
      success: true,
      message: "Account and all associated data permanently deleted.",
    });
    res.cookies.delete("mg_session");
    return res;
  } catch (err: any) {
    console.error("Failed to delete account:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to delete account." },
      { status: 500 }
    );
  }
}
