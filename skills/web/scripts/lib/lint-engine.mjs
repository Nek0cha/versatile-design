// lint エンジン本体。Node.js 組み込みモジュールのみを使う。
import { readdir, readFile, stat } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { rules as defaultRules, projectRules as defaultProjectRules } from './lint-rules.mjs';

export const SCAN_EXTENSIONS = ['.tsx', '.jsx', '.ts', '.js', '.css', '.html'];
export const EXCLUDED_DIRS = ['node_modules', 'dist', 'build', '.git', '.next'];

// `//` と `/* */` の両形式の抑制コメントを受け付ける
const SUPPRESSION = /(?:\/\/|\/\*)\s*design-lint-disable-next-line[ \t]+([\w-]+)([^\n]*)/g;

function lineOf(source, index) {
  let line = 1;
  for (let i = 0; i < index && i < source.length; i++) {
    if (source.charCodeAt(i) === 10) line++;
  }
  return line;
}

// 抑制コメントを解析する。理由（`--` の後の空白以外の文字列）がなければ違反として返す。
function parseSuppressions(source, filePath) {
  const suppressed = new Map(); // 行番号 -> 抑制するルール id の集合
  const directiveLines = new Set(); // 抑制コメント自身の行
  const violations = [];
  for (const m of source.matchAll(SUPPRESSION)) {
    const line = lineOf(source, m.index);
    const rest = m[2].replace(/\*\/.*$/, '');
    const reason = /^\s*--\s*(\S[\s\S]*)$/.exec(rest);
    if (!reason) {
      violations.push({
        file: filePath,
        line,
        rule: 'suppression-without-reason',
        message: `抑制コメントに理由がない。「design-lint-disable-next-line ${m[1]} -- 理由」の形式で書くこと`,
      });
    }
    directiveLines.add(line);
    // 理由のない抑制は無効とし、元の違反も報告する
    if (!reason) continue;
    const target = line + 1;
    if (!suppressed.has(target)) suppressed.set(target, new Set());
    suppressed.get(target).add(m[1]);
  }
  return { suppressed, violations, directiveLines };
}

export function lintSource(source, filePath, rules) {
  const ext = extname(filePath);
  const { suppressed, violations, directiveLines } = parseSuppressions(source, filePath);
  const result = [...violations];
  for (const rule of rules) {
    if (!rule.extensions.includes(ext)) continue;
    for (const hit of rule.check(source, filePath)) {
      const line = lineOf(source, hit.index);
      // 抑制コメント自身の行（ルール id を含む）は検査対象から外す
      if (directiveLines.has(line)) continue;
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

export async function lintPaths(paths, options = {}) {
  const rules = options.rules ?? defaultRules;
  const projectRules = options.projectRules ?? defaultProjectRules;
  const files = [];
  for (const p of paths) await collectFiles(p, files);
  const unique = [...new Set(files)];
  const loaded = [];
  const violations = [];
  for (const path of unique) {
    const source = await readFile(path, 'utf8');
    loaded.push({ path, source });
    violations.push(...lintSource(source, path, rules));
  }
  for (const rule of projectRules) violations.push(...rule.check(loaded));
  return { violations, filesScanned: unique.length };
}

export function formatViolations(violations) {
  const lines = violations.map((v) => `${v.file}:${v.line}  ${v.rule}  ${v.message}`);
  lines.push(`${violations.length} 件の違反`);
  return lines.join('\n');
}
