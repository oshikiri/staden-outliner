import { getDb, logSqliteQuery } from "./db";

export function initializeLinks(db = getDb()) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS links (
      from_id TEXT,
      to_id TEXT,
      FOREIGN KEY (from_id) REFERENCES blocks(id),
      FOREIGN KEY (to_id) REFERENCES blocks(id)
    )
  `);
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_links_from_id
    ON links (from_id)
  `);
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_links_to_id
    ON links (to_id)
  `);
}

export function getSourceLinks(
  targetPageTitle: string,
  db = getDb(),
): string[] {
  const sql = `
    SELECT links.*
    FROM links
    JOIN blocks_p AS to_blocks ON links.to_id = to_blocks.id
    WHERE to_blocks.page_title = ?;
  `;
  logSqliteQuery(sql, [targetPageTitle]);
  const links = db.query<{ from_id: string }, string>(sql).all(targetPageTitle);
  return links.map((link) => link.from_id);
}

export function deleteLinksByFromId(fromId: string, db = getDb()) {
  db.prepare("DELETE FROM links WHERE from_id = ?").run(fromId);
}

export function batchInsertLinks(links: [string, string][], db = getDb()) {
  if (links.length === 0) {
    return;
  }

  const insert = db.prepare(
    "REPLACE INTO links (from_id, to_id) VALUES (?, ?)",
  );
  const insertMany = db.transaction((links: [string, string][]) => {
    for (const [from, to] of links) {
      insert.run(from, to);
    }
  });
  insertMany(links);
}
