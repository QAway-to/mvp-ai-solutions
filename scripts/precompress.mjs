import { createReadStream, createWriteStream } from 'node:fs';
import { readdir, stat } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { createBrotliCompress, createGzip, constants } from 'node:zlib';

/**
 * Кладёт рядом с каждым текстовым файлом сборки его .br и .gz версии.
 *
 * Web Service на Render отдаёт ровно то, что лежит на диске: сжимать ответы
 * на лету некому. Без этого шага HTML и CSS уезжают посетителю в полном
 * размере — на мобильном интернете это заметные секунды.
 */

const DIST = new URL('../dist/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const COMPRESSIBLE = new Set(['.html', '.css', '.js', '.json', '.svg', '.xml', '.txt']);

// Файлы меньше килобайта после сжатия обычно не выигрывают ничего.
const MIN_BYTES = 1024;

const walk = async (dir) => {
  const entries = await readdir(dir, { withFileTypes: true });

  return (
    await Promise.all(
      entries.map((entry) => {
        const path = join(dir, entry.name);
        return entry.isDirectory() ? walk(path) : Promise.resolve([path]);
      }),
    )
  ).flat();
};

const compress = async (path, extension, createCodec) =>
  pipeline(createReadStream(path), createCodec(), createWriteStream(`${path}${extension}`));

const files = await walk(DIST);
let done = 0;

for (const path of files) {
  if (!COMPRESSIBLE.has(extname(path))) continue;
  if ((await stat(path)).size < MIN_BYTES) continue;

  await compress(path, '.br', () =>
    createBrotliCompress({
      params: { [constants.BROTLI_PARAM_QUALITY]: 11 },
    }),
  );
  await compress(path, '.gz', () => createGzip({ level: 9 }));
  done += 1;
}

process.stdout.write(`Предсжато файлов: ${done}\n`);
