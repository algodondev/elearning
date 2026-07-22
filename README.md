# Corporate E-Learning API

NestJS 11 REST API for corporate training administration: employees, organizational catalogs, courses, ordered learning content, assessments, enrollments, sequential learning paths, certificates, expiry alerts, and compliance reporting.

The API implements JWT authentication, role/ownership authorization, DTO validation, PostgreSQL transactions and constraints, generated Swagger/OpenAPI documentation, real-database E2E tests, and an executable Postman acceptance flow.

## Technology

- Node.js 24 and TypeScript
- NestJS 11 with the standard CLI/module/controller/service conventions
- PostgreSQL 17 and TypeORM migrations (`synchronize` is disabled)
- Passport JWT, bcrypt, RBAC, ownership checks, and request throttling
- Jest, Supertest, Swagger/OpenAPI, Postman/Newman, and Docker Compose

## Quick start: API on the host, PostgreSQL in Docker

Requirements: Node.js 24+, npm 11+, Docker Engine/Desktop, and Docker Compose.

```bash
cp .env.example .env
docker compose up -d postgres
npm ci
npm run migration:run
npm run seed
npm run start:dev
```

The checked-in `.env.example` is safe to copy. The local `.env` is intentionally ignored by Git. Set `DB_PORT=5433` when running the API from the host, as shown in the example file.

For the hosted academic environment, follow [the Render + Supabase deployment guide](docs/deployment-render-supabase.md). Provider tokens belong only in the ignored `.env.local`; never copy them into Git, documentation, or chat.

## Fully Dockerized API

```bash
cp .env.example .env
docker compose up -d --build
docker compose run --rm -e NODE_ENV=development api \
  node dist/database/seeds/development.seed/development.seed.js
docker compose ps
```

The API image is multi-stage and runs with production dependencies only. PostgreSQL data uses a named volume. To stop containers without deleting data:

```bash
docker compose down
```

## URLs

- API base: `http://localhost:3000/api/v1`
- Swagger UI: `http://localhost:3000/api`
- OpenAPI JSON: `http://localhost:3000/api-json`
- Health/readiness: `http://localhost:3000/api/v1/health`

The generated submission contract is [docs/api/openapi.json](docs/api/openapi.json).

## Development seed

`npm run seed` is destructive by design: it truncates application data, preserves migrations, and is blocked when `NODE_ENV=production`. It is repeatable and creates:

| Role       | Email                     | Development password |
| ---------- | ------------------------- | -------------------- |
| ADMIN      | `admin@elearning.local`   | `DevOnly123!`        |
| HR_MANAGER | `hr@elearning.local`      | `DevOnly123!`        |
| EMPLOYEE   | `learner@elearning.local` | `DevOnly123!`        |

It also creates two areas/levels, an active learner, a complete mandatory published course and assessment, and a published learning path. These credentials are for local evaluation only.

Set `SEED_PASSWORD` to replace the local default for a controlled remote demonstration initialization. Run the seed exactly once against a newly created empty database; never run it against data that must be preserved.

## Database workflow

```bash
npm run migration:run
npm run migration:revert
npm run migration:generate
npm run seed
```

Migrations enforce foreign-key delete policies, positive-value checks, ordered-child uniqueness, case-insensitive catalog/account uniqueness, one published assessment per course, one active employee/course enrollment, paired learning-path context, attempt numbers 1–3, and exactly-once certificates/alerts.

Never enable TypeORM schema synchronization. Create schema changes as migrations and prove them against an empty database.

## Tests and quality gates

The E2E suites truncate application tables. Run them only against a disposable development/test database, then rerun `npm run seed` if you want the demo fixture restored.

```bash
npm run format:check
npm run lint:check
npm run build
npm test
npm run test:e2e
npm run test:cov
npm run openapi:generate
npm run openapi:test
npm audit --audit-level=high
```

See [docs/testing.md](docs/testing.md) for the test layers, business-case matrix, and acceptance sequence.

The large compliance fixture, guarded benchmark command, query-plan evidence, and measured p95 are documented in [docs/report-performance.md](docs/report-performance.md). Run the benchmark only with a disposable database whose name ends in `_performance`:

```bash
DB_NAME=elearning_performance npm run report:benchmark
```

## Postman/Newman acceptance

