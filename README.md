# StructLab

StructLab is an interactive visual playground for fundamental data structures. The first release covers arrays, stacks, queues, deques, and doubly linked lists in a single-page canvas.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Framer Motion
- lucide-react

## Status

Phase 0.4 is complete: design tokens, typography, formatting, unit testing, and end-to-end testing are configured.

The next milestone is Phase 0.5: README, `.env.example`, site configuration, and local setup documentation.

## Local setup

```powershell
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Branches

`main` is the integration branch.

Personal development branches:

- `dev/valentyn`
- `dev/andriy`

Do not commit directly to `main`. Open a pull request from your personal branch when a milestone is ready.

## Verification

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm format:check
pnpm build
```

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
