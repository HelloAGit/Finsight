import { DatabaseSync } from "node:sqlite";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
// Prisma's Windows engine may fail on a nonexistent SQLite file. Create it first.
// Read only DATABASE_URL; never echo environment contents.
const envFile = existsSync(".env") ? readFileSync(".env", "utf8") : "";
const match = envFile.match(/^DATABASE_URL\s*=\s*["']?([^"'\r\n]+)["']?\s*$/m);
const url = process.env.DATABASE_URL || match?.[1]?.trim();
if (!url?.startsWith("file:"))
  throw new Error(
    "Set a local SQLite file: DATABASE_URL before running db:init",
  );
const filename = resolve("prisma", url.slice(5));
new DatabaseSync(filename).close();
