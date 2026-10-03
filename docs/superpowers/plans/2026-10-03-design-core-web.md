# 汎用デザインスキル（design-core ＋ web）実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** AI 感のないデザインを出力させる Claude スキル `design-core` と `web` を、禁止パターンの自動検出・スクリーンショット撮影のスクリプト付きで作る。

**Architecture:** 各スキルは短い手順書（`SKILL.md`）と、必要時に読む `references/` で構成する。`web` は検証用のスクリプト（`lint-design.mjs`、`screenshot.mjs`）を同梱し、外部依存なしで動く lint と、Playwright によるスクリーンショットで検証ループを機械的に回す。リポジトリ直下の `tools/` には、スキル文書の構造・匿名化・レシピのコードを検査する開発用ツールを置く。

**Tech Stack:** Node.js 22（ESM、`node:test`）、Playwright、TypeScript（レシピの型検査のみ）、React 19、React Aria Components、Tailwind CSS v4、Motion、GSAP、Iconify。

**Spec:** `docs/superpowers/specs/2026-10-03-design-core-web-design.md`

## Global Constraints

- スキル文書・README・コメントは標準語で書き、である調に統一する。関西弁は使わない。
- `SKILL.md` の frontmatter は `name`（ディレクトリ名と一致）と `description`（1024文字以内、日本語＋英語の検索語を含める）を持つ。
- `skills/` と `docs/` に実例のサービス名・アプリ名・サイト名・URL を書かない。匿名ラベル（「サイト1」「アプリA（チャット）」など）と種類で表す（設計書 5.1.1）。
- 実例の HTML・CSS・JS・画像・文章・スクリーンショットをリポジトリに入れない。スクリーンショットはスクラッチ領域に置く。
- `skills/web/scripts/lint-design.mjs` は Node.js 標準モジュールのみで動く（スキル単体で配布できるようにするため）。
- `skills/web/scripts/screenshot.mjs` が依存してよい外部パッケージは `playwright` のみ。
- 優先順位：プロンプトでの指示 ＞ `design-core/user-preferences.md` ＞ 各 `references/` の「スキル作者の調整欄」。
- テーマの既定は「ダーク基本＋ライト対応」。プロンプトの指定で上書きする。
- スクリーンショットの幅は PC 1440px、スマートフォン 390px。
- 自己批評の周回は最大2周。
- アニメーションの初期値：アプリ系 120〜240ms・遅延 20〜40ms、サイト系 600〜1200ms・遅延 40〜80ms、既定の減速カーブ `cubic-bezier(0.22, 1, 0.36, 1)`。
- lint の抑制コメントの形式：`design-lint-disable-next-line <ルール名> -- <理由>`。理由のない抑制はそれ自体を違反とする。
- 匿名化の検査に使う実名リストはリポジトリに含めず、環境変数 `REFERENCE_DENYLIST`（1行1語のテキストファイルのパス）で渡す。

## Review Focus

1. 本文中の矢印・絵文字（例：段落内の「A → B」、チャットのメッセージ本文の絵文字）：ボタン・リンク・リスト項目の外にある場合は違反にしない。→ Task 2 のテスト `ignores arrows and emoji outside interactive elements`。
2. 抑制コメントの効果範囲：直後の1行だけを抑制し、2行先の同じ違反は検出する。→ Task 1 のテスト `suppression applies to the next line only`。
3. ディレクトリ指定時の走査：`node_modules`・`dist`・`.git` 配下は無視し、存在しないパスは終了コード 2 とエラー文で知らせる。→ Task 1 のテスト `skips vendor directories` と `missing path exits with code 2`。
4. Tailwind の白・黒・任意値（`bg-white`、`bg-black`、`bg-[var(--accent)]`、`text-accent-500` のような自前トークン）を標準パレットとして誤検出しない。→ Task 2 のテスト `does not flag white, black, arbitrary values or custom tokens`。
5. ブラウザが起動できない環境：`screenshot.mjs` が撮影済みであるかのように振る舞わず、「ブラウザ」を含むエラー文と終了コード 1 を返す。→ Task 3 のテスト `reports a clear error when the browser cannot launch`。

---

## ファイル構成

```
package.json                              開発用（テスト、型検査の依存）
.gitignore                                node_modules、スクリーンショット、一時ファイル
README.md                                 導入方法、スキル一覧、調整欄の説明
skills/design-core/
  SKILL.md
  user-preferences.md
  references/{concept-brief,anti-patterns,color,typography-ja,critique}.md
skills/web/
  SKILL.md
  references/{mode-site,mode-app,intuitive-ui,tokens-tailwind,motion-web}.md
  references/components/{button,text-input,number-field,select,checkbox-radio-switch,tabs,modal,toast,tooltip-popover-menu,scrollbar,loading,states,selection,icons}.md
  references/observations/{site,app}.md
  scripts/lint-design.mjs                 CLI
  scripts/lib/lint-engine.mjs             走査、抑制、整形
  scripts/lib/lint-rules.mjs              ルール定義
  scripts/screenshot.mjs                  CLI と captureScreenshots()
tools/
  check-skills.mjs                        frontmatter、参照パス、匿名化の検査
  check-recipes.mjs                       レシピのコードの lint と型検査
  recipes-tsconfig.json
tests/
  lint/engine.test.mjs
  lint/rules.test.mjs
  screenshot.test.mjs
  tools/check-skills.test.mjs
  tools/check-recipes.test.mjs
  fixtures/...
```

---

### Task 1: リポジトリの土台と lint エンジン

**Files:**
- Create: `package.json`, `.gitignore`
- Create: `skills/web/scripts/lint-design.mjs`
- Create: `skills/web/scripts/lib/lint-engine.mjs`
- Create: `skills/web/scripts/lib/lint-rules.mjs`（この Task では `export const rules = []` と `export const projectRules = []` のみ）
- Test: `tests/lint/engine.test.mjs`、`tests/fixtures/lint/engine/`

