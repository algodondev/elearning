# Compliance report performance evidence

This evidence verifies that the mandatory-course compliance report is aggregated in PostgreSQL, uses the report index, avoids application-side N+1 queries, and meets the provisional local p95 target of 1,000 ms.

## Reproducible fixture

The benchmark uses an isolated database whose name must end in `_performance`. The script refuses any other database name before it truncates or inserts data.

| Fixture item                        |   Count |
| ----------------------------------- | ------: |
| Active employees                    |   5,000 |
| Active areas                        |      10 |
| Mandatory published courses         |      30 |
| Certificates and passed enrollments | 100,000 |

Certificate expirations are deterministically distributed across expired, expiring-soon, and valid classifications relative to `2026-07-20T00:00:00.000Z`.

```bash
docker exec elearning-postgres psql -U elearning -d postgres \
  -c 'CREATE DATABASE elearning_performance'
DB_NAME=elearning_performance npm run migration:run
DB_NAME=elearning_performance npm run report:benchmark
```

The reusable implementation is [scripts/benchmark-compliance-report.ts](../scripts/benchmark-compliance-report.ts). It imports the same SQL constant used by `ReportsService`, performs one warm-up followed by 25 measured queries, and executes `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)`.

## Result recorded 2026-07-20

| Measurement                   |             Result |
| ----------------------------- | -----------------: |
| Fixture load                  |            22.47 s |
| Minimum                       |          705.23 ms |
| Median                        |          764.86 ms |
| p95                           |      **913.29 ms** |
| Maximum                       |          949.20 ms |
| PostgreSQL-reported execution |         845.727 ms |
| PostgreSQL planning           |           1.615 ms |
| Shared cache hits / reads     | 452,913 / 0 blocks |

The p95 result passes the provisional ≤1,000 ms target. The plan used `IDX_certificates_report` (`course_id`, `employee_id`, `expires_at`). The API issues one parameterized aggregate query per summary request; it does not fetch employees and certificates in a loop.

## Environment

- PostgreSQL 17.10 in `postgres:17-alpine`
- Docker Engine 29.1.3 under WSL2/Linux 6.6
- AMD Ryzen 7 7840HS, 8 cores / 16 logical CPUs
- 7.4 GiB memory available to the WSL2 environment
- Warm PostgreSQL cache; no other controlled workload

These are local engineering results, not a production service-level guarantee. Re-run the benchmark on deployment hardware after material schema, index, PostgreSQL, or compliance-query changes.

## Cleanup

The fixture database is disposable:

```bash
docker exec elearning-postgres psql -U elearning -d postgres \
  -c 'DROP DATABASE elearning_performance WITH (FORCE)'
```
