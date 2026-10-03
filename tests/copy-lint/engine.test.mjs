import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { extractText, lintCopySource, lintCopyPaths } from '../../skills/copywriting/scripts/lib/copy-engine.mjs';

const cli = fileURLToPath(new URL('../../skills/copywriting/scripts/lint-copy.mjs', import.meta.url));

const noFoo = {
  id: 'no-foo',
  check: (t) => [...t.matchAll(/foo/g)].map((m) => ({ index: m.index, message: 'foo は禁止' })),
};

function withDir(fn) {
  const dir = mkdtempSync(join(tmpdir(), 'copy-lint-'));
  try {
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test('reports file, line and rule', () => {
  assert.deepEqual(lintCopySource('a\nfoo\n', 'x.md', [noFoo]), [
    { file: 'x.md', line: 2, rule: 'no-foo', message: 'foo は禁止' },
  ]);
});
test('extractText keeps length and newlines', () => {
  const src = '<h1 className="a">foo</h1>\n';
  const t = extractText(src, 'x.tsx');
  assert.equal(t.length, src.length);
  assert.equal(t.indexOf('foo'), src.indexOf('foo'));
  assert.equal(t.endsWith('\n'), true);
});
test('scans jsx text and string literals with spaces or non-ascii', () => {
  const src = 'const a = "foo bar";\nconst b = "foo";\nconst c = "日本foo";\n<p>foo</p>\n';
  assert.deepEqual(lintCopySource(src, 'x.tsx', [noFoo]).map((v) => v.line), [1, 3, 4]);
});
test('ignores class attributes and import specifiers', () => {
  const src = 'import x from "foo lib";\n<div className="foo bar" class="foo x">ok</div>\n';
  assert.equal(lintCopySource(src, 'x.tsx', [noFoo]).length, 0);
});
test('ignores jsx expressions and comments', () => {
  const src = '<p>{items.map((foo) => foo)}</p>\n// foo bar\n/* foo bar */\n';
  assert.equal(lintCopySource(src, 'x.tsx', [noFoo]).length, 0);
});
test('scans html text and text attributes only', () => {
  const src = '<img alt="foo bar" src="foo bar.png">\n<p class="foo x">foo</p>\n';
  assert.deepEqual(lintCopySource(src, 'x.html', [noFoo]).map((v) => v.line), [1, 2]);
});
test('ignores code fences, script and style', () => {
  assert.equal(lintCopySource('```\nfoo\n```\n', 'x.md', [noFoo]).length, 0);
  assert.equal(lintCopySource('<script>foo</script><style>foo</style>\n', 'x.html', [noFoo]).length, 0);
});
test('suppression works in markdown and jsx comments', () => {
  const md = '<!-- copy-lint-disable-next-line no-foo -- 商品名の一部 -->\nfoo\nfoo\n';
  assert.deepEqual(lintCopySource(md, 'x.md', [noFoo]).map((v) => v.line), [3]);
  const jsx = '{/* copy-lint-disable-next-line no-foo -- 商品名の一部 */}\n<p>foo</p>\n';
  assert.equal(lintCopySource(jsx, 'x.tsx', [noFoo]).length, 0);
});
test('suppression without reason is itself a violation', () => {
  const v = lintCopySource('<!-- copy-lint-disable-next-line no-foo -->\nfoo\n', 'x.md', [noFoo]);
  assert.deepEqual(v.map((x) => x.rule).sort(), ['no-foo', 'suppression-without-reason']);
});
test('skips vendor directories and unknown extensions', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'copy-lint-'));
  try {
    mkdirSync(join(dir, 'src'));
    mkdirSync(join(dir, 'node_modules'));
    writeFileSync(join(dir, 'src', 'a.md'), 'foo\n');
    writeFileSync(join(dir, 'node_modules', 'b.md'), 'foo\n');
    writeFileSync(join(dir, 'c.css'), 'foo\n');
    const r = await lintCopyPaths([dir], { rules: [noFoo] });
    assert.equal(r.filesScanned, 1);
    assert.equal(r.violations.length, 1);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
test('cli exits 2 for a missing path', () => {
  const r = spawnSync('node', [cli, 'no/such/path']);
  assert.equal(r.status, 2);
  assert.match(r.stderr.toString(), /見つかりません/);
});
test('cli exits 2 without arguments', () => {
  const r = spawnSync('node', [cli]);
  assert.equal(r.status, 2);
  assert.match(r.stderr.toString(), /使い方: node lint-copy\.mjs/);
});
test('cli exits 0 for clean input', () =>
  withDir((dir) => {
    writeFileSync(join(dir, 'ok.md'), '\n');
    const r = spawnSync('node', [cli, dir]);
    assert.equal(r.status, 0);
    assert.match(r.stdout.toString(), /違反はありません/);
  }));
test('cli exits 1 for violations', () =>
  withDir((dir) => {
    writeFileSync(join(dir, 'bad.md'), '<!-- copy-lint-disable-next-line empty-word -->\n本文\n');
    const r = spawnSync('node', [cli, dir]);
    assert.equal(r.status, 1);
    assert.match(r.stdout.toString(), /bad\.md:1  suppression-without-reason/);
    assert.match(r.stdout.toString(), /件の違反/);
  }));
test('handles generics, text right before closing tags and nested expressions', () => {
  const src = [
    'const [a] = useState<boolean>(false);',
    '<p>It is {a ? <b>foo</b> : "x y"} foo</p>',
    'const after = 1; // foo bar',
    'foo();',
    '',
  ].join('\n');
  assert.deepEqual(lintCopySource(src, 'x.tsx', [noFoo]).map((v) => v.line), [2, 2]);
});
