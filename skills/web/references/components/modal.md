# モーダル

作業を止めて、短い入力か重要な判断を求めるダイアログを作る段階で読む。トークンの名前は `references/tokens-tailwind.md` だけを出典とし、モーダルを使うかどうかの判断は `references/intuitive-ui.md` の2.2節と5.3節、確認のダイアログの書き方は同4.2節に従う。

## 目的

- 開いたことと閉じ方が一目で分かり、キーボードだけでも迷わずに操作でき、閉じたら元の場所に戻れるダイアログを作る。
- 戻せない操作の確認では、読まずに押される事故を防ぐ。

## 守ること

- 開く前に、その場で編集する、横にパネルを開く、ポップオーバーで済ませる方法を検討する（`references/intuitive-ui.md` の5.3節）。情報を伝えるだけで、利用者が取れる行動がないなら、ダイアログにしない。
- 土台は React Aria の `ModalOverlay`、`Modal`、`Dialog` にする。題名は `Heading` に `slot="title"` を付けて置き、React Aria が `aria-labelledby` でダイアログにつなぐ。
- 閉じ方は次の3つを用意する。
  - **Esc**：React Aria の標準の動作。消さない（`isKeyboardDismissDisabled` を付けない）。
  - **背景のクリック**：`ModalOverlay` に `isDismissable` を付ける。
  - **閉じるボタン**：右上の角に、アイコンだけのボタン（`ph:x`）を置く。`aria-label` とツールチップを付ける（`references/components/tooltip-popover-menu.md`）。React Aria の `Button` に `slot="close"` を付けると、ダイアログを閉じる動作がつながる。
- 破壊的な操作の確認のダイアログだけは、背景のクリックで閉じない（`isDismissable` を付けない）。確認の途中で背景に触れただけで閉じると、確認したかどうかが分からなくなるためである。Esc とキャンセルのボタンでは閉じられるようにする。
- 背景のスクロールの固定と、フォーカスをダイアログの中に閉じ込める動作は、React Aria に任せる。自分で `overflow: hidden` を付けたり、Tab キーを横取りしたりしない。閉じたときは、開いたボタンにフォーカスが戻る。
- 登場は、不透明度と下からの 8px の移動を同時に変え、`--duration-base`（180ms）と `--ease-out-quint` で行う。背景の暗幕は不透明度だけを変える。閉じるときは `--duration-fast`（120ms）にし、開くときより短くする。
- 動きを減らす設定のときは、移動をやめ、不透明度の変化だけを `--duration-fast` で行う。
- ダイアログは浮いているものとして、`rounded-lg`、`bg-surface-2`、`border border-line`、`shadow-float` の組で作る（`references/mode-app.md` の6.2節）。背景の暗幕は `bg-surface-0` を半透明にしたものにし、ぼかし（`backdrop-blur`）を付けない（`../design-core/references/anti-patterns.md` の K1）。
- ボタンは右下に「キャンセル」「主要な操作」の順に並べる。ラベルは結果を表す動詞にする（`references/components/button.md`）。
- 確認のダイアログ（`references/intuitive-ui.md` の4.2節）は次のように作る。
  - `Dialog` に `role="alertdialog"` を指定する。
  - 題名で、何が起きるかを対象の名前と件数とともに書く。本文で、戻せないことと、失われるものを書く。
  - 実行のボタンは危険の色で面を塗る（`bg-danger`、文字は `text-danger-ink`）。危険の色で面を塗ってよいのは、確認のダイアログの中だけである（`../design-core/references/color.md` の1節）。
  - 予期しない消失を確認する場合は、最初のフォーカスをキャンセルのボタンに置く（`autoFocus`）。Enter で即座に実行されないようにするためである。
- 題名と本文は選択できるまま残す。ボタンには `select-none` を付ける。

## やってはいけないこと

- ダイアログの中から別のダイアログを開くこと。ダイアログの中で画面の階層を作ること。
- 閉じるボタンを置かず、Esc や背景のクリックだけで閉じさせること。閉じ方が見えない。
- 背景のスクロールの固定やフォーカスの閉じ込めを自前で書き、React Aria の動作と二重にすること。
- 「よろしいですか？」だけの題名、「OK」「はい」のようなラベル。
- 確認のダイアログ以外で、危険の色で面を塗ったボタンを使うこと。
- 背景の暗幕にぼかしや色を付けること。登場に拡大と回転を組み合わせるなど、180ms を超える目立つ動き。
- 起動した直後にダイアログを出すこと（`references/intuitive-ui.md` の2.2節）。

## コード例

名前を変えるダイアログである。Esc、背景のクリック、閉じるボタンの3つで閉じられる。

