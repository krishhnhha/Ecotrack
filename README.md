# 🚀 Deploying EcoTrack to Vercel + Neon PostgreSQL

> **One shared database** — all users see the same data in real time. No login required — it's one shared account for everyone.

---

## Step 1: Create a Free Neon Database

1. Go to [https://console.neon.tech](https://console.neon.tech) and sign up (free, no credit card)
2. Click **"New Project"**
3. Give it any name (e.g., `ecotrack-db`)
4. Click **Create Project**
5. On the dashboard, find **Connection Details** and copy the **Connection string** — it looks like:
   ```
   postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
   > ⚠️ Keep this string secret — it's your database password!

---

## Step 2: Push Code to GitHub

1. Create a new repository at [https://github.com/new](https://github.com/new) (name it `ecotrack` or anything)
2. In your project folder (`d:\in\anandu`), run:
   ```bash
   git init
   git add .
   git commit -m "Initial commit with Neon backend"
   git remote add origin https://github.com/YOUR-USERNAME/ecotrack.git
   git push -u origin main
   ```

---

## Step 3: Deploy to Vercel

1. Go to [https://vercel.com](https://vercel.com) and sign in with GitHub
2. Click **"Add New Project"**
3. Click **"Import"** next to your `ecotrack` repository
4. Vercel will auto-detect it's a Vite project — no changes needed to build settings
5. Before clicking **Deploy**, scroll down to **Environment Variables**
6. Add this variable:
   - **Name**: `DATABASE_URL`
   - **Value**: *(paste your Neon connection string from Step 1)*
7. Click **Deploy** and wait ~1 minute

---

## Step 4: Initialize the Database (One Time Only!)

After deployment, visit this URL in your browser **once**:

```
https://YOUR-APP.vercel.app/api/init
```

You should see:
```json
{ "success": true, "message": "Database initialized successfully. Tables created and seed data inserted." }
```

✅ **Done!** Your app is live. Share the URL with all your users — they all share the same database.

---

## Local Development

You can run the app locally in two ways:

### Method A: Connect to Neon (Shared Remote DB)
1. Create a `.env` file in the project root:
   ```env
   DATABASE_URL=postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
2. Run `npm run dev`
3. The app will connect to your remote Neon PostgreSQL database.

### Method B: Offline Local DB (No Setup Required)
If you just want to test the app **immediately** without setting up a database:
1. Make sure you do **NOT** have a `DATABASE_URL` in your `.env` file.
2. Run `npm run dev`
3. The app automatically creates a local SQLite file (`local.db`) using an included Vite plugin.
4. Visit `http://localhost:5173/api/init` once to seed the local database.
5. Open `http://localhost:5173` — all buttons and actions will work perfectly using the local file!

---

## How Multi-User Sync Works

- All users share **one PostgreSQL database** hosted on Neon
- Changes made by User A are visible to User B within **15 seconds** (auto-refresh)
- Immediately after saving a record, the current user sees it instantly
- For real-time updates, users can manually refresh the page anytime

---

## Project Structure

```
d:\in\anandu\
├── api/
│   ├── query.ts       ← Universal SQL endpoint (POST /api/query)
│   └── init.ts        ← One-time DB setup (GET /api/init)
├── src/
│   ├── db/
│   │   └── DatabaseContext.tsx  ← Fetch-based DB layer (no sql.js)
│   └── components/   ← UI unchanged
├── vercel.json        ← Vercel deployment config
└── .env.example       ← Required env vars
```
