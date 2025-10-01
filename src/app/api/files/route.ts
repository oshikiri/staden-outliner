import { NextRequest, NextResponse } from "next/server";

import { getPagesByPrefix } from "./../../lib/sqlite/pages";

export async function GET(req: NextRequest) {
  const prefix = req.nextUrl.searchParams.get("prefix") || "";
  // @owner Validate `prefix` length and characters to prevent expensive queries and injection attempts.
  const files = await getPagesByPrefix(prefix);

  return NextResponse.json(files);
}
