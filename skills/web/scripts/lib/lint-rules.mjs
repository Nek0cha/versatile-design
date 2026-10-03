// ルール定義。モジュールを読み込まず、文字列処理だけで判定する。
// Rule = { id, extensions, check(source, filePath) → [{ index, message }] }
// ProjectRule = { id, check(files[{ path, source }]) → Violation[] }

const MARKUP = ['.tsx', '.jsx', '.html'];
const ALL = ['.tsx', '.jsx', '.ts', '.js', '.css', '.html'];

// ---------------------------------------------------------------------------
// 共通の補助関数

function lineOf(source, index) {
  let line = 1;
  for (let i = 0; i < index && i < source.length; i++) {
    if (source.charCodeAt(i) === 10) line++;
  }
  return line;
}

// 正規表現の全一致を { index, message } の配列にする
function matchAll(source, re, message) {
  return [...source.matchAll(re)].map((m) => ({ index: m.index, message }));
}

// 開き括弧の位置から、対応する閉じ括弧の直後の位置を返す。見つからなければ -1
function closeOf(source, openIndex, open, close) {
  let depth = 0;
  for (let i = openIndex; i < source.length; i++) {
    const c = source[i];
    if (c === open) depth++;
    else if (c === close && --depth === 0) return i + 1;
  }
  return -1;
}

// 文字列の長さ（UTF-16 単位）を保ったまま、{...} 式とタグを空白に置き換える（子テキストの位置を保つため）
function blankExpressionsAndTags(text) {
  let out = '';
  let depth = 0;
  let inTag = false;
  for (const c of text) {
    let hidden = true;
    if (c === '{') depth++;
    else if (c === '}' && depth > 0) depth--;
    else if (depth > 0) hidden = true; // 式の内側は隠す
    else if (c === '<') inTag = true;
    else if (inTag) inTag = c !== '>';
    else hidden = false;
    out += hidden ? ' '.repeat(c.length) : c;
  }
  return out;
}

// 属性部分は `{...}` や引用符内の `>` を許す（例：onClick={() => go()}）
const ATTRS = String.raw`(?:[^>{"']|\{[^}]*\}|"[^"]*"|'[^']*')*`;

// 指定した要素の子テキスト（式とタグを除く）を { offset, text } で返す
function childTexts(source, tags) {
  // 自己終了タグ（<Link ... />）は子を持たないので開始タグとして扱わない
  const re = new RegExp(String.raw`<(${tags.join('|')})\b${ATTRS}(?<!\/)>([\s\S]*?)<\/\1>`, 'g');
  const out = [];
  for (const m of source.matchAll(re)) {
    const body = m[2];
    const offset = m.index + m[0].length - `</${m[1]}>`.length - body.length;
    out.push({ tag: m[1], offset, text: blankExpressionsAndTags(body) });
  }
  return out;
}

