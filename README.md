# Contest App — Setup Guide

This is a React + Vite app backed by Supabase (database + file storage) and deployed on Vercel.
Follow these steps in order and you'll have it running.

---

## Step 1 — Set up Supabase (the database)

1. Go to [supabase.com](https://supabase.com) and create a free account.
2. Click **New project**. Give it a name (e.g. "contest-app"), pick a region close to Argentina (South America - São Paulo), set a database password, click **Create project**.
3. Wait about a minute for it to spin up.
4. In the left sidebar, click **SQL Editor**.
5. Paste the following SQL and click **Run**:

```sql
-- Contests table
create table contests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phase text not null default 'draft', -- draft | submit | vote | results
  created_at timestamptz default now()
);

-- Categories table
create table categories (
  id uuid primary key default gen_random_uuid(),
  contest_id uuid references contests(id) on delete cascade,
  name text not null,
  created_at timestamptz default now()
);

-- Entries table (one per participant per contest)
create table entries (
  id uuid primary key default gen_random_uuid(),
  contest_id uuid references contests(id) on delete cascade,
  author_name text not null,
  media_url text,
  description text,
  created_at timestamptz default now(),
  unique(contest_id, author_name)
);

-- Votes table (one per voter per category per contest)
create table votes (
  id uuid primary key default gen_random_uuid(),
  contest_id uuid references contests(id) on delete cascade,
  category_id uuid references categories(id) on delete cascade,
  voter_name text not null,
  entry_id uuid references entries(id) on delete cascade,
  created_at timestamptz default now(),
  unique(contest_id, category_id, voter_name)
);

-- Allow public read/write (no auth needed — participants use shared links)
alter table contests enable row level security;
alter table categories enable row level security;
alter table entries enable row level security;
alter table votes enable row level security;

create policy "Public read" on contests for select using (true);
create policy "Public insert" on contests for insert with check (true);
create policy "Public update" on contests for update using (true);

create policy "Public read" on categories for select using (true);
create policy "Public insert" on categories for insert with check (true);
create policy "Public delete" on categories for delete using (true);

create policy "Public read" on entries for select using (true);
create policy "Public insert" on entries for insert with check (true);
create policy "Public update" on entries for update using (true);

create policy "Public read" on votes for select using (true);
create policy "Public insert" on votes for insert with check (true);
create policy "Public update" on votes for update using (true);
```

6. Now set up the **file storage bucket**:
   - In the left sidebar, click **Storage**.
   - Click **New bucket**, name it `entries`, and check **Public bucket**. Click **Create bucket**.

7. Get your API keys:
   - In the left sidebar, click **Project Settings** → **API**.
   - Copy the **Project URL** and the **anon public** key. You'll need these in the next step.

---

## Step 2 — Set up the project locally

You'll need [Node.js](https://nodejs.org) installed (version 18 or higher).

1. Open the project folder in VS Code.
2. Open the terminal (Terminal → New Terminal in VS Code).
3. Run:

```bash
npm install
```

4. Create a file called `.env` in the root of the project (same level as `package.json`).
   Copy the contents of `.env.example` into it and fill in your values:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_ADMIN_PASSWORD=whatever-you-want
```

5. Test it locally:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser. If it loads, you're good.

---

## Step 3 — Deploy on Vercel

1. Go to [github.com](https://github.com) and create a free account if you don't have one.
2. Create a new repository (click the **+** in the top right → New repository). Name it `contest-app`, set it to public or private, click **Create repository**.
3. In VS Code terminal, run:

```bash
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/contest-app.git
git push -u origin main
```

   (Replace `YOUR_USERNAME` with your GitHub username.)

4. Go to [vercel.com](https://vercel.com), create a free account (you can sign up with GitHub).
5. Click **Add New Project** → Import your `contest-app` repository.
6. Before clicking Deploy, click **Environment Variables** and add:
   - `VITE_SUPABASE_URL` → your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` → your Supabase anon key
   - `VITE_ADMIN_PASSWORD` → your chosen admin password
7. Click **Deploy**. Vercel will build and give you a live URL in about a minute.

---

## How to use the app

### As admin
- Go to your Vercel URL (e.g. `https://contest-app.vercel.app`)
- Log in with your admin password
- Create a contest, add categories
- Click **Open for submissions** → share the contest link with coworkers
- When everyone's submitted, click **Close submissions & open voting**
- When voting is done, click **Close voting & release results**

### As participant
- Open the share link on any phone or browser
- Enter your name
- Submit a photo/video
- When voting opens, vote once per category

---

## Making changes later

The files you'll most likely want to edit:
- `src/index.css` — all the colors, sizes, and spacing
- `src/pages/` — each screen of the app is one file
- `src/App.jsx` — the list of pages/routes

After making changes, push to GitHub and Vercel will redeploy automatically:

```bash
git add .
git commit -m "describe what you changed"
git push
```

---

## Troubleshooting

**"Failed to fetch" or blank page** — check that your `.env` values are correct and match what's in Vercel's environment variables.

**Upload fails** — make sure the `entries` bucket in Supabase Storage is set to **public**.

**"row level security" errors** — make sure you ran the full SQL from Step 1, including the `create policy` lines at the bottom.