**Interfaces:**
- Produces:
  - 型 `Violation = { file: string, line: number, rule: string, message: string }`
  - 型 `Rule = { id: string, extensions: string[], check(source: string, filePath: string): Array<{ index: number, message: string }> }`（`index` は `source` 内の文字位置）
  - 型 `ProjectRule = { id: string, check(files: Array<{ path: string, source: string }>): Violation[] }`
  - `lintSource(source: string, filePath: string, rules: Rule[]): Violation[]`（抑制コメント適用済み）
  - `lintPaths(paths: string[], options?: { rules?: Rule[], projectRules?: ProjectRule[] }): Promise<{ violations: Violation[], filesScanned: number }>`。省略時は `lint-rules.mjs` の `rules` / `projectRules` を使う
  - `formatViolations(violations: Violation[]): string`（1件1行 `file:line  rule  message`、末尾に `N 件の違反` の行）
  - CLI：`node skills/web/scripts/lint-design.mjs <path...>`。違反なし→終了コード 0 と `違反はありません（N ファイル）`、違反あり→1、引数なし・存在しないパス→2

- [ ] **Step 1: 土台を作る**

`package.json`：`"type": "module"`、`"private": true`、`"engines": { "node": ">=22" }`、`"scripts": { "test": "node --test tests/" }`。`.gitignore`：`node_modules/`、`screenshots/`、`*.png`、`.tmp/`。

- [ ] **Step 2: 失敗するテストを書く**

`tests/lint/engine.test.mjs` に、テスト用ルール `{ id: 'no-foo', extensions: ['.tsx','.css'], check: s => [...s.matchAll(/foo/g)].map(m => ({ index: m.index, message: 'foo は禁止' })) }` を注入して次を検証する。

```js
test('reports file, line and rule', () => {
  const v = lintSource('a\nfoo\n', 'x.tsx', [noFoo]);
  assert.deepEqual(v, [{ file: 'x.tsx', line: 2, rule: 'no-foo', message: 'foo は禁止' }]);
});
test('suppression applies to the next line only', () => {
  const src = '// design-lint-disable-next-line no-foo -- 意図的\nfoo\nfoo\n';
  assert.deepEqual(lintSource(src, 'x.tsx', [noFoo]).map(v => v.line), [3]);
});
test('suppression without reason is itself a violation', () => {
  const v = lintSource('// design-lint-disable-next-line no-foo\nfoo\n', 'x.tsx', [noFoo]);
  assert.deepEqual(v.map(x => x.rule).sort(), ['no-foo', 'suppression-without-reason']);
});
test('css block comments can suppress', () => {
  const src = '/* design-lint-disable-next-line no-foo -- 進捗バー */\nfoo\n';
  assert.equal(lintSource(src, 'x.css', [noFoo]).length, 0);
});
test('rules only run on their extensions', () => {
  assert.equal(lintSource('foo', 'x.md', [noFoo]).length, 0);
});
test('skips vendor directories', async () => {
  // fixtures/lint/engine/ に src/a.tsx（foo を含む）と node_modules/b.tsx・dist/c.tsx（foo を含む）を置く
  const r = await lintPaths([fixtureDir], { rules: [noFoo], projectRules: [] });
  assert.equal(r.filesScanned, 1);
  assert.equal(r.violations.length, 1);
});
test('missing path exits with code 2', () => {
  const r = spawnSync('node', [cli, 'no/such/path']);
  assert.equal(r.status, 2);
  assert.match(r.stderr.toString(), /見つかりません/);
});
test('clean input exits 0', () => { /* 違反のない fixture で status 0、stdout に「違反はありません」 */ });
```

- [ ] **Step 3: テストが失敗することを確認する**

Run: `npm test`
Expected: FAIL（`lint-engine.mjs` が存在しない）

- [ ] **Step 4: 実装する**

走査対象の拡張子は `.tsx .jsx .ts .js .css .html`。除外ディレクトリは `node_modules dist build .git .next`。抑制コメントは `//` と `/* */` の両形式を受け付け、理由（`--` の後の空白以外の文字列）がなければ `suppression-without-reason` を出す。行番号は `index` から改行数で求める。

- [ ] **Step 5: テストが通ることを確認する**

Run: `npm test`
Expected: PASS（8 件）

- [ ] **Step 6: コミット**

```bash
git add package.json .gitignore skills/web/scripts tests
git commit -m "feat: lint-design のエンジンと CLI を追加"
```

---

### Task 2: lint のルール

**Files:**
- Modify: `skills/web/scripts/lib/lint-rules.mjs`
- Test: `tests/lint/rules.test.mjs`

**Interfaces:**
- Consumes: Task 1 の `Rule`、`ProjectRule`、`lintSource`、`lintPaths`
- Produces: `rules: Rule[]`、`projectRules: ProjectRule[]`。ルール ID は次の表のとおり（`critique.md` と `SKILL.md` がこの ID を参照する）

