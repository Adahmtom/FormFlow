# FormFlow — Pro Form Builder

A full-stack form builder dashboard built with **Next.js 15**, **Supabase**, and **Tailwind CSS**. Create, publish, and analyze forms with full theme control, automations, and role-based user management.

## Features

- **Drag & Drop Form Builder** — 13 field types including text, email, phone (with country codes), dropdowns, ratings, scales, file uploads, and section breaks
- **Live Theme Editor** — Full control over colors, fonts, spacing, shadows, gradients, and button styles with real-time preview
- **Public Form Sharing** — Direct links, iframe embeds, and JS widget snippets
- **Response Dashboard** — Sortable spreadsheet view with search, filtering, detail panels, and CSV export
- **Automations** — Email notifications, auto-replies, webhooks, and Slack integrations
- **Role-Based Access** — Admin, Editor, Viewer, and Responder roles with full user management
- **3 Form Categories** — Job Application, Contact/Lead, and Survey with pre-built templates

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Database:** Supabase (PostgreSQL + Auth + RLS)
- **Styling:** Tailwind CSS + Custom CSS
- **Fonts:** Google Fonts (Outfit, Bebas Neue, + 8 more)
- **Deployment:** Vercel

## Quick Start

1. **Clone the repo:**
   ```bash
   git clone https://github.com/Adahmtom/FormFlow.git
   cd FormFlow
   ```

2. **Install dependencies:**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   Fill in your Supabase credentials in `.env.local`.

4. **Set up the database:**
   Run the SQL in `supabase/schema.sql` in your Supabase SQL Editor.

5. **Run locally:**
   ```bash
   npm run dev
   ```

## Deploy to Vercel

1. Push to GitHub
2. Import the repo in [Vercel](https://vercel.com/new)
3. Add these environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Deploy!

## Project Structure

```
FormFlow/
├── app/
│   ├── page.tsx                    # Root redirect (→ dashboard or login)
│   ├── layout.tsx                  # Root layout with fonts
│   ├── globals.css                 # Global styles + dark theme
│   ├── (auth)/login & signup       # Auth pages
│   ├── (app)/                      # Protected app shell
│   │   ├── dashboard/              # Dashboard overview
│   │   ├── forms/                  # Forms list + responses
│   │   ├── builder/                # Form builder (new + edit)
│   │   └── admin/users/            # User management (admin)
│   └── f/[id]/                     # Public form page
├── components/                     # All client components
├── lib/                            # Server actions, Supabase, constants
├── types/                          # TypeScript interfaces
├── middleware.ts                   # Auth route protection
└── supabase/schema.sql             # Database schema + RLS policies
```

## License

MIT
