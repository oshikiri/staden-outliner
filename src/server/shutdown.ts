type ShutdownTarget = {
  stop: () => void;
  close: () => Promise<void>;
};

export function createShutdownHandler(target: ShutdownTarget) {
  let shuttingDown = false;

  return async function shutdown() {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;
    target.stop();
    await target.close();
  };
}