| ID | 対象 | 検出条件 |
|---|---|---|
| `text-arrow` | .tsx .jsx .html | `<button>` `<a>` `<Button>` `<Link>` `<li>` 要素の子テキストに `→ ↗ ↘ ← ↑ ↓ › ‹ » « ▼ ▲ ▶ ◀ ➜ ➔ ⟶` のいずれか |
| `emoji-icon` | .tsx .jsx .html | 同じ要素の子テキストに `\p{Extended_Pictographic}` |
| `tailwind-default-palette` | .tsx .jsx .html .css | `(bg|text|border|ring|from|via|to|fill|stroke|outline|decoration|divide|shadow|accent|caret|placeholder)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(50|100|…|900|950)`（`/不透明度` 付きも含む） |
| `gradient-text` | 全対象 | 同じ `className` 文字列に `bg-clip-text` と `bg-gradient-`／`bg-linear-` が共存する。または同じ CSS ルール内に `background-clip: text` と `gradient(` が共存する |
| `purple-blue-gradient` | 全対象 | Tailwind の `from-(purple|violet|indigo|blue|fuchsia)` と `to-(purple|violet|indigo|blue|fuchsia|pink)` が同じ `className` にある。または CSS の `*-gradient(` 内の16進色がすべて色相 220〜300° |
| `generic-font-only` | .css .html .tsx | `font-family:` または `--font-*:` の値から総称ファミリー（`sans-serif` `serif` `monospace` など）を除いた全要素が `Inter Roboto Poppins Arial Helvetica system-ui -apple-system "Segoe UI"` のいずれか |
| `native-select` | .tsx .jsx .html | `<select` |
| `native-number-input` | .tsx .jsx .html | `type="number"` または `type='number'` |
| `transition-all` | 全対象 | クラス `transition-all`、または CSS `transition: all` / `transition-property: all` |
| `default-easing` | 全対象 | クラス `ease-linear` `ease-in` `ease-out` `ease-in-out`（完全一致）、または CSS の `transition`／`animation` 宣言で `ease` 系・`linear` キーワードを使うもの、もしくはタイミング関数を持たない `transition:` 宣言 |
| `no-reduced-motion`（ProjectRule） | 走査した全ファイル | `@keyframes`・`animation:`・`motion/react`・`gsap` のいずれかが存在し、かつどのファイルにも `prefers-reduced-motion`・`useReducedMotion`・`reducedMotion` がない。最初の出現箇所に1件だけ報告する |

各ルールのメッセージは「何が違反か」と「代わりにどうするか」を1文ずつ含める（例：`text-arrow`：「ボタン内の文字の矢印はフォントで形と位置が崩れる。Iconify の SVG アイコンに置き換える」）。

- [ ] **Step 1: 失敗するテストを書く**

ルールごとに「検出される例」と「検出されない例」を1つ以上 `lintSource` で検証する。加えて次の2件を必ず含める。

```js
test('ignores arrows and emoji outside interactive elements', () => {
  const src = '<p>手順 A → B 🎉</p>\n<div>{message.text}</div>';
  assert.equal(lintSource(src, 'x.tsx', rules).length, 0);
});
test('does not flag white, black, arbitrary values or custom tokens', () => {
  const src = '<div className="bg-white text-black bg-[var(--accent)] text-accent-500 border-ink-200" />';
  assert.equal(lintSource(src, 'x.tsx', rules).length, 0);
});
test('no-reduced-motion is satisfied by any file in the project', async () => {
  // fixtures: a.css に @keyframes、b.css に @media (prefers-reduced-motion: reduce) → 0 件
  // a.css だけを走査 → no-reduced-motion が 1 件
});
```

- [ ] **Step 2: テストが失敗することを確認する**

Run: `npm test`
Expected: FAIL（ルール未定義のため検出 0 件）

- [ ] **Step 3: 表のとおりにルールを実装する**

要素スコープの判定は正規表現 `<(button|a|Button|Link|li)\b[^>]*>([\s\S]*?)<\/\1>` で子テキストを取り出し、その中の `{...}` 式は対象外にする。色相は16進色を HSL に変換して求める。

- [ ] **Step 4: テストが通ることを確認する**

Run: `npm test`
Expected: PASS

- [ ] **Step 5: コミット**

```bash
git add skills/web/scripts/lib/lint-rules.mjs tests/lint
git commit -m "feat: lint-design の禁止パターンのルールを追加"
```

---

### Task 3: スクリーンショット撮影

**Files:**
- Create: `skills/web/scripts/screenshot.mjs`
- Test: `tests/screenshot.test.mjs`、`tests/fixtures/screenshot/page.html`
- Modify: `package.json`（devDependencies に `playwright`）

**Interfaces:**
- Produces:
  - `captureScreenshots({ target: string, outDir: string, widths?: number[], themes?: Array<'dark'|'light'> }): Promise<string[]>`。既定は `widths = [1440, 390]`、`themes = ['dark','light']`。`target` は URL またはローカルファイルのパス。保存名は `${width}-${theme}.png`、全ページを撮影する。戻り値は保存したパスの配列
  - テーマの適用：`page.emulateMedia({ colorScheme: theme })` と `document.documentElement.dataset.theme = theme` の両方を行う
  - ブラウザの実行ファイルは環境変数 `CHROMIUM_PATH` があればそれを使う
  - CLI：`node skills/web/scripts/screenshot.mjs <target> --out <dir> [--widths 1440,390] [--themes dark,light]`。成功時は保存パスを1行ずつ出力して終了コード 0。`playwright` が読み込めない場合は `npm i -D playwright` を案内して終了コード 1。ブラウザが起動できない場合は「ブラウザを起動できませんでした」を含む文と終了コード 1

- [ ] **Step 1: 失敗するテストを書く**

```js
test('captures every width and theme', async () => {
  const files = await captureScreenshots({ target: fixturePage, outDir: tmp });
  assert.deepEqual(files.map(f => path.basename(f)).sort(),
    ['1440-dark.png','1440-light.png','390-dark.png','390-light.png']);
  assert.equal(pngWidth(files.find(f => f.endsWith('390-dark.png'))), 390);
});
test('themes differ', async () => {
  // fixture はダークで黒、ライトで白の背景。2枚のバイト列が異なることを確認
});
test('reports a clear error when the browser cannot launch', () => {
  const r = spawnSync('node', [cli, fixturePage, '--out', tmp], { env: { ...process.env, CHROMIUM_PATH: '/nonexistent' } });
  assert.equal(r.status, 1);
  assert.match(r.stderr.toString(), /ブラウザ/);
});
```

