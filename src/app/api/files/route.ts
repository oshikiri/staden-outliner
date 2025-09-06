import { getPagesByPrefix } from "./../../lib/sqlite/pages";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const prefix = url.searchParams.get("prefix") || "";
  // RV: Validate `prefix` length and characters to prevent expensive queries and injection attempts.
  const files = await getPagesByPrefix(prefix);

  return new Response(JSON.stringify(files), {
    headers: {
      "Content-Type": "application/json",
    },
  });
}
