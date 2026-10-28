import { FormattedRelease } from "@/types/tmdb";

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case "'":
        return "&apos;";
      case '"':
        return "&quot;";
      default:
        return c;
    }
  });
}

export function generateRssFeed({
  personName,
  releases,
  feedUrl,
  siteUrl,
}: {
  personName: string;
  releases: FormattedRelease[];
  feedUrl: string;
  siteUrl: string;
}): string {
  const channelTitle = `Movie Releases: ${personName}`;
  const channelDesc = `Upcoming and recent movie releases featuring ${personName}.`;
  const buildDate = new Date().toUTCString();

  const itemsXml = releases
    .map((item) => {
      // Parse release date for pubDate
      let pubDate = buildDate;
      try {
        const d = new Date(item.releaseDate);
        if (!isNaN(d.getTime())) {
          pubDate = d.toUTCString();
        }
      } catch {
        // fallback to buildDate
      }

      const posterHtml = item.posterPath
        ? `<p><img src="https://image.tmdb.org/t/p/w342${item.posterPath}" alt="${escapeXml(item.movieTitle)}" style="max-width: 240px; border-radius: 8px; margin-bottom: 12px;" /></p>`
        : "";

      const descriptionContent = `
${posterHtml}
<p><strong>Release Date:</strong> ${item.releaseDate} (${item.country})</p>
<p><strong>Type:</strong> ${item.releaseTypeLabel}</p>
<p><strong>Role:</strong> ${escapeXml(item.role)}</p>
<p><strong>Overview:</strong></p>
<p>${escapeXml(item.overview || "No overview available.")}</p>
<p><a href="${item.tmdbUrl}">View on The Movie Database (TMDB)</a></p>
      `.trim();

      return `
    <item>
      <title>${escapeXml(`${item.movieTitle} - ${item.releaseTypeLabel} (${item.releaseDate})`)}</title>
      <link>${escapeXml(item.tmdbUrl)}</link>
      <guid isPermaLink="false">${escapeXml(item.id)}</guid>
      <pubDate>${pubDate}</pubDate>
      <description><![CDATA[${descriptionContent}]]></description>
      <category>${escapeXml(item.releaseTypeLabel)}</category>
      <category>${escapeXml(item.role)}</category>
    </item>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(channelTitle)}</title>
    <link>${escapeXml(siteUrl)}</link>
    <description>${escapeXml(channelDesc)}</description>
    <language>en-us</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />
${itemsXml}
  </channel>
</rss>`;
}
