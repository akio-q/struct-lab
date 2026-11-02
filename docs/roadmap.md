# StructLab Roadmap

This roadmap is the shared execution plan for both developers and their OpenCode agents.

## Status legend

- `[x]` complete
- `[ ]` not started
- `[~]` in progress

## Working agreement

- Work on your personal branch: `dev/valentyn` or `dev/andriy`.
- Never commit application work directly to `main`.
- Sync with `main` before starting a phase.
- Only one person should work on a phase that touches shared files such as `globals.css`, `layout.tsx`, or the shell.
- Before every commit:
  ```powershell
  pnpm lint
  pnpm exec tsc --noEmit
  pnpm test
  ```
- Before phase checkpoints:
  ```powershell
  pnpm build
  ```
- Merge personal branches into `main` with **Create a merge commit**, not squash.
- Do not delete personal branches after merging.

## Phase 0 — Foundation

### 0.1 Scaffold

- [x] Next.js App Router, TypeScript, Tailwind, ESLint
- [x] Git repository connected to GitHub
- [x] Personal branches created

Commit:

```text
chore: scaffold Next.js app with TypeScript and Tailwind
```

### 0.2 UI dependencies

- [x] Framer Motion
- [x] Lucide
- [x] shadcn/ui with Radix Nova preset
- [x] Shared UI primitives

Commit:

```text
chore(ui): initialize shadcn/ui and motion dependencies
```

### 0.3 Design foundation

- [x] Dark-first design tokens
- [x] Geist Sans for UI
- [x] Fira Code for values, addresses, and indices
- [x] StructLab metadata
- [x] Base html/body styling

Commit:

```text
style: add dark-first tokens and Geist/Fira Code typography
```

### 0.4 Tooling

- [x] Prettier and Tailwind class sorting
- [x] Vitest setup
- [x] Playwright setup
- [x] Package scripts for lint, typecheck, test, and build
- [x] `.gitignore` review

Commit:

```text
chore: add formatting, testing, and repository hygiene
```

### 0.5 Documentation baseline

- [x] Finalize README
- [x] Add `.env.example`
- [x] Add site configuration
- [x] Document local setup

Commit:

```text
docs: add project readme and environment template
```

Checkpoint:

```powershell
pnpm lint
pnpm exec tsc --noEmit
pnpm test
pnpm build
git tag -a phase-0 -m "Phase 0: foundation"
git push origin main --tags
```

## Phase 1 — Single-page shell

### 1.1 Shared types and registry

- [ ] Structure IDs and metadata
- [ ] Complexity types
- [ ] Trace types
- [ ] Structure registry

Commit:

```text
feat(shell): add structure registry and shared playground types
```

### 1.2 URL synchronization

- [ ] Read and validate `?structure=`
- [ ] Fallback to `array`
- [ ] Update with `window.history.replaceState`
- [ ] Support back/forward navigation

Commit:

```text
feat(shell): sync active structure with URL search params
```

### 1.3 Header and tabs

- [ ] Brand header
- [ ] Accessible structure tabs
- [ ] Animated active tab pill
- [ ] Keyboard navigation

Commit:

```text
feat(shell): add header and animated structure tabs
```

### 1.4 Playground shell

- [ ] Persistent mounted panels
- [ ] Inactive panels `inert` and `aria-hidden`
- [ ] Active panel rendering
- [ ] Suspense boundary
- [ ] Responsive page frame

Commit:

```text
feat(shell): compose single-page playground shell
```

### 1.5 Inspector primitives

- [ ] Complexity badge
- [ ] Pointer inspector
- [ ] Step log
- [ ] Playback controls shell
- [ ] Stage frame

Commit:

```text
feat(inspector): add shared complexity, pointer, and step-log dock primitives
```

### 1.6 Trace engine

- [ ] Immutable frame history
- [ ] Step forward/back
- [ ] Branch truncation
- [ ] Reset
- [ ] Active-panel pause behavior

Commit:

```text
feat(engine): add generic trace history and stepper primitives
```

Checkpoint:

```powershell
git tag -a phase-1 -m "Phase 1: single-page shell"
git push origin main --tags
```

## Phase 2 — Array and stack

### 2.1 Array engine

- [ ] Static mode
- [ ] Dynamic mode
- [ ] Capacity doubling
- [ ] Access, insert, remove, append, pop, clear
- [ ] Engine tests

Commit:

```text
feat(array): add trace engine for static and dynamic arrays
```

### 2.2 Array canvas

- [ ] Index strip
- [ ] Capacity frame
- [ ] Empty slots
- [ ] Shift animations
- [ ] Reallocation animation

Commit:

```text
feat(array): add capacity, index, and shifting visualizer
```

### 2.3 Array integration

- [ ] Operation controls
- [ ] Complexity badges
- [ ] Inspector state
- [ ] Empty state

Commit:

```text
feat(array): wire array controls, complexity, and inspector
```

### 2.4 Stack engine

- [ ] Push, pop, peek, clear
- [ ] Overflow and underflow states
- [ ] Engine tests

Commit:

```text
feat(stack): add LIFO engine with overflow and underflow states
```

### 2.5 Stack canvas

- [ ] Vertical chamber
- [ ] Top pointer
- [ ] Push/pop animations
- [ ] Overflow/underflow visuals

Commit:

```text
feat(stack): add vertical chamber with push/pop animations
```

### 2.6 Stack integration

