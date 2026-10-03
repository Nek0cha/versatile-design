#!/usr/bin/env node
// 使い方: node screenshot.mjs <target> --out <dir> [--widths 1440,390] [--themes dark,light]
// target は URL またはローカルファイルのパスである。
import { mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const DEFAULT_WIDTHS = [1440, 390];
const DEFAULT_THEMES = ['dark', 'light'];

class UserError extends Error {}

// URL ならそのまま、そうでなければローカルファイルとして file:// に変換する
function toUrl(target) {
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(target)) return target;
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

export async function captureScreenshots({ target, outDir, widths = DEFAULT_WIDTHS, themes = DEFAULT_THEMES }) {
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
          await page.goto(url, { waitUntil: 'load' });
          await page.evaluate((t) => { document.documentElement.dataset.theme = t; }, theme);
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
  const opts = { target: undefined, outDir: undefined, widths: DEFAULT_WIDTHS, themes: DEFAULT_THEMES };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--out') opts.outDir = argv[++i];
    else if (a === '--widths') {
      opts.widths = String(argv[++i]).split(',').map(Number);
      if (opts.widths.some((w) => !Number.isInteger(w) || w <= 0)) throw new UserError('--widths は正の整数をカンマ区切りで指定すること。');
    } else if (a === '--themes') {
      opts.themes = String(argv[++i]).split(',');
      if (opts.themes.some((t) => !DEFAULT_THEMES.includes(t))) throw new UserError('--themes は dark と light のみ指定できる。');
    } else if (!opts.target) opts.target = a;
    else throw new UserError(`不明な引数: ${a}`);
  }
  if (!opts.target || !opts.outDir) {
    throw new UserError('使い方: node screenshot.mjs <target> --out <dir> [--widths 1440,390] [--themes dark,light]');
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
