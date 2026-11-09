# Contributing

This guide covers local setup, the change workflow, and the checks a pull request must pass. Branch, commit, and review rules live in [Collaboration conventions](conventions.md); this page is the practical walkthrough.

## Prerequisites

- Node.js 22.x
- pnpm 11.x (`corepack enable pnpm` if pnpm is not installed)
- Git

Playwright browsers are separate from `pnpm install`. Install them once:

```powershell
pnpm exec playwright install
```

## Quick start

```powershell
git clone https://github.com/akio-q/struct-lab.git
cd struct-lab
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). No environment variables are required for v1.

## Before you change code

Read the documents that describe the system:

- [Architecture](architecture.md) — shell, trace engine, structure modules, visual language
- [Roadmap](roadmap.md) — phase scope and the expected commit for each step
- [Decisions](decisions.md) — accepted architecture decisions; do not contradict them silently
- [Collaboration conventions](conventions.md) — branches, commits, PRs, and gates

## Workflow

1. Sync your personal branch with `main`:

   ```powershell
   git fetch origin
   git switch dev/valentyn
   git merge origin/main
   ```

2. Make one focused change. Keep structure work inside `src/components/structures/<name>/`.
3. Add or update tests alongside the change.
4. Run the quality gates.
5. Commit with a conventional message, for example `feat(queue): add circular wrap-around highlight`.
6. Push and open a pull request into `main`.
7. Wait for the **Quality gate** check and review, then merge with a merge commit.

Never commit application work directly to `main`, and never merge one personal branch into the other.

## Quality gates

Before every commit:

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm format:check
```

Before a phase checkpoint or a release:

```powershell
pnpm test:e2e
pnpm build
```

A commit should not exist with a failing lint, typecheck, test, or build. Run `pnpm format` to apply Prettier instead of fixing formatting by hand.

## Where code goes

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

Rules that keep modules independent:

- Shared trace and complexity types live in `src/lib/structures/`.
- Shared visualization primitives live in `src/components/structures/shared/`.
- Structure state stays inside the structure engine; it must not leak into the shell.
- Every panel stays mounted; inactive panels are `inert`, `aria-hidden`, and paused.
- Use stable IDs for animated items and nodes, and namespace Framer Motion `layoutId` values per structure.
- Do not add a global state library without an accepted decision in [Decisions](decisions.md).

## Testing expectations

- **Unit tests (Vitest):** engines, trace stepping, and pure helpers. Add a case for each new operation or branch in engine logic.
- **Component tests:** shared primitives and controls when behavior is not already covered.
- **End-to-end tests (Playwright):** user-visible flows such as tab switching, URL sync, operation controls, and the mobile layout. Add one when a change alters a flow the suite already covers.

If a dev server is already running on port 3000, Playwright reuses it instead of starting its own. Stop it first when you want the suite to run against a freshly started server.

## UI changes

Every user-facing change is reviewed against the shared web interface guidelines:

- Skill: `.agents/skills/web-design-guidelines/SKILL.md`
- Rules: https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md

Check, at minimum:

- Keyboard reachability and visible focus for every interactive element.
- Accessible names for icon-only controls and canvas regions.
- `prefers-reduced-motion` behavior for new animation.
- Contrast and non-color status cues.
- Layout at 360, 768, 1024, and 1440 pixels wide.
- No layout shift or overlap in the playback dock on small screens.

Include a screenshot or short recording in the pull request for visual changes.

## Pull request checklist

- [ ] The change matches the roadmap step or has a clear rationale.
- [ ] Lint, typecheck, unit tests, and formatting pass locally.
- [ ] New behavior has unit coverage, and affected flows have end-to-end coverage.
- [ ] `pnpm build` succeeds for phase-level work.
- [ ] Documentation is updated when behavior or structure changes.
- [ ] Visual changes include a screenshot or recording and pass the UI review.
- [ ] The **Quality gate** check is green.

## Adding a structure

The v1 scope is fixed at array, stack, queue, deque, and doubly linked list. A new structure would need an accepted decision record first. If one is approved:

1. Add engine and trace logic and its tests.
2. Build the canvas from shared primitives and namespaced motion IDs.
3. Register the structure in the shared registry and the shell tabs.
4. Add controls, inspector wiring, complexity badges, and an empty state.
5. Extend end-to-end coverage and update the architecture and roadmap.

## Questions and decisions

Discuss a direction in an issue or pull request before implementing it. Record anything that changes the architecture in [Decisions](decisions.md) as a short ADR with status, rationale, and trade-offs.
