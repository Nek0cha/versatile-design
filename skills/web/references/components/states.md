# 部品の状態

空の画面、エラー、フォーカス、無効、ホバー時だけ現れる操作を作る段階で読む。どの部品でも状態の見せ方を揃えるための資料である（`references/mode-app.md` の2節）。トークンの名前は `references/tokens-tailwind.md` だけを出典とし、状態の伝え方の原則は `references/intuitive-ui.md` の2節に従う。

## 目的

- 利用者が「今どうなっていて、次に何をすればよいか」を、どの画面でも同じ見た目から読み取れるようにする。
- 状態を色だけで伝えず、アイコン、文字、形の変化を組み合わせる（`references/intuitive-ui.md` の2.5節）。

## 守ること

### 状態の見せ方の一覧

すべての部品で、次の見せ方に揃える。部品ごとに作り直さない。

| 状態 | 見せ方 | React Aria の属性 |
|---|---|---|
| ホバー | 面を1段明るく（`bg-surface-2`）するか、文字を1段強くする | `data-hovered` |
| 押下中 | 面をさらに1段（`bg-surface-3`）にするか、わずかに縮める | `data-pressed` |
| キーボードのフォーカス | アクセントの 2px の線を 2px 離して付ける | `data-focus-visible` |
| 選択中 | 印（チェック、下線、面）を付け、文字を `text-text-strong` にする | `data-selected` |
| 無効 | 不透明度を 50% に下げ、理由をツールチップか補足の文字で示す | `data-disabled` |
| 読み込み中 | ラベルを残したまま処理中の印を出す（`references/components/button.md`） | `data-pending` |
| エラー | 危険の色の枠と文字、アイコン、原因と対処の文章 | `data-invalid` |

### 空状態

- データがまだない画面を、次にすべき操作を1つ示す場所として使う（`references/intuitive-ui.md` の5.4節）。
- 何が起きているか（「まだプロジェクトがない」）と、次に何をすればよいか（「最初のプロジェクトを作ると、ここに一覧が出る」）を書き、その操作のボタンを1つ置く。ボタンは主要の見た目にしてよい。
- 空の理由で書き分ける。初めて使うときの空と、検索や絞り込みで何も見つからないときの空は別のものである。後者では、条件を解除するボタンを置く。
- アイコンは Iconify の線のアイコンを `text-text-muted` で1つだけ置く。大きな挿絵や絵文字を置かない。
- 空状態の見出しは、アプリ系の記憶のフックを置く場所の候補である（`references/mode-app.md` の1節と5節）。見出しだけにセリフ体（`font-display`）を使うなどの工夫は、ここに1か所だけ置く。

### エラー

- 何が起きたか、なぜか、次に何をすればよいかを書く（`references/intuitive-ui.md` の2.4節）。「エラーが発生しました」だけで終わらせない。
- エラーは原因の場所に出す。入力欄のエラーは入力欄の下（`references/components/text-input.md`）、一覧の読み込みの失敗は一覧の場所、操作の失敗はトースト（`references/components/toast.md`）に出す。
- 危険の色（`text-danger`）はアイコンと見出しにだけ使い、説明の文章は `text-text` にして読みやすくする。危険の色で面を塗らない。
- エラーの文章とエラーの番号は、選択してコピーできるまま残す（`references/components/selection.md`）。問い合わせに使う番号には、コピーボタンを付ける。
- やり直せる場合は「もう一度読み込む」などのボタンを置く。入力した内容は消さない。
- 後から現れたエラーは `role="alert"` で読み上げる。

### フォーカスリング

- キーボードで操作しているとき（`data-focus-visible`、CSS では `:focus-visible`）だけ表示する。マウスで押したときには出さない。ただし文字を打つ入力欄は、マウスで押したときも出す（`data-focused`）。
- アクセント（`outline-accent`）の 2px の線（`outline-2`）を、部品から 2px 離して（`outline-offset-2`）付ける。全部品で同じにする。
- スクロールする領域の中など、外側に描くと切れる場所では、`-outline-offset-2` で内側に描く。
- Tailwind v4 の `outline-none` は線の種類を `none` にするため、同じ要素に後から `outline-2` を付けても線が出ない。フォーカスリングを出す要素には `outline-none` を書かない。中の要素にフォーカスが移るためにリングの要らない入れ物（`Dialog` など）は、`outline-hidden` にする。`outline-hidden` は強制カラーモードでは線を残す。
- キーボードで移動中の項目を面の明度で示す一覧（メニュー、選択欄の項目）では、面の明度をフォーカスの印の代わりにしてよい（`references/components/select.md`）。

### 無効状態

