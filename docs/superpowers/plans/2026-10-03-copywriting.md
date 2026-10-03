# 文章のスキル（copywriting）実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** キャッチコピーと LP の本文を AI っぽさなく生成する Claude スキル `copywriting` を、空っぽの言葉と避ける型を検出する lint 付きで作り、`web` スキルから呼べるようにする。

**Architecture:** `copywriting` は短い手順書（`SKILL.md`）と、必要時に読む `references/` で構成する。同梱の `lint-copy.mjs` は、ファイルから文章の部分だけを取り出し（位置は保つ）、ルールを当てて「ファイル:行番号  ルール名  理由」を出す。`web` は手順2で `copywriting` の聞き出しを行い、確認を待たずに推し案でページを作る。

**Tech Stack:** Node.js 22（ESM、`node:test`）。外部依存なし。

**Spec:** `docs/superpowers/specs/2026-10-03-copywriting-design.md`

> **状態：中止。** Task 1〜4 を実装し、Task 5 の比較評価を2回行ったが、合格基準を満たさなかった。スキル作者の判断で `copywriting` スキルと lint は削除し、書き方のルールだけを `skills/web/references/copy.md` に統合した。

## Global Constraints

- スキル文書・README・コメントは標準語で書き、である調に統一する。関西弁は使わない。
- `SKILL.md` の frontmatter は `name: copywriting` と `description`（1024文字以内、日本語＋英語の検索語を含める）を持つ。
- `skills/` と `docs/` に実在のコピーの本文、企業名、商品名を書かない。必要なら「手本A（飲料）」のような匿名ラベルを使う（設計書 5章）。AI が作ったコピーは載せてよい。
- `skills/copywriting/scripts/` は Node.js 標準モジュールのみで動き、他のスキルのファイルを import しない（設計書 1.2「単独でも使える」）。このため `web` の lint エンジンは共通化せず、同じ形の小さなエンジンを持つ。
- lint の抑制コメントの形式：`copy-lint-disable-next-line <ルール名> -- <理由>`。理由のない抑制はそれ自体を違反（`suppression-without-reason`）とする。
- lint の出力形式：`ファイル:行番号  ルール名  理由`、最後に `N 件の違反`。終了コードは 0（違反なし）、1（違反あり）、2（引数の誤り、存在しないパス）。
- 走査する拡張子：`.md`、`.txt`、`.tsx`、`.jsx`、`.html`。除外するディレクトリ：`node_modules`、`dist`、`build`、`.git`、`.next`。
- 優先順位：プロンプトでの指示 ＞ `copywriting/user-preferences.md` ＞ 各 `references/` の「スキル作者の調整欄」。
- 質問は最大2回（1回目＋薄いときの追加1問）。量産は 20〜30 案。提示は切り口ごとに1案、合計5案。英語の案は技術系・クリエイター系のサイトで 1〜2 案。自己批評は最大2周。

## Review Focus

1. Tailwind のクラス名と import の指定子（`className="transform ..."`、`import x from 'seamless-lib'`）：文章ではないため検出しない。→ Task 1 のテスト `ignores class attributes and import specifiers`。
2. 本文の長い文に出てくる弱い空っぽの言葉（「毎日」「体験」「新しい」「未来」）：25文字以下の短い行（見出しやキャッチ）だけで検出し、長い本文の行では検出しない。→ Task 2 のテスト `weak empty words are flagged only on short lines`。
3. Markdown とJSX での抑制：`<!-- copy-lint-disable-next-line ... -->` と `{/* copy-lint-disable-next-line ... */}` の両方が次の1行だけに効く。→ Task 1 のテスト `suppression works in markdown and jsx comments`。
4. Markdown のコードブロック（` ``` ` で囲んだ部分）と HTML の `<script>`・`<style>`：文章ではないため検出しない。→ Task 1 のテスト `ignores code fences, script and style`。
5. 文の数が少ない本文と英語の文：「できます」の割合は日本語の文が4文以上あるときだけ判定し、英語の文は文末のルールの対象にしない。→ Task 2 のテスト `dekimasu ratio needs at least four japanese sentences`。

---

## ファイル構成

```
skills/copywriting/
├── SKILL.md
├── user-preferences.md
├── references/
│   ├── hearing.md  angles.md  taste.md  anti-patterns.md
│   ├── english.md  body.md    critique.md
└── scripts/
    ├── lint-copy.mjs            CLI
    └── lib/
        ├── copy-engine.mjs      文章の取り出し、抑制、走査、出力
        └── copy-rules.mjs       ルールと語のリスト
