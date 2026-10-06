// 部品のレシピと動きの資料（skills/web/references/ の components/*.md、motion-web.md、webgl.md）のコード例を検査するツールである。
// 各 ```tsx ブロックを .tmp/recipes/ に書き出し、lint と型検査を実行する。
import { execFile } from 'node:child_process';
import { mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { lintPaths, formatViolations } from '../skills/web/scripts/lib/lint-engine.mjs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(rootDir, '.tmp', 'recipes');
const tsconfig = path.join(rootDir, 'tools', 'recipes-tsconfig.json');
const tscBin = path.join(rootDir, 'node_modules', 'typescript', 'bin', 'tsc');

// ```tsx で始まるコードブロックの中身を、出てきた順に返す
export function extractTsxBlocks(markdown) {
  const blocks = [];
  for (const m of markdown.matchAll(/^```tsx[ \t]*\r?\n([\s\S]*?)\r?\n```[ \t]*$/gm)) blocks.push(m[1]);
  return blocks;
}

async function typeCheck() {
  try {
    await promisify(execFile)(process.execPath, [tscBin, '-p', tsconfig, '--noEmit', '--pretty', 'false'], {
      cwd: rootDir,
      maxBuffer: 16 * 1024 * 1024,
    });
    return [];
  } catch (err) {
    // tsc は型エラーがあると終了コード 2 で終わり、エラーを標準出力に書く
    const out = `${err.stdout ?? ''}${err.stderr ?? ''}`;
    const lines = out.split(/\r?\n/).filter((l) => l.trim());
    return lines.length ? lines : [String(err.message)];
  }
}

const NAMED_BLOCK = /^\/\/ ([\w-]+\.tsx?)(?:：.*)?$/;

// 1行目が「// <名前>.ts」のブロックはその名前で、それ以外は「資料名-番号.tsx」で書き出す
export function blockFileName(block, base, index) {
  const m = block.split(/\r?\n/, 1)[0].match(NAMED_BLOCK);
  return m ? m[1] : `${base}-${index}.tsx`;
}

async function listMarkdown(source) {
  if (source.endsWith('.md')) return [source];
  const names = (await readdir(source)).filter((n) => n.endsWith('.md')).sort();
  return names.map((n) => path.join(source, n));
}

export async function checkRecipes(sources) {
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });
  const owners = new Map();
  let written = 0;
  for (const source of sources) {
    for (const file of await listMarkdown(source)) {
      const base = path.basename(file, '.md');
      for (const [i, block] of extractTsxBlocks(await readFile(file, 'utf8')).entries()) {
        const name = blockFileName(block, base, i + 1);
        if (owners.has(name)) throw new Error(`名前付きのブロック ${name} が重複している（${owners.get(name)} と ${file}）`);
        owners.set(name, file);
        await writeFile(path.join(outDir, name), `${block}\n`);
        written++;
      }
    }
  }
  if (written === 0) return { lintViolations: [], typeErrors: [] };
  const { violations } = await lintPaths([outDir]);
  const typeErrors = await typeCheck();
  return { lintViolations: violations, typeErrors };
}

async function main() {
  const refs = path.join(rootDir, 'skills', 'web', 'references');
  const sources = [path.join(refs, 'components'), path.join(refs, 'motion-web.md')];
  if (await stat(path.join(refs, 'webgl.md')).then(() => true, () => false)) sources.push(path.join(refs, 'webgl.md'));
  const { lintViolations, typeErrors } = await checkRecipes(sources);
  console.log(formatViolations(lintViolations));
  for (const e of typeErrors) console.error(e);
  console.log(`${typeErrors.length} 件の型エラー`);
  if (lintViolations.length || typeErrors.length) process.exit(1);
  console.log('レシピの検査に合格した');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
