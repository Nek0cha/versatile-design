# アイコン

アイコンを選ぶ段階と、ボタンやラベルにアイコンを置く段階で読む。トークンの名前は `references/tokens-tailwind.md` だけを出典とし、アイコンの大きさと押せる範囲は `references/mode-app.md` の調整欄、動きは `references/motion-web.md` に従う。

## 目的

- 線の太さと形の揃ったアイコンで、画面全体の手触りを揃える。
- アイコンの意味を、ラベルかツールチップで必ず言葉にする。
- アイコンの小さな動きを、状態の変化を伝える要所だけに使う。

## 守ること

### 使い方

- アイコンは Iconify の SVG を `@iconify/react` の `Icon` で描画する。`icon` に「アイコンセットの接頭辞:名前」を渡す（`ph:trash`）。大きさは `size-4` などのクラスで、色は `currentColor` を継ぐため文字の色のクラス（`text-text-muted`）で決める。
- `Icon` は、既定ではアイコンのデータを Iconify の公開 API から実行時に取得する。製品では、使うアイコンだけを `@iconify-icons/<接頭辞>` から1つずつ読み込み、`addIcon` で登録してから描画する。通信が要らなくなり、表示までの一瞬の空白もなくなる。描画する側は `icon="ph:trash"` の書き方のまま変えなくてよい。
- アイコンセット全体（`@iconify-json/<接頭辞>` と `addCollection`）は登録しない。Phosphor は1セットで約 9000 個のアイコンを持ち、全体を登録すると JavaScript が数 MB 増える。
- 大きさは、密な行と小さな部品の中で 16px（`size-4`）、ツールバーで 20px（`size-5`）にする（`references/mode-app.md` の調整欄）。チェックボックスの中の印など 12px（`size-3`）の場所だけ、同じセットの太い版（`ph:check-bold`）を使い、小さくしても線が細く見えないようにする。

### アイコンセット

- 線の太さが揃ったセットを1つだけ選び、画面全体でそれだけを使う。セットを混ぜると、線の太さ、角の丸さ、余白が揃わない。
- 推奨は次のとおりである。どれも線の太さが揃っており、アプリ系でよく使う操作のアイコンが揃っている。

| セット | 接頭辞 | 向いている印象 |
|---|---|---|
| Phosphor | `ph` | 柔らかく、少し丸い。このスキルのレシピの既定 |
| Lucide | `lucide` | 細めで端正。道具らしい画面 |
| Tabler | `tabler` | やや太く、はっきりしている。情報の多い画面 |

- 同じ意味には、画面全体で同じアイコンを使う（`references/intuitive-ui.md` の1.2節）。閉じる、検索、設定、共有などは、よく知られた形を選ぶ。
- 塗りつぶしの版（`ph:*-fill`）は、選択中の表示など、状態を示す場所にだけ使う。線の版と塗りの版を同じ並びで混ぜない。

### アイコンとラベル

- アイコンはラベルと組にする。アイコンだけで意味を伝えようとしない（`../design-core/SKILL.md` の6節の6）。ラベルと組にしたアイコンには `aria-hidden` を付け、読み上げではラベルだけを読ませる。
- アイコンとラベルの間隔は、16px のアイコンで `gap-2`（8px）、狭い場所で `gap-1.5`（6px）にし、画面全体で揃える。縦の位置は `items-center` で揃える。
- アイコンだけのボタンは、ツールバーのように場所が狭く、よく知られた形のアイコンだけに使う。`aria-label` とツールチップを必ず付け、両方に同じ動詞のラベルを書く（`references/components/tooltip-popover-menu.md`）。押せる範囲は PC 幅で 28〜32px 四方、スマートフォン幅で 44px 以上にする。

### 動くアイコン

アイコンを動かすのは、次の3つの場面だけにする。どれも状態の変化か、押した結果の予告を伝えるためのものである。

| 場面 | 動き | 所要時間とイージング | 動きを減らす設定のとき |
|---|---|---|---|
| 読み込み | 処理中の印を回す（`references/components/button.md` の処理中の印） | 1周 0.9 秒、加減速のカーブで繰り返す（`references/components/loading.md` の「繰り返し続く動きの扱い」） | 回さず、不透明度だけをゆっくり変える |
| 成功 | チェックのアイコンが小さく弾んで現れる | 柔らかいばね（`--ease-spring-soft` と同じ値、240ms 前後） | 不透明度だけで現れる |
| ホバー時の矢印の移動 | 「次へ進む」リンクの矢印を、ホバーとフォーカスで 2px 右へ動かす | `--duration-fast`（120ms）、`--ease-out-quint` | 動かさない |

