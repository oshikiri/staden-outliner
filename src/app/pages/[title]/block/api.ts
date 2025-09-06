import { Block as BlockEntity } from "@/app/lib/markdown/block";

export async function postPage(
  page: BlockEntity | null,
): Promise<BlockEntity | null> {
  if (!page) {
    return null;
  }
  const pageTitle = page.getProperty("title") as string;
  page = sanitizePageBeforePost(page);
  // RV: Remove console.log before deploying; rely on logging only when debugging.
  console.log("postPage", page);
  const encodedTitle = encodeURIComponent(pageTitle);
  const response = await fetch(`/api/pages/${encodedTitle}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(page?.toJSON()),
  });
  // RV: Check response.ok before parsing to JSON to handle HTTP errors.
  return response.json();
}

function sanitizePageBeforePost(page: BlockEntity): BlockEntity {
  const sanitizedPage = new BlockEntity([], page.depth, []).withId(
    page.id || "",
  );
  sanitizedPage.contentMarkdown = page.contentMarkdown;
  sanitizedPage.children = page.children.map((child) =>
    sanitizePageBeforePost(child),
  );
  sanitizedPage.properties = page.properties;
  sanitizedPage.parentId = page.parentId;
  sanitizedPage.pageId = page.pageId;
  return sanitizedPage;
}
