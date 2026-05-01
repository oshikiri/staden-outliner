import fs from "fs";
import os from "os";
import path from "path";

import { expect, test } from "bun:test";

import { initializeStadenRoot, readStadenRoot } from "./stadenRoot";

test("readStadenRoot uses the first positional argument", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "staden-root-"));
  try {
    const relativeRoot = path.relative(process.cwd(), tempDir);

    expect(readStadenRoot([relativeRoot])).toBe(tempDir);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test("readStadenRoot requires a positional root argument", () => {
  expect(() => readStadenRoot([])).toThrow(
    "A vault root path must be provided.",
  );
});

test("readStadenRoot rejects file paths", () => {
  const tempFile = fs.mkdtempSync(path.join(os.tmpdir(), "staden-root-"));
  const filePath = path.join(tempFile, "root.txt");

  try {
    fs.writeFileSync(filePath, "root");

    expect(() => readStadenRoot([filePath])).toThrow(
      `The configured vault root path must be a directory. Received: ${filePath}`,
    );
  } finally {
    fs.rmSync(tempFile, { recursive: true, force: true });
  }
});

test("initializeStadenRoot returns the resolved root", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "staden-root-"));
  try {
    expect(initializeStadenRoot([tempDir])).toBe(tempDir);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});