- 動きは Motion か CSS の `transition` で、Iconify のアイコンを包んだ要素に付ける。SVG の中に動きを持つアイコンセット（SMIL で動くもの）は使わない。SMIL の動きは `prefers-reduced-motion` で止められず、セットも混ざるためである。
- 上の3つ以外で、飾りのためにアイコンを動かさない（`references/mode-app.md` の11節）。

### 文字の矢印と絵文字の禁止

- ボタンやリンクの中に、文字の矢印（`→` `↗` `›` `»` `▼` や `&rarr;` などの文字参照）を入れない。Iconify の矢印のアイコン（`ph:arrow-right`、`ph:caret-down`）を使う（`../design-core/references/anti-patterns.md` の X10）。lint の `text-arrow` が検出する。
- 絵文字をアイコンの代わりに使わない（同 X6）。lint の `emoji-icon` が、ボタン、リンク、リストの項目の中の絵文字を検出する。
- 矢印キーなどのキーの表示も、文字の矢印ではなくアイコンで表す（`references/mode-app.md` の7節）。

## やってはいけないこと

- 2つ以上のアイコンセットを混ぜること。線の版と塗りの版を同じ並びで混ぜること。
- アイコンだけのボタンに `aria-label` かツールチップを付け忘れること。
- ラベルと組にしたアイコンに `aria-hidden` を付けず、読み上げでアイコンの名前とラベルを二重に読ませること。
- 文字の矢印、絵文字、記号（「✓」「×」）をアイコンの代わりに使うこと。
- 色の点（「●」や丸い要素）を状態のアイコンの代わりにして、状態の文字と並べること（`../design-core/references/anti-patterns.md` の X18）。異常な状態は、意味の分かるアイコン（警告、停止など）＋文字で示し、状態の色はそのアイコンと文字に付ける。アバターに重ねる在席の点は例外である。
- アイコンにアクセントの色を付けること。アクセントは、選択中や完了などの状態を示す場合だけにする（`../design-core/references/color.md` の1節）。
- すべてのアイコンをホバーで動かすこと。SMIL で動くアイコンを使うこと。
- 製品で、アイコンを毎回 Iconify の公開 API から取得したままにすること。アイコンセット全体を `addCollection` で登録すること。

## コード例

使うアイコンの登録である。1つのファイル（`icons.ts`）にまとめ、アプリの入口で1回だけ読み込む。

```tsx
// icons.ts：使うアイコンだけを1つずつ入れる（npm install @iconify-icons/ph）
import { addIcon } from "@iconify/react";
import shareNetwork from "@iconify-icons/ph/share-network";
import link from "@iconify-icons/ph/link";
import arrowRight from "@iconify-icons/ph/arrow-right";
import checkCircle from "@iconify-icons/ph/check-circle";

// 登録したアイコンは、通信せずにすぐ描画される。名前は描画する側の icon="ph:…" と同じにする
addIcon("ph:share-network", shareNetwork);
addIcon("ph:link", link);
addIcon("ph:arrow-right", arrowRight);
addIcon("ph:check-circle", checkCircle);
```

- アイコンは1つずつ別のファイルになっているため、ビルドには登録したアイコンだけが入る。
- 画面に新しいアイコンを足したら、このファイルにも足す。登録を忘れたアイコンは、公開 API から取得されるため開発中は表示されてしまい、気付きにくい。確認方法の4で確かめる。

アイコンとラベルの組と、アイコンだけのボタンである。

