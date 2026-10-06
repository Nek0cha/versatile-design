import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { lintSource, lintPaths } from '../../skills/web/scripts/lib/lint-engine.mjs';
import { rules, projectRules } from '../../skills/web/scripts/lib/lint-rules.mjs';

const motionDir = fileURLToPath(new URL('../fixtures/lint/rules/reduced-motion', import.meta.url));

// 指定したルールの違反だけを取り出す
function hits(src, file, id) {
  return lintSource(src, file, rules).filter((v) => v.rule === id);
}

test('exports the expected rule ids', () => {
  for (const rule of rules) {
    for (const ext of rule.extensions) assert.match(ext, /^\.\w+$/);
  }
  const ids = rules.map((r) => r.id).sort();
  assert.deepEqual(ids, [
    'default-easing',
    'default-favicon',
    'emoji-icon',
    'generic-font-only',
    'gradient-text',
    'mono-label',
    'native-number-input',
    'native-select',
    'purple-blue-gradient',
    'rounded-accent-rail',
    'tailwind-default-palette',
    'text-arrow',
    'transition-all',
  ]);
  assert.deepEqual(projectRules.map((r) => r.id), ['no-reduced-motion']);
});

// text-arrow
test('text-arrow flags arrows in buttons and links', () => {
  assert.equal(hits('<button>次へ →</button>', 'x.tsx', 'text-arrow').length, 1);
  assert.equal(hits('<a href="/x">詳しく ›</a>', 'x.html', 'text-arrow').length, 1);
  assert.equal(hits('<Link to="/x">もっと見る »</Link>', 'x.jsx', 'text-arrow').length, 1);
  assert.equal(
    hits('<Button onClick={() => go(1)}>\n  <span>開く ▼</span>\n</Button>', 'x.tsx', 'text-arrow').length,
    1,
  );
});
test('text-arrow reports the line of the arrow', () => {
  const v = hits('<button>\n  次へ\n  →\n</button>', 'x.tsx', 'text-arrow');
  assert.deepEqual(v.map((x) => x.line), [3]);
  assert.match(v[0].message, /。/);
});
test('text-arrow does not apply to list items or expressions', () => {
  assert.equal(hits('<li>A → B</li>', 'x.tsx', 'text-arrow').length, 0);
  assert.equal(hits("<button>{'→'}</button>", 'x.tsx', 'text-arrow').length, 0);
  assert.equal(hits('<button><Icon icon="ph:arrow-right" />次へ</button>', 'x.tsx', 'text-arrow').length, 0);
  assert.equal(hits('<button>次へ →</button>', 'x.css', 'text-arrow').length, 0);
});

// emoji-icon
test('emoji-icon flags emoji in buttons, links and list items', () => {
  assert.equal(hits('<button>🚀 始める</button>', 'x.tsx', 'emoji-icon').length, 1);
  assert.equal(hits('<li>✅ 高速</li>', 'x.html', 'emoji-icon').length, 1);
  assert.equal(hits('<a href="#">⭐ お気に入り</a>', 'x.jsx', 'emoji-icon').length, 1);
});
test('emoji-icon ignores plain text and symbols such as copyright', () => {
  assert.equal(hits('<li>© 2026 サンプル</li>', 'x.tsx', 'emoji-icon').length, 0);
  assert.equal(hits('<button>保存</button>', 'x.tsx', 'emoji-icon').length, 0);
  assert.equal(hits('<button>{icon}</button>', 'x.tsx', 'emoji-icon').length, 0);
});
test('an arrow that is also pictographic is reported once in a button', () => {
  const v = lintSource('<a href="/x">外部 ↗</a>', 'x.tsx', rules);
  assert.deepEqual(v.map((x) => x.rule), ['text-arrow']);
});
test('ignores arrows and emoji outside interactive elements', () => {
  const src = '<p>手順 A → B 🎉</p>\n<div>{message.text}</div>';
  assert.equal(lintSource(src, 'x.tsx', rules).length, 0);
});

