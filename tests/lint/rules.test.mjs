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
    'emoji-icon',
    'generic-font-only',
    'gradient-text',
    'native-number-input',
    'native-select',
    'purple-blue-gradient',
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
