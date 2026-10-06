# 動き・WebGL・フォント・技術スタックの拡充 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `web` のサイト系に、作る前のコンセプトの案と技術スタックの確認、GSAP の型の追加、素の Three.js による WebGL の型、Google Fonts の外まで広げた書体の組を加え、その根拠となる参考サイト 5〜15 件の観察記録を足す。

**Architecture:** スキルの本体は Markdown の手順書と references である。新しい資料として `skills/web/references/stack.md` と `skills/web/references/webgl.md` を作り、既存の `concept-brief.md`、`motion-web.md`、`typography-ja.md`、`observations/site.md` などを書き換える。コード例は `tools/check-recipes.mjs` で lint と型検査にかけるため、その対象を広げ、資料をまたいだ import（`./gsap-setup` など）を解決できるようにする。参考サイトの計測はスクラッチ領域の Playwright スクリプトで行い、結果だけを匿名ラベルで記録する。

**Tech Stack:** Node.js 22 以上（ESM、`node:test`）、TypeScript（型検査のみ）、React 19、Tailwind CSS v4、GSAP（ScrollTrigger、SplitText、CustomEase、Flip）、`@gsap/react`、Lenis、three、Playwright。

**Spec:** `docs/superpowers/specs/2026-10-06-motion-webgl-fonts-stack-design.md`

## Global Constraints

- スキル文書・README・コメント・コミットメッセージは標準語で書き、である調に統一する。コミットは Conventional Commits で、type 以外は日本語で書く。
- 参考サイトの名前・ドメイン・URL を、`skills/`、`docs/`、`README.md`、`tests/`、`tools/`、コミットメッセージのどこにも書かない。匿名ラベル（「サイト5」など）と種類で表す。対応表 `reference-map.md` と禁止語のファイル `reference-denylist.txt` はスクラッチ領域にだけ置く。
- 実例の HTML・CSS・JS・画像・文章・スクリーンショットをリポジトリに入れない。
- 珍しい有料フォントは名前を書かず分類で書く。無料配信と OFL のフォントは名前を書いてよい。
- Three.js は `three` だけを使う。`@react-three/fiber` と `@react-three/drei` を使わない。
- 書体の配信元は Google Fonts、Fontshare、OFL のフォントの自前配信の3つに限る。有料フォントは載せない。
- 依存の追加は、ロックファイル（`package-lock.json`）に合わせて npm で行う。この環境の WSL には npm がないため、`pnpm dlx npm@11 <コマンド>` で実行する（`npm` を直接叩くと Windows 側の npm が呼ばれ、UNC パスのエラーで失敗する）。テストと検査は `node` で直接実行する：`node --test "tests/**/*.test.mjs"`、`node tools/check-recipes.mjs`、`node tools/check-skills.mjs`。
- 動きの数値は既存の調整欄の範囲に収める：サイト系の登場 600〜1200ms、文字・要素ごとの遅延 40〜80ms、既定の減速カーブ `cubic-bezier(0.22, 1, 0.36, 1)`（`outQuint`）、加減速のカーブ `cubic-bezier(0.76, 0, 0.24, 1)`（`inOutQuart`）。`ease: "none"` は `scrub` にだけ使う。
- WebGL の必須の決まり：動きを減らす設定では1フレームだけ描いて止める／WebGL が使えなければ同じ位置に静止画か CSS の背景／画面外で描画を止める／片付けで `dispose()`／`setPixelRatio(Math.min(window.devicePixelRatio, 2))`／canvas は `aria-hidden="true"`。
- 新規・既存の判定は、作業ディレクトリに `package.json` があるかどうかで行う。

## Review Focus

1. 資料をまたいだ import：`webgl.md` のコード例が `motion-web.md` の `./gsap-setup` を import しても型検査が通り、同じファイル名を2つの資料が定義したら検査がはっきり失敗する。→ Task 1 のテスト `resolves named blocks across markdown files` と `fails on duplicate named blocks`。
2. Three.js だけを使い GSAP も CSS アニメーションも使わない生成物：動きを減らす設定への対応がなければ `no-reduced-motion` が検出する。→ Task 2 のテスト `no-reduced-motion detects three imports`。
3. 「おまかせ」と言われたのに質問して止まる／新規のサイト系で質問せずに作り始める：`concept-brief.md` の表と `web` の手順2が同じ条件分けになっている。→ Task 5 の Step 4 の照合（2つのファイルの条件を表で突き合わせる）。
4. WebGL が使えない環境（ヘッドレスのブラウザで GPU がない場合を含む）：例外で画面が真っ白にならず、代わりの表示が出る。→ Task 8 のコード例の `try`／`catch` と `webglcontextlost`、Task 10 の生成テストで `--disable-gpu` 相当の確認。
5. 禁止語の漏れ：追加したサイトの名前がコミットの履歴に入らない。→ Task 4 の Step 8 と Task 10 の Step 3 で `git log --all -p` を禁止語で検索する。

---

## ファイル構成

| ファイル | 変更 | 責務 |
|---|---|---|
| `tools/check-recipes.mjs` | 変更 | 対象を複数の Markdown／ディレクトリに広げ、名前付きのコードブロック（`// gsap-setup.ts` で始まるもの）をその名前で書き出す |
| `tools/recipes-tsconfig.json` | 変更 | `.ts` と型宣言のファイルを対象に含める |
| `tools/recipes-env.d.ts` | 新規 | CSS の import とシェーダー文字列のための型宣言 |
| `tests/tools/check-recipes.test.mjs` | 変更 | 上の挙動のテスト |
| `tests/fixtures/recipes/cross/*.md`、`tests/fixtures/recipes/dup/*.md` | 新規 | テスト用の資料 |
| `package.json`、`package-lock.json` | 変更 | `three`、`@types/three`、`gsap`、`@gsap/react`、`lenis` を開発用の依存に足す |
| `skills/web/scripts/lib/lint-rules.mjs` | 変更 | `no-reduced-motion` が `three` の import も動きとして扱う |
| `tests/lint/rules.test.mjs` | 変更 | 上のテスト |
| `skills/web/references/observations/site.md` | 変更 | サイト5以降の観察と、全件の傾向 |
| `skills/web/references/mode-site.md` | 変更 | 調整欄の数値と根拠の列の見直し、WebGL への言及 |
| `skills/design-core/references/concept-brief.md` | 変更 | 案を出して選んでもらう流れと書式 |
| `skills/design-core/SKILL.md` | 変更 | 4節「コンセプト先行」の確認の決まり |
| `skills/web/SKILL.md` | 変更 | 手順2の確認の流れ、手順4の構成と WebGL の読み込み、手順4の表 |
| `skills/web/references/stack.md` | 新規 | 技術スタックの提案と、フレームワークごとの違い |
| `skills/web/references/favicon.md` | 変更 | Astro と React Router の置き場所を足す |
| `skills/web/references/motion-web.md` | 変更 | GSAP の型の追加、ライブラリの表に Three.js |
| `skills/web/references/webgl.md` | 新規 | 素の Three.js の型と必須の決まり |
| `skills/design-core/references/anti-patterns.md` | 変更 | X22（記憶のフックと結び付かない定番の WebGL の演出） |
| `skills/design-core/references/typography-ja.md` | 変更 | 配信元の列、読み込み方、確かめる手順、新しい組 |
| `skills/web/references/tokens-tailwind.md` | 変更 | 自前配信のフォントのトークン定義例（必要な場合のみ） |
| `README.md` | 変更 | 必要なもの、開発者向けのコマンドの npm の注意 |

スクラッチ領域（`$SCRATCH` ＝ `/tmp/claude-1000/-home-neko-Workspace-10-Active-versatile-design/<セッションID>/scratchpad`）に置くもの：`reference-map.md`、`reference-denylist.txt`、`measure/measure.mjs`、`measure/out/*.json`。

---

### Task 1: レシピの検査を資料をまたいで行えるようにする

**Files:**
- Modify: `tools/check-recipes.mjs`
- Modify: `tools/recipes-tsconfig.json`
- Create: `tools/recipes-env.d.ts`
- Modify: `tests/tools/check-recipes.test.mjs`
- Create: `tests/fixtures/recipes/cross/a.md`、`tests/fixtures/recipes/cross/b.md`、`tests/fixtures/recipes/dup/a.md`、`tests/fixtures/recipes/dup/b.md`
- Modify: `package.json`、`package-lock.json`

**Interfaces:**
- Produces: `checkRecipes(sources: string[]): Promise<{ lintViolations, typeErrors }>`。`sources` の各要素は、`.md` のファイルか、`.md` を含むディレクトリのパス。名前付きのブロックの名前が重複したら `Error`（メッセージに `重複` とファイル名を含む）を投げる。
- Produces: `blockFileName(block: string, base: string, index: number): string`。ブロックの1行目が `// <名前>.ts` または `// <名前>.tsx`（直後が行末か全角コロン「：」）なら `<名前>.ts(x)`、そうでなければ `${base}-${index}.tsx` を返す。
- Produces: `node tools/check-recipes.mjs` が `skills/web/references/components/`、`skills/web/references/motion-web.md`、`skills/web/references/webgl.md`（存在する場合のみ）を検査する。

- [ ] **Step 1: 依存を入れる**

```bash
cd /home/neko/Workspace/10_Active/versatile-design
pnpm dlx npm@11 ci
pnpm dlx npm@11 install -D three @types/three gsap @gsap/react lenis
git diff --stat package.json package-lock.json
```

Expected: `package.json` の `devDependencies` に5つが増え、`package-lock.json` が更新される。`pnpm-lock.yaml` が作られていないことを `ls pnpm-lock.yaml` で確かめる（No such file）。既存の `devDependencies` と同じく、バージョンは `^` を外した固定の値に書き換える（例：`"three": "0.181.0"`。実際に入ったバージョンを `node -p "require('three/package.json').version"` で確かめて書く）。書き換えたら `pnpm dlx npm@11 install` をもう一度実行してロックファイルを揃える。

- [ ] **Step 2: 失敗するテストを書く**

`tests/fixtures/recipes/cross/a.md`：

````markdown
# A

```tsx
// shared-setup.ts：資料をまたいで使う
export const unit = 8;
```
````

`tests/fixtures/recipes/cross/b.md`：

````markdown
# B

```tsx
import { unit } from "./shared-setup";

export function Box() {
  return <div style={{ padding: unit }} />;
}
```
````

