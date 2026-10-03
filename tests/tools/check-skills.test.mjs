import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
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
test('detects a skill directory without SKILL.md', async () => {
  const d = await mkdtemp(`${tmpdir()}/cs-`);
  await mkdir(`${d}/skills/empty`, { recursive: true });
  assert.match((await checkSkills(d)).join('\n'), /skills\/empty.*SKILL\.md/);
});

test('scans README.md for denylisted terms', async () => {
  const d = await mkdtemp(`${tmpdir()}/cs-`);
  await writeFile(`${d}/README.md`, 'これは SecretName の説明である。\n');
  assert.match((await checkSkills(d, { denylist: ['secretname'] })).join('\n'), /README\.md.*secretname/);
});

const cli = fileURLToPath(new URL('../../tools/check-skills.mjs', import.meta.url));
const runCli = (listFile) =>
  spawnSync('node', [cli], { env: { ...process.env, REFERENCE_DENYLIST: listFile }, encoding: 'utf8' });

test('warns but passes when the denylist path does not exist', () => {
  const r = runCli('/nonexistent/denylist.txt');
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stderr, /警告.*存在しない/);
});
test('warns but passes when the denylist file is empty', async () => {
  const d = await mkdtemp(`${tmpdir()}/cs-`);
  await writeFile(`${d}/empty.txt`, '\n  \n');
  const r = runCli(`${d}/empty.txt`);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stderr, /警告.*空/);
});
