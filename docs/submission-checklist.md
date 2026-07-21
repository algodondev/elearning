# Rubric submission checklist

Status: **accepted locally on 2026-07-20**.

## Required deliverables

- [x] NestJS/PostgreSQL API implementing course, employee, organization, enrollment, progress, assessment, certificate, alert, learning-path, and compliance-report requirements.
- [x] Detailed interactive Swagger UI at `http://localhost:3000/api`.
- [x] Generated 74-operation OpenAPI contract at [api/openapi.json](api/openapi.json).
- [x] Postman collection at [corporate-elearning.postman_collection.json](../postman/corporate-elearning.postman_collection.json) and secret-free environment template.
- [x] Learning-route state and sequence diagram at [learning-path.md](learning-path.md).
- [x] Setup, environment, migration, seed, test, and execution instructions in the [README](../README.md).
- [x] Testing methodology and acceptance sequence at [testing.md](testing.md).
- [x] Large-fixture report query-plan and p95 evidence at [report-performance.md](report-performance.md).

## Mandatory business challenges

- [x] Attempts are blocked until all required modules are complete.
- [x] A learning-path course is blocked until the immediately previous course has a historical pass.
- [x] An enrollment accepts at most three attempts; its third failure requires a linked fresh enrollment with reset progress.
- [x] Compliance distinguishes valid, expired-only, and never-certified employee/course combinations without double-counting certificate history.

## Mandatory technical elements

- [x] JWT authentication, role authorization, and employee ownership enforcement.
- [x] DTO validation with transformation, allowlisting, and unknown-field rejection.
- [x] Stable safe exception envelope with request IDs and database/concurrency mappings.
- [x] PostgreSQL 17, TypeORM entities/migrations, normalized relations, checks, FKs, partial/composite/case-insensitive indexes, and `synchronize: false`.
- [x] Service-owned sequential-unlock policy.
- [x] SQL-side compliance aggregation and documented index/query-plan evidence.
- [x] Swagger/OpenAPI schemas, examples, security, success responses, and relevant `400`/`401`/`403`/`404`/`409`/`429` responses.
- [x] Jest/Supertest unit, real-database E2E, concurrency, contract, and Newman suites.

## Recorded acceptance evidence

| Gate                           | Recorded result                                                                          |
| ------------------------------ | ---------------------------------------------------------------------------------------- |
| `npm run format:check`         | Passed                                                                                   |
| `npm run lint:check`           | Passed                                                                                   |
| `npm run build`                | Passed                                                                                   |
| `npm test`                     | 8 suites, 51 tests passed                                                                |
| `npm run test:e2e`             | 9 suites, 23 tests passed                                                                |
| `npm run test:cov`             | 17 suites, 74 tests passed                                                               |
| Coverage                       | 92.36% statements, 77.12% branches, 96.40% functions, 94.32% lines                       |
| Critical branch coverage       | Attempts 90.74%, scoring 96.66%, certificates 94.11%, unlock policy 100%, reports 92.85% |
| `npm run openapi:test`         | 4 tests passed; artifact parity and no dangling references                               |
| Fresh database                 | 2 migrations applied; seed succeeded twice with stable 3 users / 1 course / 1 path       |
| Docker Compose                 | API and PostgreSQL healthy                                                               |
| Newman                         | 37 requests, 37 test scripts, 55 assertions, 0 failures                                  |
| Compliance benchmark           | 100,000 certificates; 913.29 ms p95; `IDX_certificates_report` used                      |
| `npm audit --audit-level=high` | 0 vulnerabilities                                                                        |
| Hygiene audit                  | No TODO/FIXME or skipped/focused tests; `dev-docs/` ignored and untracked                |

## Evaluator quick start

```bash
cp .env.example .env
docker compose up -d --build
docker compose run --rm -e NODE_ENV=development api \
  node dist/database/seeds/development.seed/development.seed.js
docker compose restart api
npm run postman:test
```

All seeded users use the development-only password `DevOnly123!`: `admin@elearning.local`, `hr@elearning.local`, and `learner@elearning.local`.
