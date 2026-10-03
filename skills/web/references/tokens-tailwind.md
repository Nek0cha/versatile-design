# Tailwind のトークン

**このファイルは、トークン名の唯一の出典である。** 部品のレシピ（web スキルの references/components/ 以下に置くもの）と実装は、ここに書いた名前だけを使う。新しい名前が必要になったら、先にこのファイルに足してから使う。

トークンを決める段階で読み、実装の段階で `@theme` を書くときにもう一度読む。

- 色の原則と値は `../design-core/references/color.md` に、フォントの選び方と `font-family` の順序は `../design-core/references/typography-ja.md` に従う。角丸、影、余白の段階は `references/mode-app.md` と `references/mode-site.md` の調整欄に従う。動きの所要時間とイージングの使い分けは `references/motion-web.md` に従う。このファイルは、それらの値を Tailwind v4 のトークンとして書く方法を定める。
- 優先順位は、プロンプトの指示、`../design-core/user-preferences.md`、各資料の「スキル作者の調整欄」の順である。下の定義例の値は調整欄の初期値を書き写したものであり、上位の指示があればそちらに差し替える。名前は差し替えない。

## 1. トークン名の一覧

Tailwind v4 では、`@theme` に書いた変数名からクラス名が作られる。`--color-surface-1` は `bg-surface-1`・`border-surface-1` に、`--color-text-muted` は `text-text-muted` になる。`text-text-muted` のように語が重なるのは、色の役割名をそのまま使うためであり、別名を作って短くしない。

### 色

役割と値は `../design-core/references/color.md` の調整欄の表に従う。部品は役割名だけを参照し、色の値を直接書かない。

| トークン | 用途 | クラスの例 |
|---|---|---|
| `--color-surface-0` | 最も奥の背景 | `bg-surface-0` |
| `--color-surface-1` | パネル、カード | `bg-surface-1` |
| `--color-surface-2` | 浮いた面、ホバー | `bg-surface-2`、`hover:bg-surface-2` |
| `--color-surface-3` | 押下中、選択中の面 | `bg-surface-3` |
| `--color-line` | 区切り線（装飾。3:1 の対象外） | `border-line`、`divide-line` |
| `--color-line-strong` | 強い区切り線（装飾。3:1 の対象外） | `border-line-strong` |
| `--color-line-control` | 操作できる部品の枠（3:1 以上）。`--color-text-faint` の別名 | `border-line-control` |
| `--color-text-faint` | 無効、プレースホルダー | `text-text-faint`、`placeholder:text-text-faint` |
| `--color-text-muted` | 補足、説明、ラベル | `text-text-muted` |
| `--color-text` | 本文 | `text-text` |
| `--color-text-strong` | 見出し、主要な値、反転した主要ボタンの面 | `text-text-strong`、`bg-text-strong` |
| `--color-accent` | 主要な操作、選択中、肯定的な状態（`color.md` の1節の3か所だけ） | `bg-accent`、`ring-accent` |
| `--color-accent-ink` | アクセントの面の上の文字（4.5:1 以上） | `text-accent-ink` |
| `--color-danger` | エラー（危険）の文字と枠、破壊的な操作のボタン | `text-danger`、`border-danger` |
| `--color-danger-ink` | 確認のダイアログの中で危険の色を面に塗ったときの文字（4.5:1 以上） | `text-danger-ink` |
| `--color-warning` | 警告の印 | `text-warning` |
| `--color-success` | 肯定的な状態。`--color-accent` の別名であり、独自の色を持たない | `text-success` |

- `--color-success` は、`color.md` の「成功専用の緑は原則として作らない」に従い、アクセントを指す別名として置く。部品のコードで「成功」を表す意図を残すための名前である。
- `--color-line-control` と `--color-text-faint` は同じ段階を指す（`color.md` の調整欄）。値を2か所に書かず、別名にする。
- 中身の色（`color.md` の3節、K2 の条件を満たす場合のみ）は `--color-content-1` 〜 `--color-content-8` とし、必要な数だけ定義する。UI の部品には使わない。

### 角丸