`tests/fixtures/recipes/dup/a.md` と `tests/fixtures/recipes/dup/b.md`（2つとも同じ内容）：

````markdown
# 重複

```tsx
// same.ts
export const x = 1;
```
````

`tests/tools/check-recipes.test.mjs` の既存の `checkRecipes(fx('…'))` の呼び出しを、すべて `checkRecipes([fx('…')])` に書き換え、import に `blockFileName` を足し、末尾に次を足す。

```js
test('names a block by its first-line file comment', () => {
  assert.equal(blockFileName('// gsap-setup.ts\nexport {};', 'motion-web', 3), 'gsap-setup.ts');
  assert.equal(blockFileName('// motion-tokens.ts：説明\nexport {};', 'motion-web', 1), 'motion-tokens.ts');
  assert.equal(blockFileName('// Scene.tsx\nexport {};', 'webgl', 2), 'Scene.tsx');
  assert.equal(blockFileName('// 黒い面のラベル\nexport {};', 'mode-site', 1), 'mode-site-1.tsx');
  assert.equal(blockFileName('export const a = 1;', 'x', 2), 'x-2.tsx');
});

test('resolves named blocks across markdown files', async () => {
  const r = await checkRecipes([fx('cross/a.md'), fx('cross/b.md')]);
  assert.deepEqual(r, { lintViolations: [], typeErrors: [] });
  assert.deepEqual((await readdir(outDir)).sort(), ['b-1.tsx', 'shared-setup.ts']);
});

test('fails on duplicate named blocks', async () => {
  await assert.rejects(checkRecipes([fx('dup')]), /重複.*same\.ts/);
});
```

- [ ] **Step 3: テストが失敗することを確かめる**

Run: `node --test tests/tools/check-recipes.test.mjs`
Expected: FAIL（`blockFileName` が export されていない、`checkRecipes` が配列を受け付けない）

- [ ] **Step 4: 実装する**

`tools/check-recipes.mjs` の先頭のコメントを「部品のレシピと動きの資料（skills/web/references/ の components/*.md、motion-web.md、webgl.md）のコード例を検査するツールである。」に書き換え、`checkRecipes` と `main` を次に置き換える。`extractTsxBlocks` と `typeCheck` はそのまま残す。

```js
const NAMED_BLOCK = /^\/\/ ([\w-]+\.tsx?)(?:：.*)?$/;

// 1行目が「// <名前>.ts」のブロックはその名前で、それ以外は「資料名-番号.tsx」で書き出す
export function blockFileName(block, base, index) {
  const m = block.split(/\r?\n/, 1)[0].match(NAMED_BLOCK);
  return m ? m[1] : `${base}-${index}.tsx`;
}

async function listMarkdown(source) {
  if (source.endsWith('.md')) return [source];
  const names = (await readdir(source)).filter((n) => n.endsWith('.md')).sort();
  return names.map((n) => path.join(source, n));
}

export async function checkRecipes(sources) {
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });
  const owners = new Map();
  let written = 0;
  for (const source of sources) {
    for (const file of await listMarkdown(source)) {
      const base = path.basename(file, '.md');
      for (const [i, block] of extractTsxBlocks(await readFile(file, 'utf8')).entries()) {
        const name = blockFileName(block, base, i + 1);
        if (owners.has(name)) throw new Error(`名前付きのブロック ${name} が重複している（${owners.get(name)} と ${file}）`);
        owners.set(name, file);
        await writeFile(path.join(outDir, name), `${block}\n`);
        written++;
      }
    }
  }
  if (written === 0) return { lintViolations: [], typeErrors: [] };
  const { violations } = await lintPaths([outDir]);
  const typeErrors = await typeCheck();
  return { lintViolations: violations, typeErrors };
}

async function main() {
  const refs = path.join(rootDir, 'skills', 'web', 'references');
  const sources = [path.join(refs, 'components'), path.join(refs, 'motion-web.md')];
  if (await stat(path.join(refs, 'webgl.md')).then(() => true, () => false)) sources.push(path.join(refs, 'webgl.md'));
  const { lintViolations, typeErrors } = await checkRecipes(sources);
  console.log(formatViolations(lintViolations));
  for (const e of typeErrors) console.error(e);
  console.log(`${typeErrors.length} 件の型エラー`);
  if (lintViolations.length || typeErrors.length) process.exit(1);
  console.log('レシピの検査に合格した');
}
```

import 行に `stat` を足す：`import { mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';`

`tools/recipes-env.d.ts`：

```ts
// レシピのコード例が import する CSS の型宣言である（Lenis の CSS など）
declare module "*.css";
```

`tools/recipes-tsconfig.json` の `include` を次に置き換える。

```json
  "include": ["../.tmp/recipes/**/*.ts", "../.tmp/recipes/**/*.tsx", "./recipes-env.d.ts"]
```

- [ ] **Step 5: テストが通ることを確かめる**

Run: `node --test tests/tools/check-recipes.test.mjs`
Expected: PASS（8件）

- [ ] **Step 6: 既存の資料に対して検査を実行し、出たエラーを直す**

Run: `node tools/check-recipes.mjs`

`motion-web.md` は今回初めて型検査にかかる。エラーが出たら、コード例の側を直す（検査を緩めない）。想定されるもの：

- `gsap-setup.ts` のブロックは1行目が `// gsap-setup.ts` なので名前付きで書き出され、`./gsap-setup` の import が解決する。`motion-tokens.ts` も同様である。
- `SplitText.create` の `onSplit` の戻り値の型、`gsap.matchMedia` の型などで型エラーが出た場合は、GSAP の型定義（`node_modules/gsap/types/`）を読んで正しい書き方に直す。

Expected: `0 件の型エラー` と `レシピの検査に合格した`

- [ ] **Step 7: 全テストを実行する**

Run: `node --test "tests/**/*.test.mjs"`
Expected: すべて PASS（ブラウザを起動できない環境ではスクリーンショットのテストが skip になる）

- [ ] **Step 8: コミットする**

```bash
git add tools/ tests/tools/check-recipes.test.mjs tests/fixtures/recipes/ package.json package-lock.json skills/web/references/motion-web.md
git commit -m "feat: レシピの検査を動きの資料まで広げ、資料をまたいだ import を解決する"
```

---

### Task 2: `no-reduced-motion` が Three.js を動きとして扱う

**Files:**
- Modify: `skills/web/scripts/lib/lint-rules.mjs:514`
- Modify: `tests/lint/rules.test.mjs`
- Modify: `skills/design-core/references/anti-patterns.md`（X15 の「検出」欄）

**Interfaces:**
- Produces: `MOTION_USE` が `from "three"`／`from 'three'` と `requestAnimationFrame(` を検出する。

- [ ] **Step 1: 失敗するテストを書く**

`tests/lint/rules.test.mjs` の `no-reduced-motion accepts tailwind motion-reduce and motion-safe variants` の後に足す。

```js
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

test('no-reduced-motion detects requestAnimationFrame loops', () => {
  const [rule] = projectRules;
  assert.equal(rule.check([{ path: 'a.ts', source: 'requestAnimationFrame(loop);' }]).length, 1);
});
```

- [ ] **Step 2: テストが失敗することを確かめる**

Run: `node --test tests/lint/rules.test.mjs`
Expected: FAIL（`detects three imports` の1つ目の assert で 0 !== 1）

- [ ] **Step 3: 実装する**

`skills/web/scripts/lib/lint-rules.mjs` の `MOTION_USE` を次に置き換える。

```js
const MOTION_USE =
  /@keyframes|(?<![\w-])animation\s*:|motion\/react|\bgsap\b|from\s+["']three["']|\brequestAnimationFrame\s*\(/;
```

`anti-patterns.md` の X15 の「検出」を「lint: `no-reduced-motion`（CSS のアニメーション、Motion、GSAP、Three.js、`requestAnimationFrame` を使っているのに、どのファイルにも対応がないもの）」に書き換える。`skills/web/SKILL.md` の手順5.1 のルールの説明は変えなくてよい。

- [ ] **Step 4: テストが通ることを確かめる**

Run: `node --test tests/lint/rules.test.mjs && node tools/check-recipes.mjs`
Expected: PASS、`レシピの検査に合格した`

- [ ] **Step 5: コミットする**

```bash
git add skills/web/scripts/lib/lint-rules.mjs tests/lint/rules.test.mjs skills/design-core/references/anti-patterns.md
git commit -m "feat: no-reduced-motion で three の import と requestAnimationFrame を動きとして検出する"
```

---

### Task 3: 参考サイトの候補を集め、スキル作者に選んでもらう

この Task はリポジトリを変更しない。最後にスキル作者の回答を待って止まる。

**Files:**
- Create: `$SCRATCH/reference-map.md`（リポジトリの外）

**Interfaces:**
- Produces: `$SCRATCH/reference-map.md` に、選ばれたサイトの「ラベル（サイト5〜）／名前／URL／種類／選んだ理由」の表。Task 4 がこれを読む。

- [ ] **Step 1: スキル作者の指定を表に入れる**

`$SCRATCH/reference-map.md` を作り、スキル作者がチャットで指定した個人のポートフォリオ（Vue 製）を1行目に書く。名前と URL はチャットの記録から写す。

- [ ] **Step 2: Web 検索で候補を集める**

WebSearch（`mode: "standard"`、薄ければ `"extended"`）で、次の観点の候補を 15〜20 件集める。同じ turn に検索をまとめて投げる。

- GSAP の ScrollTrigger や SplitText を使った受賞サイト（Web デザインのギャラリーの Site of the Day など）
- Three.js や WebGL のシェーダーを使ったポートフォリオ、ブランドサイト
- Fontshare や Velvetyne、Collletttivo などの書体を使ったサイト
- 日本語のサイト（和文の組版の参考として、少なくとも3件）

各候補について、種類（個人のポートフォリオ、ブランドサイト、事業サイトなど）、使っていそうな技術、選ぶ理由を1行で書く。開けないサイト、ログインが必要なサイトは外す。

- [ ] **Step 3: スキル作者に提示して止まる**

候補の表（名前と URL を含む）をチャットに出し、5〜15 件を選んでもらう。種類が偏らないことと、和文のサイトが入っていることを添える。**回答があるまで Task 4 に進まない。**

- [ ] **Step 4: 選ばれたサイトに匿名ラベルを振る**

