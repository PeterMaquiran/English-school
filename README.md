# English school

pnpm monorepo with a NestJS API and a Next.js frontend.

Product documentation (business rules first, then architecture):

- [docs/README.md](./docs/README.md) — reading order
- [docs/business-logic.md](./docs/business-logic.md) — domain rules (source of truth)
- [SRS](./docs/architecture/srs.md) · [schema](./docs/architecture/database-schema.md) · [RBAC](./docs/architecture/rbac-matrix.md) · [integrations](./docs/architecture/api-integrations.md)

## Apps

- `apps/api` — NestJS backend (layout for agents: `apps/api/AGENTS.md`)
- `apps/web` — Next.js frontend (layout for agents: `apps/web/AGENTS.md`)

## Setup

```bash
pnpm install
```

## Development

From the repo root:

```bash
pnpm dev:api
pnpm dev:web
```

- `pnpm dev:api` starts the NestJS API in watch mode
- `pnpm dev:web` starts the Next.js frontend

Run both in parallel:

```bash
pnpm dev
```
