import { execFileSync } from "node:child_process";

async function globalSetup() {
  const root = "./e2e/";
  execFileSync("bun", ["run", "reset-db", "--", root], {
    cwd: process.cwd(),
    stdio: "inherit",
  });
}

export default globalSetup;