- 使えない操作は隠さずに無効の見た目で表示し、なぜ使えないかを示す（`references/intuitive-ui.md` の2.4節）。
- 理由はツールチップで示す。ただし、React Aria の `isDisabled` を付けたボタンは、ホバーもフォーカスも受けないため、ツールチップが出ない。理由を示すボタンは `isDisabled` を使わず、`aria-disabled="true"` を付けて押しても何もしないようにする。フォーカスとホバーを受けるため、ツールチップが出て、読み上げでも「無効」と伝わる。
- ツールチップはスマートフォンでは出ないため、操作に必要な理由（「保存するには名前を入力する」）は、ボタンの近くに補足の文字でも示す。

### ホバー時だけ現れる操作

- 情報の多い一覧で、行ごとの操作をホバー時だけ表示する（`references/mode-app.md` の8節）。
- キーボードで行の中にフォーカスがあるとき（`:focus-within`）にも表示する。これがないと、Tab で見えないボタンにフォーカスが移る。
- ホバーできない端末（`@media (hover: none)`）では常に表示する。
- 表示の切り替えは不透明度だけで行い、`--duration-fast`（120ms）にする。不透明度だけの短い変化のため、動きを減らす設定のときもそのままでよい（`references/motion-web.md` の調整欄）。
- 現れる操作の場所は最初から確保し、現れても行の高さや文字の位置が動かないようにする。
- 削除など戻せない操作は、ホバーで現れる場所に直接置かず、「その他」メニューの中に入れる。

### 一覧やダッシュボードの中身の状態（稼働、接続、同期など）

- 正常な状態は表示しない。すべての行に「稼働中」「ONLINE」を付けない（`../design-core/references/anti-patterns.md` の X20）。全体が正常であることを伝えたい場合は、見出しの横に「すべて正常」のような要約を1つだけ置く。
- 異常な状態（停止、警告、遅延など）の行だけに、Iconify のアイコン＋文字を置く。状態の色（`text-danger`、`text-warning`）はアイコンと文字に付け、面や行全体を塗らない。
- 「● 稼働中」のような色の点＋状態の文字にしない（同 X18）。例外は、チャットなどでアバターに重ねる在席の点だけである。
- 状態をデータの印そのものに持たせてもよい（応答時間の棒のうち、遅延した棒だけを警告の色にするなど）。色だけに頼らないよう、異常な行には文字も添える（`references/intuitive-ui.md` の2.5節）。

## やってはいけないこと

- 空状態に「データがありません」とだけ書き、次の操作を示さないこと。
- 空状態に大きな挿絵、絵文字、ぼかした光の玉を置くこと（`../design-core/references/anti-patterns.md` の X6、X7）。
- エラーの文章に `select-none` を付けること。エラーを危険の色の面で塗ること。
- フォーカスリングを消すこと（`outline-none` だけを付けて代わりを用意しない）。部品ごとにフォーカスリングの色や太さを変えること。
- 無効のボタンを隠すこと、理由を示さずに無効にすること。
- ホバー時だけ現れる操作を、キーボードやスマートフォンで使えなくすること。
- ホバーで現れる操作の中に、削除のボタンを直接置くこと。
- 正常な状態のラベルをすべての行に付けること。色の点＋状態の文字で状態を示すこと（`../design-core/references/anti-patterns.md` の X18、X20）。

## コード例

初めて使うときの空状態と、絞り込みで何も見つからないときの空状態である。

```tsx
import { Button } from "react-aria-components";
import { Icon } from "@iconify/react";

const ring = "data-focus-visible:outline-2 data-focus-visible:outline-offset-2 data-focus-visible:outline-accent";

export function EmptyProjects({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-start gap-4 px-6 py-16">
      <Icon icon="ph:folder-simple-dashed" aria-hidden className="size-8 text-text-muted" />
      <div className="flex flex-col gap-1.5">
        {/* 空状態の見出しは、記憶のフックの候補。書体の切り替えはここ1か所だけ */}
        <h2 className="font-display text-2xl text-text-strong">まだプロジェクトがない</h2>
        <p className="max-w-[32em] text-sm text-text-muted">最初のプロジェクトを作ると、ここに一覧が出る。メンバーを招待するのは、作ったあとでよい。</p>
      </div>
      <Button onPress={onCreate} className={`inline-flex h-9 select-none items-center gap-2 rounded-md bg-text-strong px-3 text-sm text-surface-0 data-hovered:opacity-90 ${ring}`}>
        <Icon icon="ph:plus" aria-hidden className="size-4" />
        <span>プロジェクトを作る</span>
      </Button>
    </div>
  );
}

export function NoResults({ query, onClear }: { query: string; onClear: () => void }) {
  return (
    <div role="status" className="flex flex-col items-start gap-3 px-6 py-12">
      <Icon icon="ph:magnifying-glass" aria-hidden className="size-6 text-text-muted" />
      <p className="text-sm text-text">「{query}」に一致するプロジェクトがない。</p>
      <p className="text-sm text-text-muted">言葉を短くするか、絞り込みの条件を解除する。</p>
      <Button onPress={onClear} className={`inline-flex h-9 select-none items-center gap-2 rounded-md border border-line-control px-3 text-sm text-text data-hovered:bg-surface-2 data-pressed:bg-surface-3 ${ring}`}>
        <Icon icon="ph:x-circle" aria-hidden className="size-4" />
        <span>条件を解除</span>
      </Button>
    </div>
  );
}
```

