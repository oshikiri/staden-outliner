const MAX_RECENT_PAGES = 10;
let recentPages: string[] = [];

export async function GET(): Promise<Response> {
  return new Response(JSON.stringify({ pages: recentPages }), {
    headers: {
      "Content-Type": "application/json",
    },
  });
}

export async function POST(request: Request): Promise<Response> {
  const payload = (await request.json()) as RecentPagesRequest;
  const { pageTitle } = payload;
  if (!pageTitle || typeof pageTitle !== "string") {
    return new Response(JSON.stringify({ error: "Missing pageTitle" }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  recentPages = recentPages.filter((title) => title !== pageTitle);
  recentPages.push(pageTitle);
  recentPages = recentPages.slice(-MAX_RECENT_PAGES);

  return new Response(JSON.stringify({ pages: recentPages }), {
    headers: {
      "Content-Type": "application/json",
    },
  });
}

type RecentPagesRequest = {
  pageTitle?: string;
};
