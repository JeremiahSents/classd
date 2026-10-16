/**
 * Start the local Firebase emulators (Auth, Firestore, Functions) for app
 * development:  pnpm emulators
 *
 * Builds the Cloud Functions first, and keeps your test data between runs in
 * .emulator-data/ (saved when you stop the emulators with Ctrl+C). Emulator
 * dashboard: http://localhost:4000
 */

import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

const run = (cmd) => spawnSync(cmd, { stdio: "inherit", shell: true }).status ?? 1;

if (run("npm --prefix functions run build") !== 0) process.exit(1);

const DATA_DIR = ".emulator-data";
// --import fails on the first run, before anything has been saved
const importFlag = existsSync(`${DATA_DIR}/firebase-export-metadata.json`)
  ? `--import ${DATA_DIR}`
  : "";

process.exit(
  run(
    `firebase emulators:start --only auth,firestore,functions ${importFlag} --export-on-exit ${DATA_DIR}`,
  ),
);
