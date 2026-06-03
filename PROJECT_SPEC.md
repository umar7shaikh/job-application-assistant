# Job Application Assistant — Project Spec

> Living document. Updated as decisions evolve. Last updated: 2026-06-02

## 1. What we're building

A multi-user web app that helps people apply to jobs faster **without** bot-applying
(which gets LinkedIn/Naukri accounts banned). Instead of automating the risky submit,
we automate everything *leading up to* it and keep a human in the loop for the final click.

**The loop:**

```
Scrape jobs + JDs (Apify)
   → Analyze each JD (LLM)
   → Score fit vs the user's resume (LLM)
   → Tailor a resume + cover letter per job (LLM → PDF)
   → User reviews in a dashboard
   → Browser extension autofills the company's application form
   → User eyeballs it and clicks Submit
   → App records the application in history
```

## 2. Locked decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Final apply step | **Autofill + 1-click human submit** | Robust across every ATS, no bans, no CAPTCHA brittleness |
| Stack | **Next.js 16.2.7 (App Router) + React 19 + TypeScript** | Frontend + backend in one app; deploys to Vercel, no separate backend to host. Turbopack + Tailwind v4. |
| Hosting | **Vercel** | Push-to-deploy; serverless route handlers / server actions = the backend |
| Database (dev) | **PGlite** embedded Postgres → `.localdb/` | No Docker/accounts, fully offline; same Postgres dialect as prod |
| Database (prod) | **Supabase/Neon** via `DATABASE_URL` | Swap the driver in `packages/db/src/client.ts`; schema unchanged |
| Auth | **Custom JWT cookie session (`jose`) + bcrypt** | Officially-documented Next 16 pattern; no auth-library beta-churn. (Was going to be Auth.js — changed for robustness.) |
| ORM | **Drizzle** | Type-safe SQL in TypeScript |
| Apify key | **User brings their own** (BYO), encrypted at rest | Zero scraping cost to us; free product |
| AI key | **User brings their own** (Anthropic/OpenAI), encrypted | Zero AI cost to us; provider swappable |
| Resume render | **`react-pdf` (HTML/JS → PDF)** first; LaTeX later | Chromium too heavy for serverless; react-pdf is pure JS |
| Users | **Multi-user SaaS**, free now, possibly paid later | Login + per-user history |

## 3. Vercel-specific design constraints

- **Long Apify runs** → trigger the run, receive an **Apify webhook** on completion
  (avoids serverless timeout). Don't block a request waiting for scrape results.
- **PDF generation** → `react-pdf` (no Chromium). LaTeX = external compile service (Phase 7).
- **Scheduled work** → Vercel Cron if/when needed.
- **Secrets** → users' Apify/AI keys encrypted at rest, never logged, never sent to client.

## 4. Data model

```
users ──┬── user_secrets        apify_key🔒, ai_provider, ai_key🔒
        ├── master_profiles      parsed resume as structured JSON + source file
        ├── scrape_runs          apify run id, query params, status
        │       └── jobs         title, company, url, jd_text, jd_parsed (deduped)
        ├── job_matches          job ↔ profile, fit_score, gap analysis
        ├── tailored_documents   resume / cover-letter, content, rendered PDF
        └── applications  ★      job + resume used + status + applied_at  ← HISTORY
```

`applications` answers the core requirement: *when did the user apply, with which
resume, on what date, and what status*.

## 5. Phased roadmap

| Phase | Deliverable |
|-------|-------------|
| **0 — Foundation** | Monorepo (web + extension), Supabase project, login/signup, DB schema, encrypted BYO-keys settings page |
| **1 — Resume intake** | Upload PDF/DOCX → parse to structured master profile → editable UI |
| **2 — Job scraping** | Configure Apify actor, trigger scrape with user's key, store jobs + JDs, browse list |
| **3 — JD analysis + fit score** | LLM extracts requirements/keywords, scores fit, shows skill gaps |
| **4 — Tailoring** | Generate tailored resume + cover letter per job, render to PDF, preview/download |
| **5 — Application tracking** | Apply queue → mark applied → history dashboard (resume + date + status) |
| **6 — Browser extension** | Autofill ATS form fields from tailored profile; user reviews & submits |
| **7 — Polish** | LaTeX option, resume pagination tuning, paid tier/billing |

