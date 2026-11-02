# StructLab Architecture

StructLab is an interactive visual playground for fundamental data structures. The first release covers five structures:

- Array
- Stack
- Queue
- Deque
- Doubly linked list

The application is designed as a single-page interactive canvas with modular structure modules that can later be reused on standalone pages.

## Product constraints

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Framer Motion
- lucide-react
- Dark-mode first
- Vercel deployment
- No backend for v1

## Core architecture

### Single-page canvas

The `/` route hosts all five structure views. The active structure is selected through the header tabs and synchronized with the URL:

```text
/?structure=array
/?structure=stack
/?structure=queue
/?structure=deque
/?structure=linked-list
```

The URL update uses `window.history.replaceState`, which Next.js integrates with `useSearchParams`. This avoids a full page reload and keeps the playground interactive.

Invalid structure values fall back to `array`.

### Persistent panels

All five structure views are mounted once. Only the active panel participates in layout and accessibility:

- Active panel: visible, in flow, focusable
- Inactive panels: absolutely positioned, transparent, `pointer-events-none`, `inert`, and `aria-hidden`

This preserves each structure's state when switching tabs without introducing a global state library. Playback in inactive panels must be paused.

### Modular structure modules

Each structure is self-contained under `src/components/structures/<name>/` and exports three layers:

1. **Engine** — headless state, operations, trace generation
2. **Canvas** — pure visualization
3. **View** — full experience including controls and inspector

The top-level view files (`src/components/structures/array-view.tsx`, etc.) compose these layers. Future routes such as `/challenges` or `/cheatsheet` can import a full view or only a canvas and engine.

### Trace-based state

Every operation produces a sequence of immutable frames. A frame contains:

- The complete structure snapshot
- Operation name
- Step/phase label
- Human-readable detail
- Complexity metadata
- Visual highlights
- Feedback state (`neutral`, `success`, `warning`, `error`)

The stepper moves through frames. This gives one consistent model for:

- Step forward/back
- Play/pause
- Operation logs
- Complexity badges
- Intermediate animations
- Reset and replay

When an operation runs from an earlier frame, future frames are discarded before the new frames are appended.

## Planned folder structure

```text
src/
├─ app/
│  ├─ layout.tsx
│  ├─ page.tsx
│  └─ globals.css
├─ components/
│  ├─ ui/                         # shadcn/ui primitives
│  ├─ providers/
│  │  └─ app-providers.tsx
│  ├─ shell/
│  │  ├─ app-header.tsx
│  │  ├─ structure-tabs.tsx
│  │  ├─ structure-renderer.tsx
│  │  ├─ playground-page.tsx
│  │  └─ playground-skeleton.tsx
│  └─ structures/
│     ├─ array-view.tsx
│     ├─ stack-view.tsx
│     ├─ queue-view.tsx
│     ├─ deque-view.tsx
│     ├─ linked-list-view.tsx
│     ├─ shared/
│     │  ├─ inspector-dock.tsx
│     │  ├─ complexity-badge.tsx
│     │  ├─ playback-controls.tsx
│     │  ├─ pointer-inspector.tsx
│     │  ├─ step-log.tsx
│     │  ├─ stage-frame.tsx
│     │  └─ operation-toolbar.tsx
│     ├─ array/
│     ├─ stack/
│     ├─ queue/
│     ├─ deque/
│     └─ linked-list/
├─ hooks/
│  ├─ use-structure-route.ts
│  ├─ use-trace-player.ts
│  └─ use-keyboard-shortcuts.ts
└─ lib/
   ├─ structures/
   │  ├─ registry.ts
   │  ├─ types.ts
   │  ├─ complexity.ts
   │  └─ trace.ts
   ├─ site.ts
   └─ utils.ts
```

## Shared state types