tests/copy-lint/
├── engine.test.mjs
├── rules.test.mjs
└── sync.test.mjs                語のリストと anti-patterns.md の一致
```

変更するファイル：`tools/check-skills.mjs`、`tests/tools/check-skills.test.mjs`、`skills/web/SKILL.md`、`skills/design-core/SKILL.md`、`skills/design-core/references/critique.md`、`README.md`、`docs/superpowers/specs/2026-10-03-copywriting-design.md`（4.6節の補足）。

---

### Task 1: lint のエンジンと CLI

**Files:**
- Create: `skills/copywriting/scripts/lib/copy-engine.mjs`
- Create: `skills/copywriting/scripts/lint-copy.mjs`
- Create: `skills/copywriting/scripts/lib/copy-rules.mjs`（この Task では `export const rules = [];` のみ）
- Test: `tests/copy-lint/engine.test.mjs`

**Interfaces:**
- Produces:
  - `extractText(source: string, filePath: string): string` — 入力と同じ長さの文字列を返す。文章でない部分は空白に置き換え、改行は残す（行番号を保つため）。
  - `lintCopySource(source: string, filePath: string, rules: Rule[]): Violation[]` — 行番号順に並べて返す。
  - `lintCopyPaths(paths: string[], options?: { rules?: Rule[] }): Promise<{ violations: Violation[], filesScanned: number }>`
  - `formatViolations(violations: Violation[]): string`
  - `Rule = { id: string, check(text: string): { index: number, message: string }[] }`（`text` は `extractText` の結果）
  - `Violation = { file: string, line: number, rule: string, message: string }`

- [ ] **Step 1: 失敗するテストを書く**

テストでは `noFoo = { id: 'no-foo', check: (t) => [...t.matchAll(/foo/g)].map((m) => ({ index: m.index, message: 'foo は禁止' })) }` を使う。

```js
test('reports file, line and rule', () => {
  assert.deepEqual(lintCopySource('a\nfoo\n', 'x.md', [noFoo]),
    [{ file: 'x.md', line: 2, rule: 'no-foo', message: 'foo は禁止' }]);
});
test('extractText keeps length and newlines', () => {
  const src = '<h1 className="a">foo</h1>\n';
  const t = extractText(src, 'x.tsx');
  assert.equal(t.length, src.length);
  assert.equal(t.indexOf('foo'), src.indexOf('foo'));
  assert.equal(t.endsWith('\n'), true);
});
test('scans jsx text and string literals with spaces or non-ascii', () => {
  const src = 'const a = "foo bar";\nconst b = "foo";\nconst c = "日本foo";\n<p>foo</p>\n';
  assert.deepEqual(lintCopySource(src, 'x.tsx', [noFoo]).map((v) => v.line), [1, 3, 4]);
});
test('ignores class attributes and import specifiers', () => {
  const src = 'import x from "foo lib";\n<div className="foo bar" class="foo x">ok</div>\n';
  assert.equal(lintCopySource(src, 'x.tsx', [noFoo]).length, 0);
});
test('ignores code fences, script and style', () => {
  assert.equal(lintCopySource('```\nfoo\n```\n', 'x.md', [noFoo]).length, 0);
  assert.equal(lintCopySource('<script>foo</script><style>foo</style>\n', 'x.html', [noFoo]).length, 0);
});
test('suppression works in markdown and jsx comments', () => {
  const md = '<!-- copy-lint-disable-next-line no-foo -- 商品名の一部 -->\nfoo\nfoo\n';
  assert.deepEqual(lintCopySource(md, 'x.md', [noFoo]).map((v) => v.line), [3]);
  const jsx = '{/* copy-lint-disable-next-line no-foo -- 商品名の一部 */}\n<p>foo</p>\n';
  assert.equal(lintCopySource(jsx, 'x.tsx', [noFoo]).length, 0);
});
test('suppression without reason is itself a violation', () => {
  const v = lintCopySource('<!-- copy-lint-disable-next-line no-foo -->\nfoo\n', 'x.md', [noFoo]);
  assert.deepEqual(v.map((x) => x.rule).sort(), ['no-foo', 'suppression-without-reason']);
});
test('skips vendor directories and unknown extensions', async () => {
  // 一時ディレクトリに src/a.md（foo）、node_modules/b.md（foo）、c.css（foo）を作る
  const r = await lintCopyPaths([dir], { rules: [noFoo] });
  assert.equal(r.filesScanned, 1);
  assert.equal(r.violations.length, 1);
});
test('cli exits 2 for a missing path, 0 for clean input, 1 for violations', () => { /* spawnSync で3通りを確認 */ });
```

CLI の終了コード 1 の確認には、Task 2 のルールが空でも違反が出る入力として、理由のない抑制コメントだけを書いた `.md` を使う。

- [ ] **Step 2: テストを実行して失敗を確かめる**

Run: `node --test tests/copy-lint/engine.test.mjs`
Expected: FAIL（モジュールが見つからない）

- [ ] **Step 3: `copy-engine.mjs` と `lint-copy.mjs` を実装する**

- 抑制コメントの解析は `skills/web/scripts/lib/lint-engine.mjs` の `parseSuppressions` と同じ考え方で、指示語を `copy-lint-disable-next-line` に変える。抑制コメントは `extractText` の前の元の文字列から解析する。
- `extractText` の規則：
  - `.md`、`.txt`：全体を文章とし、` ``` ` で囲んだ範囲と `<!-- -->` を空白にする。
  - `.tsx`、`.jsx`：JSX のテキスト（`>` と `<` の間で `{}` の外）と、空白か非 ASCII 文字を含む文字列リテラル（`'`、`"`、`${}` を含まない `` ` ``）を文章とする。ただし `className`、`class`、`style`、`href`、`src`、`id`、`key`、`type` 属性の値と、`import`／`export ... from`／`require()` の指定子は除く。コメントは除く。
  - `.html`：タグの外のテキストと、`alt`、`title`、`content`、`aria-label`、`placeholder` 属性の値を文章とする。`<script>`、`<style>` の中身は除く。
- CLI の使い方と終了コードは `skills/web/scripts/lint-design.mjs` と同じ形にし、使い方の文言は `使い方: node lint-copy.mjs <path...>` とする。

- [ ] **Step 4: テストを実行して通ることを確かめる**

Run: `node --test tests/copy-lint/engine.test.mjs`
Expected: PASS

- [ ] **Step 5: コミット**

```bash
git add skills/copywriting/scripts tests/copy-lint/engine.test.mjs
git commit -m "feat: copywriting の lint エンジンと CLI を追加する"
```

---

### Task 2: lint のルール

**Files:**
- Modify: `skills/copywriting/scripts/lib/copy-rules.mjs`
- Modify: `docs/superpowers/specs/2026-10-03-copywriting-design.md`（4.6節）
- Test: `tests/copy-lint/rules.test.mjs`

**Interfaces:**
- Consumes: Task 1 の `Rule`、`lintCopySource`
- Produces（Task 3 の同期テストが使う）：
  - `STRONG_EMPTY_WORDS_JA: string[]` = 価値、特別、可能性、すべての人、全ての人、あなたらしさ、想い、寄り添、革新、次世代、加速、次のレベル
  - `WEAK_EMPTY_WORDS_JA: string[]` = 新しい、未来、体験、毎日
  - `EMPTY_WORDS_EN: string[]` = unlock、elevate、empower、seamless、supercharge、revolutionize、revolutionise、transform、effortless、next level、journey
  - `STOCK_PHRASES: string[]` = と言えるでしょう、といえるでしょう、ではないでしょうか、さまざまな、様々な、多様な、近年、、昨今、
  - `rules: Rule[]`。ルール id は `empty-word`、`motto-template`、`dakejanai-template`、`triple-list`、`english-template`、`stock-phrase`、`repeated-ending`、`dekimasu-ratio`

ルールの判定：

| id | 判定 |
|---|---|
| `empty-word` | 強い語はどこでも検出。弱い語は、その行の文章（前後の空白を除く）が25文字以下のときだけ検出。英語の語は大文字小文字を区別せず、単語の先頭で一致（`Elevates` も一致） |
| `motto-template` | `を、?もっと[^。\n]{1,12}に` |
| `dakejanai-template` | `だけじゃない` または `だけではない` |
| `triple-list` | 30文字以下の行を `、。,.` で区切り、空でない項目が3つ以上あり、どの項目も10文字以下 |
| `english-template` | `\bnot just\b`、`\bwhere\s+\S+\s+meets\s+\S+`、`,\s*reimagined\b`（大文字小文字を区別しない） |
| `stock-phrase` | `STOCK_PHRASES` のいずれか |
| `repeated-ending` | ひらがなかカタカナを含む文（`。！？` と改行で区切る）が3つ続き、閉じ括弧を除いた末尾2文字が同じとき、3つ目の文で検出 |
| `dekimasu-ratio` | ひらがなかカタカナを含む文が4つ以上あり、`(できます|できる|可能です|可能だ|可能となります)$` で終わる文が3割を超えるとき、最初の該当文で1回だけ検出。理由に「N 文中 M 文」を含める |

- [ ] **Step 1: 失敗するテストを書く**

```js
const ids = (src, file = 'x.md') => lintCopySource(src, file, rules).map((v) => v.rule);
test('flags strong empty words anywhere', () => {
  assert.deepEqual(ids('新しい価値を、すべての人へ。\n'), ['empty-word', 'empty-word', 'empty-word']);
});
test('weak empty words are flagged only on short lines', () => {
  assert.deepEqual(ids('毎日を、ひと匙。\n'), ['empty-word']);
  assert.deepEqual(ids('店主は毎日、朝五時に豆を焙煎し、その日の天気を見て挽き方を少しずつ変えている。\n'), []);
});
test('english empty words match word starts case-insensitively', () => {
  assert.deepEqual(ids('Elevates your craft.\n'), ['empty-word']);
  assert.deepEqual(ids('Craft beyond the block.\n'), []);
});
test('flags templates', () => {
  assert.deepEqual(ids('毎日を、もっと自由に。\n'), ['empty-word', 'motto-template']);
  assert.deepEqual(ids('コーヒーだけじゃない。\n'), ['dakejanai-template']);
  assert.deepEqual(ids('速い。安い。うまい。\n'), ['triple-list']);
  assert.deepEqual(ids('Not just a tool.\n'), ['english-template']);
});
test('does not flag two-part copy', () => {
  assert.deepEqual(ids('日本を、1枚で。\n'), []);
  assert.deepEqual(ids('がんばるひとの、がんばらない時間。\n'), []);
});
test('flags stock phrases', () => assert.deepEqual(ids('理想的と言えるでしょう。\n'), ['stock-phrase']));
test('flags the third repeated ending', () => {
  const v = lintCopySource('豆を焼きます。\n袋に詰めます。\n店に並べます。\n', 'x.md', rules);
  assert.deepEqual(v.map((x) => [x.rule, x.line]), [['repeated-ending', 3]]);
});
test('dekimasu ratio needs at least four japanese sentences', () => {
  assert.deepEqual(ids('予約できます。\n持ち帰りできます。\n'), []);
  assert.deepEqual(ids('予約できます。\n持ち帰りも可能です。\n豆は自家焙煎だ。\n朝七時に開く。\n'), ['dekimasu-ratio']);
  assert.deepEqual(ids('You can book. You can take out. You can pay. You can sit.\n'), []);
});
test('scans copy inside tsx', () => {
  assert.deepEqual(ids('<h1 className="transform">Seamless flow</h1>\n', 'x.tsx'), ['empty-word']);
});
```

- [ ] **Step 2: テストを実行して失敗を確かめる**

Run: `node --test tests/copy-lint/rules.test.mjs`
Expected: FAIL

- [ ] **Step 3: `copy-rules.mjs` に上の表のとおりルールを実装する**

- [ ] **Step 4: テストを実行して通ることを確かめる**

Run: `node --test tests/copy-lint/rules.test.mjs tests/copy-lint/engine.test.mjs`
Expected: PASS

- [ ] **Step 5: 設計書 4.6節に、弱い語（新しい、未来、体験、毎日）は25文字以下の行だけで検出することを1文で書き足す**

本文の中では普通の語でもあるため、見出しやキャッチの長さの行に限る、という理由も添える。

- [ ] **Step 6: コミット**

```bash
git add skills/copywriting/scripts/lib/copy-rules.mjs tests/copy-lint/rules.test.mjs docs/superpowers/specs/2026-10-03-copywriting-design.md
git commit -m "feat: copywriting の lint ルールを追加する"
```

---

### Task 3: スキルの文書

**Files:**
- Create: `skills/copywriting/SKILL.md`、`skills/copywriting/user-preferences.md`
- Create: `skills/copywriting/references/` の7ファイル
- Test: `tests/copy-lint/sync.test.mjs`

**Interfaces:**
- Consumes: Task 2 の語のリスト、ルール id、CLI のパス `scripts/lint-copy.mjs`
- Produces（Task 4 が参照する）：`SKILL.md` の見出し `## web から呼ばれたとき`

