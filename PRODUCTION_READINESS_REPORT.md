# Production Readiness Report — CARI Next.js (Vercel + Supabase)

**Date:** 2026-01-03  
**Target:** Deploy on Vercel + Supabase backend (SaaS)  
**Status:** Deployable, but complete the Go‑Live Blockers below.

---

## Summary

This repo is set up for a Vercel-hosted Next.js App Router frontend with Supabase (Auth/DB/Storage/Realtime) as the backend.

Recent work added production-style database automation (RPC + triggers) for:
- Project thumbnails (latest result asset → `projects.thumbnail_url`)
- Profile names (canonical update via RPC, keeps Community posts consistent)
- Avatar storage + profile persistence via Supabase Storage + RPC

---

## ✅ Fixed in the repo

- Removed any “demo user / fake login” path from the landing flow (`defaultUser` removed).
- Added a real health endpoint so the Vercel rewrite works: `GET /health` → `src/app/api/health/route.ts`.
- Removed a stale test component that referenced non-existent debug endpoints.
- Tightened RPC execution permissions with `REVOKE/GRANT` and added auth scoping where it was missing:
  - `migrations/007_jobs_status_completed_all.sql`
  - `migrations/008_project_thumbnail_rpc.sql`
  - `migrations/009_profile_names_rpc.sql`
- Removed problematic global CORS headers from `vercel.json` (use per-route CORS only if you truly need cross-origin browser calls).

---

## 🚨 Go‑Live Blockers (must do before production)

1) Apply Supabase migrations in PROD
- At minimum apply `cari-nextjs/migrations/007_*.sql` through `cari-nextjs/migrations/011_*.sql`.
- Important: `008_project_thumbnail_rpc.sql` and `009_profile_names_rpc.sql` were updated for security (auth scope + grants). Make sure PROD has the updated versions.

2) Configure Supabase Auth URLs
- Supabase Dashboard → Auth → URL Configuration:
  - Site URL: `https://YOUR_DOMAIN`
  - Redirect URLs:
    - `https://YOUR_DOMAIN/auth/callback`
    - (Optional) add your Vercel preview domain if you use it for testing

3) Configure Vercel env vars (Build + Runtime)
- Required:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Recommended (Studio generation):
  - `N8N_STUDIO_PHOTO_WEBHOOK_URL`, `N8N_STUDIO_PHOTO_SECRET`
  - `N8N_STUDIO_VIDEO_WEBHOOK_URL`, `N8N_STUDIO_VIDEO_SECRET`
- Note: `cari-nextjs/next.config.mjs` reads `NEXT_PUBLIC_SUPABASE_URL` at build time to allow remote avatar images. In Vercel, set env vars for the Production environment (build uses them).

4) Supabase Storage (avatars)
- Bucket: `avatars`
- Apply `cari-nextjs/migrations/010_avatars_storage_policies_and_rpc.sql` and `cari-nextjs/migrations/011_profile_avatar_clear_rpc.sql`
- Decide privacy:
  - Public avatars: simplest for Community pages.
  - Private avatars: requires signed URL flow (extra work).

---

## Deployment checklist (Vercel)

1. Vercel → New Project → select repo → Framework: Next.js  
2. Add environment variables (above)  
3. Deploy  
4. Verify auth login/signup + `/auth/callback` redirect  
5. Verify uptime: open `/health`  

---

## SaaS readiness notes / risks

**Security**
- Keep all `SECURITY DEFINER` functions scoped via `auth.uid()` and restrict `EXECUTE` to `authenticated` (now applied for key RPCs).
- Consider enforcing unique `community_user_name` at DB level (unique index) if you want “handles” to be unique.

**Operations**
- Env validation exists and fails-fast in production (`src/lib/env/validator.ts`).
- Sentry is a placeholder; add real error tracking before serious scale if possible.
- No rate limiting / abuse prevention is implemented for generation endpoints; add if you expect public traffic.

**Billing**
- If paid subscriptions are part of go‑live (Stripe, plans, etc.), validate that billing flows are fully implemented end-to-end (webhooks, plan enforcement, credits/quota).

---

## Conclusion

You can deploy to Vercel now. For “SaaS live-ready”, finish the Go‑Live Blockers (PROD Supabase SQL + Auth URLs + Vercel envs), then do a staging run through the Studio + Community flows.

