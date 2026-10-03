#!/usr/bin/env node
// 使い方: node screenshot.mjs <target> --out <dir> [--widths 1440,390] [--themes dark,light] [--wait 1500]
// target は URL、`localhost:5173` のようなホストとポート、またはローカルファイルのパスである。
import { mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const DEFAULT_WIDTHS = [1440, 390];
const DEFAULT_THEMES = ['dark', 'light'];
const DEFAULT_WAIT = 1500;
// 有限のアニメーションの完了を待つ上限（ミリ秒）
const ANIMATION_TIMEOUT = 5000;
const USAGE = '使い方: node screenshot.mjs <target> --out <dir> [--widths 1440,390] [--themes dark,light] [--wait 1500]';

class UserError extends Error {}

// URL ならそのまま、ホストとポートだけなら http:// を補い、そうでなければローカルファイルとして file:// に変換する
export function toUrl(target) {
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(target)) return target;
  if (/^[\w.-]+:\d+(\/|$)/.test(target)) return `http://${target}`;
  return pathToFileURL(path.resolve(target)).href;
}

// スクリプトの置き場所から探し、見つからなければコマンドを実行したプロジェクト（カレントディレクトリ）から探す
async function loadChromium() {
  try {
    return (await import('playwright')).chromium;
  } catch {
    // スキルの置き場所に playwright がない場合は、次に進む
  }
  try {
    const mod = createRequire(path.join(process.cwd(), 'noop.js'))('playwright');
    const chromium = mod.chromium ?? mod.default?.chromium;
    if (chromium) return chromium;
  } catch {
    // どちらにもない場合は、下で導入方法を示す
  }
  throw new UserError(
    'playwright を読み込めなかった。コマンドを実行するプロジェクトで `npm i -D playwright`、' +
      'またはこのスキルのディレクトリで `npm i playwright` を実行して導入すること。',
  );
}

// 撮影前にページを落ち着かせる。フォントの読み込み、スクロールで現れる要素、入場のアニメーションを待つ
async function settle(page, wait) {
  await page.evaluate(() => document.fonts.ready);
  // 下端まで少しずつスクロールし、IntersectionObserver などで現れる要素を表示させてから先頭に戻る
  await page.evaluate(async () => {
    const pause = () => new Promise((r) => setTimeout(r, 100));
    const step = Math.max(1, Math.floor(window.innerHeight * 0.8));
    for (let i = 0, y = 0; i < 50 && y < document.documentElement.scrollHeight; i++, y += step) {
      window.scrollTo(0, y);
      await pause();
    }
    window.scrollTo(0, document.documentElement.scrollHeight);
    await pause();
    window.scrollTo(0, 0);
    await pause();
  });
  // 無限に繰り返すもの以外のアニメーションと transition の完了を、上限つきで待つ
  await page.evaluate(
    (timeout) =>
      Promise.race([
        Promise.all(
          document
            .getAnimations()
            .filter((a) => a.effect?.getTiming().iterations !== Infinity)
            .map((a) => a.finished.catch(() => {})),
        ),
        new Promise((r) => setTimeout(r, timeout)),
      ]),
    ANIMATION_TIMEOUT,
  );
  if (wait > 0) await page.waitForTimeout(wait);
}

export async function captureScreenshots({
  target,
  outDir,
  widths = DEFAULT_WIDTHS,
  themes = DEFAULT_THEMES,
  wait = DEFAULT_WAIT,
}) {
  const chromium = await loadChromium();
  let browser;
  try {
    browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  } catch (e) {
    throw new UserError(`ブラウザを起動できませんでした: ${String(e.message).split('\n')[0]}`);
  }
  const saved = [];
  try {
    await mkdir(outDir, { recursive: true });
    const url = toUrl(target);
    for (const width of widths) {
      for (const theme of themes) {
        const context = await browser.newContext({ viewport: { width, height: 900 } });
        try {
          const page = await context.newPage();
          await page.emulateMedia({ colorScheme: theme });
          // 描画が始まる前に data-theme を付け、テーマの切り替えの transition が撮影に写らないようにする
          await page.addInitScript((t) => {
            const apply = () => document.documentElement && (document.documentElement.dataset.theme = t);
            if (!apply()) new MutationObserver((_, o) => apply() && o.disconnect()).observe(document, { childList: true });
          }, theme);
          try {
            await page.goto(url, { waitUntil: 'load' });
          } catch (e) {
            throw new UserError(`ページを開けませんでした: ${url}（${String(e.message).split('\n')[0]}）`);
          }
          // ページ自身のスクリプトが data-theme を書き換えた場合に備えて、読み込み後にも付け直す
          await page.evaluate((t) => { document.documentElement.dataset.theme = t; }, theme);
          await settle(page, wait);
          const file = path.join(outDir, `${width}-${theme}.png`);
          await page.screenshot({ path: file, fullPage: true });
          saved.push(file);
        } finally {
          await context.close();
        }
      }
    }
  } finally {
    await browser.close();
  }
  return saved;
}

function parseArgs(argv) {
  const opts = { target: undefined, outDir: undefined, widths: DEFAULT_WIDTHS, themes: DEFAULT_THEMES, wait: DEFAULT_WAIT };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--out') opts.outDir = argv[++i];
    else if (a === '--widths') {
      opts.widths = String(argv[++i]).split(',').map(Number);
      if (opts.widths.some((w) => !Number.isInteger(w) || w <= 0)) throw new UserError('--widths は正の整数をカンマ区切りで指定すること。');
    } else if (a === '--themes') {
      opts.themes = String(argv[++i]).split(',');
      if (opts.themes.some((t) => !DEFAULT_THEMES.includes(t))) throw new UserError('--themes は dark と light のみ指定できる。');
    } else if (a === '--wait') {
      opts.wait = Number(argv[++i]);
      if (!Number.isInteger(opts.wait) || opts.wait < 0) throw new UserError('--wait は 0 以上の整数（ミリ秒）で指定すること。');
    } else if (!opts.target) opts.target = a;
    else throw new UserError(`不明な引数: ${a}`);
  }
  if (!opts.target || !opts.outDir) {
    throw new UserError(USAGE);
  }
  return opts;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const files = await captureScreenshots(parseArgs(process.argv.slice(2)));
    console.log(files.join('\n'));
  } catch (e) {
    if (!(e instanceof UserError)) throw e;
    console.error(e.message);
    process.exit(1);
  }
}