`reference-map.md` に、選ばれたサイトを「サイト5」から順に振る。`$SCRATCH/reference-denylist.txt` に、各サイトの名前（表記揺れを含む）とドメインを1行1語で書く。既存のサイト1〜4の禁止語はスキル作者の手元にしかないため、スキル作者にファイルのパスを聞き、あれば中身をこのファイルの末尾に足す。

---

### Task 4: 参考サイトを計測し、観察記録と調整欄を更新する

**Files:**
- Create: `$SCRATCH/measure/measure.mjs`（リポジトリの外）
- Modify: `skills/web/references/observations/site.md`
- Modify: `skills/web/references/mode-site.md`（調整欄の数値と根拠の列、6節）
- Modify: `skills/web/references/motion-web.md`（調整欄の数値のみ）

**Interfaces:**
- Consumes: `$SCRATCH/reference-map.md`（Task 3）
- Produces: `observations/site.md` の「サイト5」以降の節と、全件の「共通する傾向」。各節に、GSAP のプラグイン、WebGL の演出の種類、書体の配信元を含む。Task 7・8・9 は、この記録の「共通する傾向」の番号を根拠として引用する。

- [ ] **Step 1: 計測スクリプトを書く**

`$SCRATCH/measure/measure.mjs`：

```js
// 参考サイトの計算後のスタイル、動き、ライブラリ、WebGL、フォントを計測する（リポジトリの外で使う）
import { chromium } from 'playwright';
import { writeFile, mkdir } from 'node:fs/promises';

const [url, label] = process.argv.slice(2);
if (!url || !label) throw new Error('使い方: node measure.mjs <URL> <ラベル>');
await mkdir(new URL('./out/', import.meta.url), { recursive: true });

const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] });
const result = { label, url, viewports: {} };
for (const [name, viewport] of [['pc', { width: 1440, height: 900 }], ['sp', { width: 390, height: 844 }]]) {
  const page = await browser.newPage({ viewport });
  const scripts = [];
  const fonts = [];
  page.on('response', (r) => {
    const u = r.url();
    if (/\.m?js(\?|$)/.test(u)) scripts.push(u);
    if (/\.(woff2?|ttf|otf)(\?|$)|fonts\.googleapis|api\.fontshare|use\.typekit/.test(u)) fonts.push(u);
  });
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  for (let y = 0; y < 30; y++) {
    await page.mouse.wheel(0, viewport.height * 0.8);
    await page.waitForTimeout(250);
  }
  await page.waitForTimeout(1000);
  result.viewports[name] = await page.evaluate(() => {
    const pick = (el) => {
      const s = getComputedStyle(el);
      return {
        tag: el.tagName, fontFamily: s.fontFamily, fontSize: s.fontSize, fontWeight: s.fontWeight,
        letterSpacing: s.letterSpacing, lineHeight: s.lineHeight, color: s.color,
      };
    };
    const texts = [...document.querySelectorAll('h1,h2,h3,p,a,li,span,button')]
      .filter((el) => el.childElementCount === 0 && el.textContent.trim() && el.getBoundingClientRect().width > 0)
      .map(pick);
    const bySize = [...texts].sort((a, b) => parseFloat(b.fontSize) - parseFloat(a.fontSize));
    const transitions = new Map();
    const easings = new Map();
    let reducedRules = 0;
    for (const sheet of document.styleSheets) {
      let rules;
      try { rules = sheet.cssRules; } catch { continue; }
      const walk = (list) => {
        for (const r of list) {
          if (r.media && /prefers-reduced-motion/.test(r.media.mediaText)) reducedRules++;
          if (r.cssRules) walk(r.cssRules);
          if (!r.style) continue;
          for (const prop of ['transition-duration', 'animation-duration']) {
            const v = r.style.getPropertyValue(prop);
            if (v) transitions.set(v, (transitions.get(v) ?? 0) + 1);
          }
          for (const prop of ['transition-timing-function', 'animation-timing-function']) {
            const v = r.style.getPropertyValue(prop);
            if (v) easings.set(v, (easings.get(v) ?? 0) + 1);
          }
        }
      };
      walk(rules);
    }
    const canvases = [...document.querySelectorAll('canvas')].map((c) => {
      const r = c.getBoundingClientRect();
      let ctx = 'unknown';
      for (const t of ['webgl2', 'webgl', '2d']) {
        // 既に作られたコンテキストの種類は、同じ種類で getContext したときだけ返る
        try { if (c.getContext(t)) { ctx = t; break; } } catch {}
      }
      return { w: Math.round(r.width), h: Math.round(r.height), ctx, fixed: getComputedStyle(c).position };
    });
    const globals = {
      gsap: typeof window.gsap !== 'undefined' ? window.gsap.version : null,
      ScrollTrigger: typeof window.ScrollTrigger !== 'undefined',
      THREE: typeof window.THREE !== 'undefined' ? window.THREE.REVISION : null,
      Lenis: typeof window.Lenis !== 'undefined' || document.documentElement.classList.contains('lenis'),
    };
    const pinned = document.querySelectorAll('.pin-spacer').length;
    return {
      largest: bySize.slice(0, 8), body: texts.filter((t) => t.tag === 'P').slice(0, 8),
      bg: getComputedStyle(document.body).backgroundColor,
      transitions: [...transitions].sort((a, b) => b[1] - a[1]).slice(0, 12),
      easings: [...easings].sort((a, b) => b[1] - a[1]).slice(0, 12),
      reducedRules, canvases, globals, pinned,
      fontsLoaded: [...document.fonts].filter((f) => f.status === 'loaded').map((f) => `${f.family} ${f.weight} ${f.style}`),
    };
  });
  result.viewports[name].scripts = scripts;
  result.viewports[name].fontFiles = fonts;
  // ライブラリ名はスクリプトの中身から推定する（バンドルされていても文字列が残ることが多い）
  const libs = new Set();
  for (const s of scripts.slice(0, 40)) {
    const body = await (await fetch(s).catch(() => null))?.text().catch(() => '') ?? '';
    for (const [lib, re] of [
      ['gsap', /gsap|GreenSock/], ['ScrollTrigger', /ScrollTrigger/], ['SplitText', /SplitText/],
      ['Flip', /\bFlip\b/], ['CustomEase', /CustomEase/], ['three', /THREE\.|three\.module|WebGLRenderer/],
      ['ogl', /\bogl\b/], ['lenis', /lenis/i], ['barba', /barba/i], ['swup', /swup/i], ['rive', /rive/i],
      ['vue', /__VUE__|createApp/], ['react', /react-dom|__REACT/], ['svelte', /svelte/],
    ]) if (re.test(body)) libs.add(lib);
  }
  result.viewports[name].libs = [...libs];
  await page.close();
}
await browser.close();
await writeFile(new URL(`./out/${label}.json`, import.meta.url), JSON.stringify(result, null, 2));
console.log(`${label} を計測した`);
```

`playwright` はリポジトリの `node_modules` にある（Task 1 の `npm ci`）。スクラッチ領域から読み込むため、`NODE_PATH` を指定して実行する。

- [ ] **Step 2: 1件で試す**

```bash
cd $SCRATCH/measure
NODE_PATH=/home/neko/Workspace/10_Active/versatile-design/node_modules node measure.mjs <サイト5の URL> site5
jq '.viewports.pc | {libs, globals, canvases, pinned, fontsLoaded, transitions: .transitions[:3]}' out/site5.json
```

Expected: `out/site5.json` ができ、`libs`、`canvases`、`fontsLoaded` に値が入る。ブラウザが起動しない場合は `npx playwright install chromium` に当たる `node /home/neko/Workspace/10_Active/versatile-design/node_modules/playwright/cli.js install chromium` を実行してからやり直す。

- [ ] **Step 3: 全件を計測する**

`reference-map.md` の全行について Step 2 のコマンドを実行する。失敗したサイトは `reference-map.md` に理由を書き、観察記録では「取得できず」として扱う（推測で埋めない）。

- [ ] **Step 4: 動きを目で確かめる**

各サイトを Playwright でスクロールしながら 3 枚程度のスクリーンショットを `$SCRATCH/measure/shots/` に撮り、Read で見て、演出の種類（文字の分割の登場、ピン留め、横スクロール、画像の切り抜き、WebGL の面・ゆがみ・粒子・3D の物体、ページの読み込みの演出）を記録する。スクリーンショットはリポジトリに入れない。

- [ ] **Step 5: 観察記録を書く**

`observations/site.md` の冒頭の「実例4件」を全件数に、「観察日」を「サイト1〜4は 2026-10-03、サイト5以降は <計測日>」に書き換える。「観察の方法」に、計測した値として「WebGL の canvas の数と大きさ、GSAP のプラグイン、ピン留めの数、書体の配信元」を足す。

「4サイトに共通する傾向」の直前に、各サイトの節をサイト1〜4と同じ形（観察した数値の表、言語化した原則、採らない点）で足す。表の行に次の3行を加える（サイト1〜4には足さない）。

| 項目 | 書き方の例 |
|---|---|
| WebGL | 「最初の画面の背景に画面幅いっぱいの canvas 1個（webgl2）。シェーダーの面で、スクロールに合わせて色の境目が動く」／「なし」 |
| 書体の配信元 | 「見出しは Fontshare、本文は Google Fonts」「自前配信（OFL）」「有料の配信サービス」 |
| GSAP のプラグインと型 | 「ScrollTrigger（ピン留め2か所、横スクロール1か所）、SplitText」 |

珍しい有料フォントは名前を書かず、「コントラストの強い有料のセリフ体」のように分類で書く。

- [ ] **Step 6: 共通する傾向を作り直す**

見出しを「全サイトに共通する傾向」に変え、比較の表を全件の列に広げる（列が多すぎる場合は、サイトを行、項目を列に転置する）。箇条の傾向は全件で数え直し、件数を「N件中M件」の形で書く。少なくとも次の3つの傾向を足す：WebGL を使うサイトの割合と使い方、GSAP の型の出現数（ピン留め、横スクロール、Flip、画像の切り抜き、速さに反応する帯、読み込みの演出のそれぞれ）、書体の配信元の割合。

- [ ] **Step 7: 調整欄の数値を見直す**

`mode-site.md` の調整欄（文字、色、余白とレイアウト、動き）の「根拠にした実例」の列に新しいサイトを足し、初期値が全件の傾向から外れていれば直す。`motion-web.md` の調整欄の「サイト系」の列も同様に見直す。直した値はコミットメッセージの本文に「旧 → 新」で書く。

- [ ] **Step 8: 匿名化を検査してコミットする**

