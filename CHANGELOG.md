# Changelog

All notable changes to StructLab are documented here. This project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-11-09

First release: five data structures in one interactive canvas.

### Added

- **Single-page shell** with header tabs, keyboard navigation, and `?structure=` deep links. Every panel stays mounted so each structure keeps its state, and inactive panels pause playback.
- **Array** visualizer with append, insert, and remove, capacity tracking, and a reallocation trace.
- **Stack** visualizer with push and pop, a top pointer, and depth tracking.
- **Queue** visualizer with enqueue and dequeue, head and tail pointers, and capacity tracking.
- **Deque** visualizer with push and pop at both ends and front and back pointers.
- **Doubly linked list** visualizer with prepend, append, insert, remove, and traversal, plus address labels, bidirectional SVG pointer links, and pointer detach, relink, and repair.
- **Trace engine** with immutable frames, stepping, autoplay, speed control, reset, step log, and complexity badges shared by every structure.
- **Inspector** with structure-specific metadata, pointer details, and integrity status.
- **Playback controls** with keyboard shortcuts for stepping and play or pause.
- **Accessibility**: tablist semantics, inert inactive panels, a skip link, polite live step announcements, labelled canvas regions, and `prefers-reduced-motion` support.
- **Responsive layout** with a mobile playback dock and scrollable canvases checked at 360, 768, 1024, and 1440 pixels.
- **Test suites** covering 374 Vitest unit tests and 12 Playwright end-to-end tests.
- **CI quality gate** on GitHub Actions covering lint, typecheck, unit tests, formatting, and build.
- **Documentation** for architecture, roadmap, conventions, decisions, contributing, and deployment.

### Performance

- Framer Motion features load lazily through `LazyMotion` in strict mode.
- Canvases are memoized and trace-heavy callbacks are stabilized.
- Critical-path JavaScript for `/` dropped from 737.5 KB to 647.9 KB, and the largest client chunk from 292.1 KB to 171.9 KB.

### Tooling

- Next.js App Router, React 19, TypeScript strict mode, Tailwind CSS 4, shadcn/ui, Framer Motion, and lucide-react.
- ESLint with zero warnings allowed, Prettier with the Tailwind plugin, Vitest with jsdom, and Playwright for end-to-end coverage.

[Unreleased]: https://github.com/akio-q/struct-lab/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/akio-q/struct-lab/releases/tag/v1.0.0
