import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  rules,
  STRONG_EMPTY_WORDS_JA,
  WEAK_EMPTY_WORDS_JA,
  EMPTY_WORDS_EN,
  STOCK_PHRASES,
} from '../../skills/copywriting/scripts/lib/copy-rules.mjs';

const read = (name) => readFile(new URL(`../../skills/copywriting/references/${name}`, import.meta.url), 'utf8');

test('every listed word appears in anti-patterns.md', async () => {
  const doc = (await read('anti-patterns.md')).toLowerCase();
  for (const w of [...STRONG_EMPTY_WORDS_JA, ...WEAK_EMPTY_WORDS_JA, ...EMPTY_WORDS_EN, ...STOCK_PHRASES]) {
    const term = w.toLowerCase().replace(/、$/, '');
    assert.ok(doc.includes(term), `${w} が anti-patterns.md にない`);
  }
});
test('every rule id is documented in anti-patterns.md or body.md', async () => {
  const docs = (await read('anti-patterns.md')) + (await read('body.md'));
  for (const r of rules) assert.ok(docs.includes(`\`${r.id}\``), `${r.id} がどちらにもない`);
});