| トークン | 初期値 | 用途 | 出典 |
|---|---|---|---|
| `--radius-sm` | 6px | 小さな操作部品（チェックボックス、タグ、小さなボタン） | `references/mode-app.md` の調整欄（操作部品 6〜8px） |
| `--radius-md` | 8px | ボタン、入力欄、選択欄 | 同上 |
| `--radius-island` | 10px | 島（背景から浮かせたパネルのまとまり） | 同上（島 10〜12px） |
| `--radius-lg` | 14px | メニュー、ポップオーバー、浮いたツールバー、ダイアログ | 同上（12〜16px、島より大きく） |

クラスは `rounded-sm`、`rounded-md`、`rounded-island`、`rounded-lg` になる。この4段階以外の角丸（`rounded-xl`、`rounded-[20px]` など）を使わない。丸い形が必要な場合（スイッチのつまみ、アバター）に限り `rounded-full` を使う。

### 影

| トークン | 用途 |
|---|---|
| `--shadow-float` | 浮いているもの（メニュー、ポップオーバー、ダイアログ、浮いたツールバー、トースト）専用の1種類 |

影はこれ1つだけを定義する。段階を増やさない（`references/mode-app.md` の影の節）。区切りに影を使わない。値はテーマごとに差し替えるが、名前は1つのままにする。ダークでは影がほとんど見えないため、浮いているものには `bg-surface-2` と `border border-line` も付ける（`color.md` の5節）。

### フォント

| トークン | 用途 |
|---|---|
| `--font-display` | 見出し。`typography-ja.md` の例の `--font-heading` に当たる |
| `--font-body` | 本文、UI の文字 |
| `--font-mono` | 数字、コード、ログ |

`font-family` は欧文、和文、総称ファミリーの順に書く（`typography-ja.md` の2.1節）。下の定義例の書体は、組み合わせ表の S1 を例にしたものである。

### イージングと所要時間

使い分けと調整欄は `references/motion-web.md` にある。

| トークン | 値 | 用途 |
|---|---|---|
| `--ease-out-quint` | `cubic-bezier(0.22, 1, 0.36, 1)` | 既定の減速のカーブ。登場、開閉、操作への反応 |
| `--ease-in-out-quart` | `cubic-bezier(0.76, 0, 0.24, 1)` | 画面の大きな移動、遷移 |
| `--ease-spring-soft` | `cubic-bezier(0.34, 1.3, 0.64, 1)` | わずかに行き過ぎて戻る動き。スイッチのつまみ、並び替えの着地 |
| `--duration-fast` | 120ms | 短い変化（ホバー、押下、ホバー時だけ現れる操作） |
| `--duration-base` | 180ms | 開閉、移動（メニュー、パネル、並び替え） |
| `--duration-slow` | 240ms | 大きな移動（パネル全体、画面の遷移） |
| `--duration-reveal` | 800ms | サイト系の登場 |

イージングのクラスは `ease-out-quint` のように作られる。所要時間は Tailwind の `@theme` の名前空間にないため、`:root` に変数として置き、`duration-(--duration-base)` の形で使う。

### 余白

余白の単位は 4px である（`references/mode-app.md` の調整欄）。Tailwind v4 の既定の `--spacing`（0.25rem、つまり 4px）がこの単位に当たるため、そのまま使う。`p-[13px]` のような任意の値で段階を外さない。

## 2. 定義例

既定の「ダークを基本にし、ライトにも対応する」場合の全体である。この形を写し、値だけを調整する。

