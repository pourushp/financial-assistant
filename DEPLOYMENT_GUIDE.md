# FinBot — Production Deployment Guide

## Current Setup
- **Frontend**: https://sent-i-meter.com (GitHub Pages + Cloudflare)
- **Backend**: https://finbot-backend-s8v8.onrender.com

---

## Step 1: Configure Cloudflare for sent-i-meter.com

1. Sign up at [cloudflare.com](https://www.cloudflare.com) (free)
2. Add `sent-i-meter.com` → Cloudflare gives you two nameservers
3. Go to your domain registrar → update nameservers to the Cloudflare ones
4. In Cloudflare DNS, add these records:
   - `CNAME @ pourushp.github.io` (proxied)
   - `CNAME www pourushp.github.io` (proxied)
   - `CNAME api finbot-backend-s8v8.onrender.com` (proxied)
5. SSL/TLS → set to **Full** (not "Full strict" — GitHub Pages has its own cert)
6. Enable **"Always Use HTTPS"** under SSL/TLS → Edge Certificates

After DNS propagates: `sent-i-meter.com` → frontend, `api.sent-i-meter.com` → backend

## Step 2: Configure GitHub Pages Custom Domain

1. Go to `github.com/pourushp/financial-assistant` → Settings → Pages
2. Under "Custom domain", enter: `sent-i-meter.com`
3. Check "Enforce HTTPS"
4. GitHub will verify DNS — may take a few minutes
5. The `CNAME` file in `public/` is already configured

## Step 3: Set Up Supabase (Free)

1. Sign up at [supabase.com](https://supabase.com)
2. Create a new project (choose a region close to India, e.g., Mumbai)
3. Go to SQL Editor → paste contents of `backend/supabase/schema.sql` → Run
4. Go to Settings → API:
   - Copy **Project URL** → set as `VITE_SUPABASE_URL` (frontend) and `SUPABASE_URL` (backend)
   - Copy **anon public key** → set as `VITE_SUPABASE_ANON_KEY` (frontend)
   - Copy **service_role key** → set as `SUPABASE_SERVICE_KEY` (backend, keep secret!)
5. Go to Authentication → Providers → Enable Google OAuth (optional)
6. In Authentication → URL Configuration:
   - Set Site URL to `https://sent-i-meter.com`
   - Add redirect URL: `https://sent-i-meter.com`

### Environment Variables

**Frontend** (GitHub Actions secrets or `.env`):
```
VITE_API_URL=https://api.sent-i-meter.com/api
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**Backend** (Render → Environment tab):
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
FRONTEND_URL=https://sent-i-meter.com
```

## Step 4: Update Render Backend Environment

1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Open your `finbot-backend` service
3. Go to Environment tab
4. Add/update: `FRONTEND_URL=https://sent-i-meter.com`
5. This allows the backend CORS to accept requests from your custom domain

## Step 5: Upgrade Backend (Optional)

**Free options:**
- **Render** (current): Free tier sleeps after 15min inactivity. Upgrade to $7/mo for always-on.
- **Railway**: 500 free hours/month, no sleep. Good alternative.
- **Fly.io**: Free tier with 3 shared VMs.

## Step 6: Add Error Monitoring (Free)

1. Sign up at [sentry.io](https://sentry.io)
2. Create a Python/FastAPI project
3. Copy the DSN
4. Set `SENTRY_DSN=your-dsn` in Render environment

## Step 7: Add Analytics (Free)

**Option A: Plausible Cloud** ($9/mo) or **self-hosted** (free)
**Option B: PostHog** (free tier: 1M events/mo)

Add to `index.html` before `</head>`:
```html
<script defer data-domain="sent-i-meter.com" src="https://plausible.io/js/script.js"></script>
```

## Step 8: PWA — App Store Listing (Optional)

The app is already installable as a PWA. To publish on Google Play:
1. Use [PWABuilder](https://www.pwabuilder.com/) — paste `https://sent-i-meter.com`
2. It generates an Android APK wrapper
3. Upload to Google Play Console ($25 one-time fee)

---

## Architecture Overview

```
User → Cloudflare CDN → GitHub Pages (React frontend)
                      → Render (FastAPI backend)
                      → Supabase (Auth + Database)
                      → NSE/Google Finance/Yahoo (Market data)
```

## Monthly Cost Summary

| Service | Tier | Cost |
|---------|------|------|
| Domain (sent-i-meter.com) | Already owned | $0 |
| Cloudflare | Free | $0 |
| GitHub Pages | Free | $0 |
| Render | Free / $7 | $0-7 |
| Supabase | Free (50k MAU) | $0 |
| Sentry | Free (5k errors) | $0 |
| **Total** | | **$0-7/mo** |