各ファイルの中身は設計書の該当節を手順書の形に書き直したものである。設計書にない値を足さない。

| ファイル | 元になる節 | 必ず入れるもの |
|---|---|---|
| `SKILL.md` | 4.1、4.10、7章 | 手順1〜8。各手順で読む references。lint のコマンド `node <スキルのディレクトリ>/scripts/lint-copy.mjs <作業用ファイル>`。作業用ファイルは生成物に含めず、`## 切り口名` の見出しの下に `- 案` を並べる形にする。5案の提示の書式（下記）。`## web から呼ばれたとき` の節 |
| `user-preferences.md` | 6章 | `design-core/user-preferences.md` と同じ書き出し。見出しは「好きなコピー」「避けたい言葉」「口調」「英語の使い方」「その他」 |
| `hearing.md` | 4.2 | 質問4つと選択肢（設計書の表の文言のまま）。追加質問の条件と例。依頼で分かっている項目は聞かない |
| `angles.md` | 4.3 | 5つの切り口。それぞれ AI が作った例を1つ（実在のコピーは使わない）。英語の案の割り当て |
| `taste.md` | 4.4 | 好む性質、好まない性質、判定の教訓、英語でも同じ物差し。「スキル作者の調整欄」の表（日本語のキャッチの長さ 20文字以内、英語 3〜5語） |
| `anti-patterns.md` | 4.6 | 空っぽの言葉（Task 2 のリストの語をすべて書く）、避ける型、AI 製の例5本。各項目の「検出」欄に lint のルール id か「自己批評」 |
| `english.md` | 4.8 | 使う場面、長さ、禁止、優先する技、日本語サブコピー |
| `body.md` | 4.7 | 7項目。架空の数字は「ここに数字」 |
| `critique.md` | 4.5 | 差し替えテスト、言葉遊びの確認、事実の確認。各項目を「問い／合格／不合格のとき」の形で書く。最大2周 |

