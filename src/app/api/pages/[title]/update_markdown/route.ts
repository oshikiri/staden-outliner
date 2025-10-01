import { NextRequest, NextResponse } from "next/server";

import { exportOnePageToMarkdown } from "@/app/lib/exporter/incremental_exporter";

type Props = {
  // @owner `params` should be a plain object in Next.js route handlers; using Promise forces `await` unnecessarily.
  params: Promise<{
    title: string;
  }>;
};

export async function POST(_req: NextRequest, props: Props) {
  const { title } = await props.params;

  await exportOnePageToMarkdown(title);

  return NextResponse.json({});
}
