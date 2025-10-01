import fs from "fs";
import path from "path";

let cachedRoot: string | undefined;

function validateRoot(rawValue: string | undefined): string {
  if (!rawValue || rawValue.trim().length === 0) {
    throw new Error(
      "Environment variable STADEN_ROOT must be set to the vault directory path.",
    );
  }

  const resolved = path.resolve(rawValue);
  let stats: fs.Stats;
  try {
    stats = fs.statSync(resolved);
  } catch {
    throw new Error(
      `Environment variable STADEN_ROOT points to a non-existent path: ${resolved}`,
    );
  }

  if (!stats.isDirectory()) {
    throw new Error(
      `Environment variable STADEN_ROOT must reference a directory. Received: ${resolved}`,
    );
  }

  return resolved;
}

/**
 * Returns the validated vault root path and caches it for subsequent calls.
 *
 * @returns Absolute path to the configured STADEN_ROOT directory.
 */
export function getStadenRoot(): string {
  if (cachedRoot) {
    return cachedRoot;
  }

  cachedRoot = validateRoot(process.env.STADEN_ROOT);
  return cachedRoot;
}

/**
 * Clears the cached STADEN_ROOT value, allowing tests to re-run validation.
 */
export function _resetCachedStadenRootForTests(): void {
  cachedRoot = undefined;
}
