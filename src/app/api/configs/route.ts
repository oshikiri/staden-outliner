import { NextResponse } from "next/server";

import { getAllConfigs } from "@/app/lib/file/config";

export async function GET() {
  const configs = await getAllConfigs();
  return NextResponse.json(configs);
}
