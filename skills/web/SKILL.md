---
name: web
description: React と Tailwind CSS（v4）で、AI 感のない Web サイトと Web アプリの UI を作るときに使う。ポートフォリオ、企業サイト、LP などのサイト系と、ダッシュボード、ツール、設定画面、管理画面などのアプリ系を画面ごとに判定し、コンセプトの宣言、@theme のトークン、React Aria Components による部品のレシピ、禁止パターンの自動チェック、PC 幅とスマートフォン幅のスクリーンショットによる自己批評までを手順として定める。最初に design-core スキルを読む。English keywords - web design, landing page, portfolio, dashboard, web app UI, React, Tailwind, component.
---

# web

React ＋ Tailwind CSS（v4）＋ React Aria Components で、Web のサイトとアプリの画面を作る手順である。共通の思想は `../design-core/SKILL.md` にあり、このファイルはそれを Web で実行する手順を定める。

- 下の6つの手順を順に行う。references は最初にすべて読まず、各手順に書かれたファイルだけを、その手順に来たときに読む。
- パスはこのファイルのあるディレクトリ（以下「スキルのディレクトリ」）を基準にしている。
- 指示が食い違ったときは、プロンプトの指示 ＞ ユーザーの調整欄 ＞ 各 references の「スキル作者の調整欄」の順に従う。

## 手順1 読み込み

1. `../design-core/SKILL.md` を読む。
2. ユーザーの調整欄を、`../design-core/SKILL.md` の2節に書かれた場所から探して読む。見つからない場合と、見出しの下が空の項目は「好みなし」として扱う。

## 手順2 コンセプトを決める

コードを1行でも書く前に行う。読むファイル：`../design-core/references/concept-brief.md`

1. 「誰に」「どんな印象を」「何で記憶に残すか」の3行を書く。
2. 画面ごとにサイト系かアプリ系かを判定する。判定の問いは「その画面は、一度見てもらうことが目的か（サイト系）、繰り返し操作されることが目的か（アプリ系）」である。紹介 LP と管理画面のように両方を含む依頼は、画面ごとに判定し、1つの画面の中で混ぜない。
3. テーマを決める。プロンプトの指定（「ダークのみ」「ライト基本」「ライトのみ」など）、ユーザーの調整欄の「テーマの既定」、既定の「ダーク基本＋ライト対応」の順に採用する。
4. `concept-brief.md` の5節の書式で利用者に宣言し、確認を待たずにそのまま進める。依頼が曖昧で3行のどれも決められない場合に限り、質問する。

以降の手順では、判定したモードに応じて次の表のファイルを読む。画面ごとにモードが違う場合は、その画面を作るときにそのモードのファイルを読む。

| | サイト系 | アプリ系 |
|---|---|---|
| 手順3で読む | `references/mode-site.md` と `references/observations/site.md` | `references/mode-app.md` と `references/observations/app.md` |
| 手順4で読む | フォーム、メニュー、ダイアログを作るときだけ `references/intuitive-ui.md` の2節、4節、7節 | `references/intuitive-ui.md` |

observations は、mode のファイルの原則と数値の根拠となる観察の記録である。原則がなぜそうなっているかを理解するために mode のファイルと組で読み、判断は mode のファイルに従う。手本ではないため、特定の実例の見た目や数値の組み合わせを再現しない。

## 手順3 トークンを決める

色、和文と欧文の組み合わせ、余白の段階、角丸、影、イージングと所要時間を、部品を作る前に Tailwind v4 の `@theme` に定義する。

読むファイル：

- `../design-core/references/anti-patterns.md`（通読し、これから決める値が禁止事項に当たらないことを確かめる）
- `../design-core/references/color.md`
- `../design-core/references/typography-ja.md`
- 手順2で判定したモードのファイルと、その根拠の観察記録（上の表）
- `references/tokens-tailwind.md`（トークン名の唯一の出典。2節の定義例を写して値だけを調整する）

決まりごと：

- トークンの名前は `tokens-tailwind.md` の1節にあるものだけを使う。新しい名前が必要なら、その形式に合わせて `@theme` に足し、報告に書く。
- テーマの構造は `tokens-tailwind.md` の3節の表に従う。「ダークのみ」「ライトのみ」でも色はトークン経由にする。部品ごとに `dark:` で色を分けない。
- Tailwind の既定値（標準パレット、`rounded-*` と `shadow-*` の既定の段階、既定のイージング）は `@theme` で消し、使わない（`tokens-tailwind.md` の4節）。

## 手順4 実装する

