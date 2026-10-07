# 💪 FitLine Power Hub

An independent **FitLine partner site** presenting FitLine's premium nutritional supplements in **Swedish and English**. Visitors can browse products by category, read about each product and the NTC® technology behind them, and are then sent on to FitLine's official webshop to buy. The site includes an admin area and is optimized for search engines in both languages.

**[Live site →](https://fitline-now.lovable.app)**

> This is an independent partner/affiliate site. All purchases are made through FitLine's official webshop.

## Features

- **Product catalog:** browse supplements with prices, descriptions and dedicated product pages
- **Categories:** Optimal Supply, Fitness, Special Needs, Beauty and Weight Management
- **Featured products:** a "most loved" selection on the home page
- **Bilingual:** full Swedish (`/sv`) and English (`/en`) versions with a language switcher
- **SEO-optimized:** localized routes, per-language titles and meta descriptions, canonical URLs, and Open Graph / Twitter card metadata
- **Newsletter signup:** collect subscribers for tips, new products and campaigns
- **Admin area:** protected `/admin` section for managing the site
- **Affiliate-ready:** clear partner disclaimer, with purchases handled on FitLine's official webshop

## Tech Stack

| Area | Technology |
| --- | --- |
| Framework | [TanStack Start](https://tanstack.com/start) (React 19, TanStack Router, TanStack Query) |
| Language | [TypeScript](https://www.typescriptlang.org/) |
| Build tool | [Vite](https://vite.dev/) with [Nitro](https://nitro.build/) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com/) |
| UI components | [shadcn/ui](https://ui.shadcn.com/) on [Radix UI](https://www.radix-ui.com/), [Lucide](https://lucide.dev/) icons |
| Forms & validation | [React Hook Form](https://react-hook-form.com/) and [Zod](https://zod.dev/) |
| Database & auth | [Supabase](https://supabase.com/) (PostgreSQL) with Lovable Cloud authentication |
| ORM & migrations | [Drizzle ORM](https://orm.drizzle.team/) and Drizzle Kit |
| Testing | [Vitest](https://vitest.dev/) and Testing Library |
| Code quality | ESLint and Prettier |
| Package manager | [Bun](https://bun.sh/) |
| Built with | [Lovable](https://lovable.dev/) |

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (the repository ships a `bun.lock`)
- A [Supabase](https://supabase.com/) project (or access to the Lovable Cloud project this site is connected to)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/davidallert/fitline.git
   cd fitline
   ```

2. **Install dependencies**

   ```bash
   bun install
   ```

3. **Configure environment variables**

   Create a `.env` file in the project root with your Supabase project details (see [Environment Variables](#environment-variables)):

   ```env
   SUPABASE_URL="https://your-project-id.supabase.co"
   SUPABASE_PUBLISHABLE_KEY="your-publishable-key"
   SUPABASE_PROJECT_ID="your-project-id"

   VITE_SUPABASE_URL="https://your-project-id.supabase.co"
   VITE_SUPABASE_PUBLISHABLE_KEY="your-publishable-key"
   VITE_SUPABASE_PROJECT_ID="your-project-id"
   ```

4. **Start the development server**

   ```bash
   bun run dev
   ```

   Open the local URL printed in your terminal. The site redirects to the Swedish version by default, and you can switch to English with the language toggle.

## Environment Variables

| Variable | Description |
| --- | --- |
| `SUPABASE_URL` / `VITE_SUPABASE_URL` | URL of your Supabase project (server and client) |
| `SUPABASE_PUBLISHABLE_KEY` / `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable (anon) key |
| `SUPABASE_PROJECT_ID` / `VITE_SUPABASE_PROJECT_ID` | Supabase project ID |
| `LOVABLE_DB_MIGRATION_URL` | PostgreSQL connection string used by Drizzle Kit for migrations (only needed when running migrations) |

The publishable key is designed to be used in the browser. Access to data is protected by Supabase Row Level Security policies, so make sure they are enabled for every table, especially those used by the admin area. Never commit a service-role key or database password.

## Available Scripts

| Command | Description |
| --- | --- |
| `bun run dev` | Start the development server |
| `bun run build` | Create a production build |
| `bun run build:dev` | Create a build in development mode |
| `bun run preview` | Preview the production build locally |
| `bun run lint` | Lint the code with ESLint |
| `bun run format` | Format the code with Prettier |
| `bun run test` | Run the test suite once |
| `bun run test:watch` | Run tests in watch mode |

## Routes

Every public page exists in both languages, prefixed with `/sv` or `/en`.

| Route | Description |
| --- | --- |
| `/:lang` | Home page |
| `/:lang/products` | All products, filterable with `?category=` |
| `/:lang/products/:slug` | Product detail page |
| `/admin` | Admin area (requires authentication) |

Available category values: `optimalsupply`, `fitness`, `specialneeds`, `beauty`, `weightmanagement`.

## Database

The site uses PostgreSQL through Supabase. The schema and migrations are managed with Drizzle:

- **Schema:** `drizzle/schema.ts`
- **Migrations:** `drizzle/migrations`
- **Configuration:** `drizzle.config.ts`, which reads the connection string from `LOVABLE_DB_MIGRATION_URL`

```bash
# Generate a migration after changing the schema
bunx drizzle-kit generate

# Apply migrations to the database
bunx drizzle-kit migrate
```

The `supabase/` folder contains the Supabase project configuration.

## Project Structure

```
fitline/
├── .lovable/             # Lovable project metadata
├── drizzle/              # Database schema and migrations
├── public/               # Static assets
├── src/                  # Application source code
├── supabase/             # Supabase project configuration
├── drizzle.config.ts     # Drizzle Kit configuration
├── vite.config.ts        # Vite configuration
├── vitest.config.ts      # Test configuration
└── package.json
```

## Deployment

The live site is hosted through Lovable at [fitline-now.lovable.app](https://fitline-now.lovable.app). Changes are published from the Lovable editor.

## Disclaimer

FitLine Power Hub is an independent partner site and is not the official FitLine webshop. FitLine, NTC® and other product names and trademarks belong to their respective owners.

## Author

**David Allert**: [@davidallert](https://github.com/davidallert)
