import fs from "fs";
import path from "path";

// Read TMDB API key from environment variable or .env.local
let apiKey = process.env.TMDB_API_KEY || process.env.TMDB_ACCESS_TOKEN;

if (!apiKey && fs.existsSync(".env.local")) {
  const envContent = fs.readFileSync(".env.local", "utf8");
  const envVars = Object.fromEntries(
    envContent
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const idx = line.indexOf("=");
        return [line.slice(0, idx).trim(), line.slice(idx + 1).trim()];
      })
  );
  apiKey = envVars.TMDB_API_KEY || envVars.TMDB_ACCESS_TOKEN;
}

if (!apiKey) {
  console.error("TMDB API key not found in process.env or .env.local");
  process.exit(1);
}

const TOTAL_PAGES = 500; // 500 pages * 20 = 10,000 popular artists
const BATCH_SIZE = 20;

async function fetchPage(page) {
  const isToken = apiKey.length > 50;
  const url = isToken
    ? `https://api.themoviedb.org/3/person/popular?page=${page}`
    : `https://api.themoviedb.org/3/person/popular?api_key=${apiKey}&page=${page}`;
  const headers = isToken ? { Authorization: `Bearer ${apiKey}` } : {};

  try {
    const res = await fetch(url, { headers });
    if (!res.ok) return [];
    const data = await res.json();
    return data.results || [];
  } catch (err) {
    return [];
  }
}

async function main() {
  console.log(`Fetching top ~10,000 popular TMDB artists across ${TOTAL_PAGES} pages...`);
  const startTime = Date.now();
  const seenIds = new Set();
  const artists = [];

  for (let i = 1; i <= TOTAL_PAGES; i += BATCH_SIZE) {
    const batchPages = [];
    for (let p = i; p < i + BATCH_SIZE && p <= TOTAL_PAGES; p++) {
      batchPages.push(fetchPage(p));
    }
    const results = await Promise.all(batchPages);
    for (const pageList of results) {
      for (const p of pageList) {
        if (!p || !p.id || !p.name || seenIds.has(p.id)) continue;
        seenIds.add(p.id);
        artists.push([
          p.id,
          p.name,
          p.known_for_department || "Acting",
          p.profile_path || "",
          Math.round((p.popularity || 0) * 10) / 10,
        ]);
      }
    }
    process.stdout.write(
      `\rFetched pages ${Math.min(i + BATCH_SIZE - 1, TOTAL_PAGES)}/${TOTAL_PAGES} (${artists.length} artists)`
    );
  }

  console.log(`\nCompleted in ${((Date.now() - startTime) / 1000).toFixed(1)}s.`);
  console.log(`Total unique artists collected: ${artists.length}`);

  const outDir = path.resolve("public/data");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const outPath = path.join(outDir, "popular-artists.json");
  const jsonContent = JSON.stringify(artists);
  fs.writeFileSync(outPath, jsonContent, "utf8");

  const sizeKb = (Buffer.byteLength(jsonContent, "utf8") / 1024).toFixed(1);
  console.log(`Saved to ${outPath} (${sizeKb} KB)`);
}

main().catch(console.error);
