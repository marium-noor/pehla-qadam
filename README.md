# Pehla Qadam (پہلا قدم)

A Shariah-first weekly guide that helps first-time investors in Pakistan take their first step. One short story-style lesson by email each week, in Urdu or English. Free to start, with a paid Plus plan. We never hold or move your investment money. You only ever pay Pehla Qadam for the course.

Built for the Build2Launch hackathon.

## What is in the MVP

- **Landing page**: four sections (hero with the real week 1 email, how it works, what we do and never do, halal and Urdu first).
- **Onboarding**: five short steps (about you, work and family, money today, goal and monthly amount, comfort with ups and downs).
- **Plan engine** (`src/lib/plan.ts`, unit tested): safety-net target, "start here" step (debt, safety net, or invest), risk style, and an example starting mix. Short horizon or no safety net always forces the careful style.
- **Dashboard**: plan, choose a starting route (Islamic money market fund, Islamic bank certificate, gold) with example platforms to research, this week's lesson, six-week timeline that unlocks weekly, and a saving calculator that shows the effect of inflation.
- **Six lessons**, English and Urdu, personalised with the person's name, monthly amount, safety-net target and chosen route.
- **Email**: week 1 is sent on sign-up, then the cron sends the next lesson on the weekday each person chose. Every email has a one-click link back to the dashboard and an unsubscribe link.
- **Chat assistant**: English and Urdu. Text for everyone (Free is limited per day), voice on Plus and Teams. Voice is recorded in the browser, converted to 16 kHz WAV and sent to Gemini, which transcribes and answers in one call. The transcript is shown back to the user. "Listen" uses the device's own speech voices when available.
- **Full Urdu support**: right-to-left layout, Nastaliq type, every string translated.

## Pricing

All prices and limits live in `src/lib/pricing.ts`. The plans:

| Plan | Price | Includes |
| --- | --- | --- |
| Free | PKR 0 | Profile, plan, all 6 lessons, text chat limited to 10 user messages a day. No voice. |
| Plus | PKR 299 a month or PKR 2,999 a year | Unlimited text chat, voice questions, a monthly plan check-in email. |
| Teams (pilot pricing) | PKR 199 per person a month, minimum 20 people | Same as Plus. "Talk to us" opens a mailto to `NEXT_PUBLIC_CONTACT_EMAIL`. |

The wording rule: the app never says it takes no money at all. The claim is "We never hold or move your investment money. You only ever pay Pehla Qadam for the course."

**No payment gateway is integrated.** On the dashboard a Free user presses "Request Plus". `POST /api/plan/request` saves `plan_requested` and `plan_requested_at`, emails you (`NOTIFY_EMAIL`) and emails the user to say you will contact them to pay by JazzCash, Easypaisa or bank transfer.

### Activating a plan

1. You get a notification email with the person's email address (the SQL is in it).
2. Contact them and take payment by JazzCash, Easypaisa or bank transfer.
3. In the Supabase SQL editor run:
   ```sql
   update public.profiles set plan = 'plus' where email = 'person@example.com';
   ```
   Use `'teams'` for a Teams member. To switch someone back, set `'free'`.
4. The change applies on their next chat message (the plan is read from the database each time). Their first monthly check-in email goes out on the next daily cron run.

### How limits are enforced

- **The plan always comes from the database.** The browser sends only its profile token; `POST /api/chat` looks the plan up and ignores anything else the client says. The token is the same secret magic-link token that already gates the profile.
- **Free:** 10 user messages per Asia/Karachi day, tracked in `chat_day` and `chat_count` and reset when the day changes. The 11th returns `429 {"error":"limit"}`. Counting is a compare-and-set update, so two parallel requests cannot both take the last message. If the AI provider fails, the message is given back. Audio from a Free user returns `403 {"error":"voice"}` before anything is counted.
- **Plus and Teams:** no limit, voice allowed.
- **Demo mode (no Supabase), no token, or an unknown token:** treated as Free. The daily count is kept in `localStorage` only, so **it is not enforced on the server** and anyone can clear it. Voice is still refused server side. Because a request with no token is treated as Free and cannot be counted, someone could also get unmetered text chat by omitting the token; the per-IP rate limit (30 requests per 10 minutes) is the only guard there. Fine for an MVP, not for a paid launch.
- The rate limiter is the existing in-memory one (see Known limits).

