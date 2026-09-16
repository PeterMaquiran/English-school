<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Agent instructions — web (Next.js)

Generate code that matches this repo. Prefer copying an existing feature over inventing a new layout.

This is **Next.js App Router** (not Vite, not React Router, not the Pages Router). Package manager is **pnpm**. The NestJS API lives in `apps/api` and listens on **3001**.

**Canonical layout:** this file.  
**Cursor rules:** `.cursor/rules/nextjs-web-source-layout.mdc`  
**API layout:** `apps/api/AGENTS.md` (resource names and auth match the backend).

When the first real feature lands, move the current package-root `app/` into `src/app/` and point the `@/` alias at `src/`. Do not keep growing files at `apps/web/app/` once `src/` exists.

## Non-negotiables

1. **Layers stay separate.** `src/app` is routing only (layouts, `page.tsx`, `loading.tsx`, `error.tsx`, metadata). `src/components` renders UI and calls hooks. `src/module` owns API types, repositories, use-cases, and client hooks. `src/infra` owns HTTP. `src/utils` is shared pure helpers. Do not collapse these.
2. **One HTTP verb = one repository method.** Multi-step flows belong in `use-case/`, not in components, pages, or repositories.
3. **API results are `Result<ApiSuccess<T>, ApiError>` (neverthrow).** Check `isErr()` and return/propagate. Do not `try/catch` fetch. Surface errors in UI with `getApiErrorMessage`.
4. **Pages are thin.** A `page.tsx` composes components and calls a use-case (Server Component) or a hook (Client Component). No inline `fetch`, no DTO mapping in JSX.
5. **`'use client'` is opt-in.** Default to Server Components. Add `'use client'` only for event handlers, browser APIs, or client hooks. Do not mark a whole route tree client unless required.
6. **Do not re-implement the Nest API in Next.** No `src/app/api/**` route handlers that proxy CRUD unless there is a real BFF need (httpOnly cookies, image/auth bridging). Call `apps/api` through `src/infra/http`.
7. **Path alias `@/`** → `src/`. Do not use deep relative imports across layers (`../../../infra`).
8. **Copy the nearest sibling.** New REST resource → look at an existing `src/module/{entity}`. New screen → look at an existing `src/app/{route}/page.tsx`. New client hook → look at `src/module/{entity}/hooks`.

## `src/` tree

```
src/
  app/                    # App Router: route segments only
  components/             # shared and feature UI (no fetch)
  module/                 # per-entity API + orchestration
  infra/                  # HTTP client (and only I/O adapters)
  utils/                  # pure helpers
```

```
src/app/
  layout.tsx              # root html/body, fonts, providers if needed
  page.tsx                # /
  globals.css
  {segment}/
    page.tsx              # the route
    layout.tsx            # optional nested layout
    loading.tsx           # optional
    error.tsx             # optional
```

Route-only files stay in `app/`. Visual building blocks go in `src/components`, not in a parallel `pages/` or `routes/` folder (that was the Vite app).

## Where new code goes

| Kind of change | Put it here |
| -------------- | ----------- |
| REST resource | `src/module/{entity}/data/{entity}.repository.ts` + `dtos.ts` |
| Wired singleton | `src/module/{entity}/{entity}-module.ts` (`new XRepository(apiClient)`) |
| Barrel | `src/module/{entity}/index.ts` and `src/module/{entity}/data/index.ts` |
| Multi-step or validated write | `src/module/{entity}/use-case/{kebab-name}.ts` |
| Client data hook | `src/module/{entity}/hooks/use-{kebab-name}.ts` (`'use client'` if it uses React state) |
| Route (URL) | `src/app/{segment}/page.tsx` (+ `layout.tsx` when the segment needs a shell) |
| Feature UI | `src/components/{entity}/` — PascalCase component files |
| Shared helper | `src/utils/` |
| HTTP client | `src/infra/http/` only |
| Env / API base URL | `src/infra/http` + `NEXT_PUBLIC_API_URL` (Nest on port 3001) |
| Server Action (thin) | next to the use-case or `src/module/{entity}/actions/` — must only call a use-case |
| Integration test | `src/test/{kebab-name}.test.ts` |
| Playwright | `e2e/*.spec.ts` + `e2e/helpers.ts` |

Do not add empty placeholder packages (`src/core`, `src/libs`, fake `database` / `socket` folders). Create a layer when the first real file needs it.

Planned entities follow the API: `auth`, `users`, `profile`, `categories`, `tags`, `articles`, `images`, `comments`, `bookmarks`, `sections`, `video`.

## Feature modules (`src/module/<entity>/`)

```
module/<entity>/
  <entity>-module.ts      # wires repository with apiClient
  index.ts
  data/
    <entity>.repository.ts
    dtos.ts
    index.ts
  use-case/               # optional; kebab-case files
  hooks/                  # optional; client hooks only
```

Typical wiring:

```typescript
import { apiClient } from "@/infra/http";
import { ArticlesRepository } from "./data/articles.repository";

export const articlesRepository = new ArticlesRepository(apiClient);
```

Server Components import the use-case or repository singleton and `await` it. Client Components import a hook that calls the same use-case. Do not duplicate HTTP in both places.

## Naming

- Files: **kebab-case** (`list-articles.ts`, `api-error-message.ts`) except React components.
- Repositories: `{Entity}Repository` in `{entity}.repository.ts`.
- Singletons: `{entity}Repository` in `{entity}-module.ts`.
- React components: **PascalCase** files (`ArticleCard.tsx`).
- Route files: Next.js names only (`page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`).
- Types: `{Verb}{Entity}Input` / `{Entity}Output` in `data/dtos.ts`.

## UI and Next.js

- Use `next/link` and `next/navigation` (`useRouter`, `usePathname`, `redirect`). Never `react-router`.
- Use `next/image` for images served from known hosts (configure `images.remotePatterns` in `next.config.ts`).
- Colocate route-specific loaders/errors with the segment; keep generic chrome in `src/components`.
- Providers (auth, theme, query) wrap children in `src/app/layout.tsx` via a small client `Providers` component — do not make the root layout a Client Component.

## Config, HTTP, auth

- HTTP lives in `src/infra/http` (base URL, headers, cookies, `Result` wrapping). Feature folders do not create their own `fetch` wrappers.
- Auth: Keycloak on the API (`apps/api` `module/auth`). Frontend auth code lives in `src/module/auth`. Do not drop a Keycloak client inside a random component.
- New public env vars: `NEXT_PUBLIC_*` in `.env` and read them from infra/config, not from scattered `process.env` in JSX.

## Adding a new screen + API resource (checklist)

1. Add or reuse `src/module/<entity>/` (repository, dtos, module singleton). Put multi-step writes in `use-case/`.
2. Add `src/app/<segment>/page.tsx` that only composes UI and calls the use-case/hook.
3. Put presentational pieces in `src/components/<entity>/`.
4. Guard private screens the same way as existing ones (auth module + layout or page-level check). Do not invent a second auth path.
5. Keep object-storage URLs / third-party HTTP in `src/infra` or call the Nest API — not inside a component.

## Out of `src/` (do not relocate)

- `public/` static assets
- `e2e/` Playwright
- `next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`
- `package.json` scripts: `dev`, `build`, `start`, `lint`
