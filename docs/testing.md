# Testing and acceptance

The API uses layered tests and a real PostgreSQL database for every persistence-sensitive behavior.

## Test layers

| Layer           | Command                                                                                       | Primary coverage                                                                                                                                             |
| --------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Unit            | `npm test`                                                                                    | Exact-match scoring, path unlock policy, certificate time boundaries, exception mapping                                                                      |
| Integration/E2E | `npm run test:e2e`                                                                            | HTTP, JWT/RBAC/ownership, DTO validation, transactions, migrations/constraints, complete business workflows                                                  |
| Contract        | `npm run openapi:test`                                                                        | 74 operation IDs, tags, descriptions, Bearer/error responses, success schemas, UUID params, required examples, no dangling references, generated-file parity |
| Acceptance      | `npm run postman:test`                                                                        | 37 requests and 55 assertions across the complete evaluator-facing workflow                                                                                  |
| Static/security | `npm run format:check`, `npm run lint:check`, `npm run build`, `npm audit --audit-level=high` | Formatting, typed lint, compilation, dependency vulnerabilities                                                                                              |

`npm run verify` executes the complete local static, unit, E2E, coverage, contract, and dependency-audit gate. The workflow at `.github/workflows/ci.yml` adds fresh migrations and the running-API Newman acceptance flow on every push and pull request.

The Jest coverage threshold is 70% for branches, functions, lines, and statements. Critical rule services are exercised by focused unit tests plus HTTP workflows.

## Business-case coverage

| Area                   | Normal case                                                                   | Business/edge cases                                                                                                    |
| ---------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Authentication         | Active user login/profile                                                     | Missing/malformed token, inactive identity, wrong role, normalized email, login throttling                             |
| Organization/employees | CRUD and transactional employee/account creation                              | Unknown properties, duplicate identity, invalid references, dependent archive, safe serialization                      |
| Course authoring       | Course/module/content/assessment/question creation and publication            | Ordered uniqueness, type-dependent content, invalid options, incomplete publication, post-use immutability             |
| Enrollment/progress    | Enrollment creates module progress; owned completion reaches assessment-ready | Inactive employee, unpublished course, duplicate active enrollment, foreign module, idempotent completion/cancellation |
| Attempts               | Exact scoring, pass, certificate                                              | Incomplete modules, duplicate/foreign selections, threshold equality, three failures, fourth rejection, re-enrollment  |
| Learning paths         | First course enrolls; prior pass unlocks next; final pass completes path      | Wrong path course, missing previous pass, duplicate assignment, locked structure, explicit context                     |
| Certificates/alerts    | Dynamic valid state and idempotent alert generation/read                      | Exact 30-day and expiry boundaries, repeat run/read, ownership, no persisted status                                    |
| Compliance             | Valid/expired-only/never totals and percentage                                | Certificate history deduplication, inactive exclusion, optional-course exclusion, filters, paging, zero denominator    |
| Database               | Fresh migrations and expected schema objects                                  | Case-insensitive/partial uniqueness, checks, FKs, attempt/certificate/alert uniqueness                                 |
| OpenAPI                | Swagger UI and raw contract                                                   | Security/error coverage, response schemas, key business examples, redacted employee assessment                         |

## Clean acceptance sequence

The E2E tests and seed mutate the configured database. Use only the Docker development database.

```bash
docker compose up -d postgres
npm ci
npm run migration:run
npm run format:check
npm run lint:check
npm run build
npm test
npm run test:e2e
npm run test:cov
npm run openapi:generate
npm run openapi:test
npm audit --audit-level=high
npm run seed
docker compose up -d --build api
npm run postman:test
```

Successful Newman evidence is: 37 requests, 37 test scripts, and 55 assertions with zero failures.

## Manual Swagger smoke test

1. Seed and start the API.
2. Open `http://localhost:3000/api`.
3. Execute `authLogin` for each seeded role.
4. Use **Authorize** with the returned token.
5. Confirm protected endpoints show `401`, `403`, `429`, validation/state errors, exact success schemas, and realistic examples.
6. Execute health, course list, owned enrollment/certificate views, alerts, and an ADMIN report.
7. Inspect `getEnrollmentAssessment`: neither the schema nor serialized response contains `isCorrect`.

The raw artifact at [api/openapi.json](api/openapi.json) must match `npm run openapi:generate`; the contract test enforces this equality.