// tailwind-default-palette
test('tailwind-default-palette flags default palette classes', () => {
  assert.equal(hits('<div className="bg-blue-500" />', 'x.tsx', 'tailwind-default-palette').length, 1);
  assert.equal(
    hits('<div className="hover:text-slate-900 border-zinc-200/50 ring-indigo-950" />', 'x.tsx', 'tailwind-default-palette')
      .length,
    3,
  );
  assert.equal(hits('.x { @apply bg-gray-50; }', 'x.css', 'tailwind-default-palette').length, 1);
});
test('does not flag white, black, arbitrary values or custom tokens', () => {
  const src = '<div className="bg-white text-black bg-[var(--accent)] text-accent-500 border-ink-200" />';
  assert.equal(lintSource(src, 'x.tsx', rules).length, 0);
});
test('tailwind-default-palette does not flag lookalike classes', () => {
  assert.equal(hits('<div className="bg-blue-5000 my-bg-red-500 text-red-500x" />', 'x.tsx', 'tailwind-default-palette').length, 0);
});

// gradient-text
test('gradient-text flags tailwind gradient text', () => {
  const src = '<h1 className="bg-gradient-to-r from-ink to-accent bg-clip-text text-transparent">見出し</h1>';
  assert.equal(hits(src, 'x.tsx', 'gradient-text').length, 1);
  const v4 = '<h1 className={cn("bg-linear-to-r", "bg-clip-text")}>見出し</h1>';
  assert.equal(hits(v4, 'x.tsx', 'gradient-text').length, 1);
});
test('gradient-text flags css gradient text', () => {
  const src = '.title {\n  background: linear-gradient(90deg, #111, #555);\n  -webkit-background-clip: text;\n  background-clip: text;\n}';
  assert.equal(hits(src, 'x.css', 'gradient-text').length, 1);
});
test('gradient-text ignores gradients and clip-text kept apart', () => {
  const src = '<div className="bg-gradient-to-r from-ink to-accent" />\n<span className="bg-clip-text" />';
  assert.equal(hits(src, 'x.tsx', 'gradient-text').length, 0);
  const css = '.a { background: linear-gradient(#111, #555); }\n.b { background-clip: text; }';
  assert.equal(hits(css, 'x.css', 'gradient-text').length, 0);
});

// purple-blue-gradient
test('purple-blue-gradient flags tailwind purple to blue', () => {
  const src = '<div className="bg-gradient-to-r from-purple-500 to-blue-500" />';
  assert.equal(hits(src, 'x.tsx', 'purple-blue-gradient').length, 1);
});
test('purple-blue-gradient flags css gradients whose colors are all blue to purple', () => {
  const src = '.hero { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); }';
  assert.equal(hits(src, 'x.css', 'purple-blue-gradient').length, 1);
});
test('purple-blue-gradient ignores other gradients', () => {
  assert.equal(hits('<div className="from-orange-500 to-blue-500" />', 'x.tsx', 'purple-blue-gradient').length, 0);
  assert.equal(hits('.a { background: linear-gradient(#6366f1, #f97316); }', 'x.css', 'purple-blue-gradient').length, 0);
  assert.equal(hits('.a { background: linear-gradient(#fff, #000); }', 'x.css', 'purple-blue-gradient').length, 0);
  assert.equal(hits('.a { background: linear-gradient(var(--a), var(--b)); }', 'x.css', 'purple-blue-gradient').length, 0);
});

// generic-font-only
test('generic-font-only flags stacks made only of generic fonts', () => {
  assert.equal(hits('body { font-family: Inter, sans-serif; }', 'x.css', 'generic-font-only').length, 1);
  assert.equal(
    hits('body { font-family: system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }', 'x.css', 'generic-font-only')
      .length,
    1,
  );
  assert.equal(hits('@theme { --font-sans: "Poppins", sans-serif; }', 'x.css', 'generic-font-only').length, 1);
  assert.equal(hits('<p style="font-family: Arial">x</p>', 'x.html', 'generic-font-only').length, 1);
});
test('generic-font-only accepts a chosen typeface', () => {
  assert.equal(hits('body { font-family: "Instrument Sans", Inter, sans-serif; }', 'x.css', 'generic-font-only').length, 0);
  assert.equal(hits('code { font-family: monospace; }', 'x.css', 'generic-font-only').length, 0);
  assert.equal(hits('body { font-family: var(--font-body); }', 'x.css', 'generic-font-only').length, 0);
  assert.equal(hits('@theme { --font-weight-bold: 700; }', 'x.css', 'generic-font-only').length, 0);
  assert.equal(hits('body { font-family: Inter, sans-serif; }', 'x.jsx', 'generic-font-only').length, 0);
});