### Monthly check-in email

`/api/cron/weekly` (daily) also sends Plus and Teams users a short plan check-in, in English or Urdu by their saved language, at most once every 30 days (`last_checkin_at`). It recomputes the plan from their saved answers with `computePlan` and links to their magic link, where they can update their monthly amount. Free users never receive it, and people who unsubscribed are skipped. A user who has never had one gets it on the first cron run after activation.

### Migration (existing database)

New installs: run `supabase/schema.sql`. For a database created before pricing, run the `alter table ... add column if not exists` block at the bottom of the same file. It is safe to run more than once. New columns on `profiles`: `plan`, `plan_requested`, `plan_requested_at`, `chat_day`, `chat_count`, `last_checkin_at`. Row level security stays on with no policies; all access is server side with the service role key.

## Stack

Next.js 16 (App Router), React 19, Tailwind CSS 4, TypeScript, Zod, Supabase (PostgREST over `fetch`), Resend (REST), Gemini API, Vercel (hosting and cron). Vitest for unit tests.

## Run locally

```bash
npm install
cp .env.example .env.local   # every key is optional, see below
npm run dev
```

With no keys the app runs in **demo mode**: profiles live in the browser, emails are not sent and the chat says it is off. Each key switches one feature on.

| Variable | Turns on |
| --- | --- |
| `GEMINI_API_KEY` (+ optional `GEMINI_MODEL`) | Chat assistant, text and voice |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Saved profiles, magic links, weekly cron |
| `RESEND_API_KEY`, `EMAIL_FROM` | Real emails |
| `NEXT_PUBLIC_SITE_URL` | Correct links inside emails |
| `NEXT_PUBLIC_CONTACT_EMAIL` | The "Talk to us" mailto link on the Teams plan (hidden when empty) |
| `NOTIFY_EMAIL` | Where plan-request notifications are sent (needs Resend) |
| `CRON_SECRET` | Authorises `/api/cron/weekly` |

### Supabase

Run `supabase/schema.sql` in the Supabase SQL editor. Row level security is on with no policies, so the public key can read nothing. Only the server, with the service role key, touches the table. Never expose that key in the browser.

### Resend

Verify a sending domain in Resend and set `EMAIL_FROM` to an address on it. Without a verified domain, Resend only delivers to your own address.

## Deploy

1. Push this folder to a public GitHub repository.
2. In Vercel choose "Add New Project", import the repo, add the environment variables above, and deploy.
3. Set `NEXT_PUBLIC_SITE_URL` to the Vercel URL and redeploy.
4. `vercel.json` registers a daily cron (09:00 Pakistan time) that sends each person their next lesson on their chosen weekday. Vercel sends `CRON_SECRET` automatically as a bearer token.

## Tests

```bash
npm test          # plan engine, projection maths, daily chat limit and check-in rules
```

## Known limits of this MVP

- **No email verification.** Anyone can sign up with any address. Add a confirm-email step (double opt-in) before real traffic. Re-using an existing email never reveals that account's token; the owner just gets a link by email.
- **Rate limiting is in memory**, so it is per server instance. Use Upstash or Vercel KV before launch.
- **Lesson progress** (done ticks) is stored in the browser, not the database.
- **Urdu text was written by an AI and needs a native proofread** before public launch, especially the lessons.
- **Facts about platforms** (names, minimums, limits) were checked in November 2026 and change. Each place in the app is labelled an example to research, never a recommendation.
- **Shariah compliance** is not certified by Pehla Qadam. It points to products that each have their own Shariah board and tells users to confirm with a scholar.
- **Regulation.** SECP licenses investment advisers. This app is built as education: category-level guidance, example platforms, no named buy instructions, no money handling. Get legal advice before adding anything more personal.
