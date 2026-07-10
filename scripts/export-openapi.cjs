#!/usr/bin/env node
/**
 * Export OpenAPI JSON from a running dev server.
 *
 * Usage:
 *   npm run dev          # in another terminal
 *   npm run openapi:export
 *
 * Output: docs/openapi.json
 */
const fs = require("fs");
const path = require("path");

const BASE = process.env.BASE_URL || "http://localhost:3000";
const OUT = path.join(__dirname, "..", "docs", "openapi.json");

async function main() {
  const url = `${BASE.replace(/\/$/, "")}/api/swagger`;
  console.log(`Fetching ${url} ...`);

  const res = await fetch(url);
  if (!res.ok) {
    console.error(`Failed: HTTP ${res.status}`);
    console.error("Make sure the dev server is running: npm run dev");
    process.exit(1);
  }

  const spec = await res.json();
  const paths = Object.keys(spec.paths || {}).length;

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(spec, null, 2), "utf8");

  console.log(`✅ Wrote ${OUT}`);
  console.log(`   ${paths} paths documented`);
  console.log("\nImport in Postman: File → Import → openapi.json");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
