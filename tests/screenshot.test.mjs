import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { inflateSync } from 'node:zlib';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cli = path.join(root, 'skills/web/scripts/screenshot.mjs');
const fixturePage = path.join(root, 'tests/fixtures/screenshot/page.html');

const animatedPage = path.join(root, 'tests/fixtures/screenshot/animated.html');

// PNG ヘッダーの 16〜19 バイト目（幅）を読む
const pngWidth = (file) => readFileSync(file).readUInt32BE(16);

// 8 ビットの RGB／RGBA でインターレースなしの PNG を復号し、(x, y) の [r, g, b] を返す関数を返す
function readPng(file) {
  const buf = readFileSync(file);
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  const [depth, colorType, , , interlace] = buf.subarray(24, 29);
  assert.equal(depth, 8);
  assert.equal(interlace, 0);
  const bpp = { 2: 3, 6: 4 }[colorType];
  assert.ok(bpp, `未対応の色の形式: ${colorType}`);
  const chunks = [];
  for (let i = 8; i < buf.length; ) {
    const len = buf.readUInt32BE(i);
    if (buf.toString('latin1', i + 4, i + 8) === 'IDAT') chunks.push(buf.subarray(i + 8, i + 8 + len));
    i += 12 + len;
  }
  const raw = inflateSync(Buffer.concat(chunks));
  const stride = width * bpp;
  const px = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? px[y * stride + x - bpp] : 0;
      const b = y > 0 ? px[(y - 1) * stride + x] : 0;
      const c = x >= bpp && y > 0 ? px[(y - 1) * stride + x - bpp] : 0;
      let pred = 0;
      if (filter === 1) pred = a;
      else if (filter === 2) pred = b;
      else if (filter === 3) pred = (a + b) >> 1;
      else if (filter === 4) {
        const p = a + b - c;
        const [pa, pb, pc] = [Math.abs(p - a), Math.abs(p - b), Math.abs(p - c)];
        pred = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      px[y * stride + x] = (line[x] + pred) & 0xff;
    }
  }
  return { width, height, at: (x, y) => [...px.subarray(y * stride + x * bpp, y * stride + x * bpp + 3)] };
}

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

test('falls back to playwright in the current project when the script lives elsewhere', { skip }, () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'shot-copy-'));
  try {
    const copy = path.join(dir, 'screenshot.mjs');
    copyFileSync(cli, copy);
    const out = path.join(dir, 'out');
    const r = spawnSync('node', [copy, fixturePage, '--out', out, '--widths', '390', '--themes', 'dark'], {
      cwd: root,
      // 全体に導入された playwright ではなく、カレントディレクトリのものが使われることを確かめる
      env: { ...process.env, NODE_PATH: '' },
      encoding: 'utf8',
    });
    assert.equal(r.status, 0, r.stderr);
    assert.equal(pngWidth(path.join(out, '390-dark.png')), 390);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('waits for entrance and scroll-triggered animations to settle', { skip }, async () => {
  const { captureScreenshots } = await import('../skills/web/scripts/screenshot.mjs');
  // 追加の待ち時間を 0 にして、アニメーションの完了待ちとスクロールだけで落ち着くことを確かめる
  const [file] = await captureScreenshots({
    target: animatedPage, outDir: path.join(tmp, 'animated'), widths: [390], themes: ['dark'], wait: 0,
  });
  const png = readPng(file);
  // 読み込み時に 900ms かけて現れる赤い箱
  assert.deepEqual(png.at(100, 100), [255, 0, 0]);
  // ページの下の方で、画面に入ると現れる緑の箱（200px の箱 + 3000px の余白の下）
  assert.deepEqual(png.at(100, 3300), [0, 255, 0]);
});

test('treats a bare host:port as an http URL', { skip }, async () => {
  const { captureScreenshots } = await import('../skills/web/scripts/screenshot.mjs');
  const html = readFileSync(fixturePage);
  const server = createServer((req, res) => res.end(html));
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  try {
    const target = `127.0.0.1:${server.address().port}`;
    const files = await captureScreenshots({ target, outDir: path.join(tmp, 'hostport'), widths: [390], themes: ['dark'] });
    assert.equal(pngWidth(files[0]), 390);
  } finally {
    server.close();
  }
});

test('reports a clear error when the page cannot be opened', { skip }, () => {
  for (const [target, shown] of [['localhost:9', 'http://localhost:9'], [path.join(tmp, 'missing.html'), 'missing.html']]) {
    const r = spawnSync('node', [cli, target, '--out', path.join(tmp, 'unreachable'), '--widths', '390', '--themes', 'dark'], {
      encoding: 'utf8',
    });
    assert.equal(r.status, 1, r.stderr);
    assert.match(r.stderr, /ページを開けませんでした/);
    assert.ok(r.stderr.includes(shown), r.stderr);
    assert.doesNotMatch(r.stderr, /\n\s+at /);
  }
});

test('rejects an invalid --wait', () => {
  const r = spawnSync('node', [cli, fixturePage, '--out', path.join(tmp, 'w'), '--wait', 'abc'], { encoding: 'utf8' });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /--wait は/);
});
