import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { SCHEMA_SQL } from "../src/lib/db/schema.ts";

const directory = path.join(process.cwd(), "data");
const filePath = path.join(directory, "becas.sqlite");

mkdirSync(directory, { recursive: true });

const database = new DatabaseSync(filePath, { timeout: 5000 });
database.exec("PRAGMA journal_mode = DELETE");
database.exec(SCHEMA_SQL);
database.close();

console.log(`Base inicial lista en ${filePath}`);