```tsx
import { Button, Tooltip, TooltipTrigger } from "react-aria-components";
import { Icon } from "@iconify/react";

const ring = "data-focus-visible:outline-2 data-focus-visible:outline-offset-2 data-focus-visible:outline-accent";

export function ShareActions({ onShare, onCopyLink }: { onShare: () => void; onCopyLink: () => void }) {
  return (
    <div className="flex items-center gap-2">
      {/* アイコンとラベルの組。アイコンは aria-hidden にし、ラベルだけを読ませる */}
      <Button onPress={onShare} className={`inline-flex h-9 select-none items-center gap-2 rounded-md border border-line-control px-3 text-sm text-text data-hovered:bg-surface-2 data-pressed:bg-surface-3 ${ring}`}>
        <Icon icon="ph:share-network" aria-hidden className="size-4" />
        <span>共有…</span>
      </Button>
      {/* アイコンだけのボタン。aria-label とツールチップに同じ動詞を書く */}
      <TooltipTrigger delay={500}>
        <Button aria-label="リンクをコピー" onPress={onCopyLink} className={`grid size-8 select-none place-items-center rounded-md text-text-muted data-hovered:bg-surface-2 data-hovered:text-text data-pressed:bg-surface-3 ${ring}`}>
          <Icon icon="ph:link" aria-hidden className="size-5" />
        </Button>
        <Tooltip offset={6} className="rounded-sm border border-line bg-surface-2 px-2 py-1 text-xs text-text shadow-float">
          リンクをコピー
        </Tooltip>
      </TooltipTrigger>
    </div>
  );
}
```

ホバー時に矢印が動くリンクと、成功のときに弾んで現れるチェックである。

```tsx
import { Link } from "react-aria-components";
import { Icon } from "@iconify/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

// ホバーとキーボードのフォーカスで、矢印を 2px 右へ動かす。動きを減らす設定では動かさない
export function MoreLink({ href, children }: { href: string; children: string }) {
  return (
    <Link
      href={href}
      className="group inline-flex select-none items-center gap-1.5 rounded-sm text-sm text-text-muted data-hovered:text-text data-focus-visible:outline-2 data-focus-visible:outline-offset-2 data-focus-visible:outline-accent"
    >
      <span>{children}</span>
      <Icon
        icon="ph:arrow-right"
        aria-hidden
        className="size-4 transition-transform duration-(--duration-fast) ease-out-quint motion-safe:group-data-hovered:translate-x-0.5 motion-safe:group-data-focus-visible:translate-x-0.5"
      />
    </Link>
  );
}

// 保存が終わったときだけ現れる印。柔らかいばねで小さく弾む。動きを減らす設定では不透明度だけ
export function SavedMark({ saved }: { saved: boolean }) {
  const reduce = useReducedMotion();
  return (
    <span className="inline-flex h-5 items-center gap-1.5 text-xs text-text-muted" aria-live="polite">
      <AnimatePresence initial={false}>
        {saved && (
          <motion.span
            key="saved"
            className="inline-flex items-center gap-1.5"
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.12, ease: [0.22, 1, 0.36, 1] } }}
            transition={reduce ? { duration: 0.12, ease: [0.22, 1, 0.36, 1] } : { type: "spring", visualDuration: 0.24, bounce: 0.15 }}
          >
            {/* 完了は肯定的な状態なので、アクセント（success）を使ってよい */}
            <Icon icon="ph:check-circle" aria-hidden className="size-4 text-success" />
            <span>保存した</span>
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}
```

- 矢印の移動は 2px（`translate-x-0.5`）に留める。大きく動かすと、文字が揺れて見える。
- 移動のクラスには `motion-safe:` を付け、動きを減らす設定でないときだけ効くようにしている。移動と、その打ち消しの2つのクラスを並べると、どちらが効くかがクラスの順ではなく CSS の生成順で決まるためである。
- 保存の印は、保存の状態を対象のそばに控えめに示すものである（`references/mode-app.md` の7節）。トーストで知らせない。
- 読み込みの印の作り方は `references/components/button.md` の処理中の印に従う。

## 確認方法

スクリーンショットと実際の操作で、次の点を見る。

1. 画面のすべてのアイコンが同じセットか。線の太さと角の丸さが揃っているか。
2. アイコンだけのボタンすべてに、`aria-label` とツールチップがあるか。読み上げでラベルが二重に読まれないか。
3. ボタンやリンクに、文字の矢印や絵文字がないか（lint の `text-arrow`、`emoji-icon` が 0 件か）。
4. 通信を切った状態で再読み込みしても、すべてのアイコンが表示されるか（使うアイコンをすべて `addIcon` で登録しているか）。ビルドした JavaScript に、アイコンセット全体（`@iconify-json/`）が入っていないか。
5. 動くアイコンが、読み込み、成功、ホバー時の矢印の3つの場面だけか。動きを減らす設定のとき、移動、回転、拡大が止まるか。
6. アクセントの色のアイコンが、選択中と完了などの状態を示す場所にだけあるか。
