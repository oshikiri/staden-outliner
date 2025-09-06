import { Block as BlockEntity } from "@/app/lib/markdown/block";

export async function postPage(
  page: BlockEntity | null,
): Promise<BlockEntity | null> {
  if (!page) {
    return null;
  }
  const pageTitle = page.getProperty("title") as string;
  page = sanitizePageBeforePost(page);
  // RV: Avoid logging entire page payload; can be large and sensitive.
  console.log("postPage", page);
  const encodedTitle = encodeURIComponent(pageTitle);
  const response = await fetch(`/api/pages/${encodedTitle}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(page?.toJSON()),
  });
  return response.json();
}

function sanitizePageBeforePost(page: BlockEntity): BlockEntity {
  const sanitizedPage = new BlockEntity([], page.depth, []).withId(
    page.id || "",
  );
  // RV: Only whitelists a few fields; ensure no client-only fields leak (e.g., event handlers, UI state).
  sanitizedPage.contentMarkdown = page.contentMarkdown;
  sanitizedPage.children = page.children.map((child) =>
    sanitizePageBeforePost(child),
  );
  sanitizedPage.properties = page.properties;
  sanitizedPage.parentId = page.parentId;
  sanitizedPage.pageId = page.pageId;
  return sanitizedPage;
}
