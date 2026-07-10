#!/usr/bin/env node
/**
 * Write docs/openapi.json from the in-repo spec (no dev server required).
 */
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "docs", "openapi.json");
const RUNNER = path.join(__dirname, "_export-openapi-runner.mts");

const runnerSource = `import { writeFileSync, mkdirSync } from "fs";
import { dirname } from "path";
import { openApiSpec } from "../lib/openapi/index.ts";

const out = ${JSON.stringify(OUT)};
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(openApiSpec, null, 2), "utf8");
console.log("paths:", Object.keys(openApiSpec.paths || {}).length);
`;

function main() {
  fs.writeFileSync(RUNNER, runnerSource, "utf8");
  try {
    execSync(`npx --yes tsx "${RUNNER}"`, { cwd: ROOT, stdio: "inherit" });
    console.log(`✅ Wrote ${OUT}`);
  } finally {
    try {
      fs.unlinkSync(RUNNER);
    } catch {
      /* ignore */
    }
  }
}

main();