`pngWidth(file)` は PNG ヘッダーの16〜19バイト目を読むテスト内の補助関数とする。

- [ ] **Step 2: テストが失敗することを確認する**

Run: `CHROMIUM_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome npm test`
Expected: FAIL（`screenshot.mjs` が存在しない）

- [ ] **Step 3: 実装する**

- [ ] **Step 4: テストが通ることを確認する**

Run: `CHROMIUM_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome npm test`
Expected: PASS

- [ ] **Step 5: コミット**

```bash
git add skills/web/scripts/screenshot.mjs tests package.json package-lock.json
git commit -m "feat: テーマと幅ごとのスクリーンショット撮影スクリプトを追加"
```

---

### Task 4: スキル文書の検査ツール

**Files:**
- Create: `tools/check-skills.mjs`
- Test: `tests/tools/check-skills.test.mjs`、`tests/fixtures/skills/`

**Interfaces:**
- Produces:
  - `checkSkills(rootDir: string, options?: { denylist?: string[] }): Promise<string[]>`（問題の一覧。空なら合格）
  - 検査内容：
    1. `skills/*/SKILL.md` に frontmatter があり、`name` がディレクトリ名と一致し、`description` が 1〜1024 文字
    2. 各 `SKILL.md` と `references/**/*.md` に書かれた相対パス（`references/...`、`scripts/...`、`../design-core/...` の形のバッククォート内文字列）が実在する
    3. `denylist` の各語が `skills/` と `docs/` 以下の全ファイルに（大文字小文字を区別せず）出現しない
  - CLI：`node tools/check-skills.mjs`。環境変数 `REFERENCE_DENYLIST` が指すファイル（1行1語）があれば匿名化検査を行い、なければ「匿名化の検査は省略しました」と出力する。問題があれば終了コード 1
  - `package.json` に `"check:skills": "node tools/check-skills.mjs"` を追加

- [ ] **Step 1: 失敗するテストを書く**

fixture に「正しいスキル」「name 不一致」「参照先が存在しない」「禁止語を含む」の4パターンを用意し、それぞれ検出の有無を確認する。

```js
test('passes a valid skill', async () => assert.deepEqual(await checkSkills(okDir), []));
test('detects name mismatch', async () => assert.match((await checkSkills(badNameDir))[0], /name/));
test('detects missing reference', async () => assert.match((await checkSkills(missingRefDir))[0], /references\/nope\.md/));
test('detects denylisted term', async () =>
  assert.match((await checkSkills(okDir, { denylist: ['secretname'] })).join('\n'), /secretname/));
```

（`okDir` の fixture 内のどこかに `SecretName` を含め、大文字小文字を無視して検出されることを確認する）

- [ ] **Step 2: テストが失敗することを確認する** — Run: `npm test` / Expected: FAIL

- [ ] **Step 3: 実装する**

- [ ] **Step 4: テストが通ることを確認する** — Run: `npm test` / Expected: PASS

- [ ] **Step 5: 実名リストをスクラッチ領域に作る（リポジトリには入れない）**

スクラッチ領域の `reference-map.md` に記載された実名（サービス名とドメイン名）を1行1語で `reference-denylist.txt` に書き出す。一般的な技術用語と衝突する語（例：CSS の `-apple-system` に含まれる語）は単独で登録せず、ドメイン形式やガイドラインの正式名称で登録する。

Run: `REFERENCE_DENYLIST=<scratchpad>/reference-denylist.txt node tools/check-skills.mjs`
Expected: `skills/` がまだないため frontmatter の問題は出ず、`docs/` に禁止語が出現しないこと

- [ ] **Step 6: コミット**

```bash
git add tools/check-skills.mjs tests package.json
git commit -m "feat: スキル文書の構造と匿名化の検査ツールを追加"
```

---

### Task 5: design-core の思想と禁止リスト

**Files:**
- Create: `skills/design-core/SKILL.md`
- Create: `skills/design-core/user-preferences.md`
- Create: `skills/design-core/references/concept-brief.md`
- Create: `skills/design-core/references/anti-patterns.md`
- Create: `skills/design-core/references/color.md`
- Create: `skills/design-core/references/critique.md`

**Interfaces:**
- Consumes: Task 2 のルール ID（`anti-patterns.md` の各項目に、対応する lint ルール ID を併記する。機械で検出できない項目は「自己批評で確認」と書く）
- Produces: `web/SKILL.md` が読む順序と、`critique.md` のチェック項目番号（`C1`〜）

内容の決定事項：

- `SKILL.md`
  - description：AI 感のないデザインのための共通思想。媒体別スキル（web など）から最初に読まれる。英語検索語 `design, anti-AI-look, visual design, typography, color` を含める
  - 本文：(1) スキルの考え方（平均への回帰を防ぐ）、(2) 優先順位（Global Constraints のとおり）、(3) コンセプト先行の手順（`concept-brief.md` を読む）、(4) どの段階で `anti-patterns.md`・`color.md`・`typography-ja.md`・`critique.md` を読むか、(5) 文章は生成しない暫定ルール（ダミーと分かる仮の文章を置き、「Unlock the power of〜」などの定型コピーを書かない）