// native-select / native-number-input
test('native-select flags select elements', () => {
  assert.equal(hits('<select name="a"><option>1</option></select>', 'x.html', 'native-select').length, 1);
  assert.equal(hits('<Select label="a" />', 'x.tsx', 'native-select').length, 0);
});
test('native-number-input flags number inputs', () => {
  assert.equal(hits('<input type="number" />', 'x.tsx', 'native-number-input').length, 1);
  assert.equal(hits("<input type='number'>", 'x.html', 'native-number-input').length, 1);
  assert.equal(hits('<input type="text" inputMode="numeric" />', 'x.tsx', 'native-number-input').length, 0);
});

// transition-all
test('transition-all flags the class and css', () => {
  assert.equal(hits('<div className="transition-all duration-200" />', 'x.tsx', 'transition-all').length, 1);
  assert.equal(hits('.a { transition: all 0.2s var(--ease-out); }', 'x.css', 'transition-all').length, 1);
  assert.equal(hits('.a { transition-property: all; }', 'x.css', 'transition-all').length, 1);
});
test('transition-all ignores explicit properties', () => {
  assert.equal(hits('<div className="transition-colors transition-allow" />', 'x.tsx', 'transition-all').length, 0);
  assert.equal(hits('.a { transition: opacity 0.2s var(--ease-out); }', 'x.css', 'transition-all').length, 0);
});

// default-easing
test('default-easing flags default easing classes', () => {
  assert.equal(hits('<div className="ease-in-out" />', 'x.tsx', 'default-easing').length, 1);
  assert.equal(hits('<div className="hover:ease-linear ease-out" />', 'x.tsx', 'default-easing').length, 2);
});
test('default-easing flags default keywords and missing timing functions in css', () => {
  assert.equal(hits('.a { transition: opacity 0.2s ease; }', 'x.css', 'default-easing').length, 1);
  assert.equal(hits('.a { animation: spin 1s linear infinite; }', 'x.css', 'default-easing').length, 1);
  assert.equal(hits('.a { transition-timing-function: ease-in-out; }', 'x.css', 'default-easing').length, 1);
  assert.equal(hits('.a { transition: opacity 200ms; }', 'x.css', 'default-easing').length, 1);
  assert.equal(
    hits('.a { transition: opacity 0.2s var(--ease-out), transform 300ms; }', 'x.css', 'default-easing').length,
    1,
  );
});
test('default-easing accepts custom easing', () => {
  assert.equal(hits('<div className="ease-[cubic-bezier(0.2,0,0,1)] ease-out-quint" />', 'x.tsx', 'default-easing').length, 0);
  assert.equal(hits('.a { transition: opacity 0.2s var(--ease-out-quint); }', 'x.css', 'default-easing').length, 0);
  assert.equal(hits('.a { transition: transform 0.3s cubic-bezier(0.2, 0, 0, 1); }', 'x.css', 'default-easing').length, 0);
  assert.equal(hits('.a { transition: none; }', 'x.css', 'default-easing').length, 0);
  assert.equal(hits('.a { animation: fade 1s linear(0, 0.5, 1); }', 'x.css', 'default-easing').length, 0);
});