- [ ] Controls
- [ ] Pointer inspector
- [ ] Complexity badges
- [ ] Empty state

Commit:

```text
feat(stack): wire stack controls and pointer inspector
```

Checkpoint:

```powershell
git tag -a phase-2 -m "Phase 2: array and stack"
git push origin main --tags
```

## Phase 3 — Queue and deque

### 3.1 Queue engine

- [ ] Enqueue, dequeue, peek, clear
- [ ] Head/tail derivation
- [ ] Overflow and underflow
- [ ] Engine tests

Commit:

```text
feat(queue): add FIFO trace engine with front and rear pointers
```

### 3.2 Queue canvas

- [ ] Horizontal conveyor
- [ ] Head/tail tags
- [ ] Enqueue/dequeue animations
- [ ] Empty state

Commit:

```text
feat(queue): add horizontal conveyor with enqueue and dequeue animations
```

### 3.3 Queue integration

- [ ] Controls
- [ ] Inspector
- [ ] Complexity badges

Commit:

```text
feat(queue): wire queue controls and inspector
```

### 3.4 Deque engine

- [ ] Push/pop front
- [ ] Push/pop back
- [ ] Engine tests

Commit:

```text
feat(deque): add bidirectional trace engine for both ends
```

### 3.5 Deque canvas

- [ ] Symmetric pipeline
- [ ] Front/back pointers
- [ ] Both-end animations
- [ ] Empty state

Commit:

```text
feat(deque): add symmetric double-ended pipeline visualizer
```

### 3.6 Deque integration

- [ ] Controls
- [ ] Inspector
- [ ] Complexity badges

Commit:

```text
feat(deque): wire deque controls and inspector
```

Checkpoint:

```powershell
git tag -a phase-3 -m "Phase 3: queue and deque"
git push origin main --tags
```

## Phase 4 — Doubly linked list

### 4.1 Model and integrity

- [ ] Nodes with values and addresses
- [ ] `prev` and `next` links
- [ ] Head/tail
- [ ] Integrity checks
- [ ] Cycle detection
- [ ] Engine tests

Commit:

```text
feat(linked-list): add doubly linked list model with pointer integrity checks
```

### 4.2 SVG links

- [ ] Node layout measurement
- [ ] Bidirectional SVG paths
- [ ] Arrowheads
- [ ] Draw-in and retract animations
- [ ] Layout transition measurement

Commit:

```text
feat(linked-list): render animated bidirectional SVG pointer links
```

### 4.3 Node operations

- [ ] Prepend
- [ ] Append
- [ ] Insert after/before
- [ ] Remove
- [ ] Traversal

Commit:

```text
feat(linked-list): add insertion, removal, and traversal animations
```

### 4.4 Pointer surgery

- [ ] Detach pointer
- [ ] Relink pointer
- [ ] Integrity warning
- [ ] Repair links

Commit:

```text
feat(linked-list): add interactive pointer detachment and relinking
```

### 4.5 Integration

- [ ] Address display
- [ ] Inspector
- [ ] Playback
- [ ] Empty state

Commit:

```text
feat(linked-list): wire addresses, inspector, and playback
```

Checkpoint:

```powershell
git tag -a phase-4 -m "Phase 4: doubly linked list"
git push origin main --tags
```

## Phase 5 — Playback, polish, and release

### 5.1 Playback

- [ ] Autoplay
- [ ] Speed control
- [ ] Keyboard shortcuts
- [ ] Reset behavior

Commit:

```text
feat(playback): add autoplay, speed control, and keyboard shortcuts
```

### 5.2 Accessibility

- [ ] Focus management
- [ ] ARIA live step announcements
- [ ] Reduced-motion behavior
- [ ] Screen-reader labels

Commit:

```text
feat(a11y): add keyboard navigation and reduced-motion support
```

### 5.3 Responsive polish

- [ ] Mobile inspector
- [ ] Touch targets
- [ ] Canvas overflow behavior
- [ ] 360/768/1024/1440 checks

Commit:

```text
style: polish responsive canvas and mobile inspector
```

### 5.4 End-to-end tests

- [ ] URL sync
- [ ] Tab switching
- [ ] Core operations
- [ ] Stepper controls
- [ ] Mobile smoke test

Commit:

```text
test(e2e): cover URL sync, tab switching, and core operations
```

### 5.5 Performance

- [ ] LazyMotion
- [ ] Memoized canvases
- [ ] Stable selectors
- [ ] Bundle review

Commit:

```text
perf: lazy-load motion features and memoize trace rendering
```

### 5.6 CI

- [ ] GitHub Actions
- [ ] Lint, typecheck, test, build
- [ ] Branch protection status checks

Commit:

```text
ci: add lint, typecheck, test, and build quality gate
```

### 5.7 Deployment docs

- [ ] Vercel setup
- [ ] Contribution guide
- [ ] Deployment notes

Commit:

```text
docs: add deployment and contribution guide
```

### 5.8 Release

- [ ] Final QA
- [ ] Version metadata
- [ ] Release notes

Commit:

```text
chore: prepare v1.0.0 release
```

Checkpoint:

```powershell
pnpm lint
pnpm exec tsc --noEmit
pnpm test
pnpm test:e2e
pnpm build
git tag -a v1.0.0 -m "StructLab v1.0.0"
git push origin main --tags
```

## Deferred

- User accounts
- Saved custom structures
- Light theme
- Trace sharing via URL
- Challenge mode
- Backend or API layer
- Image export
