# Source layout for agents

NestJS + TypeScript API in `apps/api`. Package manager is **pnpm**. Prisma schema lives in `apps/api/prisma/` (not under `src`). Default listen port is **3001**.

When starting a **new project like this**, copy this folder split: `src/config`, `src/module`, `src/infrastructure`, `src/shared`, plus thin `main.ts` / `app.module.ts`. Do not put Prisma schema inside `src`.

## `src/` tree

```
src/
  main.ts                 # bootstrap: tracing import first, ValidationPipe, CORS, cookies, Swagger at /api
  app.module.ts           # root module: register Config, Cls, Prisma, infra, then every feature module
  app.controller.ts
  app.service.ts
  config/
    configuration.ts      # env → typed config object (ConfigModule.forRoot load)
  common/
    types/                # extra TS declarations (e.g. Prisma JSON)
  types/
    express.d.ts          # Express request augmentations
  module/                 # domain / HTTP features (one folder per resource)
  infrastructure/         # I/O adapters: storage, notifications, broker
  shared/                 # app-wide Nest pieces used by many modules
```

## Feature modules (`src/module/<name>/`)

One Nest module per resource. Folder name is usually plural (`articles`, `tags`). Exception in this repo: `video`.

```
module/<name>/
  <name>.module.ts
  <name>.controller.ts    # HTTP only: guards, pipes, DTO, delegate to service
  <name>.service.ts       # Prisma + business rules
  <name>.processor.ts     # optional (BullMQ / jobs), e.g. video
  dto/                    # class-validator + class-transformer DTOs
```

Register the new module in `app.module.ts` `imports`.

Typical Nest wiring:

```typescript
@Module({
  imports: [AuthModule, UsersModule /* other feature deps */],
  controllers: [XxxController],
  providers: [XxxService],
})
export class XxxModule {}
```

Controller conventions:

- `@Controller('resource-path')` matches the folder/resource.
- `@ApiTags('...')` when documenting with Swagger.
- Public reads: no auth.
- Writes / manage: `@UseGuards(AuthGuard('keycloak'), UserProvisioningGuard, RolesGuard)` and `@Roles(...)`.
- Current DB user: `@CurrentDbUser()` from `shared/decorators`.
- UUID params: `ParseUUIDPipe`.

DTOs: one class per file (`create-*.dto.ts`, `update-*.dto.ts`, `list-*-query.dto.ts`). Share pagination via `shared/dto/pagination-query.dto.ts` when listing.

Existing / planned feature folders: `auth`, `users`, `profile`, `categories`, `tags`, `articles`, `images`, `comments`, `bookmarks`, `sections`, `video`.

## Infrastructure (`src/infrastructure/`)

External systems, not HTTP resources. Keep adapters here; feature services call them.

```
infrastructure/
  storage/          # MinIO, TUS, image-proxy URL helper (StorageModule is @Global)
  notifications/    # outbound HTTP to notifications service
  brokker/          # RabbitMQ (folder name is spelled this way in the repo)
```

Do not put MinIO/Keycloak/Rabbit clients inside a feature folder.

## Shared (`src/shared/`)

Cross-cutting Nest code reused by controllers/services.

```
shared/
  prisma/           # PrismaModule (@Global) + PrismaService — inject PrismaService, do not new PrismaClient
  decorators/       # @CurrentUser, @CurrentDbUser, @Roles
  guards/           # RolesGuard
  dto/              # shared query DTOs
  middleware/       # e.g. request logging
  utils/            # slug, image URLs, HLS/thumbnail, tracing, youtube helpers
```

Import shared code with relative paths (`../../shared/...`). Do not duplicate Prisma or auth guards inside a feature.

## Config, bootstrap, auth

- Env mapping: `src/config/configuration.ts`. Add new keys there, then `ConfigService`.
- `main.ts` must import `./shared/utils/tracing` **before** NestFactory.
- Global `ValidationPipe`: `whitelist`, `transform`, `forbidNonWhitelisted`.
- Auth: Keycloak JWT in `module/auth` (`keycloak.strategy.ts`, `keycloak.guard.ts`). First-request user sync: `module/users/user-provisioning.guard.ts`.

## Adding a new HTTP resource (checklist)

1. Create `src/module/<name>/` with module, controller, service, and `dto/`.
2. Use `PrismaService` from `shared/prisma`. Put schema/migrations in `prisma/`.
3. Import the module in `app.module.ts`.
4. Guard mutating routes like existing modules (`AuthGuard('keycloak')` + provisioning + roles).
5. Put object storage / queues / third-party HTTP in `infrastructure/`, not in the feature service file if it is a reusable adapter.

## Out of `src/` (do not relocate)

- `prisma/schema.prisma`, migrations, `prisma/seed.ts`
- `test/` e2e
- `package.json` scripts: `start:dev`, `prisma:generate`, `db:migrate`, `seed`