// default-favicon
test('default-favicon flags a head without an icon link', () => {
  const v = hits('<!doctype html>\n<html>\n<head>\n<title>x</title>\n</head>\n</html>', 'index.html', 'default-favicon');
  assert.equal(v.length, 1);
  assert.equal(v[0].line, 3);
  assert.equal(hits('<div>no head here</div>', 'part.html', 'default-favicon').length, 0);
  assert.equal(hits('<header>x</header>', 'part.html', 'default-favicon').length, 0);
});
test('default-favicon flags template favicons', () => {
  const vite = '<head>\n<link rel="icon" type="image/svg+xml" href="/vite.svg" />\n</head>';
  const v = hits(vite, 'index.html', 'default-favicon');
  assert.equal(v.length, 1);
  assert.equal(v[0].line, 2);
  assert.equal(hits("<head><link href='/react.svg' rel='shortcut icon'></head>", 'index.html', 'default-favicon').length, 1);
});
test('default-favicon accepts a custom favicon', () => {
  assert.equal(
    hits('<head>\n<link rel="icon" href="/favicon.svg" type="image/svg+xml" />\n</head>', 'index.html', 'default-favicon').length,
    0,
  );
  // apple-touch-icon だけではタブのファビコンにならない
  assert.equal(hits('<head><link rel="apple-touch-icon" href="/a.png"></head>', 'index.html', 'default-favicon').length, 1);
  // コメントの中の指定は数えない
  assert.equal(hits('<head><!-- <link rel="icon" href="/favicon.svg"> --></head>', 'index.html', 'default-favicon').length, 1);
  // tsx は対象外（Next.js などは別の仕組みでファビコンを指定する）
  assert.equal(hits('<head></head>', 'x.tsx', 'default-favicon').length, 0);
});

// no-reduced-motion
test('no-reduced-motion is satisfied by any file in the project', async () => {
  const both = await lintPaths([motionDir], { rules: [], projectRules });
  assert.equal(both.violations.length, 0);
  const onlyA = await lintPaths([join(motionDir, 'a.css')], { rules: [], projectRules });
  assert.equal(onlyA.violations.length, 1);
  assert.equal(onlyA.violations[0].rule, 'no-reduced-motion');
  assert.equal(onlyA.violations[0].line, 1);
  assert.equal(onlyA.violations[0].file, join(motionDir, 'a.css'));
});
test('no-reduced-motion reports once at the first occurrence', () => {
  const [rule] = projectRules;
  const files = [
    { path: 'a.tsx', source: 'const x = 1;\n' },
    { path: 'b.tsx', source: "\nimport { motion } from 'motion/react';\nimport gsap from 'gsap';\n" },
    { path: 'c.css', source: '@keyframes x {}' },
  ];
  const v = rule.check(files);
  assert.equal(v.length, 1);
  assert.equal(v[0].file, 'b.tsx');
  assert.equal(v[0].line, 2);
  assert.equal(rule.check([...files, { path: 'd.tsx', source: 'useReducedMotion()' }]).length, 0);
  assert.equal(rule.check([{ path: 'a.css', source: '.a { color: red; }' }]).length, 0);
});

// 境界の確認
test('a self-closing link does not swallow later text', () => {
  const src = '<Link to="/" />\n<p>A → B</p>\n<Link to="/b">次</Link>';
  assert.equal(hits(src, 'x.tsx', 'text-arrow').length, 0);
});
test('default-easing reports a css declaration once', () => {
  assert.equal(hits('.a { animation: spin 1s ease-in-out infinite; }', 'x.css', 'default-easing').length, 1);
  assert.equal(hits('.a { @apply ease-in-out; }', 'x.css', 'default-easing').length, 1);
});
test('a directive comment does not hide a violation earlier on its line', () => {
  const tsx = '<button>次へ →</button> {/* design-lint-disable-next-line text-arrow -- 次の行は意図的 */}\n<button>戻る ←</button>';
  assert.deepEqual(hits(tsx, 'x.tsx', 'text-arrow').map((v) => v.line), [1]);
  const css = '.a { transition: all 0.2s var(--e); } /* design-lint-disable-next-line transition-all -- 理由 */\n.b { transition: all 0.2s var(--e); }';
  assert.deepEqual(hits(css, 'x.css', 'transition-all').map((v) => v.line), [1]);
});

