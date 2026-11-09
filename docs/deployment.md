# Deployment

StructLab is a single-route Next.js App Router application. `/` is prerendered as static content, so a deployment only needs a Next.js build and no runtime services, database, or secrets.

## Target

Vercel is the reference host. The repository contains no `vercel.json`; the defaults below are all the configuration the project needs.

| Setting         | Value                            |
| --------------- | -------------------------------- |
| Framework       | Next.js                          |
| Install command | `pnpm install --frozen-lockfile` |
| Build command   | `pnpm build`                     |
| Output          | Next.js default (`.next`)        |
| Node.js         | 22.x                             |
| Environment     | none for v1                      |

`package.json` pins `packageManager` to `pnpm@11.14.0`, so Corepack resolves the same pnpm version locally, in CI, and on Vercel.

## First-time Vercel setup

1. Sign in to Vercel and choose **Add New → Project**.
2. Import the `akio-q/struct-lab` GitHub repository.
3. Keep the detected framework preset **Next.js**.
4. Confirm **Root Directory** is the repository root.
5. Expand **Build & Output Settings** and set the install command to `pnpm install --frozen-lockfile` and the build command to `pnpm build`.
6. Confirm **Node.js Version** is 22.x.
7. Do not add environment variables. `.env.example` documents that v1 needs none.
8. Deploy.

Vercel creates a production deployment from `main` and a preview deployment for every other branch and pull request.

## Environment variables

None are required. If a local-only override is ever needed, copy `.env.example` to `.env.local`; that file is gitignored and must not be committed.

When a variable becomes necessary, add it in **Project → Settings → Environment Variables** for the relevant environments (Production, Preview, Development) and document it in this file and in `.env.example`.

## Continuous integration and deployment

The two systems have separate jobs:

- **GitHub Actions** (`.github/workflows/ci.yml`) runs the **Quality gate** on every pull request and push to `main`: lint, typecheck, unit tests, formatting, and a production build. It never deploys.
- **Vercel** builds and hosts the result of each branch.

Keep both green. CI is the required branch protection check; Vercel preview failures are visible on the pull request but do not replace the quality gate.

## Preview deployments

Each pull request gets its own URL. Use it to review visual and interaction changes, and include the link in PR notes when a change is layout-heavy.

Preview deployments run against the same code as the branch, so they are the fastest way to check a fix on a phone-sized viewport before merging.

## Production deployment

Merging to `main` triggers a production deployment. After it finishes:

1. Open `/` and confirm the canvas renders all five tabs.
2. Run one operation per structure as a smoke test.
3. Confirm `?structure=linked-list` deep links resolve.
4. Check the browser console for hydration errors.

Playwright does not run on Vercel; the end-to-end suite remains a local phase-checkpoint gate. For a local production check:

```powershell
pnpm build
pnpm start
```

## Rollback

Use **Deployments → … → Instant Rollback** to point production at a previous successful deployment. Rollback is a hosting action only; it does not change `main`. Follow up with a revert commit on `main` so the repository and the deployed code agree.

## Caching and rendering

- `/` is statically prerendered at build time.
- The active structure is read from `?structure=` on the client and written with `history.replaceState`; no request-time rendering is involved.
- Trace state lives in memory only and is intentionally not persisted or shared.
- No image optimization, edge functions, or API routes are configured.

## Custom domain

1. Add the domain in **Project → Settings → Domains**.
2. Apply the DNS records Vercel shows (apex `A`/`ALIAS`, `www` `CNAME`).
3. Wait for verification and certificate issuance.

Update the repository links if the canonical URL changes.

## Troubleshooting

| Symptom                                   | Cause and fix                                                                                                 |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Build fails on pnpm version               | `packageManager` and the lockfile disagree; run `pnpm install` locally and commit the lockfile                |
| `Cannot find name 'LayoutProps'`          | Route types are missing; `pnpm typecheck` runs `next typegen` first, so use that script instead of bare `tsc` |
| Build fails on TypeScript                 | Fix locally with `pnpm typecheck`; Vercel does not bypass type errors                                         |
| Preview looks stale                       | Confirm the latest commit is deployed; redeploy from **Deployments**                                          |
| Fonts or motion behave differently online | Check for reduced-motion preferences and blocked requests in the browser                                      |

## Related documentation

- [Architecture](architecture.md) — system design and visual specification
- [Collaboration conventions](conventions.md) — branches, commits, and quality gates
- [Contributing](contributing.md) — local setup and pull request flow