5案の提示の書式（`SKILL.md` に入れる）：

```
1. 〈キャッチ〉
   サブ：〈サブコピー〉
   狙い：〈切り口〉／〈根っこにした事実〉
```

`## web から呼ばれたとき` には、設計書 4.10 の「聞き出しは web の手順2と同じメッセージで行う」「選択を待たず推し案で作る」「残り4案は web の最後の報告に並べる」「推し案には `（推し）` を付ける」を書く。

- [ ] **Step 1: 失敗するテストを書く**

```js
// sync.test.mjs
test('every listed word appears in anti-patterns.md', async () => {
  const doc = await readFile(new URL('../../skills/copywriting/references/anti-patterns.md', import.meta.url), 'utf8');
  for (const w of [...STRONG_EMPTY_WORDS_JA, ...WEAK_EMPTY_WORDS_JA, ...EMPTY_WORDS_EN, ...STOCK_PHRASES]) {
    assert.ok(doc.toLowerCase().includes(w.toLowerCase().replace(/、$/, '')), `${w} が anti-patterns.md にない`);
  }
});
test('every rule id is documented in anti-patterns.md or body.md', async () => { /* rules の id がどちらかに出ること */ });
```

- [ ] **Step 2: テストを実行して失敗を確かめる**

Run: `node --test tests/copy-lint/sync.test.mjs`
Expected: FAIL（ファイルがない）

