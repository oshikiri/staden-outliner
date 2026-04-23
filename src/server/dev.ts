import { watch, type FSWatcher } from "node:fs";
import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";

import { readStadenRoot, setStadenRoot } from "@/server/lib/env/stadenRoot";

import { buildWeb } from "./build-web";
import { createWebServer } from "./web";

const watchedRoots = [
  join(process.cwd(), "src"),
  join(process.cwd(), "public"),
];

type DevState = {
  watchers: Map<string, FSWatcher>;
  rebuilding: boolean;
  rebuildRequested: boolean;
};

async function main() {
  setStadenRoot(readStadenRoot(process.argv.slice(2)));

  if (!(await buildWeb())) {
    process.exitCode = 1;
    return;
  }

  const server = createWebServer({
    host: Bun.env.HOST,
    port: Bun.env.PORT ? Number(Bun.env.PORT) : undefined,
  });

  const state = createDevState();
  await refreshWatchers(state);
  console.log("Watching for changes in src/ and public/.");
  registerShutdown(server, state);
}

function createDevState(): DevState {
  return {
    watchers: new Map<string, FSWatcher>(),
    rebuilding: false,
    rebuildRequested: false,
  };
}

async function rebuildWebAssets(state: DevState): Promise<void> {
  if (state.rebuilding) {
    state.rebuildRequested = true;
    return;
  }

  state.rebuilding = true;
  try {
    do {
      state.rebuildRequested = false;
      const success = await buildWeb();
      if (!success) {
        console.error("Failed to rebuild web assets.");
      } else {
        console.log("Rebuilt web assets.");
      }
    } while (state.rebuildRequested);
  } finally {
    state.rebuilding = false;
  }
}

function scheduleRebuild(state: DevState): void {
  void rebuildWebAssets(state).catch((error) => {
    console.error(error);
  });
}

async function refreshWatchers(state: DevState): Promise<void> {
  await Promise.all(watchedRoots.map((root) => watchDirectory(root, state)));
}

async function watchDirectory(
  directory: string,
  state: DevState,
): Promise<void> {
  if (state.watchers.has(directory)) {
    return;
  }

  try {
    if (!(await stat(directory)).isDirectory()) {
      return;
    }
  } catch (error) {
    const cause = error as { code?: string };
    if (cause.code === "ENOENT") {
      return;
    }
    throw error;
  }

  const watcher = watch(directory, () => {
    void refreshWatchers(state)
      .then(() => {
        scheduleRebuild(state);
      })
      .catch((error) => {
        console.error(error);
      });
  });
  state.watchers.set(directory, watcher);

  const entries = await readdir(directory, { withFileTypes: true });
  await Promise.all(
    entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => watchDirectory(join(directory, entry.name), state)),
  );
}

function registerShutdown(
  server: ReturnType<typeof createWebServer>,
  state: DevState,
): void {
  const shutdown = () => {
    for (const watcher of state.watchers.values()) {
      watcher.close();
    }
    server.stop();
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

if (import.meta.main) {
  void main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
