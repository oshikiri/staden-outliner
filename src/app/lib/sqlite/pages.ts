import { File } from "../file";
import { getDb, logSqliteQuery } from ".";
import { chunk } from "../lodash";
import { logInfo } from "../logger";

export async function initializePages() {
  const db = getDb();
  db.exec("DROP TABLE IF EXISTS pages");
  db.exec(`
    CREATE TABLE IF NOT EXISTS pages (
      id TEXT PRIMARY KEY,
      title TEXT,
      path TEXT
    )`);
}

export async function getPageById(pageId: string): Promise<File | undefined> {
  const sql = `SELECT * FROM pages WHERE id = ? LIMIT 1;`;
  logSqliteQuery(sql, [pageId]);
  const result = getDb().query<PageRow, string>(sql).all(pageId);
  if (result.length == 0) {
    return undefined;
  }
  return toFile(result[0]);
}

export async function getPageByTitle(title: string): Promise<File | undefined> {
  const sql = `SELECT * FROM pages WHERE title = ? LIMIT 1;`;
  logSqliteQuery(sql, [title]);
  const result = getDb().query<PageRow, string>(sql).all(title);
  if (result.length == 0) {
    return undefined;
  }

  return toFile(result[0]);
}

export async function getPagesByTitles(titles: string[]): Promise<File[]> {
  if (titles.length === 0) {
    return [];
  }

  const placeholders = titles.map(() => "?").join(", ");
  const sql = `SELECT * FROM pages WHERE title IN (${placeholders});`;
  logSqliteQuery(sql, titles);
  const result = getDb()
    .query<PageRow, string[]>(sql)
    .all(...titles);
  return result.map(toFile);
}

export async function getPagesByPrefix(prefix: string): Promise<File[]> {
  const sql = `SELECT * FROM pages where title like ?;`;
  logSqliteQuery(sql, [`${prefix}%`]);
  return getDb().query<PageRow, string>(sql).all(`${prefix}%`).map(toFile);
}

export async function batchInsertFiles(files: File[], BATCH_SIZE: number) {
  let i = 0;
  for (const batch of chunk(files, BATCH_SIZE)) {
    logInfo(
      `Importing files batch ${i + 1} of ${Math.ceil(files.length / BATCH_SIZE)}`,
    );
    i++;
    await insertFiles(batch);
  }
}

export async function putFile(file: File) {
  const db = getDb();
  const insert = db.prepare<unknown, [string, string, string | null]>(
    "REPLACE INTO pages (id, title, path) VALUES (?, ?, ?)",
  );
  if (!file.pageId) {
    throw new Error("File pageId is not defined");
  }

  insert.run(file.pageId, file.title, file.path ?? null);
  return file;
}

async function insertFiles(files: File[]) {
  const db = getDb();
  const insert = db.prepare<unknown, [string, string, string | null]>(
    "REPLACE INTO pages (id, title, path) VALUES (?, ?, ?)",
  );
  const insertMany = db.transaction((files: File[]) => {
    for (const file of files) {
      if (!file.pageId) {
        throw new Error("File pageId is not defined");
      }
      insert.run(file.pageId, file.title, file.path ?? null);
    }
  });
  insertMany(files);
}

type PageRow = {
  id: string;
  title: string;
  path: string | null;
};

function toFile(page: PageRow): File {
  return {
    pageId: page.id,
    title: page.title,
    path: page.path ?? undefined,
  };
}
