# StructLab

StructLab is an interactive visual playground for fundamental data structures. The v1 scope covers arrays, stacks, queues, deques, and doubly linked lists in a single-page canvas with step-by-step traces.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Framer Motion
- lucide-react

## Status

Phase 0 — Foundation is in progress.

- [x] 0.1 Scaffold
- [x] 0.2 UI dependencies
- [x] 0.3 Design foundation
- [ ] 0.4 Tooling
- [x] 0.5 Documentation baseline

Phase 0.4 (Prettier, Vitest, Playwright, and package scripts) is the remaining foundation step. See the [roadmap](docs/roadmap.md) for the full plan.

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

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start the development server |
| `pnpm build` | Create a production build |
| `pnpm start` | Serve the production build |
| `pnpm lint` | Run ESLint |

`pnpm typecheck` and `pnpm test` are added with the phase 0.4 tooling. Until then, type-check with:

```powershell
pnpm exec tsc --noEmit
```

## Verification

Before every commit:

```powershell
pnpm lint
pnpm exec tsc --noEmit
```

Before phase checkpoints:

```powershell
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
└─ lib/            # Site configuration, structure types, and utilities
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
