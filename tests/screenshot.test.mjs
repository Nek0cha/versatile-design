import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cli = path.join(root, 'skills/web/scripts/screenshot.mjs');
const fixturePage = path.join(root, 'tests/fixtures/screenshot/page.html');

// PNG ヘッダーの 16〜19 バイト目（幅）を読む
const pngWidth = (file) => readFileSync(file).readUInt32BE(16);

// ブラウザが起動できるかを一度だけ確認する。起動できなければ撮影テストをスキップする
async function browserSkipReason() {
  let chromium;
  try {
    ({ chromium } = await import('playwright'));
  } catch {
    return 'playwright が読み込めないためスキップする';
  }
  try {
    const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
    await b.close();
    return false;
  } catch {
    return 'ブラウザを起動できないためスキップする（CHROMIUM_PATH を設定すること）';
  }
}
const skip = await browserSkipReason();

const tmp = mkdtempSync(path.join(tmpdir(), 'shot-'));
test.after(() => rmSync(tmp, { recursive: true, force: true }));

test('captures every width and theme', { skip }, async () => {
  const { captureScreenshots } = await import('../skills/web/scripts/screenshot.mjs');
  const out = path.join(tmp, 'all');
  const files = await captureScreenshots({ target: fixturePage, outDir: out });
  assert.deepEqual(files.map((f) => path.basename(f)).sort(),
    ['1440-dark.png', '1440-light.png', '390-dark.png', '390-light.png']);
  assert.equal(pngWidth(files.find((f) => f.endsWith('390-dark.png'))), 390);
  assert.equal(pngWidth(files.find((f) => f.endsWith('1440-light.png'))), 1440);
});

test('themes differ', { skip }, async () => {
  const { captureScreenshots } = await import('../skills/web/scripts/screenshot.mjs');
  const files = await captureScreenshots({ target: fixturePage, outDir: path.join(tmp, 'themes'), widths: [390] });
  const dark = readFileSync(files.find((f) => f.endsWith('390-dark.png')));
  const light = readFileSync(files.find((f) => f.endsWith('390-light.png')));
  assert.notDeepEqual(dark, light);
});

test('CLI prints saved paths and exits 0', { skip }, () => {
  const out = path.join(tmp, 'cli');
  const r = spawnSync('node', [cli, fixturePage, '--out', out, '--widths', '390', '--themes', 'dark'], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(r.stdout.trim().split('\n'), [path.join(out, '390-dark.png')]);
});

test('reports a clear error when the browser cannot launch', () => {
  const r = spawnSync('node', [cli, fixturePage, '--out', path.join(tmp, 'bad')], {
    env: { ...process.env, CHROMIUM_PATH: '/nonexistent' },
  });
  assert.equal(r.status, 1);
  assert.match(r.stderr.toString(), /ブラウザを起動できませんでした/);
});
