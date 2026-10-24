# Bring Go Pay

What to bring, when to go, what to pay: plain guides for government paperwork in Bengaluru,
in English, Hindi and Kannada.

## How it's built

- **Website:** plain HTML, CSS and JavaScript, no framework. `build.sh` joins the files in `src/` into one page, `public/index.html`.
- **Data:** every fee, document, step and office lives in a **Supabase** (Postgres) database. The page reads it with the browser's built-in `fetch()`, saves a copy for slow networks, and shows the source and check date next to every fee and document.
- **Hosting:** **Vercel** runs `build.sh` and serves the page.

Changing a fee is a data change in Supabase. No code change and no redeploy.

## What's in this folder

| Path | What it is |
|---|---|
| `src/` | The website's source code |
| `supabase/01_schema.sql` | Creates the tables, read-only for visitors |
| `supabase/02_seed.sql` | Fills the tables with the starting data |
| `supabase/TO_VERIFY.md` | Data that still needs a human check |
| `build.sh` | Builds `public/index.html` |
| `vercel.json` | Tells Vercel how to build the site |
| `.env.example` | Template for your Supabase settings |
| `i18n/` | Hindi and Kannada text. After editing, run `python3 i18n/gen.py` |
| `index-offline.html` | The older version with the data built in. It works with no internet, handy as a demo backup |
| `dev-tests/` | The automated tests used during development (optional) |

---

## Set it up (about 20 minutes)

### 1. Create the Supabase project

1. Go to [supabase.com](https://supabase.com) and sign in. Signing in with GitHub is easiest.
2. Click **New project**.
   - **Name:** `bring-go-pay`
   - **Database password:** click *Generate* and save it somewhere safe. The website doesn't need it, but you'll need it to manage the database later.
   - **Region:** the one closest to your users, for example **Mumbai**.
   - If you see an option for the **Data API**, leave it **on**. The site reads data through it.
3. Click **Create**, then wait a minute or two while Supabase sets up.

### 2. Create the tables and add the data

1. In the left sidebar, open **SQL Editor** and click **New query**.
2. Open `supabase/01_schema.sql` in a text editor. Copy all of it, paste it into the query box and click **Run**. You should see *Success. No rows returned*.
3. Click **New query** again. Copy all of `supabase/02_seed.sql`, paste it in and click **Run**.
   - Supabase may warn that the query has *destructive operations*. That's expected: the file empties the tables before filling them. Confirm to run it.
   - Run it only **once**. Running it again later would erase any edits you made in the dashboard.
4. Check it worked: open **Table Editor**. `tasks` should have 8 rows, `rules` 424 and `offices` 4.

### 3. Copy your project URL and publishable key

1. Click **Connect** at the top of your project dashboard. They're also under **Project Settings > API Keys**.
2. Copy the two values you need:
   - **Project URL**, which looks like `https://abcdefghijkl.supabase.co`
   - **Publishable key**, which starts with `sb_publishable_`. Older projects show an **anon / public** key instead. That works too.

> **Never use the secret key** (`sb_secret_...` or `service_role`) in the website. It skips all the
> security rules. `build.sh` refuses to build with one.
>
> The publishable key is meant to be public: every visitor's browser receives it. What keeps your
> data safe is Row Level Security, set up by `01_schema.sql`, which makes every table read-only for visitors.

### 4. Try it on your computer (optional)

1. Copy `.env.example` to a new file named `.env` and paste in your two values.
2. In a terminal opened in this folder, run:
   ```bash
   sh build.sh
   ```
   On Windows, use **Git Bash**.
3. Open `public/index.html` in your browser. The guides load from your Supabase database.

### 5. Put the code on GitHub

1. Create a free account at [github.com](https://github.com). Click **New repository**, name it `bring-go-pay`, and create it **without** a README.
2. In a terminal in this folder, run each line, putting your GitHub username in the `remote` line:
   ```bash
   git init
   git add .
   git commit -m "Bring Go Pay"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/bring-go-pay.git
   git push -u origin main
   ```

`.gitignore` keeps your `.env` file and the built `public/` folder out of GitHub.

### 6. Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and sign up with your GitHub account.
2. Click **Add New > Project**, find `bring-go-pay` and click **Import**.
3. **Framework Preset:** Other. You don't need to change the build settings, because `vercel.json` already sets the build command (`sh build.sh`) and the output folder (`public`).
4. Open **Environment Variables** and add two:

   | Name | Value |
   |---|---|
   | `SUPABASE_URL` | your Project URL |
   | `SUPABASE_PUBLISHABLE_KEY` | your publishable key |

5. Click **Deploy**. After about 30 seconds you get a link like `bring-go-pay.vercel.app`. Open it: the guides load from Supabase.

If the build stops with *set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY*, add the two variables under
**Project Settings > Environment Variables**. Then go to **Deployments** and choose **Redeploy** from the **⋯** menu.

---

## Keeping it up to date

- **Change a fee:** Supabase > **Table Editor** > `rules`. Find the row and update `amount`, `value` (the text people read, like `₹80`) and `verified_on`, then save. The site shows the new fee on the next visit, with no redeploy.
- **Change English text:** if a translation exists for the old text, add a row to `translations` for the new text too. Until you do, Hindi and Kannada readers see the new English sentence, never an out-of-date translation.
- **Change the code:** push to GitHub. Vercel rebuilds and redeploys by itself.
- **What still needs checking** is listed in `supabase/TO_VERIFY.md`.

## If something goes wrong

| What you see | What to check |
|---|---|
| *Not connected to the database yet* | The build didn't get `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`. Check the names on Vercel and redeploy. |
| *Couldn't load the guides* | Is the URL right? Did `01_schema.sql` run? It gives visitors read access. Is the key the publishable (or anon) key? |
| A bar saying *Showing the guides saved on…* | The site can't reach Supabase right now, so it's showing its saved copy. It updates by itself once the connection is back. |
| Old fees still showing after an edit | The page shows its saved copy first, then updates within a second or two. Reload once. |