```css
@import "tailwindcss";

/* Tailwind の既定値を消し、自前のトークンだけを残す */
@theme {
  --color-*: initial;
  --radius-*: initial;
  --shadow-*: initial;
  --inset-shadow-*: initial;
  --drop-shadow-*: initial;
  --text-shadow-*: initial;
  --font-*: initial;
  --ease-*: initial;
  --animate-*: initial;

  /* 色（ダーク。color.md の調整欄。グレーは色相 70、彩度 0.006） */
  --color-surface-0: oklch(0.16 0.006 70);
  --color-surface-1: oklch(0.19 0.006 70);
  --color-surface-2: oklch(0.23 0.006 70);
  --color-surface-3: oklch(0.27 0.006 70);
  --color-line: oklch(0.32 0.006 70);
  --color-line-strong: oklch(0.42 0.006 70);
  --color-text-faint: oklch(0.55 0.006 70);
  --color-text-muted: oklch(0.70 0.006 70);
  --color-text: oklch(0.87 0.006 70);
  --color-text-strong: oklch(0.96 0.006 70);
  /* アクセントの色相 155 は例。コンセプトで決める */
  --color-accent: oklch(0.78 0.13 155);
  --color-accent-ink: oklch(0.16 0.006 70);
  --color-danger: oklch(0.70 0.16 25);
  --color-danger-ink: oklch(0.16 0.006 70);
  --color-warning: oklch(0.80 0.13 80);

  /* 角丸 */
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-island: 10px;
  --radius-lg: 14px;

  /* 影（浮いているもの専用の1種類） */
  --shadow-float: 0 12px 32px -8px oklch(0 0 0 / 0.5), 0 2px 8px oklch(0 0 0 / 0.3);

  /* フォント（欧文、和文、総称ファミリーの順） */
  --font-display: "Instrument Serif", "Shippori Mincho", serif;
  --font-body: "Instrument Sans", "Zen Kaku Gothic New", sans-serif;
  --font-mono: "DM Mono", "Zen Kaku Gothic New", monospace;
  --default-font-family: "Instrument Sans", "Zen Kaku Gothic New", sans-serif;
  --default-mono-font-family: "DM Mono", "Zen Kaku Gothic New", monospace;

  /* イージング */
  --ease-out-quint: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-in-out-quart: cubic-bezier(0.76, 0, 0.24, 1);
  --ease-spring-soft: cubic-bezier(0.34, 1.3, 0.64, 1);

  /* transition クラスの既定値 */
  --default-transition-duration: 180ms;
  --default-transition-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
}

/* 別名。inline にすると、クラスが参照先の変数を直接読むため、テーマの切り替えに追従する */
@theme inline {
  --color-line-control: var(--color-text-faint);
  --color-success: var(--color-accent);
}

/* 所要時間（@theme の名前空間にないため :root に置く） */
:root {
  --duration-fast: 120ms;
  --duration-base: 180ms;
  --duration-slow: 240ms;
  --duration-reveal: 800ms;
  color-scheme: dark;
}

/* ライト：利用者が明示的に選んだ場合 */
:root[data-theme="light"] {
  color-scheme: light;
  --color-surface-0: oklch(0.985 0.006 70);
  --color-surface-1: oklch(0.965 0.006 70);
  --color-surface-2: oklch(0.94 0.006 70);
  --color-surface-3: oklch(0.91 0.006 70);
  --color-line: oklch(0.87 0.006 70);
  --color-line-strong: oklch(0.78 0.006 70);
  --color-text-faint: oklch(0.62 0.006 70);
  --color-text-muted: oklch(0.48 0.006 70);
  --color-text: oklch(0.28 0.006 70);
  --color-text-strong: oklch(0.18 0.006 70);
  --color-accent: oklch(0.52 0.15 155);
  --color-accent-ink: oklch(0.985 0.006 70);
  --color-danger: oklch(0.55 0.18 25);
  --color-danger-ink: oklch(0.985 0.006 70);
  --color-warning: oklch(0.62 0.13 75);
  --shadow-float: 0 12px 32px -8px oklch(0.2 0.01 70 / 0.18), 0 2px 8px oklch(0.2 0.01 70 / 0.08);
}

/* ライト：OS がライトで、利用者がダークを明示的に選んでいない場合（上と同じ値） */
@media (prefers-color-scheme: light) {
  :root:not([data-theme="dark"]) {
    color-scheme: light;
    --color-surface-0: oklch(0.985 0.006 70);
    --color-surface-1: oklch(0.965 0.006 70);
    --color-surface-2: oklch(0.94 0.006 70);
    --color-surface-3: oklch(0.91 0.006 70);
    --color-line: oklch(0.87 0.006 70);
    --color-line-strong: oklch(0.78 0.006 70);
    --color-text-faint: oklch(0.62 0.006 70);
    --color-text-muted: oklch(0.48 0.006 70);
    --color-text: oklch(0.28 0.006 70);
    --color-text-strong: oklch(0.18 0.006 70);
    --color-accent: oklch(0.52 0.15 155);
    --color-accent-ink: oklch(0.985 0.006 70);
    --color-danger: oklch(0.55 0.18 25);
    --color-danger-ink: oklch(0.985 0.006 70);
    --color-warning: oklch(0.62 0.13 75);
    --shadow-float: 0 12px 32px -8px oklch(0.2 0.01 70 / 0.18), 0 2px 8px oklch(0.2 0.01 70 / 0.08);
  }
}

@layer base {
  body {
    background-color: var(--color-surface-0);
    color: var(--color-text);
    font-family: var(--font-body);
  }
}
```