```tsx
import { Button, Dialog, DialogTrigger, Heading, Input, Label, Modal, ModalOverlay, TextField, Tooltip, TooltipTrigger } from "react-aria-components";
import { Icon } from "@iconify/react";

// 背景の暗幕は不透明度だけを変える
const overlayClass = [
  "fixed inset-0 z-50 grid place-items-center bg-surface-0/70 p-4",
  "transition-opacity duration-(--duration-base) ease-out-quint",
  "data-entering:opacity-0 data-exiting:opacity-0 data-exiting:duration-(--duration-fast)",
].join(" ");

// ダイアログは下から 8px 動きながら現れる。閉じるときは fast。動きを減らす設定では不透明度だけ
const modalClass = [
  "w-full max-w-md rounded-lg border border-line bg-surface-2 shadow-float",
  "transition-[opacity,translate] duration-(--duration-base) ease-out-quint",
  "data-entering:opacity-0 motion-safe:data-entering:translate-y-2",
  "data-exiting:opacity-0 motion-safe:data-exiting:translate-y-2 data-exiting:duration-(--duration-fast)",
  "motion-reduce:transition-opacity motion-reduce:duration-(--duration-fast)",
].join(" ");

const ring = "data-focus-visible:outline-2 data-focus-visible:outline-offset-2 data-focus-visible:outline-accent";

export function RenameDialog({ current, onRename }: { current: string; onRename: (name: string) => void }) {
  return (
    <DialogTrigger>
      <Button className={`inline-flex h-9 select-none items-center gap-2 rounded-md border border-line-control px-3 text-sm text-text data-hovered:bg-surface-2 data-pressed:bg-surface-3 ${ring}`}>
        <Icon icon="ph:pencil-simple" aria-hidden className="size-4" />
        <span>名前を変更…</span>
      </Button>
      <ModalOverlay isDismissable className={overlayClass}>
        <Modal className={modalClass}>
          <Dialog className="relative flex flex-col gap-4 p-5 outline-hidden">
            {({ close }) => (
              <form
                className="flex flex-col gap-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  onRename(String(new FormData(event.currentTarget).get("name") ?? ""));
                  close();
                }}
              >
                <Heading slot="title" className="pr-10 font-display text-lg text-text-strong">
                  プロジェクトの名前を変更
                </Heading>
                <TooltipTrigger delay={500}>
                  <Button slot="close" aria-label="閉じる" className={`absolute top-3 right-3 grid size-8 select-none place-items-center rounded-md text-text-muted data-hovered:bg-surface-3 data-hovered:text-text ${ring}`}>
                    <Icon icon="ph:x" aria-hidden className="size-4" />
                  </Button>
                  <Tooltip offset={6} className="rounded-sm border border-line bg-surface-2 px-2 py-1 text-xs text-text shadow-float">
                    閉じる
                  </Tooltip>
                </TooltipTrigger>
                <TextField name="name" defaultValue={current} autoFocus className="flex flex-col gap-1.5">
                  <Label className="select-none text-sm text-text-muted">新しい名前</Label>
                  <Input className="h-9 rounded-md border border-line-control bg-surface-1 px-3 text-text data-focused:outline-2 data-focused:outline-offset-2 data-focused:outline-accent" />
                </TextField>
                <div className="flex justify-end gap-2">
                  <Button slot="close" className={`h-9 select-none rounded-md border border-line-control px-3 text-sm text-text data-hovered:bg-surface-3 ${ring}`}>
                    キャンセル
                  </Button>
                  <Button type="submit" className={`h-9 select-none rounded-md bg-text-strong px-3 text-sm text-surface-0 data-hovered:opacity-90 ${ring}`}>
                    名前を変更
                  </Button>
                </div>
              </form>
            )}
          </Dialog>
        </Modal>
      </ModalOverlay>
    </DialogTrigger>
  );
}
```

- `Dialog` 自体はフォーカスを受けるが、中の要素にフォーカスが移るため、`Dialog` にはフォーカスリングを付けず `outline-hidden` にしている。Tailwind v4 の `outline-hidden` は、強制カラーモード（Windows のハイコントラスト）では線を残す。フォーカスリングを出す要素には `outline-none` を書かない。
- 移動のクラスには `motion-safe:` を付け、動きを減らす設定のときは 8px ずれた位置から始まらないようにしている。`motion-reduce:transition-opacity` だけでは、移動が一瞬で飛ぶ。
- `slot="close"` のボタンは、`Dialog` の中に置くと React Aria がダイアログを閉じる動作をつなぐ。閉じるボタンとキャンセルのボタンの両方に使える。
- 入力欄に `autoFocus` を付けると、開いた直後に入力を始められる。付けない場合、React Aria はダイアログ自体にフォーカスを置く。

戻せない削除の確認のダイアログである。背景のクリックでは閉じず、最初のフォーカスはキャンセルに置く。

