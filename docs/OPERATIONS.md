# Eidos MVP Operations

This runbook covers the currently implemented local MVP. It does not describe deployment: Eidos has no production packaging, hosted mode, service manager, or supported remote listener.

> [!NOTE]
> Startup, loopback, and troubleshooting procedures remain applicable. Assessment routes and assessment-database initialization are disabled in the normal runtime. Any graph-specific UI, sample-assessment, database, or export instructions later in this document apply only to explicit test/developer compatibility mode. The current workflow is catalog search, browse, record detail, relationships, and comparison as documented in `README.md`.

## Runtime topology

| Process | Command | Listen address |
|---|---|---|
| Fastify API (development) | `npm run dev:api` | `127.0.0.1:4317` |
| Vite web UI (development) | `npm run dev:web` | `127.0.0.1:4173` |
| Compiled API | `npm run start:api` after `npm run build` | `127.0.0.1:4317` |
| Compiled UI preview | `npm run start:web` after `npm run build` | `127.0.0.1:4173` |

The UI has a fixed API base URL of `http://127.0.0.1:4317`. The compiled API and compiled UI preview remain separate loopback processes.

## Startup

From a clean checkout:

```bash
cd "E:/Coding Projects/Eidos"
npm ci
```

Start the API in terminal 1:

```bash
cd "E:/Coding Projects/Eidos"
npm run dev:api
```

Wait for:

```text
Eidos API listening at http://127.0.0.1:4317
```

Start the UI in terminal 2:

```bash
cd "E:/Coding Projects/Eidos"
npm run dev:web
```

Open <http://127.0.0.1:4173>. The status should read **Live local data**. If it reads **Local sample mode**, the browser is showing bundled fallback data and is not proof that the API or SQLite database is available.

### Use a database outside the repository

Set `EIDOS_DATABASE_PATH` only for the API process. Prefer an absolute path in a private, access-controlled directory:

```bash
EIDOS_DATABASE_PATH="E:/Private Eidos Data/client.sqlite" npm run dev:api
```

An empty/new database is initialized and seeded with the bundled sample graph. A relative override is resolved from the API process's working directory. The current path resolver uses Windows path semantics, so an absolute Windows path is least ambiguous.

## Shutdown

1. Stop using the UI and allow any export download to finish.
2. In the web terminal, press `Ctrl+C`.
3. In the API terminal, press `Ctrl+C` and wait for the process to exit.
4. Before backup, restore, move, or deletion, verify that no process is listening on API port 4317:

```bash
netstat -ano | grep ':4317'
```

No output means no matching socket was reported. If a PID remains, identify and stop that process through Windows Task Manager. Do not copy or replace the database while the API is running.

## Data location and lifecycle

Default Windows data files:

```text
%LOCALAPPDATA%\Eidos\eidos.sqlite
%LOCALAPPDATA%\Eidos\eidos.sqlite-wal   (may exist while open)
%LOCALAPPDATA%\Eidos\eidos.sqlite-shm   (may exist while open)
```

If `LOCALAPPDATA` is unavailable, Eidos falls back to `<current working directory>/local-data/eidos.sqlite`. The database uses SQLite WAL mode, foreign keys, `synchronous=FULL`, a five-second busy timeout, and schema version 1. Generic database and SQLite sidecars are ignored by Git, but ignore rules are not access controls or encryption.

On first startup against an empty database, Eidos stores the built-in sample graph. There is currently one snapshot slot and no UI/API mutation workflow. Deleting or pointing away from the database causes a new database with the sample graph to be created at the next startup.

## Backup and restore

The only supported database-copy procedure for this MVP is an **offline copy**:

1. Shut down the API and confirm port 4317 is no longer listening.
2. Copy `eidos.sqlite` and any same-basename `eidos.sqlite-wal` and `eidos.sqlite-shm` files together to a protected backup directory. Copying the whole containing data directory is simplest.
3. Record the application version/commit alongside the backup.
4. Protect the backup with OS permissions and disk encryption appropriate for client assessment data.

Restore only while the API is stopped:

1. Preserve the current database directory as a rollback copy.
2. Replace the database and any sidecars as one set, or point `EIDOS_DATABASE_PATH` at a restored copy.
3. Start the API and run the health, graph, and snapshot checks below.

There is no restore/import endpoint, migration backup automation, or recovery UI. The repository rejects databases with a newer migration version or a mismatched current migration checksum; retain the exact app version with backups and test restored copies before relying on them.

## Exports

With the API running:

```bash
curl -fsS http://127.0.0.1:4317/api/exports/snapshot -o eidos-snapshot.json
curl -fsS http://127.0.0.1:4317/api/exports/summary -o eidos-summary.md
```

