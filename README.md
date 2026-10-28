# Beacon — Solar Microgrid Operations

An operations management MVP for off-grid solar microgrids. Built with Next.js 15 (App Router), TypeScript, Tailwind CSS, and Supabase.

---

## Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- npm

---

## Setup

### 1. Clone & install

```bash
git clone <repo>
cd beacon
npm install
```

### 2. Environment variables

Copy the example file and fill in your Supabase project credentials:

```bash
cp .env.example .env.local
```

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API → `anon` key |

### 3. Run migrations

In the Supabase dashboard → **SQL Editor**, run the migration files in order:

```
supabase/migrations/001_schema.sql
supabase/migrations/002_rls.sql
```

Or if you have the Supabase CLI:

```bash
supabase db push
```

### 4. Seed demo data

```bash
# In Supabase SQL Editor, run:
supabase/seed.sql
```

Or via CLI:

```bash
supabase db reset  # runs migrations + seed
```

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Demo accounts (after seeding)

| Email | Password | Role |
|---|---|---|
| `amara@beacon.demo` | `beacon123` | Operations Director |
| `kwame@beacon.demo` | `beacon123` | Technician |
| `fatima@beacon.demo` | `beacon123` | Technician |
| `peter@beacon.demo` | `beacon123` | Technician |
| `sarah@beacon.demo` | `beacon123` | Technician |

---

## Project structure

```
app/                    Next.js App Router pages
  login/                Auth screen
  dashboard/            A-01 Village operations dashboard (ops director)
  check-in/             A-02 Technician check-in form
  meter-reading/        A-03 Meter reading form
components/
  ui/                   Shared design system (Badge, Button, Card, FormField…)
  feature/              Domain components (VillageCard, CheckInForm…)
lib/
  supabase/             Browser + server clients, middleware helper
  schemas/              Zod validation schemas
  types.ts              TypeScript DB types
middleware.ts           Auth + role redirect
supabase/
  migrations/           SQL schema & RLS policies
  seed.sql              Demo data
```

---

## Tech stack

- **Framework**: Next.js 15, App Router, TypeScript strict mode
- **Styling**: Tailwind CSS with Beacon design tokens
- **Auth + DB**: Supabase (Postgres, Auth, RLS)
- **Validation**: Zod (shared between forms and server actions)
- **Deploy**: Vercel