```tsx
import { Button, Dialog, Heading, Modal, ModalOverlay } from "react-aria-components";
import { Icon } from "@iconify/react";

const overlayClass = [
  "fixed inset-0 z-50 grid place-items-center bg-surface-0/70 p-4",
  "transition-opacity duration-(--duration-base) ease-out-quint",
  "data-entering:opacity-0 data-exiting:opacity-0 data-exiting:duration-(--duration-fast)",
].join(" ");

const modalClass = [
  "w-full max-w-md rounded-lg border border-line bg-surface-2 shadow-float",
  "transition-[opacity,translate] duration-(--duration-base) ease-out-quint",
  "data-entering:opacity-0 motion-safe:data-entering:translate-y-2",
  "data-exiting:opacity-0 motion-safe:data-exiting:translate-y-2 data-exiting:duration-(--duration-fast)",
  "motion-reduce:transition-opacity motion-reduce:duration-(--duration-fast)",
].join(" ");

const ring = "data-focus-visible:outline-2 data-focus-visible:outline-offset-2 data-focus-visible:outline-accent";

type Props = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  projectName: string;
  fileCount: number;
  onDelete: () => void;
};

export function DeleteProjectDialog({ isOpen, onOpenChange, projectName, fileCount, onDelete }: Props) {
  return (
    // isDismissable を付けないため、背景のクリックでは閉じない。Esc では閉じる
    <ModalOverlay isOpen={isOpen} onOpenChange={onOpenChange} className={overlayClass}>
      <Modal className={modalClass}>
        <Dialog role="alertdialog" className="flex flex-col gap-3 p-5 outline-hidden">
          {({ close }) => (
            <>
              <Heading slot="title" className="flex items-start gap-2 text-lg text-text-strong">
                <Icon icon="ph:warning" aria-hidden className="mt-1 size-5 shrink-0 text-danger" />
                <span>「{projectName}」と{fileCount}個のファイルを削除する</span>
              </Heading>
              <p className="text-sm text-text-muted">
                削除したプロジェクトは元に戻せない。共有しているメンバーも開けなくなる。
              </p>
              <div className="mt-2 flex justify-end gap-2">
                {/* 予期しない消失を確認するため、最初のフォーカスはキャンセルに置く */}
                <Button autoFocus slot="close" className={`h-9 select-none rounded-md border border-line-control px-3 text-sm text-text data-hovered:bg-surface-3 ${ring}`}>
                  キャンセル
                </Button>
                {/* 危険の色で面を塗ってよいのは、確認のダイアログの中だけ */}
                <Button
                  onPress={() => {
                    onDelete();
                    close();
                  }}
                  className={`inline-flex h-9 select-none items-center gap-2 rounded-md bg-danger px-3 text-sm text-danger-ink data-hovered:opacity-90 ${ring}`}
                >
                  <Icon icon="ph:trash" aria-hidden className="size-4" />
                  <span>{fileCount}個のファイルごと削除</span>
                </Button>
              </div>
            </>
          )}
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}
```

- `DialogTrigger` を使わずに、`isOpen` と `onOpenChange` で開閉を自分で持つ形である。一覧の行の「その他」メニューから開く場合など、開くボタンがダイアログの隣にない場合に使う。閉じたときにフォーカスを戻す先がないと、フォーカスがページの先頭に飛ぶため、開いた元の要素にフォーカスを戻す。
- `role="alertdialog"` にすると、読み上げソフトは開いた時点で題名を読み上げる。
- 利用者が自分で選んで捨てる操作（ゴミ箱を空にするなど）の確認では、`autoFocus` を実行のボタンに移してよい（`references/intuitive-ui.md` の4.2節）。

## 確認方法

スクリーンショットと実際の操作で、次の点を見る。

1. Esc、背景のクリック、閉じるボタンのそれぞれで閉じるか。破壊的な操作の確認のダイアログだけが、背景のクリックで閉じないか。
2. 開いている間、背景がスクロールせず、Tab キーでダイアログの外にフォーカスが出ないか。閉じたあと、開いたボタンにフォーカスが戻るか。
3. 開くときに下から 8px 動きながら現れ、閉じるときの方が短いか。動きを減らす設定のとき、移動せずに不透明度だけで開閉するか。
4. 閉じるボタンにホバーとフォーカスでツールチップが出て、読み上げで「閉じる」と読まれるか。
5. 確認のダイアログの題名に、対象の名前と件数が入っているか。最初のフォーカスがキャンセルにあり、Enter を押しても削除されないか。
6. 危険の色で塗った面が、確認のダイアログの中にだけあるか。
7. ダイアログが浮いて見えるか（ダークでは線と面の明度、ライトでは影）。暗幕にぼかしが付いていないか。
