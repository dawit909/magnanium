import { FormattedRelease } from "@/types/tmdb";

const XML_ENTITIES: Record<string, string> = {
  "<": "&lt;",
  ">": "&gt;",
  "&": "&amp;",
  "'": "&apos;",
  '"': "&quot;",
};
const XML_REGEX = /[<>&'"]/g;

function escapeXml(unsafe: string): string {
  return unsafe.replace(XML_REGEX, (c) => XML_ENTITIES[c] || c);
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

function renderWatchProvidersHtml(item: FormattedRelease): string {
  const wp = item.watchProviders;
  if (!wp || (!wp.stream?.length && !wp.rent?.length && !wp.buy?.length)) {
    return "";
  }

  const parts: string[] = [];
  if (wp.stream && wp.stream.length > 0) {
    const streamPills = wp.stream
      .map((s) => `[Stream on ${escapeXml(s)}]`)
      .join(" · ");
    parts.push(`<strong>Streaming in ${escapeXml(item.country)}:</strong> ${streamPills}`);
  }
  if (wp.rent && wp.rent.length > 0) {
    const rentPills = wp.rent
      .map((r) => `[Rent on ${escapeXml(r)}]`)
      .join(" · ");
    parts.push(`<strong>Rent / Buy:</strong> ${rentPills}`);
  } else if (wp.buy && wp.buy.length > 0) {
    const buyPills = wp.buy
      .map((b) => `[Buy on ${escapeXml(b)}]`)
      .join(" · ");
    parts.push(`<strong>Buy:</strong> ${buyPills}`);
  }

  const linkHtml = wp.link
    ? `<div style="margin-top: 6px; font-size: 11px;"><a href="${escapeXml(
        wp.link
      )}" style="color: #2563eb; text-decoration: none;">View all streaming options on JustWatch &rarr;</a></div>`
    : "";

  return `
<div style="margin: 12px 0; padding: 10px 14px; background: #f4f4f5; border: 1px solid #e4e4e7; border-radius: 8px; font-size: 13px; line-height: 1.6; color: #18181b;">
  ${parts.join("<br/>")}
  ${linkHtml}
</div>
  `.trim();
}

function renderMetadataLines(item: FormattedRelease): string {
  const lines: string[] = [];
  if (item.role) {
    lines.push(`<strong>Role:</strong> ${escapeXml(item.role)}`);
  }
  lines.push(`<strong>Release:</strong> ${item.releaseDate} (${escapeXml(item.country)})`);
  if (item.note) {
    lines.push(`<strong>Note:</strong> ${escapeXml(item.note)}`);
  }
  if (item.runtime) {
    lines.push(`<strong>Runtime:</strong> ${escapeXml(item.runtime)}`);
  }
  if (item.language) {
    lines.push(`<strong>Language:</strong> ${escapeXml(item.language)}`);
  }
  if (item.director) {
    lines.push(`<strong>Director:</strong> ${escapeXml(item.director)}`);
  }
  if (item.writer) {
    lines.push(`<strong>Writer:</strong> ${escapeXml(item.writer)}`);
  }
  if (item.stars && item.stars.length > 0) {
    lines.push(`<strong>Stars:</strong> ${item.stars.map(escapeXml).join(", ")}`);
  }
  return lines.join("<br/>");
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

  const metaHtml = renderMetadataLines(item);
  const overviewHtml = item.overview ? `<p>${escapeXml(item.overview)}</p>` : "";
  const watchHtml = renderWatchProvidersHtml(item);

  return `
${posterHtml}
<p style="line-height: 1.6;">${metaHtml}</p>
${overviewHtml}
${watchHtml}
  `.trim();
}

function renderRssItem(item: FormattedRelease, buildDate: string): string {
  const pubDate = formatPubDate(item.releaseDate, buildDate);
  const mediumLabel = item.mediaType === "tv" ? "TV" : "Movie";
  const descriptionContent = renderItemDescription(item);
  const languageCategory = item.language ? `\n      <category>${escapeXml(item.language)}</category>` : "";

  return `
    <item>
      <title>${escapeXml(item.movieTitle)}</title>
      <link>${escapeXml(item.tmdbUrl)}</link>
      <guid isPermaLink="false">${escapeXml(item.id)}</guid>
      <pubDate>${pubDate}</pubDate>
      <description><![CDATA[${descriptionContent}]]></description>
      <category>${escapeXml(mediumLabel)}</category>
      <category>${escapeXml(item.releaseTypeLabel)}</category>
      <category>${escapeXml(item.role)}</category>${languageCategory}
    </item>`;
}

export function generateRssFeed({
  personName,
  releases,
  feedUrl,
  siteUrl,
  profilePath,
  avatarUrl,
}: {
  personName: string;
  releases: FormattedRelease[];
  feedUrl: string;
  siteUrl: string;
  profilePath?: string | null;
  avatarUrl?: string | null;
}): string {
  const channelTitle = personName;
  const channelDesc = `Movie & TV release dates for ${personName}`;
  const hourBucket = new Date(Math.floor(Date.now() / 3600000) * 3600000);
  const buildDate = hourBucket.toUTCString();
  const itemsXml = releases.map((item) => renderRssItem(item, buildDate)).join("\n");

  const imageUrl =
    avatarUrl ||
    (profilePath
      ? profilePath.startsWith("http")
        ? profilePath
        : `https://image.tmdb.org/t/p/w342${profilePath}`
      : null);

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