// 最終レビューの指摘への対応
test('generic-font-only flags system font stacks', () => {
  assert.equal(
    hits('body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }', 'x.css', 'generic-font-only').length,
    1,
  );
  assert.equal(
    hits(
      '@theme { --font-sans: ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"; }',
      'x.css',
      'generic-font-only',
    ).length,
    1,
  );
  assert.equal(hits('body { font-family: "Helvetica Neue", "Noto Sans", sans-serif; }', 'x.css', 'generic-font-only').length, 1);
  assert.equal(
    hits('body { font-family: "Instrument Sans", BlinkMacSystemFont, sans-serif; }', 'x.css', 'generic-font-only').length,
    0,
  );
});
test('no-reduced-motion accepts tailwind motion-reduce and motion-safe variants', () => {
  const [rule] = projectRules;
  const anim = { path: 'a.css', source: '@keyframes x {}' };
  assert.equal(rule.check([anim]).length, 1);
  assert.equal(rule.check([anim, { path: 'b.tsx', source: '<div className="motion-reduce:animate-none" />' }]).length, 0);
  assert.equal(rule.check([anim, { path: 'b.tsx', source: '<div className="motion-safe:animate-fade" />' }]).length, 0);
});
test('no-reduced-motion detects three imports', () => {
  const [rule] = projectRules;
  const scene = { path: 'Scene.tsx', source: 'import * as THREE from "three";\n' };
  assert.equal(rule.check([scene]).length, 1);
  assert.equal(rule.check([{ path: 'a.tsx', source: "import { Mesh } from 'three';" }]).length, 1);
  assert.equal(
    rule.check([scene, { path: 'b.tsx', source: 'matchMedia("(prefers-reduced-motion: reduce)")' }]).length,
    0,
  );
  // three を含む別名のパッケージやパスは対象にしない
  assert.equal(rule.check([{ path: 'a.tsx', source: 'import x from "three-stdlib-types";' }]).length, 0);
});

test('no-reduced-motion detects dynamic and side-effect three imports', () => {
  const [rule] = projectRules;
  assert.equal(rule.check([{ path: 'a.tsx', source: 'const THREE = await import("three");' }]).length, 1);
  assert.equal(rule.check([{ path: 'a.tsx', source: "import( 'three' ).then(init);" }]).length, 1);
  assert.equal(rule.check([{ path: 'a.ts', source: 'import "three";' }]).length, 1);
  assert.equal(rule.check([{ path: 'a.ts', source: 'import { OrbitControls } from "three/addons/controls/OrbitControls.js";' }]).length, 1);
  assert.equal(rule.check([{ path: 'a.tsx', source: 'await import("three-stdlib-types");' }]).length, 0);
});

test('no-reduced-motion detects requestAnimationFrame loops', () => {
  const [rule] = projectRules;
  assert.equal(rule.check([{ path: 'a.ts', source: 'requestAnimationFrame(loop);' }]).length, 1);
});

test('text-arrow flags arrow entities in buttons and links', () => {
  for (const e of ['&rarr;', '&raquo;', '&laquo;', '&larr;', '&uarr;', '&darr;', '&rsaquo;', '&lsaquo;']) {
    assert.equal(hits(`<a href="/x">次へ ${e}</a>`, 'x.html', 'text-arrow').length, 1, e);
  }
  assert.equal(hits('<button>A &amp; B</button>', 'x.tsx', 'text-arrow').length, 0);
  assert.equal(hits('<p>A &rarr; B</p>', 'x.html', 'text-arrow').length, 0);
});
test('purple-blue-gradient understands oklch colours', () => {
  const blue = '.a { background: linear-gradient(oklch(0.6 0.2 260), oklch(0.5 0.25 290)); }';
  assert.equal(hits(blue, 'x.css', 'purple-blue-gradient').length, 1);
  const withGray = '.a { background: linear-gradient(oklch(60% 0.2 230 / 0.8), oklch(0.98 0.01 40), oklch(0.5 0.25 290)); }';
  assert.equal(hits(withGray, 'x.css', 'purple-blue-gradient').length, 1);
  const mixed = '.a { background: linear-gradient(oklch(0.6 0.2 260), oklch(0.7 0.18 50)); }';
  assert.equal(hits(mixed, 'x.css', 'purple-blue-gradient').length, 0);
  const grays = '.a { background: linear-gradient(oklch(0.2 0.01 260), oklch(0.9 0.02 280)); }';
  assert.equal(hits(grays, 'x.css', 'purple-blue-gradient').length, 0);
  const hexAndOklch = '.a { background: linear-gradient(#6366f1, oklch(0.7 0.18 50)); }';
  assert.equal(hits(hexAndOklch, 'x.css', 'purple-blue-gradient').length, 0);
});

