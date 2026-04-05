# My Delivery Fleet

A [Next.js](https://nextjs.org) application for restaurant and retail businesses to manage **delivery orders**, **dispatch**, **live courier tracking**, **billing**, and **support**. The app distinguishes **business** users (restaurants) and **admin** users (fleet operators) with role-based access.

## Tech stack

| Layer | Choices |
|--------|---------|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Auth | [Clerk](https://clerk.com) (`@clerk/nextjs`) |
| Database | PostgreSQL via [Prisma](https://www.prisma.io) 7 (`@prisma/adapter-pg`) |
| Payments | [Stripe](https://stripe.com) (cards, ACH, Financial Connections, webhooks) |
| Maps | Google Maps (`@react-google-maps/api`) |
| Delivery quotes / logistics | Uber Direct (`uber-direct`) |
| File storage | AWS S3 (`@aws-sdk/client-s3`) |
| UI | Tailwind CSS 4, Radix UI, shadcn-style components, Framer Motion |
| State / data | TanStack Query, Zustand, Formik + Yup |

## Features

- **Onboarding** — Business profile, payment method (Stripe), and approval workflow (`UNDER_REVIEW`, `APPROVED`, `REJECTED`, `SUSPENDED`).
- **Fleet dashboard** — Stats, order tables, and metrics (business); admins see cross-business views where applicable.
- **Orders** — Create and manage orders, line items, delivery addresses, surcharges (catering, retail, etc.), and integration with delivery providers.
- **Dispatch & live tracking** — Courier updates (Uber webhooks), maps, and tracking visibility.
- **Billing** — Weekly billing, invoices, subscriptions, transactions, PDFs (jsPDF), invoice retry flows.
- **Support** — Tickets with categories, messages, and attachments (S3).
- **Admin** — Manage businesses (approve/reject), orders, billing, support, and users.

## Repository layout (high level)

```
app/                    # App Router pages and API routes
  api/                  # REST handlers (orders, business, admin, webhooks, S3, …)
  fleet/                # Authenticated app (dashboard, orders, dispatch, …)
  onboarding/           # New business setup
components/             # Shared UI (including maps)
lib/                    # Prisma client, Stripe, auth helpers, types, enums
prisma/                 # schema.prisma, migrations
services/               # Uber, S3, billing, payment helpers
validations/            # Yup schemas
proxy.ts                # Clerk middleware (route protection & onboarding gates)
```

Prisma Client is generated to `app/generated/prisma` (see `prisma/schema.prisma`).

## Prerequisites

- Node.js 20+ (matches `engines` if you add one; `@types/node` is 20)
- PostgreSQL database
- Accounts/keys for services you use: Clerk, Stripe, Google Maps, AWS (if using uploads), Uber Direct (if using quotes/delivery)

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Environment variables**

   Create a `.env` or `.env.local` in the project root. Use at least:

   | Variable | Purpose |
   |----------|---------|
   | `DATABASE_URL` | PostgreSQL connection string (used by Prisma) |
   | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk (browser) |
   | `CLERK_SECRET_KEY` | Clerk (server) |
   | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Elements |
   | `STRIPE_SECRET_KEY` | Stripe server API |
   | `STRIPE_WEBHOOK_SECRET` | Verifying Stripe webhooks |
   | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Maps components |
   | `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET` | Ticket/message attachments via S3 |
   | `UBER_DIRECT_CLIENT_ID`, `UBER_DIRECT_CLIENT_SECRET`, `UBER_DIRECT_CUSTOMER_ID` | Uber Direct (base) |
   | `UBER_DIRECT_RETAIL_*`, `UBER_DIRECT_CATERING_*` | Optional separate Uber Direct apps for retail/catering |
   | `CRON_SECRET` | Authorizes `/api/webhooks/weekly-billing` (Bearer token) |

   Other code may reference `VERCEL_ENV` for non-production behavior in certain API routes.

3. **Database**

   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

4. **Run the dev server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000). The app title in `app/layout.tsx` is **My Delivery Fleet**; sign-in/sign-up and redirects are configured for `/fleet` and `/onboarding`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Next.js development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |

## API and webhooks

Route handlers under `app/api/` cover CRUD for businesses, orders, invoices, payment methods, support, and exports. Webhooks include:

- `app/api/webhooks/stripe/route.ts` — Stripe events
- `app/api/webhooks/uber/*` — Delivery status and courier updates
- `app/api/webhooks/clerk/route.ts` — Clerk
- `app/api/webhooks/weekly-billing/route.ts` — Scheduled billing (protect with `CRON_SECRET`)

## Auth middleware note

Clerk-based route protection and onboarding redirects are implemented in **`proxy.ts`**. Next.js expects the entry file to be named **`middleware.ts`** (or `src/middleware.ts`) at the project root. If middleware does not run in your environment, ensure that file exists and re-exports or contains the same logic as `proxy.ts`.

## Deploy

The project is suitable for hosting on [Vercel](https://vercel.com) or any Node-friendly platform. Set the same environment variables in the host, run `npm run build`, configure PostgreSQL, and point webhooks (Stripe, Clerk, Uber) to your public URLs.

## License

Private project (`"private": true` in `package.json`).