- [ ] **Step 3: 上の表のとおり9ファイルを書く**

- [ ] **Step 4: テストとスキル文書の検査を実行する**

Run: `node --test tests/copy-lint/ && npm run -s check:skills`
Expected: PASS、`検査に合格した`

- [ ] **Step 5: `angles.md` と `body.md` の例を lint にかける**

Run: `node skills/copywriting/scripts/lint-copy.mjs skills/copywriting/references/angles.md skills/copywriting/references/body.md`
Expected: `違反はありません`（良い例として載せた文が自分の lint に引っかからないことの確認）。`anti-patterns.md` は悪い例を載せるため対象外とする。

- [ ] **Step 6: コミット**

```bash
git add skills/copywriting tests/copy-lint/sync.test.mjs
git commit -m "feat: copywriting スキルの手順書と資料を追加する"
```

---

### Task 4: web スキルとのつながりと README

**Files:**
- Modify: `tools/check-skills.mjs`（`REF_RE`）
- Modify: `tests/tools/check-skills.test.mjs`
- Modify: `skills/web/SKILL.md`（手順2、手順4、手順6）
- Modify: `skills/design-core/SKILL.md`（5節）
- Modify: `skills/design-core/references/critique.md`（C11）
- Modify: `README.md`

**Interfaces:**
- Consumes: Task 3 の `../copywriting/SKILL.md` と見出し `## web から呼ばれたとき`、CLI `../copywriting/scripts/lint-copy.mjs`