The collection is [postman/corporate-elearning.postman_collection.json](postman/corporate-elearning.postman_collection.json), with a secret-free local environment template at [postman/local.postman_environment.json](postman/local.postman_environment.json).

For Docker Newman:

```bash
npm run seed
docker compose up -d --build api
npm run postman:test
```

For the Postman desktop app, import both files and keep `baseUrl=http://localhost:3000/api/v1`. The collection obtains JWTs itself and uses a unique run identifier. Reseed before each full collection run.

The seven folders cover readiness/login, organization and employee creation, course/assessment authoring, locked/unlocked learning paths, module gating and certification, three failures plus re-enrollment, alerts/compliance, RBAC, and DTO whitelist validation.

## API conventions

- Routes are versioned under `/api/v1`.
- All protected requests use `Authorization: Bearer <JWT>`.
- `ADMIN` and `HR_MANAGER` manage catalogs and learning assignments.
- `EMPLOYEE` access is restricted to owned progress, attempts, certificates, alerts, and path assignments.
- Collection responses use `data` and `meta` with `page`, `limit`, `totalItems`, and `totalPages`.
- Dates and certificate/report boundaries are UTC.
- Request DTOs reject unknown properties.
- Every response includes `X-Request-Id`; clients may send their own value.

Errors use a stable safe envelope:

```json
{
  "statusCode": 409,
  "code": "LEARNING_PATH_PREREQUISITE_NOT_PASSED",
  "message": "The immediately previous course must be passed first.",
  "details": {
    "previousCourseId": "550e8400-e29b-41d4-a716-446655440000"
  },
  "path": "/api/v1/learning-path-enrollments/.../enroll",
  "requestId": "a request UUID",
  "timestamp": "2026-07-20T14:30:00.000Z"
}
```

SQL, stack traces, password hashes, JWT secrets, and employee-facing answer correctness are never returned.

## Core business rules

- Required modules must be complete before an assessment attempt.
- Each enrollment permits at most three attempts. The third failure changes it to `REENROLLMENT_REQUIRED`; a new linked enrollment resets module progress.
- Scoring uses exact option-set matching and awards no partial credit.
- Passing atomically issues one certificate and can complete a learning-path assignment.
- The first path course is unlocked. Every later course needs a historical `PASSED` enrollment for the immediately previous course.
- Certificate state is derived at an `asOf` instant: exact expiry is expired; exact 30 days is expiring soon.
- Alert generation is idempotent by certificate and alert type.
- Compliance counts active employees against mandatory published courses and counts an employee/course only once even with certificate history.

The required route diagram and state explanation are in [docs/learning-path.md](docs/learning-path.md).

## Important environment variables

| Variable                            | Purpose                                | Local default/example       |
| ----------------------------------- | -------------------------------------- | --------------------------- |
| `PORT`                              | HTTP port                              | `3000`                      |
| `API_PREFIX`                        | Versioned route prefix                 | `api/v1`                    |
| `CORS_ORIGINS`                      | Comma-separated allowlist              | localhost UI origins        |
| `DB_HOST`, `DB_PORT`                | PostgreSQL connection                  | `localhost`, `5433`         |
| `DB_NAME`, `DB_USER`, `DB_PASSWORD` | PostgreSQL database credentials        | local development values    |
| `DB_SSL`, `DB_SSL_CA`               | Verified TLS for managed PostgreSQL    | `false`, unset locally      |
| `JWT_SECRET`                        | JWT signing key, minimum 32 characters | replace outside development |
| `JWT_EXPIRES_IN`                    | Access-token lifetime                  | `15m`                       |
| `BCRYPT_ROUNDS`                     | Password hashing cost                  | `12`                        |
| `THROTTLE_TTL_MS`, `THROTTLE_LIMIT` | Global request rate window/limit       | `60000`, `100`              |
| `ALERT_CRON`                        | Daily UTC certificate-alert cron       | `0 0 2 * * *`               |

Configuration is validated at startup; missing database credentials or a short JWT secret fail fast.

## Project documentation

- [OpenAPI contract](docs/api/openapi.json)
- [Learning-path diagram](docs/learning-path.md)
- [Testing and acceptance](docs/testing.md)
- [Compliance report performance](docs/report-performance.md)
- [Rubric submission checklist](docs/submission-checklist.md)
- [Render + Supabase deployment](docs/deployment-render-supabase.md)
- [Postman collection](postman/corporate-elearning.postman_collection.json)