Phases 0→5 = the complete web product. Phase 6 (extension) adds the autofill magic.
Build a thin vertical slice first to see the full loop early, then deepen each phase.

## 6. Known hard problems (tune iteratively, don't block on these)

- **Resume pagination/overflow** — a 1-page resume spilling a single line to page 2
  ruins the layout. Needs iterative tuning in the render phase (Phase 4/7).
- **ATS form diversity** — Workday/Greenhouse/Lever/Taleo/iCIMS/Ashby all differ.
  The extension handles the common ones first; not every form will autofill perfectly.

## 7. Repo layout (planned)

```
builder/
├─ apps/
│  ├─ web/            Next.js app (UI + API route handlers + server actions)
│  └─ extension/      Manifest V3 browser extension (Phase 6)
├─ packages/
│  ├─ db/             Drizzle schema + client
│  └─ shared/         shared types (profile schema, job schema, etc.)
├─ PROJECT_SPEC.md    this file
└─ ...
```

## 7b. Current status

**Phase 0 — COMPLETE & verified** (build passes, runtime DB roundtrip + auth
redirects confirmed):
- npm-workspace monorepo: `apps/web`, `packages/db`, `packages/shared`.
- DB layer: Drizzle schema (8 tables) on PGlite; `npm run db:generate` / `db:migrate`.
- Auth: signup / login / logout (server actions, bcrypt, jose session cookie),
  protected `(app)` routes, public `(auth)` routes.
- Encrypted BYO-keys settings page (AES-256-GCM; keys never returned to client).
- Editorial Ink landing, dashboard (setup checklist), settings — all styled.

**How to run locally**
```bash
npm install
npm run dev             # auto-applies migrations, then serves :3000
```
`npm run dev` now runs `db:migrate` first (the migrate process exits before the
server opens, so the single PGlite handle never conflicts). Secrets live in
`apps/web/.env.local` (gitignored); template in `.env.example`.

> ⚠️ **PGlite is single-handle.** Don't run two dev servers at once, and after a
> schema change just restart `npm run dev` (it re-migrates). A stale server kept
> alive will serve an old in-memory schema → "column does not exist" errors.

**Phase 1 — COMPLETE & verified** (build passes, extraction plumbing tested):
- Provider-agnostic AI layer `apps/web/lib/ai.ts` — Groq / Gemini / Anthropic /
  OpenAI via the user's own key (plain fetch, no SDKs). `getUserAi()` decrypts.
- Resume upload (PDF via `unpdf`, DOCX via `mammoth`, TXT) → `extractResumeText`
  → LLM parse to `masterProfile` schema → stored in `master_profiles`.
- `/resumes` list + upload, `/resumes/[id]` full structured editor (contact,
  summary, experience, education, skills, projects, certs, languages, saved
  answers), set-default + delete. Server-action body limit raised to 8 MB.
- NOTE: the parse step needs a configured AI key to exercise end-to-end.

**Phase 2 — COMPLETE & verified** (build passes, normalizer tested):
- Pluggable source layer `apps/web/lib/sources/` — `JobSource` interface +
  `normalizeJob` (maps varied scraper outputs to our schema). Two adapters:
  **Apify** (run-sync-get-dataset-items; user picks actor + optional raw JSON)
  and **JSearch** (RapidAPI, free job API). Registry in `sources/index.ts`.
- RapidAPI key added to `user_secrets` + Settings (encrypted like the others).
- `runScrape` action creates a `scrape_runs` record, scrapes, dedupe-inserts
  `jobs`, updates run status. `/jobs` list + scrape form + run history;
  `/jobs/[id]` full JD view.
- NOTE: synchronous scrape (fine local; move to async+webhook for Vercel in
  Phase 7). Needs the user's Apify or RapidAPI key to exercise end-to-end.

**Phase 3 — COMPLETE & verified** (build passes):
- `lib/analysis.ts` `analyzeAndScore()` — ONE LLM call returns both the JD
  analysis (skills/keywords/requirements/years/seniority) and the fit
  (0–100 score, matched/missing skills, strengths, gaps, summary), weighing
  experience level. `profileSummary()` makes a compact resume view.