- `--color-*: initial;` は、Tailwind の標準パレット（`slate`、`indigo` など）と `black`、`white` をすべて消す。消すと、標準パレットのクラスを書いても CSS が生成されないため、使えば画面上ですぐ気づく。`bg-transparent` と `bg-current` は `@theme` に依存しないため残る。
- 角丸、影、フォント、イージング、`animate-*` も同じ書き方で既定値を消す。`--animate-*` の既定値には `linear` のアニメーションが含まれるため、残さない。
- `--default-font-family` には `--font-body` と同じ値を直接書く。Tailwind が `html` に当てる書体であり、`--font-*: initial;` で既定の参照先が消えるためである。
- ライトの値は2か所に同じものを書く。片方だけ直すと、OS の設定によってだけ色が変わる不具合になる。値を変えたら両方を直す。
- 純粋な黒を基本にする場合（`color.md` の4節）は、ダークの `--color-surface-0` を `oklch(0 0 0)` にし、グレーの彩度を 0 にする。

## 3. ダークとライトの切り替え

- `data-theme` 属性は `<html>` に付ける。`<html lang="ja">` と同じ要素である（`typography-ja.md` の2.1節）。
- 決まり方は次の順である。
  1. `data-theme="light"` または `data-theme="dark"` があれば、それに従う（利用者がアプリ内で選んだ値）。
  2. なければ、OS の設定（`prefers-color-scheme`）に従う。
  3. OS の設定もなければ、ダークになる。
- テーマの切り替えボタンを置く場合は、選んだ値を保存し、ページの描画より前に `<html>` へ `data-theme` を付ける。描画のあとに付けると、一瞬ダークが表示されてから切り替わる。
- 部品のコードはテーマを知らない状態にする。`dark:` や `light:` のような接頭辞で部品ごとに色を分けない（`color.md` の5節）。テーマによって変えたいものは、トークンの値として `:root[data-theme="light"]` の側に足す。

### プロンプトにテーマの指定がある場合

プロンプトの指定は、このファイルの既定より優先する。どの場合も、トークンの名前と「`@theme` に既定の値、別のブロックで差し替え」という構造は崩さない（`color.md` の5節）。

| プロンプトの指定 | `@theme` に書く値 | 差し替えのブロック | `color-scheme` |
|---|---|---|---|
| 指定なし | ダーク | ライトを `:root[data-theme="light"]` と `@media (prefers-color-scheme: light)` の2か所に書く（2節の定義例） | 既定は `dark` |
| ダークのみ | ダーク | 書かない。切り替えボタンも置かない | `dark` |
| ライト基本 | ライト | ダークを `:root[data-theme="dark"]` と `@media (prefers-color-scheme: dark)` の中の `:root:not([data-theme="light"])` の2か所に書く。OS の設定がないときはライトになり、デザインとスクリーンショットでの確認もライトを先に行う | 既定は `light` |
| ライトのみ | ライト | 書かない。切り替えボタンも置かない | `light` |

「ダークのみ」「ライトのみ」でも、色を部品に直接書かず、トークン経由にする。後からもう一方のテーマを足すときに、差し替えのブロックを足すだけで済む。