```bash
cd /home/neko/Workspace/10_Active/versatile-design
REFERENCE_DENYLIST=$SCRATCH/reference-denylist.txt node tools/check-skills.mjs
git diff | rg -i -F -f $SCRATCH/reference-denylist.txt; echo "exit=$?"
git add skills/web/references/observations/site.md skills/web/references/mode-site.md skills/web/references/motion-web.md
git commit -m "docs: サイト系の観察記録に参考サイトを追加し、傾向と調整欄を見直す"
git log --all -p | rg -i -F -f $SCRATCH/reference-denylist.txt; echo "exit=$?"
```

Expected: `検査に合格した`、2回の `rg` はどちらも `exit=1`（一致なし）。

---

### Task 5: 作る前にコンセプトの案と技術スタックを確認する流れにする

**Files:**
- Modify: `skills/design-core/references/concept-brief.md`（冒頭の段落、5節、6節を新設）
- Modify: `skills/design-core/SKILL.md`（4節、3節の表の「2. コンセプト」の行）
- Modify: `skills/web/SKILL.md`（手順2）

**Interfaces:**
- Produces: `concept-brief.md` の5節「確認の流れ」の表と、6節「案の書式」。`web` の手順2は、この表を参照する。Task 6 の `stack.md` は「技術スタックの提案は `concept-brief.md` の6節の書式に入れる」と参照される。

- [ ] **Step 1: `concept-brief.md` を書き換える**

冒頭の段落を次に置き換える。

```markdown
コードを書く前に、この手順でコンセプトを決める。サイト系では案を出して利用者に選んでもらい、アプリ系では宣言して進める。どちらにするかは5節の表に従う。
```

既存の5節「宣言の書式」を6節の後ろに回して7節とし、5節と6節を次の内容で新設する。

````markdown
## 5. 確認の流れ

| 状況 | コンセプト | 技術スタック |
|---|---|---|
| 新規・サイト系 | 案を 2〜3 個出して選んでもらう（6節） | 提案して確認する。案と同じメッセージで出す |
| 新規・アプリ系 | 宣言して進める（7節） | 提案して確認する |
| 既存のプロジェクト・サイト系 | 案を 2〜3 個出して選んでもらう（6節） | 既存のものに合わせ、質問しない |
| 既存のプロジェクト・アプリ系 | 宣言して進める（7節） | 既存のものに合わせ、質問しない |
| プロンプトに「おまかせ」「確認なしで」「任せる」などがある | 最も良い案を自分で選び、選んだ理由を1文添えて宣言して進める（7節） | 自分で選び、理由を添えて宣言して進める |

- 新規か既存かは、作業ディレクトリに `package.json` があるかどうかで判定する。
- 案や技術スタックを質問したら、回答があるまでコードを書かない。
- 利用者が案を組み合わせたり直したりした場合（「案2のフックで、印象は案1」など）は、その内容で7節の宣言を出してから進める。
- サブエージェントとして動いている場合など、質問しても答える人がいない場合は「おまかせ」と同じに扱う。
- 技術スタックの決め方は媒体別スキルの資料に従う（web は `../web/references/stack.md`）。

## 6. 案の書式

案同士は、記憶のフックの種類を変える（例：巨大な文字、写真の配置、WebGL の面）。形容詞だけが違う案を並べない。動きの強さは記憶のフックから決め、フックが動きや 3D そのものである案だけを「GSAP の演出あり」「Three.js あり」にする。

```
案1：（案を一言で表す名前）
- 誰に：（1文）
- どんな印象を：（形容詞2〜3個）
- 何で記憶に残すか：（要素を1つ）
- 動きの強さ：静か／GSAP の演出あり／Three.js あり
- 書体の組：（typography-ja.md の記号と、見出しの書体名）
- テーマ：（4節で決めたもの）

案2：…

技術スタック：（提案するもの）。理由：（1文）。次点：（1つ）

どの案にしますか。組み合わせや修正の指定もできます。
```
````

7節（旧5節）の見出しを「## 7. 宣言の書式」とし、先頭に「アプリ系と「おまかせ」の場合、および案が選ばれた後に、次の書式で宣言してから作業を続ける。」を足す。

- [ ] **Step 2: `design-core/SKILL.md` を書き換える**

4節の2つ目の箇条（「宣言したら確認を待たずに…」）を次に置き換える。

```markdown
- サイト系では案を 2〜3 個出して利用者に選んでもらい、アプリ系では宣言して進める。新規のプロジェクトでは技術スタックも確認する。条件と書式は `references/concept-brief.md` の5〜7節に従う。「おまかせ」と言われた場合は質問しない。
```

3節の表の「2. コンセプト」の行の「やること」を「3行のコンセプト、サイト系／アプリ系、テーマを決め、案を出して選んでもらうか宣言する」に書き換える。

- [ ] **Step 3: `web/SKILL.md` の手順2を書き換える**

手順2の4つ目の箇条を次の2つに置き換え、読むファイルに `references/stack.md` を足す（「読むファイル：`../design-core/references/concept-brief.md`、`references/stack.md`」）。

```markdown
4. 技術スタックを決める。作業ディレクトリに `package.json` があれば、そのプロジェクトの構成に合わせる。なければ `references/stack.md` の表から提案を1つと次点を1つ選ぶ。
5. `concept-brief.md` の5節の表に従い、サイト系なら6節の書式で案と技術スタックの提案を出して回答を待つ。アプリ系なら7節の書式で宣言する（新規なら技術スタックの提案だけを出して回答を待つ）。「おまかせ」の場合は質問せず、選んだ理由を添えて7節の書式で宣言して進める。
```

- [ ] **Step 4: 2つのファイルの条件を突き合わせる**

`concept-brief.md` の5節の表の5行と、`web/SKILL.md` の手順2の4〜5の文を並べ、新規・既存 × サイト系・アプリ系 × おまかせ の各組み合わせで、質問するもの（案、技術スタック、なし）が一致することを確かめる。食い違いがあれば `concept-brief.md` を正として `web/SKILL.md` を直す。`design-core/SKILL.md` の 4節にも「確認を待たずに」という古い記述が残っていないことを確かめる。

Run: `rg -n '確認を待たずに' skills/`
Expected: 一致なし

- [ ] **Step 5: 検査してコミットする**

`references/stack.md` はまだないため、この時点では `check-skills` が「参照先が存在しない」を出す。Task 6 と同じコミットにするため、ここではコミットせず Task 6 に進む。

---

### Task 6: 技術スタックの決め方（`stack.md`）を作る

**Files:**
- Create: `skills/web/references/stack.md`
- Modify: `skills/web/SKILL.md`（手順4の冒頭の段落）
- Modify: `skills/web/references/favicon.md`（置き場所の表）
- Modify: `README.md`（必要なもの、開発者向けのコマンド）

**Interfaces:**
- Consumes: `concept-brief.md` の5〜6節（Task 5）
- Produces: `stack.md` の1節（提案の表）と2節（フレームワークごとの違いの表）。Task 8 の `webgl.md` は2節の「クライアントだけで動かす方法」の行を参照する。

- [ ] **Step 1: `stack.md` を書く**

```markdown
# 技術スタックの決め方

手順2で、新規のプロジェクトの技術スタックを提案するときに読む。既存のプロジェクトでは、そのプロジェクトの構成に合わせ、このファイルで選び直さない。提案の出し方は `../design-core/references/concept-brief.md` の5〜6節に従う。

## スキル作者の調整欄

以下は初期値である。ユーザーの調整欄とプロンプトの指示が優先される。

| 項目 | 初期値 |
|---|---|
| 迷った場合の提案 | React ＋ Vite |
| 提案に添える次点の数 | 1つ |

## 1. 提案の表

| 規模・性質 | 提案 | 次点 |
|---|---|---|
| 1〜数ページの LP、ポートフォリオ。内容の更新が少ない | React ＋ Vite | Astro |
| ページが多い、ブログやお知らせなど内容が中心で更新がある | Astro（動く部分だけ React の島にする） | React Router（フレームワークモード） |
| ログイン、データの読み書き、サーバーでの処理があるアプリ | React Router（フレームワークモード） | Next.js（App Router） |
| 依頼で Next.js の機能（画像の最適化、サーバーアクションなど）や配信先が指定されている | Next.js（App Router） | React Router（フレームワークモード） |

- 依頼に技術の指定があれば、それに従い、この表で選び直さない。
- 「規模」は、依頼の時点で分かるページ数と機能で判断する。将来大きくなるかもしれない、という理由で大きい構成を選ばない。
- どれを選んでも、Tailwind CSS v4、React Aria Components、Iconify、トークンの定義（`references/tokens-tailwind.md`）は共通である。

## 2. フレームワークごとの違い

| 項目 | React ＋ Vite | Astro | React Router（フレームワークモード） | Next.js（App Router） |
|---|---|---|---|---|
| 作り始めのコマンド | `npm create vite@latest <名前> -- --template react-ts` | `npm create astro@latest <名前>` の後に `npx astro add react tailwind` | `npx create-react-router@latest <名前>` | `npx create-next-app@latest <名前>` |
| `@theme` を置く最初の CSS | `src/index.css`（`main.tsx` で import） | `src/styles/global.css`（共通のレイアウトで import） | `app/app.css`（`app/root.tsx` で import） | `app/globals.css`（`app/layout.tsx` で import） |
| `"use client"` | 書かない（すべてクライアント） | 書かない。React の部品は島として `client:*` を付けて置く | 書かない | 状態、効果、ブラウザの API を使う部品の先頭に書く |
| GSAP と Three.js をクライアントだけで動かす方法 | そのまま `useEffect`／`useGSAP` | 部品を `client:visible`（最初の画面にあるものは `client:load`）で置く | そのまま `useEffect`／`useGSAP`（サーバーでは実行されない） | 部品の先頭に `"use client"` を書く |
| フォントの読み込み | `index.html` の `<head>` に `<link>`、自前配信は `public/fonts/` | 共通のレイアウトの `<head>` に `<link>`、自前配信は `public/fonts/` | `app/root.tsx` の `links` に追加、自前配信は `public/fonts/` | `<link>` を `app/layout.tsx` の `<head>` に書く。自前配信は `public/fonts/` に置き `@font-face` を CSS に書く（`next/font` は使わない。`typography-ja.md` の `font-family` の順序をトークンで管理するため） |
| ファビコン | `references/favicon.md` の表 | 同左 | 同左 | 同左 |

- コード例の `"use client"` は Next.js のためのものである。Next.js 以外ではあってもなくても動くため、写したままでよい。
```

