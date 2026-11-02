<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# StructLab project instructions

StructLab is an interactive visual playground for fundamental data structures. The v1 scope is five structures: array, stack, queue, deque, and doubly linked list.

## Source of truth

Read these before making architectural changes:

- `docs/architecture.md` — system design and visual specification
- `docs/roadmap.md` — phased execution plan and exact commit messages
- `docs/conventions.md` — branch, commit, PR, and verification rules
- `docs/decisions.md` — accepted architecture decisions

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Framer Motion
- lucide-react

## Working rules

- Work on your personal branch: `dev/valentyn` or `dev/andriy`.
- Never commit application work directly to `main`.
- Do not merge one personal branch into the other; merge both into `main` through PRs.
- Keep each structure self-contained under `src/components/structures/<name>/`.
- Keep structure state inside its engine; do not leak it into the shell.
- Use the shared trace model for operations, stepping, logs, and complexity.
- Preserve in-memory state when switching structures by keeping panels mounted.
- Pause playback in inactive panels.
- Namespace Framer Motion `layoutId` values per structure.
- Use stable IDs for animated items and nodes.
- Respect `prefers-reduced-motion`.
- Do not add a global state library without an accepted decision in `docs/decisions.md`.

## Verification

Before every commit:

```powershell
pnpm lint
pnpm typecheck
pnpm test
```

Before phase checkpoints:

```powershell
pnpm build
```

Do not commit with failing checks.

## Commit style

Use conventional commits with a scope:

```text
feat(array): add dynamic reallocation trace
fix(stack): correct top pointer after pop
test(linked-list): cover pointer relinking
docs: update architecture notes
```

## UI direction

- Dark-mode first
- Linear/Raycast-inspired
- Near-black surfaces, subtle borders, muted typography
- Geist Sans for UI; Fira Code for values, addresses, and indices
- Violet accent, amber pointer tags, rose errors, emerald success
- Motion should feel physical and restrained