## 4. 使ってはいけないクラスと、代わりに使うもの

Tailwind の初期値（標準パレット、`rounded-*` と `shadow-*` の既定の段階、既定のイージング）は、誰が使っても同じ見た目になり、AI 感の発生源になる。2節の定義例で消したうえで、次のクラスも書かない。lint（`scripts/lint-design.mjs`）が検出するものは、その規則の名前を併記する。

| 使ってはいけないもの | 理由 | 代わりに使うもの | lint の規則 |
|---|---|---|---|
| 標準パレットのクラス（`bg-indigo-500`、`text-slate-400`、`border-zinc-800` など） | 誰が使っても同じ色になり、テーマの差し替えもできない（`anti-patterns.md` の X11） | `bg-surface-1`、`text-text-muted`、`border-line` など1節のトークン名のクラス | `tailwind-default-palette` |
| `transition-all`、`transition: all` | 意図しないプロパティまで動き、描画も重い（X14） | `transition-colors`、`transition-opacity`、`transition-transform`、`transition-[opacity,transform]` など動かすものを明示する | `transition-all` |
| `ease-in`、`ease-out`、`ease-in-out`、`ease-linear`、CSS の `ease` と `linear`、タイミング関数のない `transition` | 動きの終わり方が機械的になる（X13）。2節で既定値を消しているが、CSS に直接書けば効いてしまう | `ease-out-quint`、`ease-in-out-quart`、`ease-spring-soft`、CSS では `var(--ease-out-quint)` | `default-easing` |
| `rounded-xl`、`rounded-2xl`、`rounded-[20px]` など1節にない角丸 | 段階が増え、部品ごとに丸さがばらつく | `rounded-sm`、`rounded-md`、`rounded-island`、`rounded-lg`（丸い形だけ `rounded-full`） | — |
| `shadow-sm`、`shadow-lg`、`shadow-[...]` など `shadow-float` 以外の影 | 影の段階が増え、区切りに影を使い始める（`references/mode-app.md` の影の節） | `shadow-float`（浮いているものだけ）。区切りは明度差か `border-line` | — |
| `font-sans`、`font-serif` と、定番フォントだけの `font-family` | 定番フォントだけで組むと誰が作っても同じ印象になる（X5） | `font-display`、`font-body`、`font-mono` | `generic-font-only` |
| `animate-spin`、`animate-pulse` など既定のアニメーション | 定番の動きで、`linear` の回転も含む | 必要な動きを `references/motion-web.md` に従って作る | — |
| `duration-150` など段階にない所要時間 | 手触りが揃わない | `duration-(--duration-fast)`、`duration-(--duration-base)`、`duration-(--duration-slow)` | — |

lint が検出する使い方を、機能上の理由があって使う場合は、直前の行に `design-lint-disable-next-line <規則の名前> -- <理由>` の抑制コメントを書く（`anti-patterns.md` の「条件付き」）。理由のない抑制コメントは、それ自体が違反になる。

## 5. 使い方の例

部品はトークン名のクラスだけで書く。次は、ダークで反転した主要ボタン（`color.md` の2節）と副次ボタンの例である。

```tsx
import { Button } from "react-aria-components";

export function SaveActions() {
  return (
    <div className="flex gap-2">
      <Button className="h-9 select-none rounded-md border border-line-control px-3 font-body text-text transition-colors duration-(--duration-fast) ease-out-quint hover:bg-surface-2 data-pressed:bg-surface-3 focus-visible:outline-2 focus-visible:outline-accent">
        下書きに保存
      </Button>
      <Button className="h-9 select-none rounded-md bg-text-strong px-3 font-body text-surface-0 transition-[opacity,transform] duration-(--duration-fast) ease-out-quint hover:opacity-90 data-pressed:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
        公開する
      </Button>
    </div>
  );
}
```

- 反転した主要ボタンは `bg-text-strong` と `text-surface-0` で作る。テーマが変わると、面と文字の明暗が自動で入れ替わる。
- 浮いているものは `rounded-lg bg-surface-2 border border-line shadow-float` の組で作る。