- [ ] **Step 2: `web/SKILL.md` の手順4の冒頭を書き換える**

「既存のプロジェクトがなければ、React と Tailwind CSS v4 の最小構成を用意し、手順3の `@theme` を最初の CSS に置く。」を次に置き換える。

```markdown
既存のプロジェクトがなければ、手順2で決めた技術スタックで構成を用意し、手順3の `@theme` を最初の CSS に置く。作り始めのコマンドと最初の CSS の置き場所は `references/stack.md` の2節に従う。
```

- [ ] **Step 3: `favicon.md` の置き場所の表に行を足す**

`favicon.md` の、Next.js と Vite の行がある表に次の2行を足す（表の列の数と並びは既存の行に合わせる）。

```markdown
| Astro | `public/favicon.svg`、`public/apple-touch-icon.png` | 共通のレイアウトの `<head>` に、Vite と同じ2行を書く |
| React Router（フレームワークモード） | `public/favicon.svg`、`public/apple-touch-icon.png` | `app/root.tsx` の `links` 関数に `{ rel: "icon", href: "/favicon.svg", type: "image/svg+xml" }` と `{ rel: "apple-touch-icon", href: "/apple-touch-icon.png" }` を足す |
```

- [ ] **Step 4: README を書き換える**

「必要なもの」の2つ目の箇条を「生成物は React と Tailwind CSS v4 を前提にする。フレームワーク（Vite、Astro、React Router、Next.js）は依頼の規模に合わせて提案され、利用者が選ぶ。React Aria Components、Iconify、Motion、GSAP、three などは、生成するプロジェクトに必要に応じて導入される。」に置き換える。「スキルの一覧」の後の箇条に「サイト系の依頼では、作る前にコンセプトの案が 2〜3 個と技術スタックの提案が出て、選んでから作られる。「おまかせで」と書けば、選ばずに進む。」を足す。

「開発者向けのコマンド」のコードブロックの直後に次を足す。

```markdown
- WSL で `npm` を実行すると Windows 側の npm が呼ばれる場合がある。その場合は、WSL 側に Node.js（npm を含む）を入れるか、`pnpm dlx npm@11 <コマンド>` で実行する。テストと検査は `node --test "tests/**/*.test.mjs"`、`node tools/check-skills.mjs`、`node tools/check-recipes.mjs` で直接実行してもよい。
```

- [ ] **Step 5: 検査してコミットする**

```bash
node tools/check-skills.mjs && node --test "tests/**/*.test.mjs"
git add skills/design-core/ skills/web/SKILL.md skills/web/references/stack.md skills/web/references/favicon.md README.md
git commit -m "feat: サイト系では作る前にコンセプトの案と技術スタックを提案して選んでもらう"
```

Expected: `検査に合格した`、テストはすべて PASS

---

### Task 7: GSAP の型を足す

**Files:**
- Modify: `skills/web/references/motion-web.md`（1節の表と箇条、4節に小節を追加、6節の表）

**Interfaces:**
- Consumes: `observations/site.md` の全件の傾向の「GSAP の型の出現数」（Task 4）。`gsap-setup.ts`（`motion-web.md` 4節の既存のブロック）。
- Produces: `gsap-setup.ts` に `Flip` を足した export：`export { gsap, Flip, ScrollTrigger, SplitText, useGSAP };`。Task 8 の `webgl.md` が `gsap` と `ScrollTrigger` を import する。

- [ ] **Step 1: 入れる型を決める**

Task 4 の傾向で出現数が1件以上の型だけを入れる。0件の型は入れず、コミットメッセージの本文に「観察で見られなかったため入れない：<型>」と書く。以下の Step 2〜6 は、入れない型の Step を飛ばす。

- [ ] **Step 2: `gsap-setup.ts` に Flip を足す**

`motion-web.md` 4節の `gsap-setup.ts` のブロックを次に置き換える（Flip を入れない場合は Flip の2行を除く）。

```tsx
// gsap-setup.ts
"use client";
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { Flip } from "gsap/Flip";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, CustomEase, Flip, ScrollTrigger, SplitText);

CustomEase.create("outQuint", "0.22, 1, 0.36, 1");
CustomEase.create("inOutQuart", "0.76, 0, 0.24, 1");

export { gsap, Flip, ScrollTrigger, SplitText, useGSAP };
```

- [ ] **Step 3: ピン留め＋横スクロールの小節を足す**

4節の「サイト系のメニューの全画面の開閉」の前に、次の小節を足す。

````markdown
### ピン留めと横スクロール

作品の一覧のように、横に並べること自体に意味がある場合だけ使う。縦に読む文章を横に流さない。スマートフォン幅では、横スクロールをやめて縦に積む（指の縦のスクロールを横の移動に変えると、利用者の操作とずれる）。

```tsx
"use client";
import { useRef } from "react";
import { gsap, useGSAP } from "./gsap-setup";

export function WorksRail({ works }: { works: { id: string; title: string; image: string }[] }) {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLUListElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
        const el = track.current;
        if (!el) return;
        // スクロール量に直接つなぐため、イージングは付けない（scrub の追従で滑らかにする）
        gsap.to(el, {
          x: () => -(el.scrollWidth - window.innerWidth),
          ease: "none",
          scrollTrigger: {
            trigger: root.current,
            pin: true,
            scrub: 0.6,
            end: () => `+=${el.scrollWidth - window.innerWidth}`,
            invalidateOnRefresh: true,
          },
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} className="overflow-hidden bg-surface-0">
      <ul ref={track} className="grid gap-6 px-6 py-24 md:flex md:w-max md:gap-12 md:px-12">
        {works.map((w) => (
          <li key={w.id} className="md:w-[40vw]">
            <img className="aspect-[4/3] w-full rounded-md object-cover" src={w.image} alt="" />
            <p className="mt-3 font-display text-2xl text-text-strong">{w.title}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

- 動きを減らす設定のときとスマートフォン幅では、`matchMedia` の条件に当たらないため、ピン留めも横の移動もせず縦に積んだまま表示する。
- `invalidateOnRefresh: true` と関数で書いた `x`・`end` を組にし、画面幅が変わったときに距離を計算し直す。
- ピン留めの中にさらにピン留めを入れない。
````

- [ ] **Step 4: 画像の切り抜きでの登場と、Flip の小節を足す**

````markdown
### 画像の切り抜き（`clip-path`）での登場

写真や作品の画像を、枠の一辺から開くように見せる。画像そのものは少し拡大した状態から等倍に戻し、切り抜きと同時に動かして奥行きを出す。

```tsx
"use client";
import { useRef } from "react";
import { gsap, useGSAP } from "./gsap-setup";

export function RevealImage({ src, alt }: { src: string; alt: string }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap.timeline({ scrollTrigger: { trigger: root.current, start: "top 80%", once: true } });
        tl.fromTo(root.current, { clipPath: "inset(100% 0 0 0)" }, { clipPath: "inset(0% 0 0 0)", duration: 1, ease: "inOutQuart" })
          .from(".js-reveal-img", { scale: 1.15, duration: 1.2, ease: "outQuint" }, 0);
      });
      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.from(root.current, { opacity: 0, duration: 0.12, ease: "outQuint", scrollTrigger: { trigger: root.current, start: "top 80%", once: true } });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <div ref={root} className="overflow-hidden rounded-md">
      <img className="js-reveal-img aspect-[3/2] w-full object-cover" src={src} alt={alt} />
    </div>
  );
}
```

### レイアウトの切り替え（Flip）

一覧の並び方（格子と1列など）や絞り込みを切り替えたときに、各項目を元の位置から新しい位置へ動かす。切り替えの前に状態を取り、DOM を変えた後に `Flip.from` で動かす。

```tsx
"use client";
import { useRef, useState } from "react";
import { Flip, gsap, useGSAP } from "./gsap-setup";

