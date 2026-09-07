import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { buildServer } from "./app.js";
import { resolveDatabasePath } from "./config.js";

const host = "127.0.0.1";
const port = 4317;
const databasePath = resolveDatabasePath(process.env, process.cwd());
mkdirSync(dirname(databasePath), { recursive: true });

const server = buildServer({ databasePath });

try {
  await server.listen({ host, port });
  console.log(`Eidos API listening at http://${host}:${port}`);
} catch (error) {
  server.log.error(error);
  process.exitCode = 1;
}
