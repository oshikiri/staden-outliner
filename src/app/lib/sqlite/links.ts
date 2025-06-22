import { db, query } from ".";

export async function initializeLinks() {
  db.exec("DROP TABLE IF EXISTS links");
  db.exec(`
    CREATE TABLE IF NOT EXISTS links (
      from_id TEXT,
      to_id TEXT,
      FOREIGN KEY (from_id) REFERENCES blocks(id),
      FOREIGN KEY (to_id) REFERENCES blocks(id)
    )
  `);
}

export async function getSourceLinks(
  targetPageTitle: string,
): Promise<string[]> {
  const links = await query(
    `
    SELECT links.*
    FROM links
    JOIN blocks_p AS to_blocks ON links.to_id = to_blocks.id
    WHERE to_blocks.page_title = ?;
  `,
    [targetPageTitle],
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return links.map((link: any) => link.from_id);
}

export async function deleteLinksByFromId(fromId: string) {
  db.prepare("DELETE FROM links WHERE from_id = ?").run([fromId]);
}

export async function batchInsertLinks(links: [string, string][]) {
  if (links.length === 0) {
    return;
  }

  const insert = db.prepare(
    "REPLACE INTO links (from_id, to_id) VALUES (?, ?)",
  );
  const insertMany = db.transaction((links: [string, string][]) => {
    for (const [from, to] of links) {
      insert.run([from, to]);
    }
  });
  insertMany(links);
}
