import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { checkSkills } from '../../tools/check-skills.mjs';

const fx = (n) => fileURLToPath(new URL(`../fixtures/skills/${n}`, import.meta.url));
const okDir = fx('ok');

test('passes a valid skill', async () => assert.deepEqual(await checkSkills(okDir), []));
test('detects name mismatch', async () => assert.match((await checkSkills(fx('bad-name')))[0], /name/));
test('detects missing reference', async () =>
  assert.match((await checkSkills(fx('missing-ref')))[0], /references\/nope\.md/));
test('detects denylisted term case-insensitively', async () =>
  assert.match((await checkSkills(okDir, { denylist: ['secretname'] })).join('\n'), /secretname/));
test('handles a root without skills dir', async () => {
  const d = await mkdtemp(`${tmpdir()}/cs-`);
  assert.deepEqual(await checkSkills(d, { denylist: ['x'] }), []);
});
