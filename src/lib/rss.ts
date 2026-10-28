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

function formatPubDate(releaseDate: string, fallbackDate: string): string {
  try {
    const d = new Date(releaseDate);
    if (!isNaN(d.getTime())) {
      return d.toUTCString();
    }
  } catch {}
  return fallbackDate;
}

function renderItemDescription(item: FormattedRelease): string {
  const posterSrc = item.posterPath
    ? item.posterPath.startsWith("http")
      ? item.posterPath
      : `https://image.tmdb.org/t/p/w342${item.posterPath}`
    : null;

  const posterHtml = posterSrc
    ? `<p><img src="${posterSrc}" alt="${escapeXml(item.movieTitle)}" style="max-width: 320px; border-radius: 8px; margin-bottom: 12px;" /></p>`
    : "";

  const roleLine = item.role ? `<strong>Role:</strong> ${escapeXml(item.role)}<br/>` : "";
  const overviewHtml = item.overview ? `<p>${escapeXml(item.overview)}</p>` : "";

  return `
${posterHtml}
<p>${roleLine}<strong>Release:</strong> ${item.releaseDate} (${item.country})</p>
${overviewHtml}
  `.trim();
}

function renderRssItem(item: FormattedRelease, buildDate: string): string {
  const pubDate = formatPubDate(item.releaseDate, buildDate);
  const mediumLabel = item.mediaType === "tv" ? "TV" : "Movie";
  const descriptionContent = renderItemDescription(item);

  return `
    <item>
      <title>${escapeXml(`${item.movieTitle} - ${item.releaseTypeLabel}`)}</title>
      <link>${escapeXml(item.tmdbUrl)}</link>
      <guid isPermaLink="false">${escapeXml(item.id)}</guid>
      <pubDate>${pubDate}</pubDate>
      <description><![CDATA[${descriptionContent}]]></description>
      <category>${escapeXml(mediumLabel)}</category>
      <category>${escapeXml(item.releaseTypeLabel)}</category>
      <category>${escapeXml(item.role)}</category>
    </item>`;
}

export function generateRssFeed({
  personName,
  releases,
  feedUrl,
  siteUrl,
  profilePath,
}: {
  personName: string;
  releases: FormattedRelease[];
  feedUrl: string;
  siteUrl: string;
  profilePath?: string | null;
}): string {
  const channelTitle = personName;
  const channelDesc = `Movie & TV release dates for ${personName}`;
  const buildDate = new Date().toUTCString();
  const itemsXml = releases.map((item) => renderRssItem(item, buildDate)).join("\n");

  const imageUrl = profilePath
    ? profilePath.startsWith("http")
      ? profilePath
      : `https://image.tmdb.org/t/p/w342${profilePath}`
    : null;

  const imageXml = imageUrl
    ? `
    <image>
      <url>${escapeXml(imageUrl)}</url>
      <title>${escapeXml(channelTitle)}</title>
      <link>${escapeXml(siteUrl)}</link>
    </image>
    <itunes:image href="${escapeXml(imageUrl)}" />`
    : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd">
  <channel>
    <title>${escapeXml(channelTitle)}</title>
    <link>${escapeXml(siteUrl)}</link>
    <description>${escapeXml(channelDesc)}</description>
    <language>en-us</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />${imageXml}
${itemsXml}
  </channel>
</rss>`;
}
