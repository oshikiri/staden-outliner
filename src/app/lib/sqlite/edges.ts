import { db, query } from ".";

export async function initializeEdges() {
  db.exec("DROP TABLE IF EXISTS edges");
  db.exec(`
    CREATE TABLE IF NOT EXISTS edges (
      from_id TEXT,
      to_id TEXT,
      FOREIGN KEY (from_id) REFERENCES blocks(id),
      FOREIGN KEY (to_id) REFERENCES blocks(id)
    )
  `);
}

export async function getSourceEdges(
  targetPageTitle: string,
): Promise<string[]> {
  const edges = await query(
    `
    SELECT edges.*
    FROM edges
    JOIN blocks_p AS to_blocks ON edges.to_id = to_blocks.id
    WHERE to_blocks.page_title = ?;
  `,
    [targetPageTitle],
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return edges.map((edge: any) => edge.from_id);
}

export async function deleteEdgesByFromId(fromId: string) {
  db.prepare("DELETE FROM edges WHERE from_id = ?").run([fromId]);
}

export async function batchInsertEdges(edges: [string, string][]) {
  if (edges.length === 0) {
    return;
  }

  const insert = db.prepare(
    "REPLACE INTO edges (from_id, to_id) VALUES (?, ?)",
  );
  const insertMany = db.transaction((edges: [string, string][]) => {
    for (const [from, to] of edges) {
      insert.run([from, to]);
    }
  });
  insertMany(edges);
}