// mono-label
test('mono-label flags monospace labels set in uppercase or with wide tracking', () => {
  assert.equal(hits('<p className="font-mono text-xs uppercase tracking-widest">本日の献立</p>', 'x.tsx', 'mono-label').length, 1);
  assert.equal(hits('<span class="font-mono uppercase">見出し</span>', 'x.html', 'mono-label').length, 1);
  assert.equal(hits('<h2 className="font-mono text-xs tracking-[0.2em]">見出し</h2>', 'x.jsx', 'mono-label').length, 1);
  assert.equal(hits('<h2 className={cn("font-mono", "md:uppercase")}>見出し</h2>', 'x.tsx', 'mono-label').length, 1);
  const css = '.eyebrow {\n  font-family: var(--font-mono);\n  text-transform: uppercase;\n}';
  assert.equal(hits(css, 'x.css', 'mono-label').length, 1);
  const css2 = '.eyebrow { font-family: "DM Mono", monospace; letter-spacing: 0.1em; text-transform: uppercase; }';
  assert.equal(hits(css2, 'x.css', 'mono-label').length, 1);
  assert.match(hits(css, 'x.css', 'mono-label')[0].message, /。/);
});
test('mono-label leaves numbers, code and non-mono labels alone', () => {
  assert.equal(hits('<span className="font-mono tabular-nums text-text-muted">{count}</span>', 'x.tsx', 'mono-label').length, 0);
  assert.equal(hits('<code className="font-mono text-sm">npm test</code>', 'x.tsx', 'mono-label').length, 0);
  assert.equal(hits('<span className="font-mono tracking-tight tabular-nums">00:01:12</span>', 'x.tsx', 'mono-label').length, 0);
  assert.equal(hits('<p className="font-body text-xs uppercase tracking-widest">ラベル</p>', 'x.tsx', 'mono-label').length, 0);
  assert.equal(hits('.label { font-family: var(--font-body); text-transform: uppercase; }', 'x.css', 'mono-label').length, 0);
  assert.equal(hits('.num { font-family: var(--font-mono); font-variant-numeric: tabular-nums; }', 'x.css', 'mono-label').length, 0);
});