- `eidos-snapshot.json` contains schema version `1.0.0`, generation time, a canonicalized graph, and a SHA-256 digest covering the canonical export envelope except the digest field itself.
- `eidos-summary.md` contains counts, priority observations, assurance states, and provenance coverage; it explicitly does not claim certification, audit completion, or compliance.
- The UI's **Export view** button downloads `eidos-current-view.json`, which contains only the currently visible/filter-matched nodes and edges.

Treat all exports as sensitive. Choose a protected destination and do not commit exports. API and UI exports are not SQLite backups, and there is no implemented import path for them.

## Verification

### Runtime checks

Run after the API starts:

```bash
curl -fsS http://127.0.0.1:4317/health
curl -fsS http://127.0.0.1:4317/api/graph -o eidos-graph-check.json
curl -fsS http://127.0.0.1:4317/api/exports/snapshot -o eidos-snapshot-check.json
```

Expected health response:

```json
{"status":"ok","service":"eidos-api"}
```

To confirm the API rejects a hostile host header:

```bash
curl -sS -o /dev/null -w '%{http_code}\n' -H 'Host: attacker.example' http://127.0.0.1:4317/api/graph
```

Expected status: `421`.

To confirm the API rejects a supplied hostile origin:

```bash
curl -sS -o /dev/null -w '%{http_code}\n' -H 'Origin: https://attacker.example' http://127.0.0.1:4317/api/graph
```

Expected status: `403`.

### Repository checks

```bash
npm run accept
```

This runs both type checks, all Vitest tests, both production builds, and the production dependency audit in release order.

## Troubleshooting

### UI says “Local sample mode”

- Confirm terminal 1 printed the API listening message.
- Run `curl -fsS http://127.0.0.1:4317/health`.
- Use exactly `http://127.0.0.1:4173` or `http://localhost:4173` for the UI. Other origins are rejected.
- Restart the API, then use **Retry API** in the UI.
- Remember that the fallback graph is bundled in the browser; seeing a graph alone does not prove persistence is working.

### Port 4173 or 4317 is already in use

```bash
netstat -ano | grep -E ':(4173|4317)'
```

Stop the conflicting process through Task Manager, then restart Eidos. Both ports are fixed in the current source; changing only a CLI port will break the host/origin allowlists or the UI's compiled API URL.

### API starts with unexpected data or creates a database in the wrong place

- Check the directory from which the API command was launched.
- Check whether `EIDOS_DATABASE_PATH` is set: `printf '%s\n' "$EIDOS_DATABASE_PATH"`.
- Use an absolute Windows path for the override.
- Do not delete an unexpected database until the API is stopped and the directory has been backed up.

### Database error, corruption concern, or failed restore

- Stop the API immediately and preserve the database plus `-wal`/`-shm` sidecars as a set.
- Do not repeatedly start Eidos against the only copy.
- Restore to a separate path with `EIDOS_DATABASE_PATH`, then verify `/health`, `/api/graph`, and the snapshot export.
- The current MVP has no repair, integrity-check, or automated rollback command.

### Build succeeded but there is no web application at port 4317

This is expected. The API listens on 4317. After building, run `npm run start:web` separately and open `http://127.0.0.1:4173`.

### Proposal endpoint does not call a model

This is expected in the MVP. `POST /api/analysis/proposals` validates a question and returns fixed proposed text marked `ai_proposed`; it has no model-provider integration and cannot modify the graph.

## Not production-safe

Do **not** deploy Eidos, expose it to a LAN, proxy it, tunnel it, or use the current runtime as a multi-user service.

The implemented MVP lacks production-critical controls and operations, including:

- user authentication and authorization;
- tenant/workspace isolation and multi-user concurrency controls;
- an Eidos-managed encryption-at-rest layer or secrets management;
- production static-UI serving/packaging, TLS, configurable network topology, and hardened deployment configuration;
- supported forward migrations across application versions, automated verified backups, restore/import tooling, and rollback automation;
- monitoring, structured operational logging, rate limiting, service supervision, and incident-response integration;
- evidence-file ingestion/storage and integrity workflows;
- complete implementation of the documented `/api/v1` contract and its provenance/audit mutation model;
- production security review, SBOM/release evidence, and full acceptance/runtime/browser testing.

Loopback binding lowers exposure but is not an authentication mechanism. Unsafe browser-facing methods require an approved local Origin, but any process running as the user can still attempt safe requests. Use only non-production sample/test data unless a responsible operator has separately accepted the local data-handling risks.