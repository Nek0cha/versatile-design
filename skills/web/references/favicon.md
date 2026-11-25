# ファビコン

手順4で画面を作るときに、サイト系とアプリ系のどちらでも必ず一緒に作る。ブラウザのタブ、ブックマーク、履歴で最初に目に入る、最も小さな記憶のフックである。雛形のロゴのまま残すと、作り込んだ画面も「雛形から作っただけ」に見える（`../design-core/references/anti-patterns.md` の X21）。

## 1. 作るもの

| ファイル | 用途 | サイト系 | アプリ系 |
|---|---|---|---|
| `favicon.svg` | ブラウザのタブ、ブックマーク | 必ず作る | 必ず作る |
| `apple-touch-icon.png`（180×180px） | スマートフォンのホーム画面に追加したときのアイコン | 作る | 依頼に必要な場合だけ |

- `apple-touch-icon.png` は、SVG を PNG に書き出せる環境（Playwright など）がある場合に作る。書き出せない場合は作らず、報告に書く。
- `favicon.ico` は作らない。現在の主要なブラウザは SVG のファビコンを表示できる。

## 2. 形と色

1. コンセプトの「何で記憶に残すか」か、画面の中で繰り返し使う形から作る。画面と無関係な記号を新しく足さない。
2. 色はトークンの値（アクセントカラーと、背景か文字の色）だけを使う。使う色は2色までにする。
3. 16px に縮めても形が分かるようにする。
   - 要素は1〜2個にする。細部、影、グラデーションは入れない。
   - `viewBox="0 0 32 32"` で描き、線の太さは 3 以上、隙間は 2 以上にする。
   - 余白は四辺に 2 程度だけ取り、形を枠いっぱいに使う。
4. 文字を使う場合は1〜2文字までにし、`<text>` ではなくパス（`<path>`）で描く。ファビコンの中では Web フォントが読み込まれず、利用者の環境のフォントで表示されてしまうためである。
5. 背景の形（角丸の正方形、円など）を敷く場合は、その角丸もトークンの段階に合わせる。何も考えずに「角丸の正方形にアクセントカラー、白い頭文字」にしない。これはロゴのない生成物の定番の形である。

## 3. ダークとライトのタブ

タブの背景色は、ページのテーマではなく、ブラウザと OS のテーマで決まる。背景を敷かない形は、白いタブと黒いタブの両方で見えるようにする。

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <style>
    .mark { fill: #1f2a24; }
    @media (prefers-color-scheme: dark) {
      .mark { fill: #e8efe9; }
    }
  </style>
  <path class="mark" d="M4 6h10v20H4z" />
  <path fill="#d9622b" d="M18 6h10v10H18z" />
</svg>
```

- 上の色と形は書き方の例である。値はその生成物のトークンに置き換える。
- SVG の中では CSS の変数（`var(--color-...)`）を使えないため、トークンの値をそのまま書き写す。
- 背景の形を敷く場合は、テーマによる切り替えは不要である。

## 4. 置き方

| 構成 | 置く場所 | 指定 |
|---|---|---|
| Vite（`index.html` がある） | `public/favicon.svg`、`public/apple-touch-icon.png` | `index.html` の `<head>` に下の2行を書く |
| Next.js（App Router） | `app/icon.svg`、`app/apple-icon.png` | 書かなくてよい（ファイルを置けば自動で指定される） |
| Astro | `public/favicon.svg`、`public/apple-touch-icon.png` | 共通のレイアウトの `<head>` に、Vite と同じ2行を書く |
| React Router（フレームワークモード） | `public/favicon.svg`、`public/apple-touch-icon.png` | `app/root.tsx` の `links` 関数に `{ rel: "icon", href: "/favicon.svg", type: "image/svg+xml" }` と `{ rel: "apple-touch-icon", href: "/apple-touch-icon.png" }` を足す |

```html
<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
```

- 雛形が置いたファビコン（Vite の `public/vite.svg` など）と、それを指す `<link>` は消す。
- `<title>` も同時に雛形の文字列（「Vite + React」など）から直す。

## 5. 確かめること

- 自動チェック（手順5.1）の `default-favicon` が出ていない。`index.html` に `rel="icon"` の指定がない場合と、雛形のファビコンを指している場合に検出される。
- `favicon.svg` をブラウザで直接開いて、形が崩れていない（スクリーンショットの撮影のスクリプトに、ファイルのパスを渡して撮ってもよい）。
- 報告の「実施した検証」に、作ったファイルと、作らなかったファイルとその理由を書く。

## 6. OGP 画像

公開する予定のあるサイト系の画面では、SNS で共有されたときの画像（`ogp.png`、1200×630px）もファビコンと同じ考え方で作る。依頼にない場合は作らず、作れることを報告で伝える。

### 6.1 中身

- 記憶のフックを、縮めて1枚に収める。サイトのスクリーンショットをそのまま縮めない。小さく表示されたとき、何も読めない画像になる。
- ロゴ（または名前）と、フックの縮図の2つに絞る。説明文は1行まで、または入れない。
- 部品は画面と同じものを使う。ロゴのパス、squircle の関数、変換の関数（`references/textmode.md` など）を、画像を作るスクリプトから読み込む。別に描き直すと、画面と画像で形がずれる。
- 色はトークンの値だけを使う。

### 6.2 作り方

1. Node のスクリプトで 1200×630 の SVG を組み立てる。写真は Base64 にして `<image>` で埋め込む。
2. SVG を PNG に書き出す。Playwright があればそれで撮る。macOS では `sips -s format png ogp.svg --out public/ogp.png` で書き出せる。`qlmanage -t` は正方形のサムネイルとして描くため、拡大されて切れる。使わない。
3. 書き出した PNG を Read ツールなどで開き、寸法（1200×630）と中身を確かめる。
4. スクリプトを `package.json` の `scripts` に登録し、作り直せるようにする。

### 6.3 置き方

```html
<meta property="og:type" content="website" />
<meta property="og:title" content="（サイト名）" />
<meta property="og:description" content="（1文）" />
<meta property="og:url" content="%VITE_SITE_URL%/" />
<meta property="og:image" content="%VITE_SITE_URL%/ogp.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="（画像の内容を1文で）" />
<meta name="twitter:card" content="summary_large_image" />
```

- `og:image` は絶対 URL でなければ読まれない。公開先のドメインが決まっていなければ、Vite では `.env` の `VITE_SITE_URL` に仮の値を置き、`index.html` の `%VITE_SITE_URL%` で差し込む。報告に、公開前にドメインへ書き換えることを書く。
- Next.js では `app/opengraph-image.png` を置けば自動で指定される。
