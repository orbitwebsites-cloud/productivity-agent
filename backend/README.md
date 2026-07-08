# ScreenBuddy Backend (Vercel)

Serverless functions for Premium: verify Supabase login → check Stripe subscription →
call the LLM with **our** key → return the answer. Zero npm dependencies.

## Endpoints
| Route | What it does |
|---|---|
| `POST /api/ask` | Premium AI answer. Bearer = Supabase access token. Body `{question, summary}`. |
| `GET /api/me` | Who am I + premium status. |
| `POST /api/checkout` | Creates a Stripe Checkout session → `{url}`. |
| `POST /api/stripe-webhook` | Stripe events → sync `subscriptions` table. |
| `GET /api/done` | Post-checkout landing page. |

## Environment variables (set in Vercel → Project → Settings → Environment Variables)
| Var | Where to get it |
|---|---|
| `SUPABASE_URL` | `https://vipextcidorcauhlviig.supabase.co` (the `screenbuddy` project) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase dashboard → Project Settings → API keys → `service_role` (secret!) |
| `ANTHROPIC_API_KEY` | Your Anthropic key — server-side only, never ships in the app |
| `ANTHROPIC_MODEL` | optional, default `claude-sonnet-5` |
| `STRIPE_SECRET_KEY` | Stripe dashboard → Developers → API keys |
| `STRIPE_PRICE_ID` | Create a Product ("ScreenBuddy Premium") + recurring Price in Stripe → copy `price_...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe → Developers → Webhooks → Add endpoint `https://<your-vercel-domain>/api/stripe-webhook`, events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted` → copy `whsec_...` |

## Deploy
From this `backend/` folder: `npx vercel --prod` (or connect the folder as a Vercel project).
After deploy, put the production URL into the desktop app config default
(`premium.backendUrl` in `electron/config.js`).

## Database
The `subscriptions` table + RLS is already applied to the `screenbuddy` Supabase project
(migration `create_subscriptions`). Schema:
`user_id uuid PK → auth.users`, `status text`, `stripe_customer_id`, `stripe_subscription_id`,
`current_period_end timestamptz`, `updated_at`.
