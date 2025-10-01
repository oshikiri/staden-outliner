import { NextRequest, NextResponse } from "next/server";

const MAX_RECENT_PAGES = 10;
let recentPages: string[] = [];

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ pages: recentPages });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const payload = (await request.json()) as RecentPagesRequest;
  const { pageTitle } = payload;
  if (!pageTitle || typeof pageTitle !== "string") {
    return NextResponse.json({ error: "Missing pageTitle" }, { status: 400 });
  }

  recentPages = recentPages.filter((title) => title !== pageTitle);
  recentPages.push(pageTitle);
  recentPages = recentPages.slice(-MAX_RECENT_PAGES);

  return NextResponse.json({ pages: recentPages });
}

type RecentPagesRequest = {
  pageTitle?: string;
};