- `user-preferences.md`：ひな形のみ。見出し「好きな色」「避けたい色」「好きなフォント」「避けたいもの」「テーマの既定」「アニメーションの好み」「その他」と、各見出しに書き方の例を1行（コメントとして）置く。初期状態では値を入れない
- `concept-brief.md`：3行（誰に／どんな印象を／何で記憶に残すか）の書き方、良い例と悪い例を各3組（悪い例は「モダンで洗練された」のような誰にでも当てはまる形容詞）、サイト系・アプリ系の判定基準（設計書 4.2 の表）、テーマの決め方（設計書 4.3）
- `anti-patterns.md`：設計書 4.8 の全項目を3段階で記載し、各項目に「禁止事項」「理由」「代わりにどうするか」「lint ルール ID または自己批評」を書く。冒頭に「スキル作者の調整欄」の見出しを置き、項目の追加方法を説明する
- `color.md`：(1) アクセントは1色、使う場所は主要な操作・選択中・肯定的な状態に限る、(2) 色を足さず明暗の反転で主役を示す方法、(3) UI の色と中身の色を分ける場合の条件、(4) グレーは8〜10段階、純粋な黒（`#000`）と暖かみのある黒の使い分け、(5) ダークとライトでトークンを差し替える構造、(6) 大胆なアクセントを成立させる条件。数値は「スキル作者の調整欄」の表にまとめる
- `critique.md`：スクリーンショットを見て答える項目を `C1`〜`C12` の番号付きで並べる。必ず含める項目：コンセプトの3行が画面から読み取れるか／記憶のフックが最初の画面にあるか／余白にメリハリがあるか／アクセントの使用箇所が限定されているか／文字の階層が太さと色で作られているか／影は浮いているものにだけ使われているか／スマートフォン幅で崩れていないか／ダークとライトの両方で破綻していないか／`anti-patterns.md` の自己批評項目に該当しないか。最後に「2周で止め、残った問題は報告する」と書く

- [ ] **Step 1: 6ファイルを書く**

- [ ] **Step 2: 検査する**

Run: `REFERENCE_DENYLIST=<scratchpad>/reference-denylist.txt npm run check:skills`
Expected: 問題なし（終了コード 0）

- [ ] **Step 3: コミット**

```bash
git add skills/design-core
git commit -m "feat: design-core の手順、禁止リスト、色、自己批評を追加"
```

---

### Task 6: 和文と欧文の組み合わせ表

**Files:**
- Create: `skills/design-core/references/typography-ja.md`

内容の決定事項：

- 印象ごと（静か／精密／遊びがある／力強い／やわらかい／編集的）に、和文フォントと欧文フォントの組み合わせを各2〜3組、合計12組以上載せる
- すべて Google Fonts で配信されているフォントに限る。Noto Sans JP 単独、Inter 単独、Roboto、Poppins を主役にした組み合わせは載せない
- 各組に「見出し」「本文」「数字（等幅が必要な場合）」の役割と、和文・欧文それぞれの字間（em）・行間の初期値を書く
- 和欧混植のルール：欧文を先に指定して和文を後に置く `font-family` の順序、欧文のサイズ補正（`size-adjust` などの使いどころ）、約物の扱い
- 冒頭に「スキル作者の調整欄」の表を置く

- [ ] **Step 1: 候補を書く**

- [ ] **Step 2: すべてのフォント名が Google Fonts に存在することを確認する**

Run: 表のフォント名を抜き出し、`https://fonts.googleapis.com/css2?family=<名前の空白を+に置換>` に1件ずつリクエストする
Expected: 全件 HTTP 200（400 が返ったフォントは差し替える）

- [ ] **Step 3: 検査してコミット**

Run: `REFERENCE_DENYLIST=<scratchpad>/reference-denylist.txt npm run check:skills` / Expected: 問題なし

```bash
git add skills/design-core/references/typography-ja.md
git commit -m "feat: 和文と欧文の組み合わせ表を追加"
```

---

### Task 7: サイト系の観察とモード資料

**Files:**
- Create: `skills/web/references/observations/site.md`
- Create: `skills/web/references/mode-site.md`

内容の決定事項：

- 分析対象はスクラッチ領域の `reference-map.md` に記載されたサイト1〜4（ギャラリーサイトは対象外で、`site.md` の末尾に「実例を探す場所：Web デザインのギャラリーサイト」としてのみ記載する。名前と URL は書かない）
- 分析方法：Playwright でトップページを PC 幅で開き、スクロールしながら `getComputedStyle` で次の値を取得するスクリプトをスクラッチ領域に書いて実行する（スクリプトもリポジトリに入れない）。取得する値：見出しと本文のフォントファミリー・サイズ・太さ・字間・行間、セクション間の余白、使われている色の数と主要色の役割、グリッドの列数と左右の余白、`transition` と `animation` の所要時間とタイミング関数
- `site.md`：サイト1〜4ごとに「観察した数値」と「言語化した原則」を記載し、観察日（実施日）を添える。末尾に4サイト共通の傾向をまとめる
- `mode-site.md`：共通の傾向から、サイト系で守る原則と数値の幅を書く。「スキル作者の調整欄」の表を置く。特定のサイトを再現する指示は書かない
- 1サイトの数値をまとめて移植しない。`mode-site.md` の数値は必ず複数サイトの範囲として書く

- [ ] **Step 1: 分析スクリプトをスクラッチ領域に書いて4サイトを計測する**

Expected: サイトごとの計測結果（JSON）がスクラッチ領域に保存されている。取得できなかった値は「取得できず」と記録し、推測で埋めない

- [ ] **Step 2: `site.md` と `mode-site.md` を書く**

- [ ] **Step 3: 検査してコミット**

Run: `REFERENCE_DENYLIST=<scratchpad>/reference-denylist.txt npm run check:skills` / Expected: 問題なし

```bash
git add skills/web/references/observations/site.md skills/web/references/mode-site.md
git commit -m "feat: サイト系の観察記録とモード資料を追加"
```

---

### Task 8: アプリ系の観察、モード資料、直感的な UI

**Files:**
- Create: `skills/web/references/observations/app.md`
- Create: `skills/web/references/mode-app.md`
- Create: `skills/web/references/intuitive-ui.md`

内容の決定事項：