- 空状態は左寄せにし、一覧が出たときの左端と揃える。中央寄せにすると、中身が届いたときに視線の位置が大きく変わる。

一覧の読み込みに失敗したときのエラーである。

```tsx
import { Button } from "react-aria-components";
import { Icon } from "@iconify/react";

const ring = "data-focus-visible:outline-2 data-focus-visible:outline-offset-2 data-focus-visible:outline-accent";

export function LoadError({ code, onRetry }: { code: string; onRetry: () => void }) {
  return (
    <div role="alert" className="flex flex-col gap-3 rounded-island border border-line px-4 py-4">
      <p className="flex items-center gap-2 text-sm text-danger">
        <Icon icon="ph:warning-circle" aria-hidden className="size-4 shrink-0" />
        <span>プロジェクトの一覧を読み込めなかった</span>
      </p>
      {/* 説明の文章は通常の文字の色にする。選択してコピーできるまま残す */}
      <p className="text-sm text-text">
        サーバーからの応答が30秒以内に返らなかった。時間をおいてもう一度読み込む。続く場合は、下の番号を添えて管理者に連絡する。
      </p>
      <p className="text-xs text-text-muted">
        エラーの番号：<span className="font-mono text-text">{code}</span>
      </p>
      <div>
        <Button onPress={onRetry} className={`inline-flex h-9 select-none items-center gap-2 rounded-md border border-line-control px-3 text-sm text-text data-hovered:bg-surface-2 data-pressed:bg-surface-3 ${ring}`}>
          <Icon icon="ph:arrow-clockwise" aria-hidden className="size-4" />
          <span>もう一度読み込む</span>
        </Button>
      </div>
    </div>
  );
}
```

- エラーの番号にコピーボタンを付ける場合は、`references/components/selection.md` のコピーボタンを使う。

理由をツールチップで示す無効のボタンである。

```tsx
import { useId } from "react";
import { Button, Tooltip, TooltipTrigger } from "react-aria-components";
import { Icon } from "@iconify/react";

export function PublishButton({ missing, onPublish }: { missing: string | null; onPublish: () => void }) {
  const disabled = missing !== null;
  const reasonId = useId();
  return (
    <div className="flex flex-col items-end gap-1.5">
      <TooltipTrigger delay={500} isDisabled={!disabled}>
        {/* isDisabled を使うとホバーとフォーカスを受けず、ツールチップが出ない。aria-disabled にして、押しても何もしないようにする */}
        <Button
          aria-disabled={disabled || undefined}
          aria-describedby={disabled ? reasonId : undefined}
          onPress={() => {
            if (!disabled) onPublish();
          }}
          className={[
            "inline-flex h-9 select-none items-center gap-2 rounded-md bg-text-strong px-3 text-sm text-surface-0",
            // 無効とホバーの不透明度を同時に付けない。両方あると、どちらが効くかは CSS の生成順で決まる
            disabled ? "cursor-not-allowed opacity-50" : "data-hovered:opacity-90",
            "data-focus-visible:outline-2 data-focus-visible:outline-offset-2 data-focus-visible:outline-accent",
          ].join(" ")}
        >
          <Icon icon="ph:paper-plane-tilt" aria-hidden className="size-4" />
          <span>公開する</span>
        </Button>
        <Tooltip offset={6} className="rounded-sm border border-line bg-surface-2 px-2 py-1 text-xs text-text shadow-float">
          {missing}を入力すると公開できる
        </Tooltip>
      </TooltipTrigger>
      {/* スマートフォンではツールチップが出ないため、理由を補足の文字でも示す */}
      {disabled && (
        <p id={reasonId} className="text-xs text-text-muted">
          {missing}を入力すると公開できる
        </p>
      )}
    </div>
  );
}
```

- `aria-disabled` のボタンは React Aria から見ると押せるボタンのままなので、`data-hovered` も付く。無効の見た目は状態の変数から付け、ホバーの反応は無効でないときだけ付ける。
- 補足の文字を `aria-describedby` でボタンにつなぐため、読み上げでも理由が伝わる。

