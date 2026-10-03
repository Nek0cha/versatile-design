// copywriting の lint エンジン本体。Node.js 組み込みモジュールのみを使う。
// 他のスキルのファイルを import しない（copywriting を単独で配布できるようにするため）。
import { readdir, readFile, stat } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { rules as defaultRules } from './copy-rules.mjs';

export const SCAN_EXTENSIONS = ['.md', '.txt', '.tsx', '.jsx', '.html'];
export const EXCLUDED_DIRS = ['node_modules', 'dist', 'build', '.git', '.next'];

// `//`・`/* */`（JSX の `{/* */}` を含む）・`<!-- -->` の3形式の抑制コメントを受け付ける
const SUPPRESSION = /(\/\/|\/\*|<!--)\s*copy-lint-disable-next-line[ \t]+([\w-]+)([^\n]*)/g;
const COMMENT_END = { '/*': '*/', '<!--': '-->' };

// 文章として扱わない属性（JSX）と、文章として扱う属性（HTML）
const NON_TEXT_ATTRS = new Set(['className', 'class', 'style', 'href', 'src', 'id', 'key', 'type']);
const HTML_TEXT_ATTRS = new Set(['alt', 'title', 'content', 'aria-label', 'placeholder']);

// 属性部分は `{...}` や引用符内の `>` を許す（例：onClick={() => go()}）
const ATTRS = String.raw`(?:[^>{"']|\{(?:[^{}]|\{[^{}]*\})*\}|"[^"]*"|'[^']*')*`;
const JSX_TAG = new RegExp(String.raw`<(\/?)([A-Za-z][\w.:-]*)?(${ATTRS}?)(\/?)>`, 'g');
const ATTR = /([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|\{)/g;

function lineOf(source, index) {
  let line = 1;
  for (let i = 0; i < index && i < source.length; i++) {
    if (source.charCodeAt(i) === 10) line++;
  }
  return line;
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

// 空白か非 ASCII 文字を含むか（コードの識別子ではなく文章らしいか）
const looksLikeText = (s) => /[\s]|[^\x00-\x7f]/.test(s.trim()) && s.trim().length > 0;

// ASCII だけで、Tailwind のクラスの並びに見える文字列か
function looksLikeClassList(s) {
  if (/[^\x00-\x7f]/.test(s)) return false;
  const tokens = s.trim().split(/\s+/).filter(Boolean);
  return (
    tokens.length > 0 &&
    tokens.every((t) => /^[a-z0-9:\-[\]/.%#()!_&>*=@~]+$/.test(t)) &&
    tokens.some((t) => /[-:[]/.test(t))
  );
}

// 位置を保ったまま、指定した範囲だけを残す
function reveal(source, ranges) {
  const out = source.replace(/[^\n]/g, ' ').split('');
  for (const [start, end] of ranges) {
    for (let i = start; i < end; i++) out[i] = source[i];
  }
  return out.join('');
}

// 範囲 [start, end) を空白にする（改行は残す）
function blank(text, start, end) {
  return text.slice(0, start) + text.slice(start, end).replace(/[^\n]/g, ' ') + text.slice(end);
}

function extractMarkdown(source) {
  let text = source;
  for (const re of [/^ {0,3}(```|~~~)[^\n]*\n[\s\S]*?^ {0,3}\1[^\n]*$/gm, /<!--[\s\S]*?-->/g, /`[^`\n]+`/g]) {
    for (const m of text.matchAll(re)) text = blank(text, m.index, m.index + m[0].length);
  }
  return text;
}

function extractHtml(source) {
  let text = source;
  for (const re of [/<!--[\s\S]*?-->/g, /<(script|style)\b[\s\S]*?<\/\1\s*>/gi]) {
    for (const m of text.matchAll(re)) text = blank(text, m.index, m.index + m[0].length);
  }
  const ranges = [];
  let last = 0;
  for (const m of text.matchAll(/<[^>]*>/g)) {
    ranges.push([last, m.index]);
    for (const a of m[0].matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) {
      if (!HTML_TEXT_ATTRS.has(a[1].toLowerCase())) continue;
      const value = a[2] ?? a[3];
      const start = m.index + a.index + a[0].length - value.length - 1;
      ranges.push([start, start + value.length]);
    }
    last = m.index + m[0].length;
  }
  ranges.push([last, text.length]);
  return reveal(text, ranges);
}

// コードの範囲 [start, end) から、文章らしい文字列リテラルの中身を集める
function codeStrings(source, start, end, ranges) {
  const re = /(["'`])((?:\\.|(?!\1)[^\\\n])*)\1/g;
  re.lastIndex = start;
  for (let m = re.exec(source); m && m.index < end; m = re.exec(source)) {
    if (m.index + m[0].length > end) break;
    const value = m[2];
    if (m[1] === '`' && value.includes('${')) continue;
    const before = source.slice(Math.max(0, m.index - 40), m.index);
    if (/(?:\bfrom|\bimport|\brequire\s*\()\s*$/.test(before)) continue;
    if (/\b(?:className|class|style)\s*[:=]\s*$/.test(before)) continue;
    if (!looksLikeText(value) || looksLikeClassList(value)) continue;
    ranges.push([m.index + 1, m.index + 1 + value.length]);
  }
}

function extractJsx(source) {
  // コメントを先に空白にする。`//` は行頭か空白の直後のものだけ（URL の `://` を除くため）
  let text = source;
  for (const re of [/\/\*[\s\S]*?\*\//g, /(?<=^|[ \t])\/\/[^\n]*/gm]) {
    for (const m of text.matchAll(re)) text = blank(text, m.index, m.index + m[0].length);
  }
  const ranges = [];
  const stack = []; // 開いている要素ごとの { 式の深さ }
  let cursor = 0;
  const visitGap = (start, end) => {
    if (stack.length === 0) {
      codeStrings(text, start, end, ranges);
      return;
    }
    // 子の領域：式の外の文字は文章。式の中の文字列リテラルも拾う
    const top = stack[stack.length - 1];
    let segStart = start;
    for (let i = start; i < end; i++) {
      const c = text[i];
      if (top.depth === 0 && c === '{') {
        ranges.push([segStart, i]);
        top.depth = 1;
        segStart = i + 1;
      } else if (top.depth > 0 && c === '{') {
        top.depth++;
      } else if (top.depth > 0 && c === '}') {
        if (--top.depth === 0) {
          codeStrings(text, segStart, i, ranges);
          segStart = i + 1;
        }
      }
    }
    if (top.depth === 0) ranges.push([segStart, end]);
    else codeStrings(text, segStart, end, ranges);
  };
  for (const m of text.matchAll(JSX_TAG)) {
    if (m.index < cursor) continue;
    // コードの文脈で識別子の直後にある `<`（TypeScript のジェネリクス）はタグとみなさない
    if (stack.length === 0 && /[\w$.]/.test(text[m.index - 1] ?? '')) continue;
    visitGap(cursor, m.index);
    const [whole, closing, , attrs, selfClosing] = m;
    // 属性の値
    const attrsStart = m.index + whole.indexOf(attrs);
    for (const a of attrs.matchAll(ATTR)) {
      const name = a[1];
      const valueStart = attrsStart + a.index + a[0].length;
      if (a[0].endsWith('{')) {
        const close = closeOf(text, valueStart - 1, '{', '}');
        if (close > 0 && !NON_TEXT_ATTRS.has(name)) codeStrings(text, valueStart, close - 1, ranges);
        continue;
      }
      const value = a[2] ?? a[3];
      if (NON_TEXT_ATTRS.has(name) || !looksLikeText(value)) continue;
      ranges.push([valueStart - value.length - 1, valueStart - 1]);
    }
    if (closing) stack.pop();
    else if (!selfClosing) stack.push({ depth: 0 });
    cursor = m.index + whole.length;
  }
  visitGap(cursor, text.length);
  return reveal(text, ranges);
}

// 入力と同じ長さの文字列を返す。文章でない部分は空白に置き換え、改行は残す
export function extractText(source, filePath) {
  const ext = extname(filePath);
  if (ext === '.md' || ext === '.txt') return extractMarkdown(source);
  if (ext === '.html') return extractHtml(source);
  if (ext === '.tsx' || ext === '.jsx') return extractJsx(source);
  return source.replace(/[^\n]/g, ' ');
}

// 抑制コメントを解析する。理由（`--` の後の空白以外の文字列）がなければ違反として返す
function parseSuppressions(source, filePath) {
  const suppressed = new Map(); // 行番号 -> 抑制するルール id の集合
  const directiveSpans = [];
  const violations = [];
  for (const m of source.matchAll(SUPPRESSION)) {
    const [, opener, ruleId, tail] = m;
    const line = lineOf(source, m.index);
    const lineEnd = m.index + m[0].length;
    const closer = COMMENT_END[opener];
    const closeAt = closer ? source.indexOf(closer, m.index + opener.length) : -1;
    const end = closeAt === -1 || closeAt > lineEnd ? lineEnd : closeAt + closer.length;
    directiveSpans.push([m.index, end]);
    const rest = tail.replace(/(?:\*\/|-->)[\s\S]*$/, '');
    const reason = /^\s*--\s*(\S[\s\S]*)$/.exec(rest);
    if (!reason) {
      violations.push({
        file: filePath,
        line,
        rule: 'suppression-without-reason',
        message: `抑制コメントに理由がない。「copy-lint-disable-next-line ${ruleId} -- 理由」の形式で書くこと`,
      });
      continue;
    }
    const target = line + 1;
    if (!suppressed.has(target)) suppressed.set(target, new Set());
    suppressed.get(target).add(ruleId);
  }
  return { suppressed, violations, directiveSpans };
}

export function lintCopySource(source, filePath, rules = defaultRules) {
  const { suppressed, violations, directiveSpans } = parseSuppressions(source, filePath);
  const text = extractText(source, filePath);
  const result = [...violations];
  for (const rule of rules) {
    for (const hit of rule.check(text)) {
      if (directiveSpans.some(([start, end]) => hit.index >= start && hit.index < end)) continue;
      const line = lineOf(text, hit.index);
      if (suppressed.get(line)?.has(rule.id)) continue;
      result.push({ file: filePath, line, rule: rule.id, message: hit.message });
    }
  }
  return result.sort((a, b) => a.line - b.line);
}

async function collectFiles(path, out) {
  const info = await stat(path);
  if (info.isFile()) {
    out.push(path);
    return;
  }
  const entries = await readdir(path, { withFileTypes: true });
  entries.sort((a, b) => a.name.localeCompare(b.name));
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (EXCLUDED_DIRS.includes(entry.name)) continue;
      await collectFiles(join(path, entry.name), out);
    } else if (entry.isFile() && SCAN_EXTENSIONS.includes(extname(entry.name))) {
      out.push(join(path, entry.name));
    }
  }
}

export async function lintCopyPaths(paths, options = {}) {
  const rules = options.rules ?? defaultRules;
  const files = [];
  for (const p of paths) await collectFiles(p, files);
  const unique = [...new Set(files)];
  const violations = [];
  for (const path of unique) {
    violations.push(...lintCopySource(await readFile(path, 'utf8'), path, rules));
  }
  return { violations, filesScanned: unique.length };
}

export function formatViolations(violations) {
  const lines = violations.map((v) => `${v.file}:${v.line}  ${v.rule}  ${v.message}`);
  lines.push(`${violations.length} 件の違反`);
  return lines.join('\n');
}