```ts
export type StructureId = "array" | "stack" | "queue" | "deque" | "linked-list"

export type ComplexityClass = "O(1)" | "O(n)"
export type PlaybackStatus = "idle" | "playing" | "paused"
export type Speed = 0.5 | 1 | 1.5 | 2

export interface Complexity {
  time: ComplexityClass
  space: ComplexityClass
  note: string
}

export type Feedback = "neutral" | "success" | "warning" | "error"

export interface Highlight {
  target: "item" | "slot" | "node" | "edge" | "pointer"
  id: string
  role: "active" | "source" | "target" | "insert" | "remove" | "pointer"
}

export interface TraceFrame<S> {
  id: string
  state: S
  operation: string
  phase: string
  detail: string
  complexity: Complexity
  highlights: Highlight[]
  feedback: Feedback
}

export interface Trace<S> {
  frames: TraceFrame<S>[]
  cursor: number
}
```

The trace player owns playback status, speed, cursor movement, reset, and automatic pause when a panel becomes inactive.

## Structure models

### Array

- Items are stored in visual order with stable IDs
- `capacity` may exceed `items.length`
- Static mode uses a fixed capacity
- Dynamic mode doubles capacity on overflow
- Random access is O(1)
- Insert/remove and reallocation are O(n)
- Space is O(n)

### Stack

- LIFO chamber
- Top is derived from `items.length - 1`
- Overflow when full
- Underflow when empty
- Push/pop/peek are O(1)
- Space is O(n)

### Queue

- FIFO horizontal pipeline
- Head is the first item; tail is the last item
- Enqueue/dequeue are O(1) conceptually
- Rail recentering is presentational and must not be described as element shifting
- Space is O(n)

### Deque

- Double-ended pipeline
- Front is the first item; back is the last item
- Push/pop at both ends are O(1)
- Space is O(n)

### Doubly linked list

Each node contains:

- Stable ID
- Value
- Pseudo-memory address
- `prevId`
- `nextId`

The list also tracks:

- Visual order
- Head and tail
- Next address counter
- Derived integrity state (`ok`, `broken`, or `cycle`)

Complexity:

- Prepend/append: O(1)
- Insert/remove at a known node: O(1)
- Search/traversal: O(n)
- Space: O(n)

## Visual system

- Background: `#08090A`
- Panels: `#0E0F11`
- Borders: `#1F2023`
- Text: `#EDEDEF`
- Muted text: `#8A8F98`
- Accent: violet `#A78BFA`
- Pointer tags: amber `#FBBF24`
- Error/removal: rose `#FB7185`
- Success: emerald `#34D399`
- UI font: Geist Sans
- Data font: Fira Code
- Radius: 12–16px
- Motion: spring transitions, 160–320ms
- Reduced motion: opacity-only transitions

## Inspector dock

Desktop layout uses a right-side inspector. Mobile uses a full-width panel below the canvas with sticky playback controls.

Sections:

1. Current operation and step
2. Time/space complexity
3. Pointer/state inspector
4. Step log
5. Playback controls

## Animation strategy

- Stable IDs drive Framer `layout` animations
- `AnimatePresence` handles insertion/removal
- `layoutId` values are namespaced per structure
- DLL SVG links are measured from DOM node rectangles
- DLL link paths are recomputed during layout transitions
- New links draw with `pathLength`
- Removed links retract with `pathLength: 0`
- Hidden panels pause playback and do not run animation loops

## Accessibility

- Tabs use `role="tablist"` and arrow-key navigation
- Inactive panels are `inert` and `aria-hidden`
- Current step changes are announced with `aria-live="polite"`
- Icon-only buttons have accessible labels and tooltips
- Color is never the only status indicator
- `prefers-reduced-motion` is respected

## Quality gates

Before committing:

```powershell
pnpm lint
pnpm typecheck
pnpm test
```

Before phase checkpoints and releases:

```powershell
pnpm build
```

## Deployment

The app is designed for Vercel with no environment variables for v1.

- Framework preset: Next.js
- Install command: `pnpm install --frozen-lockfile`
- Build command: `pnpm build`
- Node version: 22.x