ホバー時とフォーカス時に現れる、行ごとの操作である。

```tsx
import { Button, Menu, MenuItem, MenuTrigger, Popover, Tooltip, TooltipTrigger } from "react-aria-components";
import { Icon } from "@iconify/react";

// ホバー、行の中のフォーカス、ホバーできない端末のどれかで表示する。不透明度だけを 120ms で変える
const reveal = [
  "opacity-0 transition-opacity duration-(--duration-fast) ease-out-quint",
  "group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100",
].join(" ");

const iconButton = [
  "grid size-7 select-none place-items-center rounded-md text-text-muted",
  "data-hovered:bg-surface-3 data-hovered:text-text data-pressed:bg-surface-3",
  "data-focus-visible:outline-2 data-focus-visible:-outline-offset-2 data-focus-visible:outline-accent",
].join(" ");

export function TaskRow({ title, due, onEdit, onDelete }: { title: string; due: string; onEdit: () => void; onDelete: () => void }) {
  return (
    <li className="group flex h-10 items-center gap-3 px-3">
      <span className="min-w-0 flex-1 truncate text-sm text-text">{title}</span>
      <span className="font-mono text-xs tabular-nums text-text-muted">{due}</span>
      {/* 操作の場所は常に確保する。現れても行の中の文字の位置は動かない */}
      <span className={`flex gap-0.5 ${reveal}`}>
        <TooltipTrigger delay={500}>
          <Button aria-label="編集" onPress={onEdit} className={iconButton}>
            <Icon icon="ph:pencil-simple" aria-hidden className="size-4" />
          </Button>
          <Tooltip offset={6} className="rounded-sm border border-line bg-surface-2 px-2 py-1 text-xs text-text shadow-float">
            編集
          </Tooltip>
        </TooltipTrigger>
        {/* 削除は直接置かず、「その他」のメニューの中に入れる */}
        <MenuTrigger>
          <TooltipTrigger delay={500}>
            <Button aria-label="その他の操作" className={iconButton}>
              <Icon icon="ph:dots-three" aria-hidden className="size-4" />
            </Button>
            <Tooltip offset={6} className="rounded-sm border border-line bg-surface-2 px-2 py-1 text-xs text-text shadow-float">
              その他の操作
            </Tooltip>
          </TooltipTrigger>
          <Popover offset={4} placement="bottom end" className="min-w-44 rounded-lg border border-line bg-surface-2 p-1 shadow-float">
            <Menu onAction={(key) => key === "delete" && onDelete()} className="outline-none">
              <MenuItem id="delete" textValue="削除…" className="flex h-9 cursor-default select-none items-center gap-2 rounded-md px-2 text-sm text-danger outline-none data-focused:bg-surface-3">
                <Icon icon="ph:trash" aria-hidden className="size-4" />
                <span>削除…</span>
              </MenuItem>
            </Menu>
          </Popover>
        </MenuTrigger>
      </span>
    </li>
  );
}
```

- Tailwind v4 の `group-hover:` は、ホバーできる端末（`@media (hover: hover)`）でだけ効く。ホバーできない端末で常に表示するために、`[@media(hover:none)]:opacity-100` を足している。
- メニューを開いている間、フォーカスはメニューに移るが、閉じると「その他」のボタンに戻るため、操作は表示されたままになる。
- 行の中のボタンは行の端に近いため、フォーカスリングを内側（`-outline-offset-2`）に描く。
- メニューの開閉の動きは `references/components/tooltip-popover-menu.md` のクラスを足して付ける。この例では省いている。

## 確認方法

スクリーンショットと実際の操作で、次の点を見る。

1. 空状態に、何が起きているかと、次にする操作のボタンが1つあるか。初めての空と、検索で見つからない空を書き分けているか。
2. エラーに、何が起きたか、なぜか、次に何をすればよいかが書かれているか。エラーの文章と番号をドラッグして選択できるか。
3. Tab で移動したとき、すべての操作できる部品に同じフォーカスリングが出るか。マウスで押したときは出ないか（入力欄を除く）。リングが領域の端で切れていないか。
4. 無効のボタンにマウスを載せたときと Tab でフォーカスしたときに、理由のツールチップが出るか。押しても何も起きないか。スマートフォン幅で理由の文字が見えるか。
5. 行にマウスを載せたときと、Tab で行の中に入ったときに、操作が現れるか。操作が現れても、行の文字の位置が動かないか。スマートフォンで操作が常に見えるか。
6. 状態を白黒のスクリーンショットで見ても、アイコンと文字で区別できるか。