- `actions/analysis.ts`: `scoreJob` (per job, default resume) + `scoreAllJobs`
  (bulk, cap 12). Stores analysis on `jobs.jdAnalysis`, fit in `job_matches`.
- `/jobs/[id]` shows a fit breakdown (`components/fit-card.tsx`); `/jobs` shows
  score chips + ranks highest-fit first + "Score all".

**Phase 4 — COMPLETE & verified** (build + real PDF render test):
- `lib/tailor.ts` — `tailorResume` (returns a tailored MasterProfile, truthful
  reorder/rephrase) + `writeCoverLetter` (text). `actions/tailor.ts`
  `generateTailored` stores both in `tailored_documents`.
- `lib/pdf/*` react-pdf docs; `GET /api/documents/[id]/pdf` renders on demand
  (`@react-pdf/renderer` in serverExternalPackages). Job page: generate +
  download resume/cover PDFs + cover-letter preview.

**Phase 5 — COMPLETE & verified** (build passes):
- `actions/applications.ts` (trackApplication, updateApplicationStatus,
  deleteApplication). `/applications` history table (role, resume used, status
  dropdown, applied date, doc links). "Track application" on the job page.
  Status → "applied" stamps `appliedAt`. Dashboard step 4 reflects it.

**Phase 6 — COMPLETE** (build passes; needs a browser to fully test):
- `apps/extension/` — Manifest V3 extension (plain JS, load unpacked, no build).
  Popup syncs the profile from `GET /api/profile/export` (session-cookie auth),
  caches it, and `content.js` autofills form fields by heuristic matching
  (name/email/phone/links/location + saved answers). Never submits. README has
  load steps.

**Phase 7 — polish done (billing skipped per request):**
- Resume PDF pagination fixed (sections flow across pages; `minPresenceAhead`
  stops orphaned headings; tighter spacing). Resume polish stays ongoing scope.
- Apify UX: `KNOWN_ACTORS` preset builds the LinkedIn actor's input (search URL
  + experience f_E codes) from the friendly fields — **no raw JSON needed** for
  `curious_coder/linkedin-jobs-scraper`. Raw JSON moved behind an "Advanced"
  toggle for other actors.
- **LaTeX / Overleaf export (DONE):** `lib/pdf/resume-latex.ts`
  (`resumeToLatex` + `coverLetterToLatex`, escapes LaTeX specials, standard
  packages only) served at `GET /api/documents/[id]/tex` as a `.tex` download.
  Job page offers Resume/Cover as both PDF and `.tex (Overleaf)`.
- **Deferred to deploy-time (not built):** async scrape via Apify webhook (needs
  a public URL; current scrape is synchronous), prod DB swap to Supabase/Neon
  (driver swap point documented in `packages/db`), and **billing** (skipped).

**ALL 8 PHASES ADDRESSED.** The product is feature-complete for local use.

## 8. Design system — "Editorial Ink"

Deliberately NOT the generic AI look. No beige/cream/tan/brown. No emoji-headers,
no default rounded pastel cards. The app should read as art-directed/editorial.

**Palette**
| Token | Hex | Use |
|-------|-----|-----|
| `canvas` | `#F4F5F3` | page background (cool off-white, NOT cream) |
| `surface` | `#FFFFFF` | cards/panels |
| `ink` | `#14171C` | primary text / headlines |
| `ink-soft` | `#4A4F57` | secondary text |
| `line` | `#E2E3DF` | hairline borders/dividers |
| `accent` | `#0E6E55` | emerald — primary actions, links, focus |
| `accent-soft`| `#E6F0EC` | accent tint backgrounds |

**Type**
- Display/headings: a **serif** (e.g. Newsreader / Fraunces / Instrument Serif) — editorial voice.
- Body/UI: a clean **sans** (e.g. Inter / Geist).
- Numerals in data contexts: tabular/mono feel where it aids scanning.

**Principles**
- Generous editorial spacing; strong typographic hierarchy over heavy chrome.
- 1px hairlines (`line`) instead of drop shadows where possible.
- One accent only (emerald). Restraint > decoration.
- Real grid, consistent rhythm, intentional whitespace.

