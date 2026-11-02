# Architecture Decisions

Short decision records for choices that affect the project structure.

## ADR-001: Single-page interactive canvas

**Status:** Accepted

The first release uses one route (`/`) with all five structures available through header tabs.

**Why**

- The playground should be immediately usable on landing.
- Structure switching should be fast.
- Direct links still work through `?structure=`.
- Future standalone pages can reuse the same structure modules.

## ADR-002: Persistent mounted panels

**Status:** Accepted

All five structure views are mounted once. Inactive panels are absolutely positioned, transparent, `inert`, and `aria-hidden`.

**Why**

- Preserves each structure's state when switching tabs.
- Avoids a global store or session cache.
- Keeps each structure engine local and independently reusable.

**Trade-offs**

- Inactive panels must pause playback.
- Layout IDs must be namespaced per structure.
- The shell must avoid rendering hidden focusable content.

## ADR-003: URL synchronization without navigation

**Status:** Accepted

The active structure is stored in `?structure=` and updated with `window.history.replaceState`.

**Why**

- Direct links work.
- Browser back/forward works through Next's router integration.
- No server round-trip or full page reload.
- Operation history is not serialized into the URL.

## ADR-004: Trace-based state instead of direct mutation

**Status:** Accepted

Every operation produces immutable frames containing a state snapshot, operation metadata, complexity, and visual highlights.

**Why**

- One model powers stepping, playback, logs, and animations.
- Intermediate operations such as array shifts and pointer rewiring can be inspected.
- Engines remain deterministic and testable.

**Trade-offs**

- Trace history must be bounded.
- New operations branch from the current frame and discard future frames.

## ADR-005: No global state library

**Status:** Accepted

Structure state remains inside each structure engine.

**Why**

- Each structure is independent.
- The shell only needs the active structure ID.
- Future pages can import a structure without wiring a global store.

**Trade-offs**

- Cross-structure features would require an explicit shared abstraction later.

## ADR-006: Queue and deque complexity

**Status:** Accepted

Queue and deque operations are presented as O(1) end operations. Visual recentering after removal is presentational only.

**Why**

- These are abstract FIFO/deque structures, not naive array-shift implementations.
- The visual rail should stay compact and readable.

**Trade-offs**

- The UI must not imply that visual compaction is part of the data operation.

## ADR-007: Dark-first visual system

**Status:** Accepted

The first release is dark-mode only.

**Why**

- The target aesthetic is Linear/Raycast-inspired.
- It reduces visual and accessibility scope for v1.
- A light theme can be added later through CSS variables.

## ADR-008: Shared context through the repository

**Status:** Accepted

Team context lives in versioned project documentation rather than a shared chat session.

**Why**

- Both developers can use separate OpenCode sessions and clones.
- Decisions are reviewable in Git history.
- New contributors get the same context.
- Avoids sharing shell and filesystem access through an OpenCode server.

**Files**

- `AGENTS.md` — agent instructions
- `docs/architecture.md` — system design
- `docs/conventions.md` — branch, commit, and PR rules
- `docs/decisions.md` — this file
