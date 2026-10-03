import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { readdir } from 'node:fs/promises';
import { extractTsxBlocks, checkRecipes } from '../../tools/check-recipes.mjs';

const fx = (n) => fileURLToPath(new URL(`../fixtures/recipes/${n}`, import.meta.url));
const outDir = fileURLToPath(new URL('../../.tmp/recipes', import.meta.url));

test('extracts only tsx blocks', () => {
  assert.deepEqual(extractTsxBlocks('```tsx\nA\n```\n```css\nB\n```'), ['A']);
});

test('extracts multiple tsx blocks with multi-line bodies', () => {
  assert.deepEqual(extractTsxBlocks('前置き\n```tsx\nA\nB\n```\n本文\n```tsx\nC\n```\n'), ['A\nB', 'C']);
});

test('flags a recipe that violates lint', async () => {
  const r = await checkRecipes(fx('bad'));
  assert.equal(r.lintViolations[0].rule, 'text-arrow');
});

test('reports type errors', async () => {
  assert.ok((await checkRecipes(fx('typeerr'))).typeErrors.length > 0);
});

test('passes a valid recipe and writes one file per tsx block', async () => {
  const r = await checkRecipes(fx('ok'));
  assert.deepEqual(r, { lintViolations: [], typeErrors: [] });
  assert.deepEqual((await readdir(outDir)).sort(), ['ok-1.tsx', 'ok-2.tsx']);
});

test('cleans previous output before writing', async () => {
  await checkRecipes(fx('bad'));
  const r = await checkRecipes(fx('typeerr'));
  assert.deepEqual(r.lintViolations, []);
  assert.deepEqual(await readdir(outDir), ['typeerr-1.tsx']);
});
