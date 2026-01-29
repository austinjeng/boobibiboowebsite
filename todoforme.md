# Manual Setup Steps for Explore Bingo Map

Complete these steps to get the application running.

---

## 1. Create Environment Variables

Copy the example file and fill in your values:

```bash
cp .env.example .env.local
```

Edit `.env.local` with the following:

```env
# Database - Supabase PostgreSQL
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres

# BetterAuth
BETTER_AUTH_SECRET=<generate-with-command-below>
BETTER_AUTH_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=<from-google-cloud-console>
GOOGLE_CLIENT_SECRET=<from-google-cloud-console>

# Public URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Generate the auth secret:
```bash
openssl rand -base64 32
```

---

## 2. Set Up Supabase Database

1. Go to [supabase.com](https://supabase.com) and create a project
2. Navigate to **Settings → Database**
3. Copy the connection string (use **Session pooler** with port `6543`)
4. Replace `[YOUR-PASSWORD]` with your database password

---

## 3. Set Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Navigate to **APIs & Services → Credentials**
4. Click **Create Credentials → OAuth client ID**
5. Select **Web application**
6. Add authorized redirect URI:
   ```
   http://localhost:3000/api/auth/callback/google
   ```
7. Copy the **Client ID** and **Client Secret** to your `.env.local`

---

## 4. Run Database Migrations

### BetterAuth tables (user, session, account, verification):
```bash
npx @better-auth/cli@latest migrate
```

### App tables (place, check_in, bingo_card, etc.):

Option A - Via Supabase SQL Editor:
1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `src/db/schema.sql`
3. Run the query

Option B - Via psql:
```bash
psql $DATABASE_URL -f src/db/schema.sql
```

### Seed default Bingo tasks:
```bash
# Via Supabase SQL Editor or psql
psql $DATABASE_URL -f src/db/seed.sql
```

---

## 5. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## 6. For Production Deployment

Update environment variables:
- `BETTER_AUTH_URL` → your production URL
- `NEXT_PUBLIC_APP_URL` → your production URL
- Add production redirect URI in Google Cloud Console:
  ```
  https://your-domain.com/api/auth/callback/google
  ```

---

## Quick Reference

| Task | Command |
|------|---------|
| Dev server | `npm run dev` |
| Build | `npm run build` |
| Lint | `npm run lint` |
| Generate auth schema | `npx @better-auth/cli@latest generate` |
| Run auth migrations | `npx @better-auth/cli@latest migrate` |

---

## Troubleshooting

### "BETTER_AUTH_SECRET not set"
- Make sure `.env.local` exists and has the secret

### "Database connection failed"
- Check DATABASE_URL format (should use port 6543 for Supabase pooler)
- Verify password is correct

### "Google OAuth not working"
- Verify redirect URI matches exactly: `http://localhost:3000/api/auth/callback/google`
- Check that OAuth consent screen is configured

### "Tables not found"
- Run the migrations in order: BetterAuth first, then app schema, then seed
