import { File } from "../file";
import { getDb, query } from ".";
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
  const result = await query(`SELECT * FROM pages WHERE id = ? LIMIT 1;`, [
    pageId,
  ]);
  if (result.length == 0) {
    return undefined;
  }
  return toFile(result[0]);
}

export async function getPageByTitle(title: string): Promise<File | undefined> {
  const result = await query(`SELECT * FROM pages WHERE title = ? LIMIT 1;`, [
    title,
  ]);
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
  const result = await query(
    `SELECT * FROM pages WHERE title IN (${placeholders});`,
    titles,
  );
  return result.map(toFile);
}

export async function getPagesByPrefix(prefix: string): Promise<File[]> {
  return (
    await query(`SELECT * FROM pages where title like ?;`, [`${prefix}%`])
  ).map(toFile);
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
  const insert = db.prepare(
    "REPLACE INTO pages (id, title, path) VALUES (?, ?, ?)",
  );
  insert.run(file.pageId, file.title, file.path);
  return file;
}

async function insertFiles(files: File[]) {
  const db = getDb();
  const insert = db.prepare(
    "REPLACE INTO pages (id, title, path) VALUES (?, ?, ?)",
  );
  const insertMany = db.transaction((files: File[]) => {
    for (const file of files) {
      insert.run(file.pageId, file.title, file.path);
    }
  });
  insertMany(files);
}

type PageRow = {
  id: string;
  title: string;
  path: string;
};

function toFile(page: PageRow): File {
  return {
    pageId: page.id,
    title: page.title,
    path: page.path,
  };
}