// className／class 属性の値を { index, value } で返す。`{...}` の値は式全体を1つの文字列として扱う
function classAttributes(source) {
  const out = [];
  for (const m of source.matchAll(/\bclass(?:Name)?\s*=\s*(?=["'{])/g)) {
    const start = m.index + m[0].length;
    const q = source[start];
    let end;
    if (q === '{') end = closeOf(source, start, '{', '}');
    else end = source.indexOf(q, start + 1) + 1;
    if (end <= 0) continue;
    out.push({ index: m.index, value: source.slice(start, end) });
  }
  return out;
}

// 中括弧のブロックのうち、内側に中括弧を持たないもの（CSS の宣言ブロック）を返す
function cssBlocks(source) {
  return [...source.matchAll(/\{([^{}]*)\}/g)].map((m) => ({ index: m.index, body: m[1] }));
}

// 括弧の内側のカンマでは分けずに、トップレベルのカンマで分割する
function splitTopLevel(value) {
  const parts = [];
  let depth = 0;
  let current = '';
  for (const c of value) {
    if (c === '(') depth++;
    if (c === ')') depth--;
    if (c === ',' && depth === 0) {
      parts.push(current);
      current = '';
    } else current += c;
  }
  parts.push(current);
  return parts;
}

// 16進色の色相（度）と彩度を返す
function hexToHueSat(hex) {
  let h = hex;
  if (h.length === 3 || h.length === 4) h = [...h.slice(0, 3)].map((c) => c + c).join('');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  if (d === 0) return { hue: 0, sat: 0 };
  let hue;
  if (max === r) hue = ((g - b) / d) % 6;
  else if (max === g) hue = (b - r) / d + 2;
  else hue = (r - g) / d + 4;
  hue *= 60;
  if (hue < 0) hue += 360;
  const l = (max + min) / 2;
  return { hue, sat: d / (1 - Math.abs(2 * l - 1)) };
}

// ---------------------------------------------------------------------------
// ルール本体

const ARROWS = '→↗↘←↑↓›‹»«▼▲▶◀➜➔⟶';
// 矢印を表す HTML の文字参照
const ARROW_ENTITIES = /&(?:rarr|larr|uarr|darr|raquo|laquo|rsaquo|lsaquo);/g;
const ARROW_TAGS = ['button', 'a', 'Button', 'Link'];
const EMOJI_TAGS = ['button', 'a', 'Button', 'Link', 'li'];
// 記号として普通に使う文字は絵文字として扱わない
const NOT_EMOJI = new Set(['©', '®', '™']);

const textArrow = {
  id: 'text-arrow',
  extensions: MARKUP,
  check(source) {
    const out = [];
    const message = 'ボタンやリンク内の文字の矢印はフォントで形と位置が崩れる。Iconify の SVG アイコンに置き換える';
    for (const { offset, text } of childTexts(source, ARROW_TAGS)) {
      for (let i = 0; i < text.length; i++) {
        if (ARROWS.includes(text[i])) out.push({ index: offset + i, message });
      }
      for (const m of text.matchAll(ARROW_ENTITIES)) out.push({ index: offset + m.index, message });
    }
    return out.sort((a, b) => a.index - b.index);
  },
};

const emojiIcon = {
  id: 'emoji-icon',
  extensions: MARKUP,
  check(source) {
    const out = [];
    for (const { tag, offset, text } of childTexts(source, EMOJI_TAGS)) {
      for (const m of text.matchAll(/\p{Extended_Pictographic}/gu)) {
        if (NOT_EMOJI.has(m[0])) continue;
        // ボタンとリンクの矢印は text-arrow が報告するので重ねて報告しない
        if (tag !== 'li' && ARROWS.includes(m[0])) continue;
        out.push({
          index: offset + m.index,
          message: '絵文字をアイコン代わりに使っており、OS ごとに見た目が変わる。Iconify の SVG アイコンに置き換えるか、絵文字を削除する',
        });
      }
    }
    return out;
  },
};

const PALETTE = String.raw`(?<![\w-])(?:bg|text|border|ring|from|via|to|fill|stroke|outline|decoration|divide|shadow|accent|caret|placeholder)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950)(?:\/(?:\d+|\[[^\]\s]+\]))?(?![\w-])`;

const tailwindDefaultPalette = {
  id: 'tailwind-default-palette',
  extensions: ['.tsx', '.jsx', '.html', '.css'],
  check: (source) =>
    matchAll(
      source,
      new RegExp(PALETTE, 'g'),
      'Tailwind の既定パレットの色をそのまま使っている。プロジェクトで定義した色トークン（例：bg-accent）を使う',
    ),
};

const gradientText = {
  id: 'gradient-text',
  extensions: ALL,
  check(source) {
    const message = 'グラデーションで塗った文字は定型的に見え、読みにくくもなる。単色の文字にし、強調は太さや大きさで付ける';
    const out = [];
    for (const { index, value } of classAttributes(source)) {
      if (/(?<![\w-])bg-clip-text(?![\w-])/.test(value) && /(?<![\w-])bg-(?:gradient|linear)-/.test(value)) {
        out.push({ index, message });
      }
    }
    for (const { index, body } of cssBlocks(source)) {
      if (/background-clip\s*:\s*text\b/.test(body) && /gradient\(/.test(body)) out.push({ index, message });
    }
    return out;
  },
};

const BLUE_PURPLE = 'purple|violet|indigo|blue|fuchsia';

const purpleBlueGradient = {
  id: 'purple-blue-gradient',
  extensions: ALL,
  check(source) {
    const message = '青から紫の範囲だけで作ったグラデーションは定型的な配色である。ブランドの色トークンから配色を決める';
    const out = [];
    const from = new RegExp(String.raw`(?<![\w-])from-(?:${BLUE_PURPLE})-\d`);
    const to = new RegExp(String.raw`(?<![\w-])to-(?:${BLUE_PURPLE}|pink)-\d`);
    for (const { index, value } of classAttributes(source)) {
      if (from.test(value) && to.test(value)) out.push({ index, message });
    }
    for (const m of source.matchAll(/[\w-]*gradient\(/g)) {
      const open = m.index + m[0].length - 1;
      const end = closeOf(source, open, '(', ')');
      if (end === -1) continue;
      const body = source.slice(open, end);
      // 各色が青〜紫の範囲にあるかを並べる。oklch の無彩色（C < 0.03）は判定から外す
      const inRange = [];
      for (const [, hex] of body.matchAll(/#([0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})(?![0-9a-fA-F])/g)) {
        const { hue, sat } = hexToHueSat(hex);
        inRange.push(sat > 0 && hue >= 220 && hue <= 300);
      }
      for (const [, c, hue] of body.matchAll(/oklch\(\s*[\d.]+%?\s+([\d.]+%?)\s+([\d.]+)(?:deg)?/gi)) {
        const chroma = c.endsWith('%') ? (parseFloat(c) / 100) * 0.4 : parseFloat(c);
        if (chroma < 0.03) continue;
        inRange.push(Number(hue) >= 220 && Number(hue) <= 300);
      }
      if (inRange.length > 0 && inRange.every(Boolean)) out.push({ index: m.index, message });
    }
    return out;
  },
};

const GENERIC_FAMILIES = new Set([
  'serif', 'sans-serif', 'monospace', 'cursive', 'fantasy', 'math', 'emoji', 'fangsong',
  'ui-serif', 'ui-sans-serif', 'ui-monospace', 'ui-rounded',
]);
const DEFAULT_FONTS = new Set([
  'inter', 'roboto', 'poppins', 'arial', 'helvetica', 'helvetica neue', 'system-ui', '-apple-system',
  'blinkmacsystemfont', 'segoe ui', 'noto sans',
  'apple color emoji', 'segoe ui emoji', 'segoe ui symbol', 'noto color emoji',
]);

const genericFontOnly = {
  id: 'generic-font-only',
  extensions: ['.css', '.html', '.tsx'],
  check(source) {
    const out = [];
    const re = /(?<![\w-])(?:font-family|--font-[\w-]*)\s*:\s*((?:"[^"\n;<>]*"|'[^'\n;<>]*'|[^;{}\n<>"'])+)/g;
    for (const m of source.matchAll(re)) {
      const families = m[1]
        .replace(/!important/g, '')
        .split(',')
        .map((f) => f.trim().replace(/^["']|["']$/g, '').trim().toLowerCase())
        .filter((f) => f && !GENERIC_FAMILIES.has(f));
      if (families.length > 0 && families.every((f) => DEFAULT_FONTS.has(f))) {
        out.push({
          index: m.index,
          message: 'どの環境にもある定番フォントと総称ファミリーだけを指定している。用途に合った書体を先頭に置き、定番フォントは代替として後ろに回す',
        });
      }
    }
    return out;
  },
};

const nativeSelect = {
  id: 'native-select',
  extensions: MARKUP,
  check: (source) =>
    matchAll(
      source,
      /<select\b/g,
      'ネイティブの <select> は OS ごとに見た目が異なり、開いた一覧のデザインを制御できない。アクセシビリティに対応した独自のセレクト部品を使う',
    ),
};

const nativeNumberInput = {
  id: 'native-number-input',
  extensions: MARKUP,
  check: (source) =>
    matchAll(
      source,
      /\btype\s*=\s*(?:"number"|'number')/g,
      'type="number" の入力欄はブラウザ標準のスピンボタンが出て、ホイール操作でも値が変わる。数値入力用の部品を使うか、type="text" と inputMode="numeric" で入力を受けて値を検証する',
    ),
};

const transitionAll = {
  id: 'transition-all',
  extensions: ALL,
  check(source) {
    const message = 'すべてのプロパティを対象にした transition は意図しない変化まで動かし、描画も重くなる。動かすプロパティ（transform や opacity など）を明示する';
    return [
      ...matchAll(source, /(?<![\w-])transition-all(?![\w-])/g, message),
      ...matchAll(source, /(?<!\w)transition(?:-property)?\s*:\s*['"`]?all(?![\w-])/g, message),
    ].sort((a, b) => a.index - b.index);
  },
};

const DEFAULT_KEYWORD = /(?<![\w-])(?:ease(?:-in-out|-in|-out)?|linear)(?![\w(-])/;
// タイミング関数として扱う記述。var() はイージングのトークンとみなす
const TIMING = /(?<![\w-])(?:ease(?:-in-out|-in|-out)?|linear|step-start|step-end)(?![\w-])|cubic-bezier\(|steps\(|linear\(|var\(/;
const DURATION = /(?<![\w.-])\d*\.?\d+m?s(?![\w-])/;

const defaultEasing = {
  id: 'default-easing',
  extensions: ALL,
  check(source) {
    const message = '既定のイージング（ease・linear など）やイージングの指定漏れは、動きが機械的に見える。プロジェクトで定義した cubic-bezier のイージングトークンを使う';
    const out = [];
    const declSpans = [];
    const re = /(?<!\w)(transition|animation)(-timing-function)?\s*:\s*(?:(['"`])([^'"`\n]*)\3|([^;{}\n]+))/g;
    for (const m of source.matchAll(re)) {
      const value = (m[4] ?? m[5] ?? '').trim();
      if (!value) continue;
      declSpans.push([m.index, m.index + m[0].length]);
      const segments = splitTopLevel(value);
      const usesDefault = segments.some((s) => DEFAULT_KEYWORD.test(s));
      // タイミング関数を持たない transition（時間の指定はあるもの）
      const missing =
        m[1] === 'transition' && !m[2] && segments.some((s) => DURATION.test(s) && !TIMING.test(s));
      if (usesDefault || missing) out.push({ index: m.index, message });
    }
    // クラスの検出。CSS 宣言の値の中の ease-in などは上で報告済みなので重ねない
    for (const hit of matchAll(source, /(?<![\w-])ease-(?:in-out|linear|in|out)(?![\w-])/g, message)) {
      if (!declSpans.some(([start, end]) => hit.index >= start && hit.index < end)) out.push(hit);
    }
    return out.sort((a, b) => a.index - b.index);
  },
};

export const rules = [
  textArrow,
  emojiIcon,
  tailwindDefaultPalette,
  gradientText,
  purpleBlueGradient,
  genericFontOnly,
  nativeSelect,
  nativeNumberInput,
  transitionAll,
  defaultEasing,
];

// ---------------------------------------------------------------------------
// プロジェクト全体を見るルール

const MOTION_USE = /@keyframes|(?<![\w-])animation\s*:|motion\/react|\bgsap\b/;
const MOTION_GUARD = /prefers-reduced-motion|useReducedMotion|reducedMotion|(?<![\w-])motion-(?:reduce|safe):/;

const noReducedMotion = {
  id: 'no-reduced-motion',
  check(files) {
    if (files.some((f) => MOTION_GUARD.test(f.source))) return [];
    for (const f of files) {
      const m = MOTION_USE.exec(f.source);
      if (!m) continue;
      return [
        {
          file: f.path,
          line: lineOf(f.source, m.index),
          rule: 'no-reduced-motion',
          message: 'アニメーションがあるのに、動きを減らす設定（prefers-reduced-motion）への対応がどのファイルにもない。@media (prefers-reduced-motion: reduce)、Tailwind の motion-reduce:／motion-safe:、Motion の useReducedMotion のいずれかで動きを減らす',
        },
      ];
    }
    return [];
  },
};

export const projectRules = [noReducedMotion];
