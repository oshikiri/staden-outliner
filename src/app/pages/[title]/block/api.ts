import { Block as BlockEntity } from "@/app/lib/markdown/block";

export async function postPage(
  page: BlockEntity | null,
): Promise<BlockEntity | null> {
  if (!page) {
    return null;
  }
  page = sanitizePageBeforePost(page);
  console.log("postPage", page);
  const response = await fetch(`/api/pages/${page?.id}`, {
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
  sanitizedPage.contentMarkdown = page.contentMarkdown;
  sanitizedPage.children = page.children.map((child) =>
    sanitizePageBeforePost(child),
  );
  sanitizedPage.properties = page.properties;
  sanitizedPage.parentId = page.parentId;
  sanitizedPage.pageId = page.pageId;
  return sanitizedPage;
}
