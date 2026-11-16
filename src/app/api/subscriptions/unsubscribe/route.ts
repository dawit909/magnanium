import { NextRequest, NextResponse } from "next/server";
import { verifyUnsubscribeToken, unsubscribeArtist } from "@/lib/subscriptions";
import { getPersonDetails } from "@/lib/tmdb";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return new NextResponse(
      renderHtml("Invalid Request", "The unsubscribe link is invalid or incomplete."),
      { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  const payload = verifyUnsubscribeToken(token);
  if (!payload) {
    return new NextResponse(
      renderHtml("Invalid Token", "This unsubscribe link has expired or is invalid."),
      { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  await unsubscribeArtist(payload.email, payload.personId);
  const person = await getPersonDetails(payload.personId).catch(() => null);
  const artistName = person?.name || "the artist";

  return new NextResponse(
    renderHtml(
      "Unsubscribed Successfully",
      `You have been unsubscribed from email alerts for <strong>${artistName}</strong> (${payload.email}). You will no longer receive release notifications for this artist.`
    ),
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

function renderHtml(title: string, message: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Magnanium</title>
  <style>
    body {
      margin: 0;
      padding: 40px 20px;
      background-color: #09090b;
      color: #f4f4f5;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 80vh;
    }
    .card {
      background-color: #18181b;
      border: 1px solid #27272a;
      border-radius: 20px;
      padding: 36px 32px;
      max-width: 480px;
      text-align: center;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    }
    h1 {
      margin: 0 0 16px 0;
      font-size: 20px;
      font-weight: 600;
      color: #ffffff;
    }
    p {
      margin: 0 0 24px 0;
      font-size: 14px;
      line-height: 1.6;
      color: #a1a1aa;
    }
    a.btn {
      display: inline-block;
      background-color: #ffffff;
      color: #09090b;
      font-size: 13px;
      font-weight: 600;
      text-decoration: none;
      padding: 10px 20px;
      border-radius: 10px;
      transition: background-color 0.15s;
    }
    a.btn:hover {
      background-color: #e4e4e7;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>${title}</h1>
    <p>${message}</p>
    <a href="/" class="btn">Return to Magnanium</a>
  </div>
</body>
</html>`;
}
