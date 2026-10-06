import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { readdir } from 'node:fs/promises';
import { extractTsxBlocks, checkRecipes, blockFileName } from '../../tools/check-recipes.mjs';

const fx = (n) => fileURLToPath(new URL(`../fixtures/recipes/${n}`, import.meta.url));
const outDir = fileURLToPath(new URL('../../.tmp/recipes', import.meta.url));

test('extracts only tsx blocks', () => {
  assert.deepEqual(extractTsxBlocks('```tsx\nA\n```\n```css\nB\n```'), ['A']);
});

test('extracts multiple tsx blocks with multi-line bodies', () => {
  assert.deepEqual(extractTsxBlocks('前置き\n```tsx\nA\nB\n```\n本文\n```tsx\nC\n```\n'), ['A\nB', 'C']);
});

test('flags a recipe that violates lint', async () => {
  const r = await checkRecipes([fx('bad')]);
  assert.equal(r.lintViolations[0].rule, 'text-arrow');
});

test('reports type errors', async () => {
  assert.ok((await checkRecipes([fx('typeerr')])).typeErrors.length > 0);
});

test('passes a valid recipe and writes one file per tsx block', async () => {
  const r = await checkRecipes([fx('ok')]);
  assert.deepEqual(r, { lintViolations: [], typeErrors: [] });
  assert.deepEqual((await readdir(outDir)).sort(), ['ok-1.tsx', 'ok-2.tsx']);
});

test('cleans previous output before writing', async () => {
  await checkRecipes([fx('bad')]);
  const r = await checkRecipes([fx('typeerr')]);
  assert.deepEqual(r.lintViolations, []);
  assert.deepEqual(await readdir(outDir), ['typeerr-1.tsx']);
});

test('names a block by its first-line file comment', () => {
  assert.equal(blockFileName('// gsap-setup.ts\nexport {};', 'motion-web', 3), 'gsap-setup.ts');
  assert.equal(blockFileName('// motion-tokens.ts：説明\nexport {};', 'motion-web', 1), 'motion-tokens.ts');
  assert.equal(blockFileName('// Scene.tsx\nexport {};', 'webgl', 2), 'Scene.tsx');
  assert.equal(blockFileName('// 黒い面のラベル\nexport {};', 'mode-site', 1), 'mode-site-1.tsx');
  assert.equal(blockFileName('export const a = 1;', 'x', 2), 'x-2.tsx');
});

test('resolves named blocks across markdown files', async () => {
  const r = await checkRecipes([fx('cross/a.md'), fx('cross/b.md')]);
  assert.deepEqual(r, { lintViolations: [], typeErrors: [] });
  assert.deepEqual((await readdir(outDir)).sort(), ['b-1.tsx', 'shared-setup.ts']);
});

test('fails on duplicate named blocks', async () => {
  await assert.rejects(checkRecipes([fx('dup')]), /same\.ts.*重複/);
});
