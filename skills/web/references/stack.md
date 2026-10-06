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

- 作り始めのコマンドは npm の形で書いている。利用者の環境やユーザーの調整欄でパッケージマネージャー（pnpm など）の指定があれば、それに置き換える。
- コード例の `"use client"` は Next.js のためのものである。Next.js 以外ではあってもなくても動くため、写したままでよい。