- `app.md`：設計書 5.3 の表（アプリA〜F）と共通原則6項目を、観察日 2026-10-03 とともに記載する
- `mode-app.md`：アプリ系の原則と数値の幅。必ず含める項目：情報の密度（行の高さ 36〜56px の範囲で用途別）、一覧の2段表示、アクセントの限定、影の使い所、ショートカットキーと件数の表示、ホバー時のみ現れる操作、パネルの区切り方（枠線／明度差／島）、数値パラメータの1行構成（アイコン＋ラベル＋スライダー＋数値入力＋単位＋リセット）、数値表示の等幅、`user-select` のルール（`components/selection.md` を参照）。「スキル作者の調整欄」の表を置く
- `intuitive-ui.md`：大手 OS メーカーの公式サイトと公開 UI ガイドラインを読み、原則を自分の言葉で要約する。章立て：見れば操作が分かる（アフォーダンス）／状態を常に伝える（フィードバック）／一貫性／取り消せる操作と確認の使い分け／迷わせない導線（1画面1つの主目的）／段階的に見せる／誤操作を防ぐ。各原則に「Web でどう実装するか」を1〜3行添える。ガイドラインの文章をそのまま引用しない。メーカー名と URL は書かない

- [ ] **Step 1: 公開 UI ガイドラインを WebFetch で読み、原則をメモする（スクラッチ領域）**

- [ ] **Step 2: 3ファイルを書く**

- [ ] **Step 3: 検査してコミット**

Run: `REFERENCE_DENYLIST=<scratchpad>/reference-denylist.txt npm run check:skills` / Expected: 問題なし

```bash
git add skills/web/references/observations/app.md skills/web/references/mode-app.md skills/web/references/intuitive-ui.md
git commit -m "feat: アプリ系の観察記録、モード資料、直感的な UI の原則を追加"
```

---

### Task 9: トークンとアニメーションの資料

**Files:**
- Create: `skills/web/references/tokens-tailwind.md`
- Create: `skills/web/references/motion-web.md`

**Interfaces:**
- Produces: トークン名の命名規則。以降のレシピ（Task 10・11）はこの名前を使う
  - 色：`--color-bg`、`--color-surface-1`〜`--color-surface-3`、`--color-ink`、`--color-ink-muted`、`--color-ink-subtle`、`--color-line`、`--color-accent`、`--color-accent-ink`（アクセント上の文字色）、`--color-danger`、`--color-success`
  - 角丸：`--radius-sm`、`--radius-md`、`--radius-lg`、`--radius-island`
  - 影：`--shadow-float`（浮いている要素専用。他の影は定義しない）
  - フォント：`--font-display`、`--font-body`、`--font-mono`
  - イージング：`--ease-out-quint: cubic-bezier(0.22, 1, 0.36, 1)`、`--ease-in-out-quart`、`--ease-spring-soft`
  - 所要時間：`--duration-fast`（120ms）、`--duration-base`（180ms）、`--duration-slow`（240ms）、`--duration-reveal`（800ms）

内容の決定事項：

- `tokens-tailwind.md`：Tailwind v4 の `@import "tailwindcss";` と `@theme` による定義例（上記トークンをすべて含む）、`@theme` で標準パレットを無効化する書き方（`--color-*: initial;`）、ダークとライトの切り替え（`[data-theme="light"]` と `prefers-color-scheme` の両対応）、禁止クラス（lint ルール `tailwind-default-palette`・`transition-all`・`default-easing` との対応）、テーマ指定がプロンプトにある場合の扱い
- `motion-web.md`：冒頭に「スキル作者の調整欄」の表（Global Constraints のアニメーション初期値と上記の所要時間・イージング）。続けて、Motion・GSAP（ScrollTrigger、SplitText）・Lenis の使い分け、各ライブラリの最小コード例（登場、スクロール連動、文字単位の演出、メニューの開閉）、`prefers-reduced-motion` への対応例（Motion の `MotionConfig reducedMotion="user"`、GSAP の `gsap.matchMedia()`）、禁止事項（全要素を同じ速さ・方向・遅延で動かすこと、理由なき `ease`・`linear`）。将来の `motion` スキル（動画）との役割分担を1段落で書く

- [ ] **Step 1: 2ファイルを書く**

- [ ] **Step 2: 資料内のコード例が lint を通ることを確認する**

Run: 両ファイルの ```css / ```tsx コードブロックをスクラッチ領域に書き出し、`node skills/web/scripts/lint-design.mjs <書き出し先>` を実行する
Expected: `違反はありません`

- [ ] **Step 3: 検査してコミット**

Run: `REFERENCE_DENYLIST=<scratchpad>/reference-denylist.txt npm run check:skills` / Expected: 問題なし

```bash
git add skills/web/references/tokens-tailwind.md skills/web/references/motion-web.md
git commit -m "feat: Tailwind トークンとアニメーションの資料を追加"
```

---

### Task 10: レシピの検査ツールと、入力系の部品レシピ

**Files:**
- Create: `tools/check-recipes.mjs`、`tools/recipes-tsconfig.json`
- Create: `skills/web/references/components/{button,text-input,number-field,select,checkbox-radio-switch,tabs}.md`
- Test: `tests/tools/check-recipes.test.mjs`
- Modify: `package.json`（devDependencies：`typescript`、`react`、`react-dom`、`@types/react`、`@types/react-dom`、`react-aria-components`、`motion`、`@iconify/react`。scripts：`"check:recipes": "node tools/check-recipes.mjs"`）

**Interfaces:**
- Consumes: Task 1 の `lintPaths`、Task 9 のトークン名
- Produces:
  - `extractTsxBlocks(markdown: string): string[]`（```tsx で始まるコードブロックの中身）
  - `checkRecipes(componentsDir: string): Promise<{ lintViolations: Violation[], typeErrors: string[] }>`。各ブロックを `.tmp/recipes/<ファイル名>-<番号>.tsx` に書き出し、`lintPaths` と `tsc -p tools/recipes-tsconfig.json --noEmit` を実行する
  - レシピのコードブロックの規約：各 ```tsx ブロックは import を含む単独で型検査が通るモジュールとする。クラス名は Task 9 のトークン名のみを使う

