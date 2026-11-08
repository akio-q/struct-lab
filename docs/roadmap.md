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

- [x] Structure IDs and metadata
- [x] Complexity types
- [x] Trace types
- [x] Structure registry

Commit:

```text
feat(shell): add structure registry and shared playground types
```

### 1.2 URL synchronization

- [x] Read and validate `?structure=`
- [x] Fallback to `array`
- [x] Update with `window.history.replaceState`
- [x] Support back/forward navigation

Commit:

```text
feat(shell): sync active structure with URL search params
```

### 1.3 Header and tabs

- [x] Brand header
- [x] Accessible structure tabs
- [x] Animated active tab pill
- [x] Keyboard navigation

Commit:

```text
feat(shell): add header and animated structure tabs
```

### 1.4 Playground shell

- [x] Persistent mounted panels
- [x] Inactive panels `inert` and `aria-hidden`
- [x] Active panel rendering
- [x] Suspense boundary
- [x] Responsive page frame

Commit:

```text
feat(shell): compose single-page playground shell
```

### 1.5 Inspector primitives

- [x] Complexity badge
- [x] Pointer inspector
- [x] Step log
- [x] Playback controls shell
- [x] Stage frame

Commit:

```text
feat(inspector): add shared complexity, pointer, and step-log dock primitives
```

### 1.6 Trace engine

- [x] Immutable frame history
- [x] Step forward/back
- [x] Branch truncation
- [x] Reset
- [x] Active-panel pause behavior

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

- [x] Static mode
- [x] Dynamic mode
- [x] Capacity doubling
- [x] Access, insert, remove, append, pop, clear
- [x] Engine tests

Commit:

```text
feat(array): add trace engine for static and dynamic arrays
```

### 2.2 Array canvas

- [x] Index strip
- [x] Capacity frame
- [x] Empty slots
- [x] Shift animations
- [x] Reallocation animation

Commit:

```text
feat(array): add capacity, index, and shifting visualizer
```

### 2.3 Array integration

- [x] Operation controls
- [x] Complexity badges
- [x] Inspector state
- [x] Empty state

Commit:

```text
feat(array): wire array controls, complexity, and inspector
```

### 2.4 Stack engine

- [x] Push, pop, peek, clear
- [x] Overflow and underflow states
- [x] Engine tests

Commit:

```text
feat(stack): add LIFO engine with overflow and underflow states
```

### 2.5 Stack canvas

- [x] Vertical chamber
- [x] Top pointer
- [x] Push/pop animations
- [x] Overflow/underflow visuals

Commit:

```text
feat(stack): add vertical chamber with push/pop animations
```

### 2.6 Stack integration

- [x] Controls
- [x] Pointer inspector
- [x] Complexity badges
- [x] Empty state

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

- [x] Enqueue, dequeue, peek, clear
- [x] Head/tail derivation
- [x] Overflow and underflow
- [x] Engine tests

Commit:

```text
feat(queue): add FIFO trace engine with front and rear pointers
```

### 3.2 Queue canvas

- [x] Horizontal conveyor
- [x] Head/tail tags
- [x] Enqueue/dequeue animations
- [x] Empty state

Commit:

```text
feat(queue): add horizontal conveyor with enqueue and dequeue animations
```

### 3.3 Queue integration

- [x] Controls
- [x] Inspector
- [x] Complexity badges

Commit:

```text
feat(queue): wire queue controls and inspector
```

### 3.4 Deque engine

- [x] Push/pop front
- [x] Push/pop back
- [x] Engine tests

Commit:

```text
feat(deque): add bidirectional trace engine for both ends
```

### 3.5 Deque canvas

- [x] Symmetric pipeline
- [x] Front/back pointers
- [x] Both-end animations
- [x] Empty state

Commit:

```text
feat(deque): add symmetric double-ended pipeline visualizer
```

### 3.6 Deque integration

- [x] Controls
- [x] Inspector
- [x] Complexity badges

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

- [x] Nodes with values and addresses
- [x] `prev` and `next` links
- [x] Head/tail
- [x] Integrity checks
- [x] Cycle detection
- [x] Engine tests

Commit:

```text
feat(linked-list): add doubly linked list model with pointer integrity checks
```

### 4.2 SVG links

- [x] Node layout measurement
- [x] Bidirectional SVG paths
- [x] Arrowheads
- [x] Draw-in and retract animations
- [x] Layout transition measurement

Commit:

```text
feat(linked-list): render animated bidirectional SVG pointer links
```

### 4.3 Node operations

- [x] Prepend
- [x] Append
- [x] Insert after/before
- [x] Remove
- [x] Traversal

Commit:

```text
feat(linked-list): add insertion, removal, and traversal animations
```

### 4.4 Pointer surgery

- [x] Detach pointer
- [x] Relink pointer
- [x] Integrity warning
- [x] Repair links

Commit:

```text
feat(linked-list): add interactive pointer detachment and relinking
```

### 4.5 Integration

- [x] Address display
- [x] Inspector
- [x] Playback
- [x] Empty state

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

- [x] Autoplay
- [x] Speed control
- [x] Keyboard shortcuts
- [x] Reset behavior

Commit:

```text
feat(playback): add autoplay, speed control, and keyboard shortcuts
```

### 5.2 Accessibility

- [x] Focus management
- [x] ARIA live step announcements
- [x] Reduced-motion behavior
- [x] Screen-reader labels

Commit:

```text
feat(a11y): add keyboard navigation and reduced-motion support
```

### 5.3 Responsive polish

- [x] Mobile inspector
- [x] Touch targets
- [x] Canvas overflow behavior
- [x] 360/768/1024/1440 checks

Commit:

```text
style: polish responsive canvas and mobile inspector
```

### 5.4 End-to-end tests

- [x] URL sync
- [x] Tab switching
- [x] Core operations
- [x] Stepper controls
- [x] Mobile smoke test

Commit:

```text
test(e2e): cover URL sync, tab switching, and core operations
```

### 5.5 Performance

- [x] LazyMotion
- [x] Memoized canvases
- [x] Stable selectors
- [x] Bundle review

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
