# Magnanium

Movie release RSS feed generator for filmmakers and actors.

## Setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## TMDB API Key

Live TMDB searches require a free API key from [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api).

Set it in `.env.local`:
```env
TMDB_API_KEY=your_key_here
```
Or paste it directly into the interface in your browser.

## Deployment

Deployable to Vercel or Cloudflare Pages. Add `TMDB_API_KEY` to the environment variables.

## Attribution

This product uses the TMDB API but is not endorsed or certified by TMDB.