各レシピの構成（全ファイル共通）：「目的」「守ること（箇条書き）」「やってはいけないこと」「コード例（```tsx、1〜2個）」「確認方法（スクリーンショットで見る点）」。

ファイルごとの決定事項：

- `button.md`：主要（`--color-accent` 塗り、または明暗反転）／副次（枠線のみ）／危険（`--color-danger`）の3種。押下時に `scale(0.97)` を `--duration-fast` で。ロード中は幅を固定し、ラベルを残したままインジケーターを出す。アイコンは Iconify、`user-select: none`
- `text-input.md`：ラベルは入力欄の上、エラーは下に `--color-danger` とアイコン付きで。プレースホルダーをラベルの代わりにしない。フォーカスリングは `--color-accent` の 2px で `outline-offset: 2px`
- `number-field.md`：React Aria の `NumberField`。ブラウザ標準の矢印を CSS で消す（`::-webkit-inner-spin-button` と `appearance: textfield`）。自前の増減ボタン（Iconify の `ph:minus` / `ph:plus` など）、長押しで連続増減（React Aria の標準動作）、単位表示、`font-variant-numeric: tabular-nums`、スライダーとリセットを組み合わせた1行構成の例を必ず1つ含める
- `select.md`：React Aria の `Select` と `ComboBox`。開閉は `--duration-base`＋`--ease-out-quint` で、上下 4px の移動と不透明度。選択中の項目にチェックアイコン。10項目を超えたら `ComboBox`（検索欄付き）を使う
- `checkbox-radio-switch.md`：3部品の使い分け（即時反映はスイッチ、保存ボタンがある場合はチェックボックス）、ON 状態は `--color-accent`、つまみの移動は `--duration-fast`
- `tabs.md`：選択中の表示は下線または背景の島が移動するアニメーション（Motion の `layoutId`）。各タブにアイコン＋ラベル

- [ ] **Step 1: 失敗するテストを書く**

```js
test('extracts only tsx blocks', () => {
  assert.deepEqual(extractTsxBlocks('```tsx\nA\n```\n```css\nB\n```'), ['A']);
});
test('flags a recipe that violates lint', async () => {
  // fixture の components/bad.md に <button>次へ →</button> を含む tsx ブロック
  const r = await checkRecipes(badDir);
  assert.equal(r.lintViolations[0].rule, 'text-arrow');
});
test('reports type errors', async () => {
  // fixture の components/typeerr.md に const n: number = 'x' を含む tsx ブロック
  assert.ok((await checkRecipes(typeErrDir)).typeErrors.length > 0);
});
```

- [ ] **Step 2: テストが失敗することを確認する** — Run: `npm test` / Expected: FAIL

- [ ] **Step 3: `check-recipes.mjs` を実装し、依存をインストールする** — Run: `npm install`

- [ ] **Step 4: テストが通ることを確認する** — Run: `npm test` / Expected: PASS

- [ ] **Step 5: 6つのレシピを書く**

- [ ] **Step 6: レシピを検査する**

Run: `npm run check:recipes && REFERENCE_DENYLIST=<scratchpad>/reference-denylist.txt npm run check:skills`
Expected: lint 違反 0 件、型エラー 0 件、文書の問題なし

- [ ] **Step 7: コミット**

```bash
git add tools tests package.json package-lock.json skills/web/references/components
git commit -m "feat: レシピの検査ツールと入力系の部品レシピを追加"
```

---

### Task 11: 表示・状態系の部品レシピ

**Files:**
- Create: `skills/web/references/components/{modal,toast,tooltip-popover-menu,scrollbar,loading,states,selection,icons}.md`

**Interfaces:**
- Consumes: Task 9 のトークン名、Task 10 のレシピ構成と `check:recipes`

ファイルごとの決定事項：

- `modal.md`：React Aria の `Modal` と `Dialog`。閉じ方は Esc・背景クリック・閉じるボタンの3つ（破壊的な操作の確認ダイアログだけは背景クリックで閉じない）。背景のスクロール固定とフォーカスの閉じ込めは React Aria に任せる。登場は不透明度と 8px の移動、`--duration-base`
- `toast.md`：表示位置は画面の右下（スマートフォン幅では下中央）。自動で消える時間は 5 秒、ホバー中は止める。取り消せる操作には「元に戻す」ボタンを付ける。エラーは自動で消さない
- `tooltip-popover-menu.md`：使い分け（補足説明はツールチップ、操作を含むものはポップオーバー、選択肢はメニュー）。ツールチップは表示まで 500ms 待ち、アイコンだけのボタンには必ず付ける。メニューにはショートカットキーを右寄せで表示
- `scrollbar.md`：幅 8px、つまみは `--color-line`、ホバー時に `--color-ink-subtle`。`scrollbar-width: thin` と `scrollbar-color`（Firefox・Chromium）と `::-webkit-scrollbar`（Safari）の両方を書く。`scrollbar-gutter: stable` でレイアウトのずれを防ぐ
- `loading.md`：0.3秒未満は何も出さない、0.3〜2秒はスケルトン、2秒以上や進捗が分かる処理は進捗表示。スケルトンは実際のレイアウトと同じ形にする。スピナー単独を禁止する。ページ全体の初回ロード画面の例を1つ含める（ロゴやコンセプトに沿った演出と進捗）
- `states.md`：空状態（何が起きていて次に何をすればいいかを示し、操作ボタンを置く）、エラー（原因と対処を書き、文章は選択可能に）、フォーカスリング、無効状態（理由をツールチップで示す）、ホバー時のみ現れる操作（キーボード操作時は `:focus-within` でも表示する）
- `selection.md`：設計書 4.5 のルールと、コピーボタンのレシピ（コピー後にアイコンがチェックに変わり、1.5 秒で戻る）
- `icons.md`：`@iconify/react` の使い方、推奨アイコンセット（線の太さが揃ったものを1セットだけ使う）、アニメーション付き SVG の使い所（ロード、成功、ホバー時の矢印の移動）、アイコンとラベルを組にするルール、アイコンだけのボタンに `aria-label` とツールチップを付けるルール、文字の矢印と絵文字の禁止（lint ルール `text-arrow`・`emoji-icon`）

- [ ] **Step 1: 8つのレシピを書く**

- [ ] **Step 2: レシピを検査する**

Run: `npm run check:recipes && REFERENCE_DENYLIST=<scratchpad>/reference-denylist.txt npm run check:skills`
Expected: lint 違反 0 件、型エラー 0 件、文書の問題なし

- [ ] **Step 3: コミット**

```bash
git add skills/web/references/components
git commit -m "feat: 表示・状態系の部品レシピを追加"
```

---

### Task 12: web の手順書と README

**Files:**
- Create: `skills/web/SKILL.md`
- Create: `README.md`

**Interfaces:**
- Consumes: Task 1〜11 のすべてのファイルパス、lint ルール ID、`critique.md` の項目番号、スクリプトの CLI

内容の決定事項：

- `web/SKILL.md`
  - description：React ＋ Tailwind で AI 感のない Web サイト・Web アプリの UI を作るときに使う。英語検索語 `web design, landing page, portfolio, dashboard, web app UI, React, Tailwind, component` を含める
  - 本文は設計書 4.1 の6手順をそのまま手順化する。各手順で読むファイルを相対パスで明記する（例：`../design-core/SKILL.md`、`references/mode-app.md`）
  - 手順5のコマンドを、スキルのディレクトリを基準にしたパスで書く：`node <このスキルのディレクトリ>/scripts/lint-design.mjs <生成物のディレクトリ>`、`node <このスキルのディレクトリ>/scripts/screenshot.mjs <URL> --out <作業用ディレクトリ>`
  - スクリーンショットが撮れない場合の扱い（設計書 7章）と、自己批評は最大2周で止めることを明記する
  - 手順6の報告の形式（コンセプトの3行、実施した検証とその結果、直しきれなかった点）
- `README.md`：概要、スキル一覧と今後の予定（設計書 2章）、導入方法（`skills/` 以下を `~/.claude/skills/` にコピーする、または Claude Code のプロジェクトの `.claude/skills/` に置く）、`playwright` のインストール方法、調整欄の仕組み（設計書 6章）、開発者向けのコマンド（`npm test`、`npm run check:skills`、`npm run check:recipes`）、実例の取り扱い方針（設計書 5.1 の要約）

- [ ] **Step 1: 2ファイルを書く**

- [ ] **Step 2: 全検査を実行する**

Run: `npm test && npm run check:recipes && REFERENCE_DENYLIST=<scratchpad>/reference-denylist.txt npm run check:skills`
Expected: すべて合格

- [ ] **Step 3: コミット**

```bash
git add skills/web/SKILL.md README.md
git commit -m "feat: web スキルの手順書と README を追加"
```

---

### Task 13: スキルなし／ありの比較評価

**Files:**
- Create: `docs/superpowers/evals/2026-10-03-baseline-vs-skill.md`（結果の記録。スクリーンショットは含めない）
- Modify（スキル作者のダメ出しに応じて）：`skills/design-core/references/anti-patterns.md`、`skills/design-core/references/critique.md`

内容の決定事項：

- お題（4つ、文章はそのまま使う）
  1. 「イラストレーターのポートフォリオサイトを作って。トップページだけでよい」
  2. 「街の小さなカフェのWebサイトを作って。トップページだけでよい」
  3. 「個人開発者向けのサーバー監視ダッシュボードを作って。設定画面も1つ付けて」
  4. 「動画編集ツールの、選択したクリップのパラメータを編集するパネルを作って」
- 生成方法：お題ごとに、スキルを読ませない生成と、`skills/web/SKILL.md` に従う生成を、それぞれ新しいサブエージェントで行う。出力は Vite ＋ React ＋ Tailwind v4 の単一ページとして、スクラッチ領域の `evals/<番号>-<baseline|skill>/` に置く
- 記録する内容：各出力の lint 結果（違反件数とルール別の内訳）、スキルあり側で宣言されたコンセプトの3行
- スクリーンショット：各出力を 1440px・ダークで撮影し、お題ごとに左右に並べた比較ページを作ってスキル作者に見せる（比較ページとスクリーンショットはリポジトリに入れない）

- [ ] **Step 1: 8つの出力を生成する**

- [ ] **Step 2: lint を実行して結果を記録する**

Run: `node skills/web/scripts/lint-design.mjs <scratchpad>/evals/<各出力>/src`
Expected: スキルあり側はすべて `違反はありません`。違反があれば該当する資料の不足として原因を記録し、資料を直して再生成する

- [ ] **Step 3: スクリーンショットを撮って比較ページを作り、スキル作者に見せる**

- [ ] **Step 4: スキル作者の判定とダメ出しを記録する**

合格基準：4つ中4つでスキルありの方が AI 感が薄いと判定されること。ダメ出しは `anti-patterns.md`（禁止事項として表せるもの）または `critique.md`（見て判断する項目）に追加する。

- [ ] **Step 5: 全検査を実行してコミット**

Run: `npm test && npm run check:recipes && REFERENCE_DENYLIST=<scratchpad>/reference-denylist.txt npm run check:skills` / Expected: すべて合格

```bash
git add docs/superpowers/evals skills
git commit -m "docs: スキルなし／ありの比較評価の結果と、ダメ出しの反映"
```