既存のプロジェクトがなければ、React と Tailwind CSS v4 の最小構成を用意し、手順3の `@theme` を最初の CSS に置く。部品と画面は、手順3のトークン名のクラスだけで作る。部品の土台は React Aria Components とし、アイコンは Iconify を使う。shadcn/ui の既定の見た目は使わない。

部品を作るときは、その部品のレシピだけを読む。

| 作るもの | 読むファイル |
|---|---|
| ボタン | `references/components/button.md` |
| テキスト入力、テキストエリア | `references/components/text-input.md` |
| 数値入力、数値パラメータの1行 | `references/components/number-field.md` |
| 選択欄 | `references/components/select.md` |
| チェックボックス、ラジオ、スイッチ | `references/components/checkbox-radio-switch.md` |
| タブ | `references/components/tabs.md` |
| ダイアログ | `references/components/modal.md` |
| トースト | `references/components/toast.md` |
| ツールチップ、ポップオーバー、メニュー | `references/components/tooltip-popover-menu.md` |
| スクロールする領域 | `references/components/scrollbar.md` |
| 読み込み中の表示 | `references/components/loading.md` |
| 空状態、エラー、フォーカス、無効、ホバー時だけ現れる操作 | `references/components/states.md` |
| `user-select`、コピーボタン | `references/components/selection.md` |
| アイコン | `references/components/icons.md` |

- 動きを付けるときは `references/motion-web.md` を読む。アプリ系は Motion、サイト系は GSAP（必要なら Lenis）を使い、`prefers-reduced-motion` に必ず対応する。
- 利用者が渡していないキャッチコピー、サブコピー、セクションの見出し、本文は、`references/copy.md` に従って依頼の事実から書く。書けない場所と、ボタンなどの短い文言は、`../design-core/SKILL.md` の5節に従ってダミーと分かる仮の文章にする。
- ファビコンを必ず一緒に作る。`references/favicon.md` に従い、コンセプトとトークンの色から `favicon.svg` を作って指定し、雛形のファビコンと `<title>` を置き換える。
- 生成物に作業用のファイル（スクリーンショットなど）を含めない。

## 手順5 検証する

読むファイル：`../design-core/references/critique.md`（自動チェックの違反がゼロになった後に読む）

### 5.1 自動チェック

```sh
node <スキルのディレクトリ>/scripts/lint-design.mjs <生成物のディレクトリ>
```

- `<生成物のディレクトリ>` には、`src` など生成したコードのあるディレクトリ（`index.html` があればそれも）を渡す。`node_modules`、`dist`、`build`、`.git`、`.next` は自動で除外される。
- 終了コード 0 は違反なし、1 は違反あり、2 は引数の誤りである。違反は `ファイル:行番号  ルール名  理由` の形で出る。違反がゼロになるまで直す。
- 検出するルールは `text-arrow`、`emoji-icon`、`tailwind-default-palette`、`gradient-text`、`purple-blue-gradient`、`generic-font-only`、`native-select`、`native-number-input`、`transition-all`、`default-easing`、`mono-label`、`rounded-accent-rail`、`default-favicon`、`no-reduced-motion` と、理由のない抑制コメントを報告する `suppression-without-reason` である。各ルールに対応する禁止事項は `anti-patterns.md` の「検出」欄にある。
- 抑制は、条件付き（K）の項目を条件どおりに使う場合など、機能上の理由を1文で言える場合に限る。書き方は下の「抑制コメントの置き場所」に従う。抑制したものはすべて報告に書く。

#### 抑制コメントの置き場所

抑制コメント `design-lint-disable-next-line <ルール名> -- <理由>` は、lint が報告した行番号の**すぐ上の行**に書く。抑制が効くのは次の1行だけであり、要素や宣言のまとまり全体には効かない。

| ルール | 報告される行（この行のすぐ上に書く） |
|---|---|
| `text-arrow`、`emoji-icon` | 矢印や絵文字の文字そのものがある行。複数行にわたる要素では、開始タグの行ではなく、その文字がある子の行 |
| `gradient-text`、`mono-label`、`rounded-accent-rail`（CSS） | 宣言のまとまりの `{` がある行。セレクタと `{` が同じ行ならセレクタの行、`{` だけを次の行に書いた場合はその `{` の行 |
| `gradient-text`、`purple-blue-gradient`、`mono-label`、`rounded-accent-rail`（クラス） | `className=`（または `class=`）がある行 |
| `purple-blue-gradient`（CSS） | `linear-gradient(` などのグラデーション関数がある行 |
| `default-favicon` | ファビコンの指定がない場合は `<head>` の行、雛形のファビコンを指す場合はその `<link` の行 |
| 上記以外 | 該当するクラス名、宣言、`<select`、`type="number"` がある行 |

