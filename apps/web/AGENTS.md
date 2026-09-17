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

1. **Layers stay separate.** `src/app` owns routes plus **page-local** UI and hooks. `src/components` is **shared** UI only. `src/shared/hooks` is **shared** client hooks. `src/module` owns API types and repositories (and `use-case/` only when there is real business logic). `src/infra` owns HTTP. `src/utils` is shared pure helpers. Do not collapse these.
2. **One HTTP verb = one repository method.** Call the repository from pages/hooks when the call is a straight pass-through. Add `use-case/` only for multi-step or validated flows.
3. **API results are `Result<ApiSuccess<T>, ApiError>` (neverthrow).** Check `isErr()` and return/propagate. Do not `try/catch` fetch. Surface errors in UI with `getApiErrorMessage`.
4. **Pages are thin.** A `page.tsx` composes components and calls a repository (or a use-case when one exists). Client Components use a page-local or shared hook. No inline `fetch`, no DTO mapping in JSX.
5. **`'use client'` is opt-in.** Default to Server Components. Add `'use client'` only for event handlers, browser APIs, or client hooks. Do not mark a whole route tree client unless required.
6. **Do not re-implement the Nest API in Next.** No `src/app/api/**` route handlers that proxy CRUD unless there is a real BFF need (httpOnly cookies, image/auth bridging). Call `apps/api` through `src/infra/http`.
7. **Path alias `@/`** → `src/`. Do not use deep relative imports across layers (`../../../infra`).
8. **Copy the nearest sibling.** New REST resource → look at an existing `src/module/{entity}`. New screen → look at an existing `src/app/{route}/` (page + colocated `components/` / `hooks/`). Shared client hook → `src/shared/hooks`. Page-only hook → `src/app/{route}/hooks`.

## `src/` tree

```
src/
  app/                    # routes + page-local components/hooks
  components/             # shared UI only (used by 2+ routes)
  shared/hooks/           # shared client hooks (used by 2+ routes)
  module/                 # per-entity API (repository + dtos)
  infra/                  # HTTP client (and only I/O adapters)
  utils/                  # pure helpers
```

```
src/app/
  layout.tsx              # root html/body, fonts, providers if needed
  page.tsx                # /
  globals.css
  {segment}/
    page.tsx              # the route (thin: compose local UI)
    layout.tsx            # optional nested layout
    loading.tsx           # optional
    error.tsx             # optional
    components/           # UI used only by this route
    hooks/                # client hooks used only by this route
```

A route owns its screen. Put `LoginForm` next to `/login`, not in a global `components/auth` folder. Move a component to `src/components` or a hook to `src/shared/hooks` only when a second route needs it.

## Where new code goes

| Kind of change | Put it here |
| -------------- | ----------- |
| REST resource | `src/module/{entity}/data/{entity}.repository.ts` + `dtos.ts` |
| Wired singleton | `src/module/{entity}/{entity}-module.ts` (`new XRepository(apiClient)`) |
| Barrel | `src/module/{entity}/index.ts` and `src/module/{entity}/data/index.ts` |
| Multi-step or validated write | `src/module/{entity}/use-case/{kebab-name}.ts` — skip this folder if the call is a 1:1 repository wrap |
| Shared client hook (2+ routes) | `src/shared/hooks/use-{kebab-name}.ts` (`'use client'` if it uses React state) |
| Page-only client hook | `src/app/{segment}/hooks/use-{kebab-name}.ts` |
| Route (URL) | `src/app/{segment}/page.tsx` (+ `layout.tsx` when the segment needs a shell) |
| Page-only UI | `src/app/{segment}/components/` — PascalCase files |
| Shared UI (2+ routes) | `src/components/` — PascalCase files |
| Shared helper | `src/utils/` |
| HTTP client | `src/infra/http/` only |
| Env / API base URL | `src/infra/http` + `NEXT_PUBLIC_API_URL` (Nest on port 3001) |
| Server Action (thin) | next to the use-case or `src/module/{entity}/actions/` — must only call a use-case or repository |
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
  use-case/               # optional; only when there is business logic
```

Typical wiring:

```typescript
import { apiClient } from "@/infra/http";
import { ArticlesRepository } from "./data/articles.repository";

export const articlesRepository = new ArticlesRepository(apiClient);
```

Server Components import the repository singleton (or a use-case when one exists) and `await` it. Client Components import a page-local hook or `src/shared/hooks`. Do not duplicate HTTP in both places. Do not put hooks inside `src/module`.

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
- Colocate route-specific loaders, errors, components, and hooks with the segment; keep generic chrome in `src/components`.
- Providers (auth, theme, query) wrap children in `src/app/layout.tsx` via a small client `Providers` component — do not make the root layout a Client Component.

## Config, HTTP, auth

- HTTP lives in `src/infra/http` (base URL, headers, cookies, `Result` wrapping). Feature folders do not create their own `fetch` wrappers.
- Auth: Keycloak on the API (`apps/api` `module/auth`). Frontend auth code lives in `src/module/auth`. Do not drop a Keycloak client inside a random component.
- New public env vars: `NEXT_PUBLIC_*` in `.env` and read them from infra/config, not from scattered `process.env` in JSX.

## Adding a new screen + API resource (checklist)

1. Add or reuse `src/module/<entity>/` (repository, dtos, module singleton). Add `use-case/` only when the flow is more than a repository call.
2. Add `src/app/<segment>/page.tsx` that only composes UI and calls the repository/hook.
3. Put that screen’s UI in `src/app/<segment>/components/` and page-only hooks in `src/app/<segment>/hooks/`. Use `src/components/` only for UI shared by more than one route.
4. Guard private screens the same way as existing ones (auth module + layout or page-level check). Do not invent a second auth path.
5. Keep object-storage URLs / third-party HTTP in `src/infra` or call the Nest API — not inside a component.

## Out of `src/` (do not relocate)

- `public/` static assets
- `e2e/` Playwright
- `next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`
- `package.json` scripts: `dev`, `build`, `start`, `lint`
