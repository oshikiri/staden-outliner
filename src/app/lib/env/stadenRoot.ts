import fs from "fs";
import path from "path";

let cachedRoot: string | undefined;

function validateRoot(rawValue: string | undefined): string {
  if (!rawValue || rawValue.trim().length === 0) {
    throw new Error("A vault root path must be provided.");
  }

  const resolved = path.resolve(rawValue);
  let stats: fs.Stats;
  try {
    stats = fs.statSync(resolved);
  } catch {
    throw new Error(
      `The configured vault root path does not exist: ${resolved}`,
    );
  }

  if (!stats.isDirectory()) {
    throw new Error(
      `The configured vault root path must be a directory. Received: ${resolved}`,
    );
  }

  return resolved;
}

/**
 * Reads and validates the configured vault root path.
 *
 * @returns Absolute path to the configured vault root directory.
 */
export function readStadenRoot(argv: string[] = process.argv.slice(2)): string {
  return validateRoot(argv[0]);
}

export function setStadenRoot(root: string): void {
  cachedRoot = root;
}

export function getStadenRoot(): string {
  if (!cachedRoot) {
    throw new Error("Vault root has not been initialized.");
  }

  return cachedRoot;
}

/**
 * Clears the cached vault root value, allowing tests to control initialization.
 */
export function _resetCachedStadenRootForTests(): void {
  cachedRoot = undefined;
}