- コメントの形式は `//`、`/* */`、`<!-- -->` のどれでもよい。JSX の子要素の中では `{/* design-lint-disable-next-line text-arrow -- 理由 */}` のように波括弧で囲む。
- `no-reduced-motion` はプロジェクト全体を見るルールであり、抑制コメントでは消えない。`motion-web.md` の6節に従って対応を書く。
- 理由（`--` の後ろ）のない抑制コメントは無効になり、それ自体が `suppression-without-reason` として報告される。

### 5.2 スクリーンショット

開発サーバーなどで画面を表示できる状態にしてから、生成物のプロジェクトのルートで実行する。`playwright` は、スキルのディレクトリに見つからなければ、実行したディレクトリのプロジェクトから読み込まれる。

```sh
node <スキルのディレクトリ>/scripts/screenshot.mjs <URL> --out <作業用ディレクトリ>
```

- 既定で PC 幅 1440px とスマートフォン幅 390px、`dark` と `light` の両テーマを撮り、`<作業用ディレクトリ>/<幅>-<テーマ>.png` に保存する。画面の高さは全体（フルページ）である。
- テーマは、手順2で決めた対応テーマだけを `--themes` で指定する（例：「ダークのみ」なら `--themes dark`）。幅は変えない。
- `<URL>` にはローカルの HTML ファイルのパスや、`localhost:5173` のようなホストとポートも渡せる（後者は `http://` を補う）。画面が複数あるときは、画面ごとに別の作業用ディレクトリへ撮る。
- 撮影の前に、フォントの読み込みを待ち、ページの下端までスクロールして戻り（スクロールで現れる要素を表示させるため）、繰り返さないアニメーションの完了を待つ。そのうえで `--wait <ミリ秒>`（既定は 1500）だけ待ってから撮る。入場の動きが長いページで途中の状態が写る場合は、`--wait` を増やして撮り直す。
- `<作業用ディレクトリ>` は生成物のリポジトリの外（一時ディレクトリなど）に置く。スクリーンショットをコミットしない。
- 撮った画像は、Read ツールなどで実際に開いて見る。

**撮れなかった場合**（`playwright を読み込めなかった`、`ブラウザを起動できませんでした`、`ページを開けませんでした` などで終了コード 1 になった場合、または画面を表示するサーバーを起動できない場合）：

1. 「ブラウザを起動できませんでした」の場合、手元に Chromium の実行ファイルがあれば、環境変数で場所を指定して一度だけ撮り直す：`CHROMIUM_PATH=<実行ファイルのパス> node <スキルのディレクトリ>/scripts/screenshot.mjs <URL> --out <作業用ディレクトリ>`。撮れたら通常どおり進める。
2. それでも撮れなければ、撮れたことにしない。撮れなかった理由（エラーメッセージ）を報告にそのまま書く。
3. 利用者の許可なく `playwright` やブラウザを導入しない。導入方法はリポジトリの README にあると報告で伝える。
4. 代わりに、自動チェックとコードの読み直しで検証する。5.3 の自己批評は、各項目をコード（クラス、トークンの値、レイアウトの指定）から確認し、画像を見ていない項目であることを報告に書く。

### 5.3 自己批評（最大2周）

`critique.md` の C1〜C12 に、撮った画像だけを見て順に答える。

1. 不合格の項目を直す。
2. 直したら 5.1 の自動チェックを再実行し、5.2 のスクリーンショットを撮り直す。ここまでで1周とする。
3. 2周目も同じ手順で行う。
4. **2周で止める。** 3周目は行わない。残った問題は直さず、手順6で報告する。

## 手順6 報告する

最後に、次の形式で報告する。

```
## コンセプト
- 誰に：（1文）
- どんな印象を：（形容詞2〜3個）
- 何で記憶に残すか：（要素を1つ）
- 種類：サイト系／アプリ系（画面ごとに異なる場合は画面名と種類）
- テーマ：（例：ダーク基本＋ライト対応）

## 実施した検証
- 自動チェック：違反 0 件（対象：<ディレクトリ>）。抑制コメント：なし／<ファイル:行 ルール名 理由>
- ファビコン：作ったファイル（例：favicon.svg、apple-touch-icon.png）。作らなかったものがあれば、その理由
- スクリーンショット：1440px・390px × dark・light（撮れなかった場合は「撮れなかった」と書き、エラーメッセージと代わりに行った確認を書く）
- 自己批評：<1 または 2> 周。直した項目：<C 番号と内容>
- 条件付き（K）・要注意（W）の項目を使った場合：<番号と理由>

## 直しきれなかった点
- <C 番号>：何が問題で、なぜ直しきれなかったか（なければ「なし」）
```
