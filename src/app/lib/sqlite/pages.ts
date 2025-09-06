import { File } from "../file";
import { query, db } from ".";
import { chunk } from "../lodash";

export async function initializePages() {
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
  const page = result[0];
  return { pageId: page.id, title: page.title, path: page.path } as File;
}

export async function getPageByTitle(title: string): Promise<File | undefined> {
  const result = await query(`SELECT * FROM pages WHERE title = ? LIMIT 1;`, [
    title,
  ]);
  if (result.length == 0) {
    return undefined;
  }

  const page = result[0];
  return { pageId: page.id, title: page.title, path: page.path } as File;
}

export async function getPagesByTitles(titles: string[]): Promise<File[]> {
  // RV: Building an `IN` list via string concatenation is incorrect and risks SQL injection. Use parameter placeholders like `IN (?, ?, ?)` built from `titles.length`.
  const titlesStr = titles.map((title) => `'${title}'`).join(",");
  const result = await query(`SELECT * FROM pages WHERE title IN (?);`, [
    titlesStr,
  ]);
  return result.map(
    (page) =>
      ({
        pageId: page.id,
        title: page.title,
        path: page.path,
      }) as File,
  );
}

export async function getPagesByPrefix(prefix: string): Promise<File[]> {
  return query(`SELECT * FROM pages where title like ?;`, [`${prefix}%`]);
}

export async function batchInsertFiles(files: File[], BATCH_SIZE: number) {
  let i = 0;
  for (const batch of chunk(files, BATCH_SIZE)) {
    console.log(
      `Importing files batch ${i + 1} of ${Math.ceil(files.length / BATCH_SIZE)}`,
    );
    i++;
    await insertFiles(batch);
  }
}

export async function putFile(file: File) {
  const insert = db.prepare(
    "REPLACE INTO pages (id, title, path) VALUES (?, ?, ?)",
  );
  insert.run([file.pageId, file.title, file.path]);
  return file;
}

async function insertFiles(files: File[]) {
  const insert = db.prepare(
    "REPLACE INTO pages (id, title, path) VALUES (?, ?, ?)",
  );
  const insertMany = db.transaction((files: File[]) => {
    for (const file of files) {
      insert.run([file.pageId, file.title, file.path]);
    }
  });
  insertMany(files);
}
