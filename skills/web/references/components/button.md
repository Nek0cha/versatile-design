# ボタン

ボタンを作る段階で読む。トークンの名前は `references/tokens-tailwind.md` だけを出典とし、色の使い方は `../design-core/references/color.md` の1節と2節、押下の反応は `references/intuitive-ui.md` の2.1節に従う。

## 目的

- 押せることが一目で分かり、押した瞬間に反応し、押した結果がラベルから予測できるボタンを作る。
- 主要、副次、危険の3種類で優先度と危険度を伝える。ボタンの種類はこの3種類から増やさない（`references/intuitive-ui.md` の3.1節）。

## 守ること

- 3種類の見た目を次のように分ける。
  - **主要**：その領域で最も押してほしい操作1つだけに使う。明暗の反転（`bg-text-strong`、`text-surface-0`）か、アクセントの塗り（`bg-accent`、`text-accent-ink`）のどちらかにし、どちらを使うかは画面全体で統一する。反転を選んだ場合、アクセントは選択中と肯定的な状態にだけ使う（`../design-core/references/color.md` の2節）。
  - **副次**：透明な面に、操作できる部品の枠（`border-line-control`）だけを付ける。
  - **危険**：削除など戻せない操作のラベルを持つボタンだけに使う。通常時は危険の色（`--color-danger`）を文字と枠にだけ使い、面は塗らない。面を塗るのは確認のダイアログの中だけであり、その場合の文字は `text-danger-ink` にする。
- 押下中は `scale(0.97)` に縮め、`--duration-fast`（120ms）と `--ease-out-quint` で戻す。処理の完了を待たずに、押した時点で反応させる。
- 読み込み中は React Aria の `isPending` を使い、二重に押せないようにする。ボタンの幅を変えず、ラベルを残したまま、先頭のアイコンの場所に進捗の印を出す。印だけに置き換えて、何の処理中か分からなくしない。
- アイコンは Iconify の SVG を使い、ラベルと組にする。アイコンには `aria-hidden` を付ける。アイコンだけのボタンには `aria-label` を付ける。
- ボタンには `user-select: none`（`select-none`）を付ける。連打したときに文字が選択されて反転するのを防ぐ。
- フォーカスリングはアクセントの 2px の線を `outline-offset: 2px` で付け、キーボード操作のとき（`data-focus-visible`）だけ表示する。
- 動きを減らす設定のときは縮めず、色の変化だけで押下を伝える。
- ラベルは結果を表す動詞にし（「保存する」「3件を削除」）、別の画面やダイアログが開くものは末尾に「…」を付ける。

## やってはいけないこと

- 危険な操作のボタンを、通常時に危険の色で塗ること。目立つボタンは読まずに押される（`references/intuitive-ui.md` の7.1節）。
- 主要の見た目のボタンを、1つの領域に2つ以上置くこと。大きさだけで優先度を付けること。
- 読み込み中にラベルを消してスピナーだけにすること、幅が変わって隣の部品がずれること。
- 文字の矢印（「次へ →」）や絵文字をアイコンの代わりに使うこと（`../design-core/references/anti-patterns.md` の X6、X10）。
- `transition-all`、既定のイージング、ボタンごとに違う角丸や影を付けること。ボタンは浮いていないため、高さを表す影（`shadow-float`）を付けない。装飾としてのぼかさない、ずらした影（`../design-core/references/anti-patterns.md` の K3、`shadow-offset`）だけは、K3 の条件どおり（主にサイト系、1ページで1つの形）なら付けてよい。
- 「OK」「はい」「実行」のような、押した結果が分からないラベル。

## コード例

3種類のボタンと、押下・フォーカス・無効・読み込み中の状態をまとめた部品である。

