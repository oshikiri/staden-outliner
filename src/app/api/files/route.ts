import { getPagesByPrefix } from "./../../lib/sqlite/pages";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const prefix = url.searchParams.get("prefix") || "";
  const files = await getPagesByPrefix(prefix);

  return new Response(JSON.stringify(files), {
    headers: {
      "Content-Type": "application/json",
    },
  });
}