- [ ] **Step 1: 失敗するテストを書く**

```js
test('detects a missing sibling skill reference', async () => {
  // 一時ディレクトリに skills/a/SKILL.md（正しい frontmatter）を作り、本文に `../copywriting/SKILL.md` と書く
  assert.match((await checkSkills(d)).join('\n'), /\.\.\/copywriting\/SKILL\.md/);
});
```

- [ ] **Step 2: テストを実行して失敗を確かめる**

Run: `node --test tests/tools/check-skills.test.mjs`
Expected: FAIL（`../copywriting/` が参照として検査されない）

- [ ] **Step 3: `REF_RE` の `\.\.\/design-core\/` を、兄弟スキル全般を表す `\.\.\/[\w-]+\/` に広げる**

- [ ] **Step 4: テストを実行して通ることを確かめる**

Run: `node --test tests/tools/check-skills.test.mjs`
Expected: PASS

- [ ] **Step 5: 文書を直す**

- `web/SKILL.md` 手順2：利用者がキャッチコピーや LP の本文を渡しておらず、`../copywriting/SKILL.md` がある場合は、それの `## web から呼ばれたとき` に従い、コンセプトを宣言する前に聞き出しの質問を1回だけ出して答えを待つ。答えを受けたら、確認を待たずに進む。
- `web/SKILL.md` 手順4：キャッチ、サブコピー、LP の本文は `copywriting` が書いたものを使う。ボタンなどの短い文言は、これまでどおり `../design-core/SKILL.md` の5節に従う。
- `web/SKILL.md` 手順5：`copywriting` を使った場合は `node ../copywriting/scripts/lint-copy.mjs <生成物のディレクトリ>` も実行し、違反をゼロにする。
- `web/SKILL.md` 手順6：使わなかった4案を報告に並べる。
- `design-core/SKILL.md` 5節：冒頭の「文章を生成するスキルはまだない」を、「キャッチ、サブコピー、LP の本文は `copywriting` スキルがあればそれが書く。ないとき、およびマイクロコピーは次のとおりにする」に置き換える。
- `critique.md` C11：合格の条件に「`copywriting` が書いた文章は `lint-copy.mjs` の違反がゼロである」を足し、ダミーの対象を `copywriting` の範囲外の文章に限る。
- `README.md`：一覧の `copywriting` を「提供中」にし、役割に lint を含むことを書く。「`copywriting` ができるまでは〜」の行を、`web` が `copywriting` を呼ぶことと、導入しない場合はダミーになることの説明に置き換える。導入方法の `cp -r` に `skills/copywriting` を加え、3つを同じディレクトリに並べることを書く。調整欄の節に `skills/copywriting/user-preferences.md` を加える。