```tsx
import type { ReactNode } from "react";
import { Button as AriaButton, type ButtonProps as AriaButtonProps } from "react-aria-components";
import { Icon } from "@iconify/react";
import { motion, useReducedMotion } from "motion/react";

type Variant = "primary" | "primary-accent" | "secondary" | "danger";

// 主要は "primary"（明暗の反転）か "primary-accent"（アクセントの塗り）のどちらかに画面全体で統一する
const variants: Record<Variant, string> = {
  primary: "bg-text-strong text-surface-0 data-hovered:opacity-90",
  "primary-accent": "bg-accent text-accent-ink data-hovered:opacity-90",
  secondary: "border border-line-control text-text data-hovered:bg-surface-2 data-pressed:bg-surface-3",
  // 通常時は文字と枠だけに危険の色を使う。面を塗るのは確認のダイアログの中だけ
  danger: "border border-danger text-danger data-hovered:bg-surface-2 data-pressed:bg-surface-3",
};

const base = [
  "inline-flex h-9 select-none items-center gap-2 rounded-md px-3 font-body text-sm",
  "transition-[background-color,opacity,scale] duration-(--duration-fast) ease-out-quint",
  "data-pressed:scale-[0.97] motion-reduce:data-pressed:scale-100",
  "data-focus-visible:outline-2 data-focus-visible:outline-offset-2 data-focus-visible:outline-accent",
  "data-disabled:opacity-50 data-pending:cursor-progress",
].join(" ");

// 処理中の印。ラベルは残し、先頭のアイコンと同じ大きさの場所に出すため、ボタンの幅は変わらない
function PendingMark() {
  const reduce = useReducedMotion();
  return (
    <motion.span
      aria-hidden
      className="inline-flex size-4"
      animate={reduce ? { opacity: [1, 0.4, 1] } : { rotate: 360 }}
      transition={{ duration: reduce ? 1.2 : 0.9, ease: [0.76, 0, 0.24, 1], repeat: Infinity }}
    >
      <Icon icon="ph:circle-notch-bold" className="size-4" />
    </motion.span>
  );
}

// 読み込み中になりうるボタン（isPending を渡すもの）は、印を出す場所としてアイコンを必ず持つ。
// アイコンのないボタンに印を足すと、その分だけ幅が変わるためである
type ButtonProps = Omit<AriaButtonProps, "children" | "className" | "isPending"> & {
  variant?: Variant;
  children: ReactNode;
} & ({ icon?: string; isPending?: never } | { icon: string; isPending: boolean });

export function Button({ variant = "secondary", icon, isPending, children, ...props }: ButtonProps) {
  return (
    <AriaButton {...props} isPending={isPending} className={`${base} ${variants[variant]}`}>
      {isPending ? <PendingMark /> : icon ? <Icon icon={icon} aria-hidden className="size-4" /> : null}
      <span>{children}</span>
    </AriaButton>
  );
}

export function PublishActions({ saving, onPublish }: { saving: boolean; onPublish: () => void }) {
  return (
    <div className="flex items-center gap-2">
      {/* 危険な操作は、よく使う操作から離して左端に置く */}
      <div className="mr-auto">
        <Button variant="danger" icon="ph:trash">
          下書きを削除…
        </Button>
      </div>
      <Button variant="secondary" icon="ph:floppy-disk">
        下書きに保存
      </Button>
      <Button variant="primary" icon="ph:paper-plane-tilt" isPending={saving} onPress={onPublish}>
        公開する
      </Button>
    </div>
  );
}
```

- `isPending` を渡すボタンは、型でアイコンを必須にしている。印はアイコンと同じ 16px の場所に入れ替わるため、読み込み中になっても幅が変わらない。
- `isPending` の間、React Aria はボタンの押下を無効にし、`data-pending` を付け、読み上げにも処理中であることを伝える。`isDisabled` と違ってフォーカスは残る。
- 処理中の印を回す動きは、減速と加速を繰り返すカーブ（`--ease-in-out-quart` と同じ値）にする。`linear` で回し続けない（`../design-core/references/anti-patterns.md` の X13）。動きを減らす設定のときは回さず、不透明度だけを変える。
- 0.3秒未満で終わる処理では印を出さない。遅れて出す作り方は loading.md のレシピに従う。

## 確認方法

スクリーンショットと実際の操作で、次の点を見る。

1. 1つの領域に、主要の見た目のボタンが1つだけあるか。主要に反転を選んだ画面で、アクセントの塗りのボタンが混ざっていないか。
2. 危険のボタンが、通常時に面を塗られていないか。よく使う操作の隣に置かれていないか。
3. 押した瞬間に縮み、離すとすぐ戻るか。動きを減らす設定のとき（開発者ツールで `prefers-reduced-motion: reduce` を有効にする）、縮まずに色だけが変わるか。
4. 読み込み中にボタンの幅が変わらず、ラベルが読めるか。連打しても処理が二重に走らないか。
5. ボタンを連打したりドラッグしたりしても、ラベルが選択されて反転しないか。
6. Tab で移動したときだけフォーカスリングが出て、マウスで押したときには出ないか。
7. ダークとライトの両方で、主要のボタンの文字が読めるか（4.5:1 以上）。
