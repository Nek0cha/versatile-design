// 部品のレシピ（skills/web/references/components/*.md）のコード例を検査するツールである。
// 各 ```tsx ブロックを .tmp/recipes/ に書き出し、lint と型検査を実行する。
import { execFile } from 'node:child_process';
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
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

export async function checkRecipes(componentsDir) {
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });
  const names = (await readdir(componentsDir)).filter((n) => n.endsWith('.md')).sort();
  let written = 0;
  for (const name of names) {
    const blocks = extractTsxBlocks(await readFile(path.join(componentsDir, name), 'utf8'));
    for (const [i, block] of blocks.entries()) {
      await writeFile(path.join(outDir, `${path.basename(name, '.md')}-${i + 1}.tsx`), `${block}\n`);
      written++;
    }
  }
  if (written === 0) return { lintViolations: [], typeErrors: [] };
  const { violations } = await lintPaths([outDir]);
  const typeErrors = await typeCheck();
  return { lintViolations: violations, typeErrors };
}

async function main() {
  const componentsDir = path.join(rootDir, 'skills', 'web', 'references', 'components');
  const { lintViolations, typeErrors } = await checkRecipes(componentsDir);
  console.log(formatViolations(lintViolations));
  for (const e of typeErrors) console.error(e);
  console.log(`${typeErrors.length} 件の型エラー`);
  if (lintViolations.length || typeErrors.length) process.exit(1);
  console.log('レシピの検査に合格した');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
