# 🎬 CineFeed - Movie Release RSS Feeds for Filmmakers & Actors

A modern, public, lightweight web application that allows anyone to generate customized RSS feeds for movie releases involving any director, actor, writer, or producer.

## ✨ Features

- 🔍 **Instant Search**: Search across thousands of directors and actors.
- 🎛️ **Granular Filters**:
  - **Roles**: Directing, Acting, Screenplay/Writing, Producing.
  - **Release Formats**: Theatrical (Cinema), Digital / Streaming (VOD), Physical (4K / Blu-ray).
  - **Region Specific**: Filter by country release schedules (US, UK, CA, FR, DE, KR, JP, etc.).
  - **Timeframe**: Upcoming releases only or include recent launches.
- 📡 **Universal RSS 2.0**: Compatible with Feedly, NetNewsWire, Inoreader, Apple Podcasts/RSS, Slack bots, and Discord webhooks.
- ⚡ **Built-in Smart Caching**: Returns `s-maxage=43200` (12-hour CDN cache) so multiple RSS reader polling requests do not burn through your API limits.
- 🛡️ **TMDB Terms Compliant**: Full attribution footer with logo and official disclaimer for free non-commercial public hosting.
- 🧪 **Offline / Mock Mode**: Works out of the box even before adding an API key.

---

## 🚀 Quick Start

### 1. Install & Run Locally

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Adding Your Free TMDB API Key

1. Sign up for a free account at [The Movie Database (TMDB)](https://www.themoviedb.org/signup).
2. Go to **Settings > API** ([themoviedb.org/settings/api](https://www.themoviedb.org/settings/api)) and request an API key (choose "Developer / Personal").
3. Create a `.env.local` file in the root directory:
   ```env
   TMDB_API_KEY=your_actual_tmdb_api_key_here
   ```
4. Restart your server. The app will now query live real-time TMDB global data!

---

## 🌐 Deploying to the Public (100% Free)

You can deploy this to **Vercel** or **Cloudflare Pages** for free:

### Deploy to Vercel
1. Push this repository to GitHub.
2. Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Import your repository.
4. Under **Environment Variables**, add:
   - Key: `TMDB_API_KEY`
   - Value: `your_tmdb_api_key`
5. Click **Deploy**. Your custom RSS generator is now live for the world!

---

## 📜 Legal & Attribution

This website uses TMDB and the TMDB APIs but is not endorsed, certified, or otherwise approved by TMDB.
