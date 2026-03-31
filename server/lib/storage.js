import { promises as fs } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

/**
 * This is a simple storage library for the server.
 * It uses the filesystem to store data for the knowledge bases and the chat history.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

export async function read(collection, id) {
  const filePath = path.join(DATA_DIR, collection, `${id}.json`);
  const raw = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(raw);
}

export async function write(collection, id, data) {
  const dir = path.join(DATA_DIR, collection);
  await ensureDir(dir);
  await fs.writeFile(
    path.join(dir, `${id}.json`),
    JSON.stringify(data, null, 2),
  );
}

export async function list(collection) {
  const dir = path.join(DATA_DIR, collection);
  await ensureDir(dir);
  const files = await fs.readdir(dir);
  return files
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.replace('.json', ''));
}

export async function remove(collection, id) {
  const filePath = path.join(DATA_DIR, collection, `${id}.json`);
  await fs.unlink(filePath).catch(() => {});
}

export async function removeAll(collection) {
  const dir = path.join(DATA_DIR, collection);
  await ensureDir(dir);
  const files = await fs.readdir(dir);
  await Promise.all(
    files
      .filter((f) => f.endsWith('.json'))
      .map((f) => fs.unlink(path.join(dir, f))),
  );
}

export async function exists(collection, id) {
  const filePath = path.join(DATA_DIR, collection, `${id}.json`);
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
