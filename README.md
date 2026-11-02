# StructLab

StructLab is an interactive visual playground for fundamental data structures. The first release covers arrays, stacks, queues, deques, and doubly linked lists in a single-page canvas with step-by-step traces.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Framer Motion
- lucide-react

## Status

Phase 0 — Foundation is complete.

- [x] 0.1 Scaffold
- [x] 0.2 UI dependencies
- [x] 0.3 Design foundation
- [x] 0.4 Tooling
- [x] 0.5 Documentation baseline

The next milestone is Phase 1 — the single-page shell. See the [roadmap](docs/roadmap.md) for the full plan.

## Requirements

- Node.js 22.x
- pnpm 11.x

If pnpm is not installed globally, enable it through Corepack:

```powershell
corepack enable pnpm
```

## Local setup

```powershell
git clone https://github.com/akio-q/struct-lab.git
cd struct-lab
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

No environment variables are required for v1. `.env.example` documents this; copy it to `.env.local` only if you add local overrides later.

Playwright browsers are not installed by `pnpm install`. Install them once before running end-to-end tests:

```powershell
pnpm exec playwright install
```

## Scripts

| Command             | Description                           |
| ------------------- | ------------------------------------- |
| `pnpm dev`          | Start the development server          |
| `pnpm build`        | Create a production build             |
| `pnpm start`        | Serve the production build            |
| `pnpm lint`         | Run ESLint with zero warnings allowed |
| `pnpm typecheck`    | Type-check with TypeScript            |
| `pnpm test`         | Run Vitest unit tests                 |
| `pnpm test:watch`   | Run Vitest in watch mode              |
| `pnpm test:e2e`     | Run Playwright end-to-end tests       |
| `pnpm format`       | Format the repository with Prettier   |
| `pnpm format:check` | Check formatting without writing      |

## Verification

Before every commit:

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm format:check
```

Before phase checkpoints:

```powershell
pnpm test:e2e
pnpm build
```

## Project structure

```text
src/
├─ app/            # App Router layout, page, and global styles
├─ components/
│  ├─ ui/          # shadcn/ui primitives
│  ├─ shell/       # Header, tabs, and playground shell
│  └─ structures/  # Self-contained structure modules
├─ hooks/          # Shared hooks
├─ lib/            # Site configuration, structure types, and utilities
└─ test/           # Vitest setup
tests/
└─ e2e/            # Playwright end-to-end specs
```

## Branches

`main` is the integration branch. Personal development branches are `dev/valentyn` and `dev/andriy`.

Do not commit directly to `main`. Keep feature work on a personal branch and merge milestones into `main` with a merge commit. See [collaboration conventions](docs/conventions.md).

## Documentation

- [Architecture](docs/architecture.md)
- [Roadmap](docs/roadmap.md)
- [Collaboration conventions](docs/conventions.md)
- [Architecture decisions](docs/decisions.md)
- [Agent instructions](AGENTS.md)

## Deployment

The app is designed for Vercel with no environment variables required for v1.

- Framework preset: Next.js
- Install command: `pnpm install --frozen-lockfile`
- Build command: `pnpm build`
- Node version: 22.x
