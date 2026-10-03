// スキル文書の構造と匿名化を検査するツールである。
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const exists = async (p) => stat(p).then(() => true, () => false);

async function listDirs(dir) {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
  return entries.filter((e) => e.isDirectory()).map((e) => e.name).sort();
}

async function walk(dir) {
  const out = [];
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
  for (const e of entries) {
    if (e.name === 'node_modules') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else if (e.isFile()) out.push(p);
  }
  return out;
}

function parseFrontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!m) return null;
  const fields = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z_-]+):\s*(.*)$/);
    if (!kv) continue;
    let v = kv[2].trim();
    if (/^(".*"|'.*')$/.test(v)) v = v.slice(1, -1);
    fields[kv[1]] = v;
  }
  return fields;
}

const REF_RE = /`((?:references\/|scripts\/|\.\.\/design-core\/)[^`\s]*)`/g;

async function checkFrontmatter(skillDir, name, rel, problems) {
  const text = await readFile(path.join(skillDir, 'SKILL.md'), 'utf8').catch(() => null);
  if (text === null) return; // SKILL.md が未作成のディレクトリは検査対象外とする
  const fm = parseFrontmatter(text);
  if (!fm) return problems.push(`${rel}: frontmatter がない`);
  if (fm.name !== name) problems.push(`${rel}: name "${fm.name ?? ''}" がディレクトリ名 "${name}" と一致しない`);
  const len = [...(fm.description ?? '')].length;
  if (len < 1 || len > 1024) problems.push(`${rel}: description は 1〜1024 文字でなければならない（現在 ${len} 文字）`);
}

async function checkRefs(skillDir, file, rootDir, problems) {
  const text = await readFile(file, 'utf8');
  for (const m of text.matchAll(REF_RE)) {
    const ref = m[1].replace(/[#?].*$/, '');
    if (/[*<>{}]/.test(ref)) continue;
    const found =
      (await exists(path.resolve(skillDir, ref))) || (await exists(path.resolve(path.dirname(file), ref)));
    if (!found) problems.push(`${path.relative(rootDir, file)}: 参照先 ${m[1]} が存在しない`);
  }
}

async function checkDenylist(rootDir, denylist, problems) {
  const terms = denylist.map((t) => t.trim()).filter(Boolean);
  if (!terms.length) return;
  const files = [];
  for (const d of ['skills', 'docs']) files.push(...(await walk(path.join(rootDir, d))));
  for (const file of files.sort()) {
    const buf = await readFile(file);
    if (buf.includes(0)) continue; // バイナリは対象外とする
    const text = buf.toString('utf8').toLowerCase();
    for (const t of terms) {
      if (text.includes(t.toLowerCase())) problems.push(`${path.relative(rootDir, file)}: 禁止語 "${t}" を含む`);
    }
  }
}

export async function checkSkills(rootDir, options = {}) {
  const problems = [];
  const skillsRoot = path.join(rootDir, 'skills');
  for (const name of await listDirs(skillsRoot)) {
    const skillDir = path.join(skillsRoot, name);
    const rel = path.relative(rootDir, path.join(skillDir, 'SKILL.md'));
    await checkFrontmatter(skillDir, name, rel, problems);
    const mdFiles = [path.join(skillDir, 'SKILL.md')];
    mdFiles.push(...(await walk(path.join(skillDir, 'references'))).filter((f) => f.endsWith('.md')));
    for (const f of mdFiles) if (await exists(f)) await checkRefs(skillDir, f, rootDir, problems);
  }
  await checkDenylist(rootDir, options.denylist ?? [], problems);
  return problems;
}

async function main() {
  const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  let denylist = [];
  const listFile = process.env.REFERENCE_DENYLIST;
  if (listFile && (await exists(listFile))) {
    denylist = (await readFile(listFile, 'utf8')).split(/\r?\n/);
  } else {
    console.log('匿名化の検査は省略しました');
  }
  const problems = await checkSkills(rootDir, { denylist });
  for (const p of problems) console.error(p);
  if (problems.length) process.exit(1);
  console.log('検査に合格した');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
