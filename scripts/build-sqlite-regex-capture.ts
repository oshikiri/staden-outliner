import { mkdirSync } from "node:fs";
import path from "node:path";

import {
  getRegexCaptureExtensionOutputPath,
  getRegexCaptureExtensionSourcePath,
} from "../src/server/lib/sqlite/extensionPath";

const sourcePath = getRegexCaptureExtensionSourcePath();
const outputPath = getRegexCaptureExtensionOutputPath();
mkdirSync(path.dirname(outputPath), { recursive: true });

const args =
  process.platform === "darwin"
    ? [
        "-std=c++17",
        "-O2",
        "-fPIC",
        "-dynamiclib",
        sourcePath,
        "-lsqlite3",
        "-o",
        outputPath,
      ]
    : [
        "-std=c++17",
        "-O2",
        "-fPIC",
        "-shared",
        sourcePath,
        "-lsqlite3",
        "-o",
        outputPath,
      ];

const result = Bun.spawnSync(["c++", ...args], {
  stderr: "inherit",
  stdout: "inherit",
});

if (result.exitCode !== 0) {
  throw new Error(
    `Failed to build SQLite regex_capture extension: ${result.exitCode}`,
  );
}
