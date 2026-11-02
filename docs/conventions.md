# Collaboration Conventions

## Branches

`main` is the integration branch. Do not commit application work directly to `main`.

Personal development branches:

- `dev/valentyn`
- `dev/andriy`

Both branches are long-lived personal branches. Feature work should stay on the owner's branch unless a separate topic branch is useful.

Before starting work, sync with `main`:

```powershell
git fetch origin
git merge origin/main
```

Do not merge one personal branch directly into the other. Both branches land in `main` through pull requests.

## Pull requests

- Open a PR into `main` when a milestone or feature is ready.
- Keep PRs focused on one logical change.
- Include a short summary, testing notes, and screenshots or recordings for visual changes.
- Resolve review conversations before merging.
- Prefer **merge commits** to preserve the personal branch history; do not squash.

Recommended branch protection for `main`:

- Require a pull request before merging
- Require one approval
- Dismiss stale approvals when new commits are pushed
- Require conversation resolution
- Restrict deletions
- Block force pushes

Add required status checks after CI exists.

## Commits

Use conventional commit messages:

```text
feat(array): add dynamic reallocation trace
fix(stack): correct top pointer after pop
style(shell): refine tab focus ring
refactor(engine): extract shared trace helpers
test(linked-list): cover pointer relinking
docs: document branch workflow
chore: initialize shadcn/ui
ci: add lint and build workflow
perf(inspector): memoize step log rendering
```

Scopes:

- `shell`
- `engine`
- `inspector`
- `array`
- `stack`
- `queue`
- `deque`
- `linked-list`
- `playback`
- `a11y`
- `ui`
- `deploy`

Rules:

- One logical change per commit.
- Do not commit generated build output.
- Do not commit secrets or local environment files.
- Commit messages should describe the change, not the process.

## Verification

Before every commit:

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm format:check
```

Before a phase checkpoint or release:

```powershell
pnpm test:e2e
pnpm build
```

A commit should not be created with a failing lint, typecheck, test, or build.

## UI/UX review

Every UI change must be checked against the shared `web-design-guidelines` skill:

- Skill: `.agents/skills/web-design-guidelines/SKILL.md`
- Latest rules: https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md

Load the skill before writing UI and re-run the review before committing. Apply it to every UI change, not only at phase checkpoints.

## Phase checkpoints

Tag completed phases:

```powershell
git tag -a phase-0 -m "Phase 0: foundation"
git push origin main --tags
```

Tags are created after the phase has landed in `main`.

## Code organization

- Each data structure is self-contained under `src/components/structures/<name>/`.
- Shared visualization primitives live in `src/components/structures/shared/`.
- Shared trace and complexity types live in `src/lib/structures/`.
- Structure-specific state must not leak into the shell.
- The shell should only select and render the active structure.
- New pages should import existing structure views or canvases instead of duplicating logic.
- Keep engine logic pure and testable where possible.
- Use stable IDs for animated items and nodes.
- Namespace Framer Motion `layoutId` values per structure.

## Documentation

- Update `docs/architecture.md` when architecture changes.
- Record important decisions in `docs/decisions.md`.
- Keep `README.md` focused on setup and project overview.
- Include screenshots or short recordings in PRs for UI changes.

## Environment

- Node.js 22.x
- pnpm 11.x
- Windows, macOS, and Linux should all work
- No environment variables are required for v1
