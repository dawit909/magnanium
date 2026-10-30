import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ personId: string }> }
) {
  const { personId } = await props.params;
  const { search } = new URL(request.url);
  return NextResponse.redirect(new URL(`/feed/${personId}${search}`, request.url), 308);
}