- [ ] **Step 6: 全テストと検査を実行する**

Run: `npm test && npm run -s check:skills`
Expected: すべて PASS、`検査に合格した`

- [ ] **Step 7: コミット**

```bash
git add tools tests/tools skills/web/SKILL.md skills/design-core README.md
git commit -m "feat: web スキルから copywriting を呼ぶ"
```

---

### Task 5: スキルなし／ありの比較評価

**Files:**
- Create: `docs/superpowers/evals/2026-10-03-copywriting-baseline-vs-skill.md`
- Modify（判定の結果しだい）：`skills/copywriting/references/taste.md`、`skills/copywriting/references/anti-patterns.md`

この Task はスキル作者の判定を待つ。判定の前に作業を止め、判定を受け取ってから Step 5 以降を行う。

- [ ] **Step 1: お題ごとの素材メモを作る**

お題は設計書 8章の4つ（カフェ、イラストレーターのポートフォリオ、開発者向けツール、地域の小さな工務店）。聞き出しの答えに当たる素材メモ（商品の説明、一番伝えたいこと、事実を2〜3個）を架空で作り、評価の記録に書く。スキルなし／ありの両方に同じメモを渡す。

- [ ] **Step 2: 生成する**

お題ごとに、新しいサブエージェントで「スキルなしでキャッチコピーを5案」と「`skills/copywriting/SKILL.md` に従って5案（聞き出しは素材メモで答えたものとする）」を作る。モデルは同じにする。

- [ ] **Step 3: lint をかけて記録する**

両方の案を作業用ファイルに書き、`lint-copy.mjs` の件数をお題ごとに表にする。

- [ ] **Step 4: 混ぜてスキル作者に見せる**

お題ごとに10案の順番を混ぜ、どちらのものかを伏せた番号付きの一覧をスキル作者に出し、「好き」の番号だけを答えてもらう。ここで止まる。

- [ ] **Step 5: 判定を記録して合格を確かめる**

種明かしの表（番号、スキルなし／あり、印）と、合格基準（スキルありの違反ゼロ、4つのお題すべてで「好き」の過半数がスキルあり）の結果を書く。

- [ ] **Step 6: スキル作者の感想を資料に足す**

感想を原則に言い換えて `taste.md` か `anti-patterns.md` に足し、`npm test && npm run -s check:skills` を通す。

- [ ] **Step 7: コミット**

```bash
git add docs/superpowers/evals skills/copywriting
git commit -m "docs: copywriting のスキルなし／ありの比較評価を記録する"
```
