import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { FormattedRelease } from "@/types/tmdb";
import { getTmdbImageUrl } from "./media";

export function getEmailCredentials() {
  const user = (process.env.GMAIL_USER || "").replace(/^["']|["']$/g, "").trim();
  const pass = (process.env.GMAIL_APP_PASSWORD || "").replace(/^["']|["']$/g, "").replace(/\s+/g, "");
  return { user, pass };
}

export function isEmailConfigured(): boolean {
  const { user, pass } = getEmailCredentials();
  return Boolean(user && pass);
}

function getTransporter(): Transporter | null {
  const { user, pass } = getEmailCredentials();
  if (!user || !pass) return null;

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user,
      pass,
    },
  });
}

function formatEmailError(err: any): string {
  const msg = err?.message || String(err || "Failed to send email");
  if (msg.includes("535") || msg.includes("BadCredentials") || msg.includes("Username and Password not accepted")) {
    return "Gmail SMTP login failed (535 Bad Credentials). Note: Google requires a 16-character App Password (generated at myaccount.google.com/apppasswords), not your standard Google account password.";
  }
  return msg;
}

export interface SendMagicLinkOptions {
  to: string;
  verifyUrl: string;
  artistName?: string;
}

/**
 * Send passwordless magic link email for verification / login.
 */
export async function sendMagicLinkEmail({
  to,
  verifyUrl,
  artistName,
}: SendMagicLinkOptions): Promise<{ success: boolean; simulated?: boolean; error?: string }> {
  const { user } = getEmailCredentials();

  if (!isEmailConfigured()) {
    console.info(
      `\n[MAGNANIUM EMAIL - DEV SIMULATION]\n` +
      `To: ${to}\n` +
      `Subject: Confirm your alerts on Magnanium\n` +
      `Magic Link: ${verifyUrl}\n`
    );
    return { success: true, simulated: true };
  }

  const transporter = getTransporter();
  if (!transporter) {
    return { success: false, error: "Email transporter not available" };
  }

  const subject = artistName
    ? `Confirm alerts for ${artistName} on Magnanium`
    : `Sign in to your Magnanium alerts`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 32px 16px; background-color: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f4f4f5;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; margin: 0 auto; background-color: #18181b; border: 1px solid #27272a; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);">
    <!-- Header -->
    <tr>
      <td style="padding: 32px 32px 20px 32px; border-bottom: 1px solid #27272a;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td>
              <span style="font-size: 19px; font-weight: 700; letter-spacing: -0.02em; color: #ffffff;">
                Magnanium
              </span>
            </td>
            <td align="right">
              <span style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #a1a1aa; background-color: #27272a; padding: 4px 10px; border-radius: 9999px;">
                Alerts
              </span>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Body Content -->
    <tr>
      <td style="padding: 32px;">
        <h1 style="margin: 0 0 12px 0; font-size: 21px; font-weight: 600; color: #ffffff; letter-spacing: -0.02em;">
          ${artistName ? `Activate alerts for ${artistName}` : "Sign in with Magic Link"}
        </h1>
        <p style="margin: 0 0 28px 0; font-size: 14px; line-height: 1.6; color: #a1a1aa;">
          ${
            artistName
              ? `You requested email alerts whenever <strong>${artistName}</strong> has new release dates announced or updated. Click the button below to confirm your subscription.`
              : `Click the button below to access and manage your followed artist feeds on Magnanium.`
          }
        </p>

        <!-- CTA Button -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td align="center" style="padding: 4px 0 28px 0;">
              <a href="${verifyUrl}" target="_blank" style="display: inline-block; background-color: #ffffff; color: #09090b; font-size: 14px; font-weight: 600; text-decoration: none; padding: 13px 28px; border-radius: 12px; box-shadow: 0 2px 8px rgba(255, 255, 255, 0.15);">
                ${artistName ? "Confirm Subscription" : "Sign In to Magnanium"}
              </a>
            </td>
          </tr>
        </table>

        <!-- Security Notice -->
        <div style="background-color: #27272a; border-radius: 10px; padding: 14px 16px; margin-bottom: 24px;">
          <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #71717a;">
            🔒 This confirmation link is valid for <strong>15 minutes</strong>. If you didn't request this email, you can safely ignore it.
          </p>
        </div>

        <p style="margin: 0; font-size: 11px; line-height: 1.5; color: #52525b; word-break: break-all;">
          Or copy and paste this URL into your browser:<br>
          <a href="${verifyUrl}" style="color: #71717a; text-decoration: underline;">${verifyUrl}</a>
        </p>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding: 20px 32px; background-color: #121214; border-top: 1px solid #27272a; text-align: center;">
        <p style="margin: 0; font-size: 11px; color: #52525b;">
          Magnanium • Zero-noise release dates for film & television
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"Magnanium Alerts" <${user}>`,
      to,
      subject,
      html,
    });
    console.info(`[MAGNANIUM EMAIL] Magic link email successfully sent to ${to}! (id: ${info.messageId})`);
    return { success: true };
  } catch (err: any) {
    console.error("Failed to send magic link email:", err);
    return { success: false, error: formatEmailError(err) };
  }
}

export interface SendReleaseAlertOptions {
  to: string;
  artistName: string;
  releases: FormattedRelease[];
  artistUrl: string;
  manageUrl: string;
  unsubscribeUrl: string;
}

/**
 * Send release alert email for an artist's upcoming or new releases.
 */
export async function sendReleaseAlertEmail({
  to,
  artistName,
  releases,
  artistUrl,
  manageUrl,
  unsubscribeUrl,
}: SendReleaseAlertOptions): Promise<{ success: boolean; simulated?: boolean; error?: string }> {
  const { user } = getEmailCredentials();

  if (!isEmailConfigured()) {
    console.info(
      `\n[MAGNANIUM EMAIL - DEV SIMULATION]\n` +
      `To: ${to}\n` +
      `Subject: New release alert for ${artistName}\n` +
      `Releases (${releases.length}): ${releases.map((r) => r.movieTitle).join(", ")}\n`
    );
    return { success: true, simulated: true };
  }

  const transporter = getTransporter();
  if (!transporter) {
    return { success: false, error: "Email transporter not available" };
  }

  const subject = releases.length === 1
    ? `${artistName}: "${releases[0].movieTitle}" release alert`
    : `${artistName}: ${releases.length} new release alerts`;

  const releasesHtml = releases
    .map((release) => {
      const posterUrl = getTmdbImageUrl(release.posterPath, "w180_and_h180_face") || getTmdbImageUrl(release.posterPath, "w92");
      const releaseDateFormatted = release.releaseDate
        ? new Date(release.releaseDate).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })
        : "Release date TBD";

      return `
        <tr style="border-bottom: 1px solid #27272a;">
          <td style="padding: 18px 0; vertical-align: top;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                ${
                  posterUrl
                    ? `
                  <td width="56" style="vertical-align: top; padding-right: 16px;">
                    <img src="${posterUrl}" alt="${release.movieTitle}" width="56" style="border-radius: 8px; display: block; border: 1px solid #3f3f46;" />
                  </td>
                `
                    : ""
                }
                <td style="vertical-align: top;">
                  <div style="margin-bottom: 4px;">
                    <span style="font-size: 15px; font-weight: 600; color: #ffffff;">
                      ${release.movieTitle}
                    </span>
                    <span style="display: inline-block; margin-left: 8px; font-size: 10px; font-weight: 600; text-transform: uppercase; color: #a1a1aa; background-color: #27272a; padding: 2px 7px; border-radius: 4px;">
                      ${release.releaseTypeLabel || release.releaseType}
                    </span>
                  </div>
                  <div style="font-size: 12px; font-weight: 500; color: #fbbf24; margin-bottom: 6px;">
                    📅 ${releaseDateFormatted}
                  </div>
                  ${
                    release.role
                      ? `<div style="font-size: 11px; color: #71717a; margin-bottom: 6px;">Role: ${release.role}</div>`
                      : ""
                  }
                  ${
                    release.overview
                      ? `<p style="margin: 0; font-size: 12px; line-height: 1.5; color: #a1a1aa; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                          ${release.overview}
                        </p>`
                      : ""
                  }
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `;
    })
    .join("");

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 32px 16px; background-color: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f4f4f5;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 540px; margin: 0 auto; background-color: #18181b; border: 1px solid #27272a; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);">
    <!-- Header -->
    <tr>
      <td style="padding: 28px 32px 18px 32px; border-bottom: 1px solid #27272a;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td>
              <span style="font-size: 18px; font-weight: 700; letter-spacing: -0.02em; color: #ffffff;">
                Magnanium
              </span>
            </td>
            <td align="right">
              <span style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #f59e0b; background-color: #451a03; border: 1px solid #78350f; padding: 3px 9px; border-radius: 9999px;">
                Release Alert
              </span>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Body Content -->
    <tr>
      <td style="padding: 28px 32px 12px 32px;">
        <h1 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 600; color: #ffffff; letter-spacing: -0.02em;">
          ${artistName}
        </h1>
        <p style="margin: 0 0 20px 0; font-size: 13px; color: #a1a1aa;">
          Upcoming and newly scheduled releases matching your alert preferences:
        </p>

        <!-- Releases List -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%">
          ${releasesHtml}
        </table>

        <!-- View Feed Button -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td align="center" style="padding: 24px 0 12px 0;">
              <a href="${artistUrl}" target="_blank" style="display: inline-block; background-color: #ffffff; color: #09090b; font-size: 13px; font-weight: 600; text-decoration: none; padding: 11px 24px; border-radius: 10px;">
                View ${artistName} on Magnanium →
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding: 20px 32px; background-color: #121214; border-top: 1px solid #27272a; text-align: center;">
        <p style="margin: 0 0 8px 0; font-size: 11px; color: #71717a;">
          You received this email because you subscribed to alerts for <strong>${artistName}</strong>.
        </p>
        <p style="margin: 0; font-size: 11px; color: #52525b;">
          <a href="${manageUrl}" style="color: #a1a1aa; text-decoration: underline;">Manage Alerts</a>
          &nbsp;•&nbsp;
          <a href="${unsubscribeUrl}" style="color: #ef4444; text-decoration: underline;">Unsubscribe</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"Magnanium Alerts" <${user}>`,
      to,
      subject,
      html,
    });
    console.info(`[MAGNANIUM EMAIL] Release alert email successfully sent to ${to}! (id: ${info.messageId})`);
    return { success: true };
  } catch (err: any) {
    console.error("Failed to send release alert email:", err);
    return { success: false, error: formatEmailError(err) };
  }
}
