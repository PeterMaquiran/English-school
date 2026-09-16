# English school

pnpm monorepo with a NestJS API and a Next.js frontend.

## Apps

- `apps/api` — NestJS backend
- `apps/web` — Next.js frontend

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