export function WorksGrid({ works }: { works: { id: string; title: string }[] }) {
  const root = useRef<HTMLDivElement>(null);
  const [dense, setDense] = useState(false);
  const flipState = useRef<Flip.FlipState | null>(null);

  const toggle = () => {
    flipState.current = Flip.getState(".js-work");
    setDense((d) => !d);
  };

  useGSAP(
    () => {
      const state = flipState.current;
      if (!state) return;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      Flip.from(state, {
        duration: reduce ? 0 : 0.8,
        ease: "inOutQuart",
        stagger: reduce ? 0 : 0.04,
        absolute: true,
      });
      flipState.current = null;
    },
    { scope: root, dependencies: [dense] },
  );

  return (
    <div ref={root} className="grid gap-6">
      <button type="button" onClick={toggle} className="justify-self-start text-text-muted">
        {dense ? "大きく並べる" : "小さく並べる"}
      </button>
      <ul className={dense ? "grid grid-cols-4 gap-3" : "grid grid-cols-2 gap-8"}>
        {works.map((w) => (
          <li key={w.id} className="js-work rounded-md bg-surface-1 p-4 text-text">
            {w.title}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- 動きを減らす設定のときは `duration: 0` にして、位置だけを切り替える。
- 実際のプロジェクトでは、ボタンは `references/components/button.md` のレシピで作る。ここでは動きの書き方を示すため素の `button` にしている。
````

- [ ] **Step 5: スクロールの速さに反応する帯と、読み込みの演出の小節を足す**

````markdown
### スクロールの速さに反応する帯

流れ続ける帯（2節）を、スクロールの速さに合わせて一時的に速くし、向きも合わせる。帯そのものは一定の速さで動くことに意味があるため、ベースの動きは `linear` のままにする。

```tsx
"use client";
import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP } from "./gsap-setup";

export function VelocityMarquee({ text }: { text: string }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // 流れ続ける帯は一定の速さで動くことに意味がある（X13 の理由）
        const loop = gsap.to(".js-marquee-track", { xPercent: -50, duration: 40, ease: "none", repeat: -1 });
        ScrollTrigger.create({
          onUpdate(self) {
            const boost = gsap.utils.clamp(-6, 6, self.getVelocity() / 300);
            gsap.to(loop, { timeScale: boost === 0 ? 1 : boost, duration: 0.3, ease: "outQuint", overwrite: true });
            gsap.to(loop, { timeScale: self.direction, duration: 1.2, delay: 0.3, ease: "outQuint" });
          },
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <div ref={root} className="overflow-hidden border-y border-line py-4" aria-label={text}>
      <div className="js-marquee-track flex w-max gap-12 font-display text-5xl text-text-strong" aria-hidden="true">
        <span>{text}</span>
        <span>{text}</span>
      </div>
    </div>
  );
}
```

- 動きを減らす設定のときは帯を動かさない（流れ続ける帯の決まりと同じ）。
- 帯の文字は飾りとして `aria-hidden` にし、同じ内容を外側の `aria-label` で1回だけ読ませる。

### ページの読み込みの演出

最初の画面を出す前に、短い演出を1回だけ入れる。待たせる時間になるため、全体で 1200ms 以内にし、同じ訪問の2ページ目以降では出さない。

```tsx
"use client";
import { useRef, useState } from "react";
import { gsap, useGSAP } from "./gsap-setup";

export function Intro({ name }: { name: string }) {
  const root = useRef<HTMLDivElement>(null);
  const [done, setDone] = useState(() => typeof window !== "undefined" && sessionStorage.getItem("intro") === "1");

  useGSAP(
    () => {
      if (done) return;
      const finish = () => {
        sessionStorage.setItem("intro", "1");
        setDone(true);
      };
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.timeline({ onComplete: finish })
          .from(".js-intro-name", { yPercent: 100, duration: 0.6, ease: "outQuint" })
          .to(root.current, { clipPath: "inset(0 0 100% 0)", duration: 0.6, ease: "inOutQuart" }, "+=0.1");
      });
      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.to(root.current, { opacity: 0, duration: 0.12, ease: "outQuint", onComplete: finish });
      });
      return () => mm.revert();
    },
    { scope: root, dependencies: [done] },
  );

  if (done) return null;
  return (
    <div ref={root} className="fixed inset-0 z-50 grid place-items-center bg-surface-1" aria-hidden="true">
      <p className="overflow-hidden font-display text-6xl text-text-strong">
        <span className="js-intro-name block">{name}</span>
      </p>
    </div>
  );
}
```

- 数字が 0 から 100 まで増える読み込みの表示を、実際の読み込みと無関係に出さない。進んでいないものを進んでいるように見せることになる。
- 演出の層は `aria-hidden` にし、ページの内容は裏で最初から読める状態にしておく。
````

- [ ] **Step 6: 1節と6節の表を直す**

1節の表の GSAP の行の「使う場面」を「サイト系のスクロール演出（ピン留め、横スクロール、画像の切り抜き）、文字単位の演出、時間軸で組み立てる登場、レイアウトの切り替え（Flip）」に書き換える（入れなかった型は書かない）。1節の箇条の「GSAP は ScrollTrigger、SplitText、CustomEase を含めて無償で使える」を「GSAP は ScrollTrigger、SplitText、CustomEase、Flip を含めて無償で使える」に書き換える。Three.js の行は Task 8 で足す。

- [ ] **Step 7: 検査してコミットする**

```bash
node tools/check-recipes.mjs && node tools/check-skills.mjs
git add skills/web/references/motion-web.md
git commit -m "feat: motion-web に GSAP のピン留め、横スクロール、画像の切り抜き、Flip などの型を足す"
```

Expected: `0 件の型エラー`、`レシピの検査に合格した`、`検査に合格した`。型エラーが出たら、`node_modules/gsap/types/` の型定義を読んでコード例を直す（`Flip.FlipState` の名前空間など）。

---

### Task 8: Three.js の型（`webgl.md`）と禁止事項 X22 を足す

**Files:**
- Create: `skills/web/references/webgl.md`
- Modify: `skills/web/references/motion-web.md`（1節の表に Three.js の行、6節の表に Three.js の行）
- Modify: `skills/web/SKILL.md`（手順4の箇条）
- Modify: `skills/web/references/mode-site.md`（6節）
- Modify: `skills/design-core/references/anti-patterns.md`（X22）

**Interfaces:**
- Consumes: `./gsap-setup` の `gsap`、`ScrollTrigger`（Task 7）。`stack.md` の2節（Task 6）。`observations/site.md` の WebGL の傾向（Task 4）。
- Produces: `webgl.md` の `tokenColor(name: string): THREE.Color`、`ShaderPlane`、`DistortImage`、`ParticleField`。

- [ ] **Step 1: `webgl.md` を書く**

`webgl.md` を次の内容で作る。調整欄の「根拠にした実例」の列は、Task 4 の観察で WebGL を使っていたサイトのラベルで埋める（該当なしの行は「— （モデルの知識による）」）。

````markdown
# WebGL（Three.js）

サイト系で、コンセプトの記憶のフックが WebGL の演出（シェーダーの面、画像のゆがみ、粒子など）である場合だけ読む。フックでない場所に WebGL を足さない（`../design-core/references/anti-patterns.md` の X22）。動きの共通の決まりは `references/motion-web.md` に従う。

- 使うのは `three` だけである。React Three Fiber と drei は使わない。依存を増やさず、GSAP から uniform を直接動かせるようにするためである。
- 1ページに置く WebGL の canvas は1つにする。複数の場所で使う場合も、1つの canvas を `position: fixed` で敷き、場所ごとに描き分ける。
- フレームワークごとに、クライアントだけで動かす方法が違う（`references/stack.md` の2節）。

## スキル作者の調整欄

| 項目 | 初期値 | 根拠にした実例 |
|---|---|---|
| 画素の比率の上限 | 2 | — （モデルの知識による） |
| スマートフォン幅での画素の比率の上限 | 1.5 | — （モデルの知識による） |
| 粒子の数の上限 | PC 幅 4000、スマートフォン幅 1500 | — （モデルの知識による） |
| スクロールにつなぐ `scrub` の追従 | 0.6 | `motion-web.md` の既存の例に合わせる |
| 色 | トークンの色だけ（`tokenColor()` で読む）。2色まで | — |

## 1. 必ず守る決まり

| 決まり | 書き方 |
|---|---|
| 動きを減らす設定では止める | 1フレームだけ描き、時間でもスクロールでも動かさない |
| WebGL が使えない環境 | `WebGLRenderer` の作成を `try` で囲み、失敗したら同じ位置に代わりの表示（静止画か CSS の背景）を出す。`webglcontextlost` でも同じ表示に切り替える |
| 画面外では描かない | `IntersectionObserver` で見えている間だけ `gsap.ticker` に描画を登録する |
| 片付け | 効果の戻り値で、ジオメトリ、マテリアル、テクスチャ、レンダラーを `dispose()` し、canvas を DOM から外す |
| 画素の比率 | `renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))` |
| 読み上げ | canvas は `aria-hidden="true"` にする。伝えたい内容は HTML の文字で置く |
| 時計 | 描画のループは `gsap.ticker` に乗せ、GSAP と ScrollTrigger と同じ時計で動かす。Lenis を使う場合もそろう |

## 2. 共通の部品

```tsx
// webgl-utils.ts：トークンの色を Three.js の色に変える
import * as THREE from "three";

// oklch() のトークンは THREE.Color で直接読めないため、2D の canvas に一度塗って sRGB の値を取る
export function tokenColor(name: string): THREE.Color {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx || !value) return new THREE.Color(0, 0, 0);
  ctx.fillStyle = value;
  ctx.fillRect(0, 0, 1, 1);
  const [r = 0, g = 0, b = 0] = ctx.getImageData(0, 0, 1, 1).data;
  return new THREE.Color().setRGB(r / 255, g / 255, b / 255, THREE.SRGBColorSpace);
}

export function maxPixelRatio(): number {
  return Math.min(window.devicePixelRatio, window.matchMedia("(max-width: 767px)").matches ? 1.5 : 2);
}
```

## 3. 見出しや画像の裏に置くシェーダーの面

2色のトークンの境目が、時間とスクロールでゆっくり動く面である。最初の画面の背景に敷き、上に HTML の見出しを重ねる。

```tsx
// ShaderPlane.tsx
"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { gsap } from "./gsap-setup";
import { maxPixelRatio, tokenColor } from "./webgl-utils";

const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`;

const fragmentShader = `
precision highp float;
uniform float uTime;
uniform float uProgress;
uniform vec3 uColorA;
uniform vec3 uColorB;
varying vec2 vUv;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
void main() {
  float n = noise(vUv * 3.0 + vec2(uTime * 0.04, uProgress * 1.5));
  float edge = smoothstep(0.42, 0.58, n + (vUv.y - 0.5) * 0.8 - uProgress * 0.4);
  gl_FragColor = vec4(mix(uColorA, uColorB, edge), 1.0);
}`;

export function ShaderPlane({ className = "" }: { className?: string }) {
  const host = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "low-power" });
    } catch {
      setFailed(true);
      return;
    }
    renderer.setPixelRatio(maxPixelRatio());
    renderer.domElement.setAttribute("aria-hidden", "true");
    renderer.domElement.className = "block size-full";
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const geometry = new THREE.PlaneGeometry(2, 2);
    const uniforms = {
      uTime: { value: 0 },
      uProgress: { value: 0 },
      uColorA: { value: tokenColor("--color-surface-0") },
      uColorB: { value: tokenColor("--color-accent") },
    };
    const material = new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms });
    scene.add(new THREE.Mesh(geometry, material));

    const render = () => renderer.render(scene, camera);
    const resize = () => {
      const { width, height } = el.getBoundingClientRect();
      renderer.setSize(width, height, false);
      render();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(el);

    const onLost = (e: Event) => {
      e.preventDefault();
      setFailed(true);
    };
    renderer.domElement.addEventListener("webglcontextlost", onLost);

    const tick = (time: number) => {
      uniforms.uTime.value = time;
      render();
    };
    let tween: gsap.core.Tween | undefined;
    let visibility: IntersectionObserver | undefined;
    if (!reduce) {
      tween = gsap.to(uniforms.uProgress, {
        value: 1,
        // スクロール量に直接つなぐため、イージングは付けない（scrub の追従で滑らかにする）
        ease: "none",
        scrollTrigger: { trigger: el, start: "top top", end: "bottom top", scrub: 0.6 },
      });
      visibility = new IntersectionObserver(([entry]) => {
        if (entry?.isIntersecting) gsap.ticker.add(tick);
        else gsap.ticker.remove(tick);
      });
      visibility.observe(el);
    }

    return () => {
      visibility?.disconnect();
      gsap.ticker.remove(tick);
      tween?.scrollTrigger?.kill();
      tween?.kill();
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener("webglcontextlost", onLost);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div ref={host} className={`absolute inset-0 -z-10 ${className}`}>
      {failed && <div className="size-full bg-surface-1" />}
    </div>
  );
}
```

- 動きを減らす設定のときは、`ResizeObserver` の最初の呼び出しで1フレームだけ描き、ticker にもスクロールにも登録しない。
- 代わりの表示は、面の2色のうち背景側の色にする。画像を用意できる場合は、面を止めた状態の静止画にしてもよい。
- 色を3色以上にしない。虹色のグラデーションの面は X22 に当たる。

## 4. 画像のゆがみと切り替え

作品の画像に、ホバーで波のゆがみをかける。ゆがみの強さを uniform にし、GSAP で上げ下げする。

```tsx
// DistortImage.tsx
"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { gsap } from "./gsap-setup";
import { maxPixelRatio } from "./webgl-utils";

const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`;

const fragmentShader = `
precision highp float;
uniform sampler2D uTexture;
uniform float uHover;
uniform float uTime;
varying vec2 vUv;
void main() {
  vec2 uv = vUv;
  uv.x += sin(uv.y * 12.0 + uTime * 2.0) * 0.015 * uHover;
  uv.y += cos(uv.x * 10.0 + uTime * 2.0) * 0.010 * uHover;
  gl_FragColor = texture2D(uTexture, uv);
}`;

export function DistortImage({ src, alt }: { src: string; alt: string }) {
  const host = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, powerPreference: "low-power" });
    } catch {
      return;
    }
    renderer.setPixelRatio(maxPixelRatio());
    renderer.domElement.setAttribute("aria-hidden", "true");
    renderer.domElement.className = "absolute inset-0 size-full";

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const geometry = new THREE.PlaneGeometry(2, 2);
    const texture = new THREE.TextureLoader().load(src, () => {
      el.appendChild(renderer.domElement);
      setReady(true);
      render();
    });
    texture.colorSpace = THREE.SRGBColorSpace;
    const uniforms = { uTexture: { value: texture }, uHover: { value: 0 }, uTime: { value: 0 } };
    const material = new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms });
    scene.add(new THREE.Mesh(geometry, material));

    const render = () => renderer.render(scene, camera);
    const resize = () => {
      const { width, height } = el.getBoundingClientRect();
      renderer.setSize(width, height, false);
      render();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(el);

    const tick = (time: number) => {
      uniforms.uTime.value = time;
      render();
    };
    const enter = () => {
      gsap.ticker.add(tick);
      gsap.to(uniforms.uHover, { value: 1, duration: 0.6, ease: "outQuint" });
    };
    const leave = () => {
      gsap.to(uniforms.uHover, { value: 0, duration: 0.4, ease: "outQuint", onComplete: () => gsap.ticker.remove(tick) });
    };
    el.addEventListener("pointerenter", enter);
    el.addEventListener("pointerleave", leave);

    return () => {
      el.removeEventListener("pointerenter", enter);
      el.removeEventListener("pointerleave", leave);
      gsap.ticker.remove(tick);
      gsap.killTweensOf(uniforms.uHover);
      resizeObserver.disconnect();
      geometry.dispose();
      material.dispose();
      texture.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [src]);

  return (
    <div ref={host} className="relative aspect-[4/3] overflow-hidden rounded-md">
      <img className={`size-full object-cover ${ready ? "invisible" : ""}`} src={src} alt={alt} />
    </div>
  );
}
```

- 元の `<img>` は常に DOM に残し、`alt` で内容を伝える。WebGL の準備ができたときだけ見た目を canvas に切り替える（`invisible` は場所と読み上げを残したまま見えなくする）。
- 動きを減らす設定のとき、WebGL が使えないとき、テクスチャの読み込み前は、元の `<img>` がそのまま表示される。
- 描画は、ホバーしている間とゆがみが戻るまでの間だけ行う。
- 画像は同じオリジンか、CORS を許可した配信元に置く。許可がないとテクスチャを読めない。

## 5. 粒子と線

点を格子状や面の形に並べ、スクロールで集まったり散ったりさせる。マウスの位置に粒子を付いてこさせる演出は X22 に当たるため使わない。

```tsx
// ParticleField.tsx
"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { gsap } from "./gsap-setup";
import { maxPixelRatio, tokenColor } from "./webgl-utils";

export function ParticleField() {
  const host = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const count = window.matchMedia("(max-width: 767px)").matches ? 1500 : 4000;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, powerPreference: "low-power" });
    } catch {
      setFailed(true);
      return;
    }
    renderer.setPixelRatio(maxPixelRatio());
    renderer.domElement.setAttribute("aria-hidden", "true");
    renderer.domElement.className = "block size-full";
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.z = 6;

    // 散った位置と、格子に揃った位置の2組を持ち、uProgress で補間する
    const scattered = new Float32Array(count * 3);
    const aligned = new Float32Array(count * 3);
    const side = Math.ceil(Math.sqrt(count));
    for (let i = 0; i < count; i++) {
      scattered.set([(Math.random() - 0.5) * 10, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 4], i * 3);
      aligned.set([((i % side) / side - 0.5) * 6, (Math.floor(i / side) / side - 0.5) * 6, 0], i * 3);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(scattered, 3));
    geometry.setAttribute("aAligned", new THREE.BufferAttribute(aligned, 3));
    const material = new THREE.ShaderMaterial({
      transparent: true,
      uniforms: { uProgress: { value: reduce ? 1 : 0 }, uColor: { value: tokenColor("--color-text-strong") }, uSize: { value: 2 * maxPixelRatio() } },
      vertexShader: `
        attribute vec3 aAligned;
        uniform float uProgress;
        uniform float uSize;
        void main() {
          vec3 p = mix(position, aAligned, uProgress);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
          gl_PointSize = uSize;
        }`,
      fragmentShader: `
        precision highp float;
        uniform vec3 uColor;
        void main() {
          if (length(gl_PointCoord - 0.5) > 0.5) discard;
          gl_FragColor = vec4(uColor, 0.8);
        }`,
    });
    const points = new THREE.Points(geometry, material);
    scene.add(points);

    const render = () => renderer.render(scene, camera);
    const resize = () => {
      const { width, height } = el.getBoundingClientRect();
      renderer.setSize(width, height, false);
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
      render();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(el);

    let tween: gsap.core.Tween | undefined;
    let visibility: IntersectionObserver | undefined;
    if (!reduce) {
      const progress = material.uniforms.uProgress as { value: number };
      tween = gsap.to(progress, {
        value: 1,
        // スクロール量に直接つなぐため、イージングは付けない（scrub の追従で滑らかにする）
        ease: "none",
        scrollTrigger: { trigger: el, start: "top bottom", end: "center center", scrub: 0.6 },
      });
      visibility = new IntersectionObserver(([entry]) => {
        if (entry?.isIntersecting) gsap.ticker.add(render);
        else gsap.ticker.remove(render);
      });
      visibility.observe(el);
    }

    return () => {
      visibility?.disconnect();
      gsap.ticker.remove(render);
      tween?.scrollTrigger?.kill();
      tween?.kill();
      resizeObserver.disconnect();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={host} className="relative h-[80vh]">{failed && <div className="size-full bg-surface-1" />}</div>;
}
```

- 動きを減らす設定のときは、揃った状態（`uProgress` が 1）で1フレームだけ描く。
- 粒子の数は調整欄の上限を超えない。

## 6. スクロールと uniform をつなぐ

3節と5節の例のとおり、uniform のオブジェクト（`{ value: number }`）を `gsap.to` の対象にし、`value` を動かす。

- スクロール量に直接つなぐ場合は `ease: "none"` と `scrub` を組にする（`references/motion-web.md` の4節と同じ）。
- 時間で動かす場合（ホバー、登場）は `outQuint` などのトークンのイージングを使う。
- 描画は `gsap.ticker` に登録した関数で行い、`requestAnimationFrame` を別に回さない。

## 7. 確かめ方

- スクリーンショット（`scripts/screenshot.mjs`）は WebGL の描画を待つため、`--wait 2500` 以上にする。ヘッドレスのブラウザで WebGL が使えない場合は代わりの表示が写るため、報告に「WebGL の面は代わりの表示で確認した」と書く。
- 動きを減らす設定を有効にしたブラウザで、面が止まっていることを確かめる。
- 画面外にスクロールしたとき、開発者ツールのパフォーマンスで描画が止まっていることを確かめる（できない環境では、コードで `IntersectionObserver` と ticker の登録・解除が組になっていることを確かめ、報告に書く）。
````

- [ ] **Step 2: `motion-web.md` の表に Three.js を足す**

1節の表の Lenis の行の後に足す。

```markdown
| **Three.js**（`three`） | サイト系で、記憶のフックが WebGL の演出である場合だけ。書き方は `references/webgl.md` | アプリ系。フックでない装飾。React Three Fiber と drei は使わない |
```

6節の表の Lenis の行の後に足す。

```markdown
| Three.js | 設定が有効なら1フレームだけ描いて止める（`references/webgl.md` の1節） |
```

- [ ] **Step 3: `web/SKILL.md` と `mode-site.md` に読む指示を足す**

`web/SKILL.md` の手順4の箇条「動きを付けるときは…」の後に足す。

```markdown
- コンセプトの記憶のフックが WebGL の演出である場合だけ、`references/webgl.md` を読む。`three` だけを使い、同ファイルの1節の決まりをすべて守る。
```

`mode-site.md` の6節の箇条の末尾に足す。

```markdown
- WebGL の演出は、記憶のフックそのものである場合だけ使う（`references/webgl.md`）。最初の画面の背景に1つ置き、見出しと本文は HTML の文字で上に重ねる。
```

Task 4 の傾向に WebGL の使い方の傾向があれば、その番号を引用して1文足す（例：「観察した N 件中 M 件が WebGL を最初の画面の背景にだけ使っていた（`references/observations/site.md` の傾向 X）」）。

- [ ] **Step 4: X22 を足す**

`anti-patterns.md` の X21 の後（`---` の前）に足す。

```markdown
### X22 記憶のフックと結び付かない定番の WebGL の演出

- 禁止事項：コンセプトの記憶のフックと関係なく、揺れ続ける3D の球体、マウスの位置に付いてくる粒子、画面全体を覆う虹色のグラデーションの面、回り続ける3D の文字を置く。
- 理由：WebGL を使ったページの定番の見た目であり、どのサイトにも同じものが置ける。重さと電池の消費に見合う意味がない。
- 代わりに：WebGL は記憶のフックそのものである場合だけ使い、色はトークンの2色までにする。動きはスクロールやホバーなど利用者の操作とつなげ、何もしていないときは静かにする。方法は媒体別スキルに従う（web は `../web/references/webgl.md`）。
- 検出：自己批評
```

- [ ] **Step 5: 検査してコミットする**

```bash
node tools/check-recipes.mjs && node tools/check-skills.mjs && node --test "tests/**/*.test.mjs"
git add skills/web/references/webgl.md skills/web/references/motion-web.md skills/web/SKILL.md skills/web/references/mode-site.md skills/design-core/references/anti-patterns.md
git commit -m "feat: web に素の Three.js による WebGL の型と、禁止事項 X22 を追加する"
```

Expected: `0 件の型エラー`、`レシピの検査に合格した`、`検査に合格した`、テストはすべて PASS。型エラーが出たら `node_modules/@types/three/` の定義を読んでコード例を直す。

---

### Task 9: 書体の配信元を広げ、組み合わせ表を作り直す

**Files:**
- Modify: `skills/design-core/references/typography-ja.md`（冒頭、調整欄、2.2節、3節の全表）
- Modify: `skills/web/references/tokens-tailwind.md`（自前配信の例を足す場合のみ）

**Interfaces:**
- Consumes: `observations/site.md` の書体の配信元の傾向（Task 4）
- Produces: 3節の各表に「配信元」の列。既存の記号（S1 など）は振り直さない。新しい組は各節の末尾に続きの記号で足す。

- [ ] **Step 1: 候補の書体を確かめる**

候補（ここに挙げたものは未確認であり、確かめて通ったものだけを使う）：

- Fontshare：Satoshi、General Sans、Switzer、Cabinet Grotesk、Clash Display、Clash Grotesk、Gambetta、Zodiak、Erode、Sentient、Boska、Chillax、Panchang、Supreme、Tanker
- OFL の欧文（自前配信）：Velvetyne と Collletttivo の配布物から、Task 4 で傾向が見られた分類（コントラストの強いセリフ、幅の狭いグロテスクなど）に合うもの
- OFL の和文（自前配信）：LINE Seed JP、源暎ちくご、源暎こぶり明朝
- Task 4 の観察で使われていた無料・OFL の書体

Fontshare は次で確かめる（200 で、返った CSS に `font-weight: <ウェイト>` が含まれれば配信されている）。

```bash
for f in satoshi general-sans switzer cabinet-grotesk clash-display gambetta zodiak erode sentient boska; do
  printf '%s ' "$f"; curl -s "https://api.fontshare.com/v2/css?f[]=${f}@400,700&display=swap" | rg -c 'font-weight' || echo 0
done
```

Fontshare のライセンス（個人・商用で無料。再配布の条件）を WebFetch で `https://www.fontshare.com/licenses` から読み、Step 3 の注意書きに要点を書く。OFL の書体は、配布元のページかリポジトリで、ライセンスが SIL Open Font License であることと、使うウェイトのファイルがあることを WebFetch で確かめる。確かめられなかった書体は使わない。

- [ ] **Step 2: 冒頭と調整欄を書き換える**

冒頭の「ここに載せるフォントは、すべて Google Fonts で配信されている。…」を次に置き換える。

```markdown
ここに載せるフォントは、Google Fonts、Fontshare、OFL（SIL Open Font License）で配られているフォントの自前配信、の3つの配信元のどれかから使える。表の「配信元」の列で区別し、読み込み方は2.2節に従う。有料のフォントは載せない。
```

調整欄の表に行を足す。

```markdown
| 印象を決めきれない場合の配信元 | Google Fonts（読み込みが最も簡単なため） |
| 和文の自前配信 | 見出しにだけ使う。本文の和文は Google Fonts から読み込む（和文のフォントファイルは1ウェイトで数 MB あり、本文に使うと最初の表示が遅れる） |
```

調整欄の追加の手順3を次に置き換える。

```markdown
3. 追加する前に、配信元ごとに次を確かめる。
   - Google Fonts：`https://fonts.googleapis.com/css2?family=<名前の空白を+に置換>:wght@<ウェイト>` が 200 を返せば配信されている。存在しないウェイトは 400 を返す。
   - Fontshare：`https://api.fontshare.com/v2/css?f[]=<スラッグ>@<ウェイト>&display=swap` が 200 を返し、CSS に `font-weight: <ウェイト>` が含まれれば配信されている。
   - OFL の自前配信：配布元でライセンスが SIL Open Font License であることと、使うウェイトのファイル（できれば woff2）があることを確かめる。
```

- [ ] **Step 3: 2.2節「読み込み」を配信元ごとに書き分ける**

既存の箇条を「#### Google Fonts」の下に移し、その後に次を足す。

````markdown
#### Fontshare

`<head>` に1行で読み込む。ウェイトは表に書いたものだけを指定する。

```html
<link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=satoshi@400,700&display=swap" />
```

- Fontshare は個人・商用とも無料で使えるが、フォントファイルの再配布には条件がある。ファイルをリポジトリに含めず、配信の URL から読み込む。（Step 1 で読んだライセンスの要点に合わせてこの文を直す）

#### OFL のフォントの自前配信

1. 配布元から woff2（なければ ttf）を取得し、生成するプロジェクトの `public/fonts/<書体名>/` に置く。同じ場所にライセンスの文書（`OFL.txt`）を置く。
2. `@font-face` を最初の CSS（`references/stack.md` の2節）に書く。

```css
@font-face {
  font-family: "LINE Seed JP";
  src: url("/fonts/line-seed-jp/LINESeedJP-Bold.woff2") format("woff2");
  font-weight: 700;
  font-display: swap;
}
```

3. 最初の画面の見出しに使う書体は、`<link rel="preload" href="/fonts/…woff2" as="font" type="font/woff2" crossorigin>` で先に読み込む。
4. 和文の自前配信は見出しにだけ使う（調整欄）。
````

（`font-family` の名前とファイル名は、Step 1 で確かめた実際の配布物に合わせる。LINE Seed JP を確かめられなかった場合は、確かめられた OFL の書体に差し替える。）

- [ ] **Step 4: 組み合わせ表に配信元の列と新しい組を足す**

3節の冒頭の説明に「表の『配信元』の列は、見出しと本文の書体の配信元である（G：Google Fonts、F：Fontshare、O：OFL の自前配信）」を足す。各節のフォントの表の「合う場面」の前に「配信元」の列を足し、既存の行は「G」とする。

各印象（静か、精密、遊びがある、力強い、やわらかい、編集的）の表の末尾に、Step 1 で確かめた書体を使った組を1〜2行ずつ足す。各組は、見出しか本文のどちらかに F または O の書体を含める。字間・行間の表にも同じ記号の行を足す（調整欄の追加の手順2）。組を選ぶときは、Task 4 の傾向（書体の分類、太さ、大きな見出しの字間）を根拠にし、コミットメッセージの本文に「新しい組の根拠：傾向 N」と書く。

主役にしない書体（調整欄）を見出しや本文の先頭に置かない。

- [ ] **Step 5: トークンの定義例を確かめる**

`tokens-tailwind.md` の `--font-display` などの定義例は S1（Google Fonts）のままでよい。自前配信の組を選んだときの書き方が `typography-ja.md` の2.2節にあることを、`tokens-tailwind.md` の該当箇所（`font-family` は欧文、和文、総称ファミリーの順に…の箇条）に1文足す：「Fontshare と自前配信の書体の読み込み方は `../design-core/references/typography-ja.md` の2.2節に従う。」

- [ ] **Step 6: 検査してコミットする**

```bash
node tools/check-skills.mjs && node tools/check-recipes.mjs
git add skills/design-core/references/typography-ja.md skills/web/references/tokens-tailwind.md
git commit -m "feat: 書体の配信元を Fontshare と OFL の自前配信に広げ、組み合わせ表に新しい組を足す"
```

---

### Task 10: 全体の検証

**Files:**
- 変更なし（問題が見つかった場合は、その Task のファイルを直して別のコミットにする）

- [ ] **Step 1: 自動の検査をすべて実行する**

```bash
node --test "tests/**/*.test.mjs"
node tools/check-recipes.mjs
REFERENCE_DENYLIST=$SCRATCH/reference-denylist.txt node tools/check-skills.mjs
claude plugin validate .
```

Expected: すべて合格。

- [ ] **Step 2: 実際の生成で確かめる**

スクラッチ領域に空のディレクトリ `$SCRATCH/gen-test/` を作り、その中でサブエージェント（general-purpose）にこのリポジトリのスキル（`skills/design-core/SKILL.md` と `skills/web/SKILL.md` を読むよう指示）を使わせ、次の2つの依頼を順に与える。

1. 「写真家のポートフォリオサイトを作って」（「おまかせ」なし）：案 2〜3 個と技術スタックの提案が1回のメッセージで出て、コードを書かずに止まることを確かめる。サブエージェントは質問に答える人がいない扱いになるため、`concept-brief.md` の5節の「質問しても答える人がいない場合は『おまかせ』と同じ」が働くかどうかも確かめる。止まらずに進んだ場合は、その振る舞いが5節の決まりどおりか（理由を添えて宣言しているか）を確かめる。
2. 「写真家のポートフォリオサイトを作って。最初の画面に WebGL のシェーダーの面を置いて。おまかせで」：質問せずに進み、`webgl.md` の1節の決まり（7項目）をすべて満たすコードが出ることを、生成物を読んで1項目ずつ確かめる。`node skills/web/scripts/lint-design.mjs $SCRATCH/gen-test/<生成物>/src` の違反がゼロであることを確かめる。可能なら `screenshot.mjs` で PC 幅とスマートフォン幅を撮り、面か代わりの表示が出ていることを Read で確かめる。

確かめた結果（満たした項目、満たさなかった項目）をチャットで報告する。満たさなかった項目は、該当する資料の書き方を直して再度確かめる（最大2周）。

- [ ] **Step 3: 履歴の匿名化を確かめる**

```bash
git log --all -p | rg -i -F -f $SCRATCH/reference-denylist.txt; echo "exit=$?"
git log --all --format='%B' | rg -i -F -f $SCRATCH/reference-denylist.txt; echo "exit=$?"
```

Expected: どちらも `exit=1`（一致なし）。一致した場合は、まだ push していなければ該当のコミットを直し、push 済みならスキル作者に報告して対応を相談する。