// rounded-accent-rail
test('rounded-accent-rail flags a side border on a card rounded on that side', () => {
  assert.equal(hits('<div className="rounded-lg border-l-4 border-accent bg-surface-1" />', 'x.tsx', 'rounded-accent-rail').length, 1);
  assert.equal(hits('<div class="rounded border-l" />', 'x.html', 'rounded-accent-rail').length, 1);
  assert.equal(hits('<div className="rounded-md border-s-2" />', 'x.tsx', 'rounded-accent-rail').length, 1);
  assert.equal(hits('<div className="rounded-island border-r-4" />', 'x.tsx', 'rounded-accent-rail').length, 1);
  assert.equal(hits('<div className="rounded-l-md border-l-[3px]" />', 'x.tsx', 'rounded-accent-rail').length, 1);
  assert.equal(hits('<div className="rounded-t-md border-e-2" />', 'x.tsx', 'rounded-accent-rail').length, 1);
  const css = '.note {\n  border-left: 4px solid var(--color-accent);\n  border-radius: 8px;\n}';
  assert.equal(hits(css, 'x.css', 'rounded-accent-rail').length, 1);
  const css2 = '.note { border-inline-start: 0.25rem solid var(--color-accent); border-radius: var(--radius-md); }';
  assert.equal(hits(css2, 'x.css', 'rounded-accent-rail').length, 1);
  assert.match(hits(css, 'x.css', 'rounded-accent-rail')[0].message, /。/);
});
test('rounded-accent-rail accepts straight rails and plain rounded borders', () => {
  assert.equal(hits('<div className="rounded-lg border border-line" />', 'x.tsx', 'rounded-accent-rail').length, 0);
  assert.equal(hits('<div className="border-l-4 rounded-none border-accent" />', 'x.tsx', 'rounded-accent-rail').length, 0);
  assert.equal(hits('<div className="rounded-r-md border-l-4 border-accent" />', 'x.tsx', 'rounded-accent-rail').length, 0);
  assert.equal(hits('<div className="rounded-e-md border-s-4" />', 'x.tsx', 'rounded-accent-rail').length, 0);
  assert.equal(hits('<div className="rounded-l-md border-r-4" />', 'x.tsx', 'rounded-accent-rail').length, 0);
  assert.equal(hits('<nav className="w-60 border-r border-line bg-surface-1" />', 'x.tsx', 'rounded-accent-rail').length, 0);
  assert.equal(hits('<div className="rounded-md border-l-accent border" />', 'x.tsx', 'rounded-accent-rail').length, 0);
  assert.equal(hits('<div className="rounded-md border-l-0" />', 'x.tsx', 'rounded-accent-rail').length, 0);
  assert.equal(hits('.a { border-left: 1px solid var(--color-line); border-radius: 8px; }', 'x.css', 'rounded-accent-rail').length, 0);
  assert.equal(hits('.a { border-left: 4px solid red; border-radius: 0; }', 'x.css', 'rounded-accent-rail').length, 0);
  assert.equal(hits('.a { border-left: 4px solid red; border-radius: 0 8px 8px 0; }', 'x.css', 'rounded-accent-rail').length, 0);
  assert.equal(hits('.a { border-left: 4px solid red; }', 'x.css', 'rounded-accent-rail').length, 0);
});

test('mono-label skips key input and aligned numbers', () => {
  assert.equal(hits('<kbd className="font-mono text-xs uppercase">Ctrl</kbd>', 'x.tsx', 'mono-label').length, 0);
  assert.equal(hits('<Keyboard className="font-mono uppercase tracking-wide">Esc</Keyboard>', 'x.tsx', 'mono-label').length, 0);
  assert.equal(hits('<span className="font-mono uppercase tabular-nums">00:01:12:05</span>', 'x.tsx', 'mono-label').length, 0);
  assert.equal(hits('.tc { font-family: var(--font-mono); text-transform: uppercase; font-variant-numeric: tabular-nums; }', 'x.css', 'mono-label').length, 0);
  assert.equal(hits('<span className="font-mono uppercase">見出し</span>', 'x.tsx', 'mono-label').length, 1);
});
test('rounded-accent-rail honours an explicit none override on the rail side', () => {
  assert.equal(hits('<div className="rounded-md rounded-l-none border-l-4" />', 'x.tsx', 'rounded-accent-rail').length, 0);
  assert.equal(hits('<div className="rounded-md rounded-s-none border-s-4" />', 'x.tsx', 'rounded-accent-rail').length, 0);
  assert.equal(hits('<div className="rounded-md rounded-tl-none rounded-bl-none border-l-4" />', 'x.tsx', 'rounded-accent-rail').length, 0);
  assert.equal(hits('<div className="rounded-md rounded-r-none border-r-4" />', 'x.tsx', 'rounded-accent-rail').length, 0);
  assert.equal(hits('<div className="rounded-md rounded-e-none border-e-4" />', 'x.tsx', 'rounded-accent-rail').length, 0);
  assert.equal(hits('<div className="rounded-md rounded-tl-none border-l-4" />', 'x.tsx', 'rounded-accent-rail').length, 1);
  assert.equal(hits('<div className="rounded-md rounded-r-none border-l-4" />', 'x.tsx', 'rounded-accent-rail').length, 1);
});
