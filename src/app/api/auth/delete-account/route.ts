import { NextRequest, NextResponse } from "next/server";
import { deleteUserAccount } from "@/lib/subscriptions";
import { authenticateRequest } from "@/lib/api-response";
import { AUTH_CONFIG } from "@/lib/constants";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.authenticated || !auth.session) {
      return auth.errorResponse!;
    }

    await deleteUserAccount(auth.session.email, auth.sessionToken);

    const res = NextResponse.json({
      success: true,
      message: "Account and all associated data permanently deleted.",
    });
    res.cookies.delete(AUTH_CONFIG.COOKIE_NAME);
    return res;
  } catch (err: any) {
    console.error("Failed to delete account:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to delete account." },
      { status: 500 }
    );
  }
}
