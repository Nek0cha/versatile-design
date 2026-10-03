import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { lintSource, lintPaths } from '../../skills/web/scripts/lib/lint-engine.mjs';

const cli = fileURLToPath(new URL('../../skills/web/scripts/lint-design.mjs', import.meta.url));
const fixtureDir = fileURLToPath(new URL('../fixtures/lint/engine', import.meta.url));

const noFoo = {
  id: 'no-foo',
  extensions: ['.tsx', '.css'],
  check: (s) => [...s.matchAll(/foo/g)].map((m) => ({ index: m.index, message: 'foo は禁止' })),
};

test('reports file, line and rule', () => {
  const v = lintSource('a\nfoo\n', 'x.tsx', [noFoo]);
  assert.deepEqual(v, [{ file: 'x.tsx', line: 2, rule: 'no-foo', message: 'foo は禁止' }]);
});
test('suppression applies to the next line only', () => {
  const src = '// design-lint-disable-next-line no-foo -- 意図的\nfoo\nfoo\n';
  assert.deepEqual(lintSource(src, 'x.tsx', [noFoo]).map((v) => v.line), [3]);
});
test('suppression without reason is itself a violation', () => {
  const v = lintSource('// design-lint-disable-next-line no-foo\nfoo\n', 'x.tsx', [noFoo]);
  assert.deepEqual(v.map((x) => x.rule).sort(), ['no-foo', 'suppression-without-reason']);
});
test('css block comments can suppress', () => {
  const src = '/* design-lint-disable-next-line no-foo -- 進捗バー */\nfoo\n';
  assert.equal(lintSource(src, 'x.css', [noFoo]).length, 0);
});
test('rules only run on their extensions', () => {
  assert.equal(lintSource('foo', 'x.md', [noFoo]).length, 0);
});
test('skips vendor directories', async () => {
  const r = await lintPaths([fixtureDir], { rules: [noFoo], projectRules: [] });
  assert.equal(r.filesScanned, 1);
  assert.equal(r.violations.length, 1);
});
test('missing path exits with code 2', () => {
  const r = spawnSync('node', [cli, 'no/such/path']);
  assert.equal(r.status, 2);
  assert.match(r.stderr.toString(), /見つかりません/);
});
test('clean input exits 0', () => {
  const dir = mkdtempSync(join(tmpdir(), 'lint-clean-'));
  try {
    writeFileSync(join(dir, 'ok.tsx'), 'const ok = 1;\n');
    const r = spawnSync('node', [cli, dir]);
    assert.equal(r.status, 0);
    assert.match(r.stdout.toString(), /違反はありません/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
