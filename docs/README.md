# English School Management — documentation

Read in this order. **Business logic is the source of truth** for how the school operates. Architecture documents describe how that logic is stored, authorized, and integrated.

| Order | Document                                                            | Purpose                                                   |
| ----- | ------------------------------------------------------------------- | --------------------------------------------------------- |
| 1     | [Business logic](./business-logic.md)                               | Domain rules, workflows, invariants                       |
| 2     | [Software Requirements Specification](./architecture/srs.md)        | Scope, actors, functional and non-functional requirements |
| 3     | [Database schema](./architecture/database-schema.md)                | Entities, keys, relationships                             |
| 4     | [RBAC matrix](./architecture/rbac-matrix.md)                        | Roles vs permissions                                      |
| 5     | [API integration specification](./architecture/api-integrations.md) | Payments, classrooms, messaging                           |

Implementation lives in this monorepo:

- `apps/api` — NestJS API (port 3001), Prisma in `apps/api/prisma/`
- `apps/web` — Next.js App Router, calls the API (no CRUD proxies)

When a product rule and a schema or API field disagree, **change the architecture docs to match business logic**, not the other way around.
