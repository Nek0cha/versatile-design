# ツールチップ、ポップオーバー、メニュー

部品の上に浮いて現れる小さな面を作る段階で読む。トークンの名前は `references/tokens-tailwind.md` だけを出典とし、浮いている面の見た目は `references/mode-app.md` の6.2節、メニューの組み立ては `references/intuitive-ui.md` の6.3節に従う。

## 目的

- 3つの部品を中身で使い分け、利用者が「見るだけのものか、操作できるものか、選ぶものか」を開く前から予測できるようにする。
- アイコンだけのボタンでも、何が起きるかが分かるようにする。

## 守ること

- 使い分けは次のとおりにする。

| 部品 | 中身 | 開き方 | React Aria の部品 |
|---|---|---|---|
| ツールチップ | 補足の説明だけ（ボタンの名前、ショートカットキー、無効の理由）。押せるものを入れない | ホバーとキーボードのフォーカス | `TooltipTrigger`、`Tooltip` |
| ポップオーバー | 操作を含むもの（絞り込みの条件、色の選択、小さなフォーム） | ボタンを押す | `DialogTrigger`、`Popover`、`Dialog` |
| メニュー | 選択肢（その場で実行する操作の一覧） | ボタンを押す、右クリック | `MenuTrigger`、`Popover`、`Menu` |

- **ツールチップ**
  - アイコンだけのボタンには必ず付ける。`aria-label` と同じ動詞のラベルにする（`references/intuitive-ui.md` の1.3節）。ショートカットキーがあれば、ラベルの後ろに添える。
  - 表示までの待ち時間は 500ms にする（`delay={500}`）。React Aria の既定は 1500ms で長すぎる。キーボードでフォーカスしたときは待たずに表示し、1つ表示した直後に隣のボタンへ移ったときも待たずに表示する。どちらも React Aria の標準の動作である。
  - 文字は1行、12px の `text-xs` に収める。説明が2行を超えるなら、ツールチップではなく画面の中の補足の文字にする。
  - ツールチップはホバーできない端末（スマートフォン）では表示されない。ツールチップにしか書いていない情報で、操作に必要なものがないようにする。
- **ポップオーバー**：中にフォーカスできる部品を置くため、`Dialog` で包む。React Aria がフォーカスを中に移し、Esc と外側のクリックで閉じ、閉じたら開いたボタンにフォーカスを戻す。
- **メニュー**
  - ショートカットキーは項目の右端に寄せて、`Keyboard`（`<kbd>`）で `text-text-muted` の小さな文字にする（`references/mode-app.md` の7節）。修飾キーは利用者の OS の表記にする（macOS は記号、それ以外は「Ctrl」などの文字）。メニューに表示するだけではキーは効かないため、キーの処理は別に登録する。
  - 関係する項目を `MenuSection` でまとめ、区切りに `Separator` を置く。削除など戻せない操作は、最後のまとまりに置き、文字を危険の色（`text-danger`）にする（`references/intuitive-ui.md` の7.1節）。
  - 使えない項目は隠さずに無効の見た目で残す（`disabledKeys`）。
  - 同じまとまりの項目は、アイコンをすべてに付けるか、どれにも付けないかのどちらかにする。
  - 項目の高さは密な一覧の 36px にし、`user-select: none` を付ける。
- 3つとも浮いているものとして、`bg-surface-2`、`border border-line`、`shadow-float` の組で作る。角丸は、メニューとポップオーバーが `rounded-lg`、ツールチップが `rounded-sm` である。
- 開閉の動きは、開く向きの反対側から 4px の移動と不透明度を同時に変える。メニューとポップオーバーは `--duration-base`（180ms）、ツールチップは `--duration-fast`（120ms）で、どれも閉じるときは `--duration-fast` にする。イージングは `--ease-out-quint` である。動きを減らす設定のときは、移動をやめて不透明度だけを変える。

## やってはいけないこと

- ツールチップの中にリンクやボタンを置くこと。ホバーを外すと消えるため押せない。
- アイコンだけのボタンに、ツールチップか `aria-label` の片方しか付けないこと。
- ツールチップを待ち時間なしで出すこと。画面の上でマウスを動かすだけでツールチップが次々に出て、うるさくなる。
- 選択肢の一覧を、メニューではなくボタンを並べたポップオーバーで作ること。上下の矢印キーでの移動と、文字を打ってその項目へ移る動作が失われる。
- メニューのショートカットキーを、項目の名前の直後に続けて書くこと。右端で揃えないと、縦に見比べられない。
- 矢印キーを文字の矢印（「→」など）で表すこと。Iconify のアイコンで表す（`../design-core/references/anti-patterns.md` の X10）。
- サブメニューを2段以上重ねること。

## コード例

ツールチップ付きのアイコンだけのボタンである。ツールバーなどで使い回す。

```tsx
import { Button, Keyboard, Tooltip, TooltipTrigger, type ButtonProps } from "react-aria-components";
import { Icon } from "@iconify/react";

const tooltipClass = [
  "rounded-sm border border-line bg-surface-2 px-2 py-1 text-xs text-text shadow-float select-none",
  "transition-[opacity,translate] duration-(--duration-fast) ease-out-quint",
  "data-entering:opacity-0 data-exiting:opacity-0",
  "data-[placement=bottom]:data-entering:-translate-y-1 data-[placement=top]:data-entering:translate-y-1",
  "motion-reduce:transition-opacity",
].join(" ");

type IconButtonProps = Omit<ButtonProps, "children" | "className" | "aria-label"> & {
  icon: string;
  // aria-label とツールチップに同じ文言を使う
  label: string;
  shortcut?: string;
};

export function IconButton({ icon, label, shortcut, ...props }: IconButtonProps) {
  return (
    <TooltipTrigger delay={500}>
      <Button
        {...props}
        aria-label={label}
        className={[
          "grid size-8 select-none place-items-center rounded-md text-text-muted",
          "transition-colors duration-(--duration-fast) ease-out-quint",
          "data-hovered:bg-surface-2 data-hovered:text-text data-pressed:bg-surface-3",
          "data-focus-visible:outline-2 data-focus-visible:outline-offset-2 data-focus-visible:outline-accent",
          "data-disabled:opacity-50",
        ].join(" ")}
      >
        <Icon icon={icon} aria-hidden className="size-5" />
      </Button>
      <Tooltip offset={6} className={tooltipClass}>
        <span className="flex items-center gap-2">
          {label}
          {shortcut && <Keyboard className="font-mono text-text-muted">{shortcut}</Keyboard>}
        </span>
      </Tooltip>
    </TooltipTrigger>
  );
}

export function EditorToolbar() {
  return (
    <div role="toolbar" aria-label="編集" className="inline-flex gap-0.5 rounded-lg border border-line bg-surface-2 p-1 shadow-float">
      <IconButton icon="ph:arrow-counter-clockwise" label="元に戻す" shortcut="Ctrl+Z" />
      <IconButton icon="ph:arrow-clockwise" label="やり直す" shortcut="Ctrl+Shift+Z" />
      <IconButton icon="ph:text-b-bold" label="太字" shortcut="Ctrl+B" />
    </div>
  );
}
```

- `TooltipTrigger` は、中の `Button` のホバーとフォーカスを見て、ツールチップを開閉する。React Aria は `aria-describedby` でツールチップをボタンにつなぐ。
- ツールチップはボタンの名前を表示するだけであり、名前そのものは `aria-label` で付ける。ツールチップだけでは、読み上げソフトがボタンの名前を読めない場合がある。
- ショートカットキーの表記は、メニューの例と同じく OS で切り替える。この例では簡単のために固定している。

操作を含むポップオーバーである。

```tsx
import { Button, Checkbox, CheckboxGroup, Dialog, DialogTrigger, Heading, Label, Popover } from "react-aria-components";
import { Icon } from "@iconify/react";

const popoverMotion = [
  "transition-[opacity,translate] duration-(--duration-base) ease-out-quint",
  "data-entering:opacity-0 data-exiting:opacity-0 data-exiting:duration-(--duration-fast)",
  "data-[placement=bottom]:data-entering:-translate-y-1 data-[placement=bottom]:data-exiting:-translate-y-1",
  "data-[placement=top]:data-entering:translate-y-1 data-[placement=top]:data-exiting:translate-y-1",
  "motion-reduce:transition-opacity motion-reduce:duration-(--duration-fast)",
].join(" ");

const statuses = [
  { id: "open", label: "未着手" },
  { id: "doing", label: "進行中" },
  { id: "done", label: "完了" },
];

export function StatusFilter({ value, onChange }: { value: string[]; onChange: (next: string[]) => void }) {
  return (
    <DialogTrigger>
      <Button className="inline-flex h-8 select-none items-center gap-1.5 rounded-md border border-line-control px-2.5 text-sm text-text data-hovered:bg-surface-2 data-pressed:bg-surface-3 data-focus-visible:outline-2 data-focus-visible:outline-offset-2 data-focus-visible:outline-accent">
        <Icon icon="ph:funnel-simple" aria-hidden className="size-4" />
        <span>状態で絞り込む</span>
        {value.length > 0 && <span className="font-mono text-xs tabular-nums text-text-muted">{value.length}</span>}
      </Button>
      <Popover offset={6} placement="bottom start" className={`w-60 rounded-lg border border-line bg-surface-2 shadow-float ${popoverMotion}`}>
        <Dialog className="flex flex-col gap-3 p-3 outline-hidden">
          <Heading slot="title" className="text-sm text-text-strong">
            表示する状態
          </Heading>
          <CheckboxGroup value={value} onChange={onChange} className="flex flex-col gap-1">
            <Label className="sr-only">表示する状態</Label>
            {statuses.map((status) => (
              <Checkbox key={status.id} value={status.id} className="group flex h-9 select-none items-center gap-2 rounded-md px-2 text-sm text-text data-hovered:bg-surface-3">
                {({ isSelected }) => (
                  <>
                    <span className="grid size-4 place-items-center rounded-sm border border-line-control text-accent-ink group-data-selected:border-accent group-data-selected:bg-accent group-data-focus-visible:outline-2 group-data-focus-visible:outline-offset-2 group-data-focus-visible:outline-accent">
                      {isSelected && <Icon icon="ph:check-bold" aria-hidden className="size-3" />}
                    </span>
                    {status.label}
                  </>
                )}
              </Checkbox>
            ))}
          </CheckboxGroup>
        </Dialog>
      </Popover>
    </DialogTrigger>
  );
}
```

- 絞り込みは選んだ時点で反映されるため、ポップオーバーの中に「適用」のボタンを置かない。反映に時間がかかる条件の場合だけ、ボタンを置いて押したときに反映する。

ショートカットキーを右端に揃えたメニューである。

```tsx
import { Button, Header, Keyboard, Menu, MenuItem, MenuSection, MenuTrigger, Popover, Separator, Text, Tooltip, TooltipTrigger } from "react-aria-components";
import { Icon } from "@iconify/react";

// 修飾キーの表記を OS で切り替える。描画のたびに判定しないよう、モジュールの読み込み時に1回だけ決める
const isApple = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.userAgent);
const mod = isApple ? "⌘" : "Ctrl+";
const shift = isApple ? "⇧" : "Shift+";

const popoverMotion = [
  "transition-[opacity,translate] duration-(--duration-base) ease-out-quint",
  "data-entering:opacity-0 data-exiting:opacity-0 data-exiting:duration-(--duration-fast)",
  "data-[placement=bottom]:data-entering:-translate-y-1 data-[placement=bottom]:data-exiting:-translate-y-1",
  "data-[placement=top]:data-entering:translate-y-1 data-[placement=top]:data-exiting:translate-y-1",
  "motion-reduce:transition-opacity motion-reduce:duration-(--duration-fast)",
].join(" ");

const tooltipClass = [
  "rounded-sm border border-line bg-surface-2 px-2 py-1 text-xs text-text shadow-float select-none",
  "transition-[opacity,translate] duration-(--duration-fast) ease-out-quint",
  "data-entering:opacity-0 data-exiting:opacity-0",
  "data-[placement=bottom]:data-entering:-translate-y-1 data-[placement=top]:data-entering:translate-y-1",
  "motion-reduce:transition-opacity",
].join(" ");

const itemClass = [
  "flex h-9 cursor-default select-none items-center gap-2 rounded-md px-2 text-sm outline-none",
  "data-focused:bg-surface-3 data-disabled:text-text-faint",
].join(" ");

function Item({ id, icon, label, shortcut, danger }: { id: string; icon: string; label: string; shortcut?: string; danger?: boolean }) {
  return (
    <MenuItem id={id} textValue={label} className={`${itemClass} ${danger ? "text-danger" : "text-text"}`}>
      <Icon icon={icon} aria-hidden className="size-4 shrink-0" />
      <Text slot="label" className="flex-1 truncate">
        {label}
      </Text>
      {shortcut && <Keyboard className="ml-6 font-mono text-xs text-text-muted">{shortcut}</Keyboard>}
    </MenuItem>
  );
}

export function FileMenu({ onAction }: { onAction: (id: string) => void }) {
  return (
    <MenuTrigger>
      {/* アイコンだけのボタンなので、メニューを開くボタンにもツールチップを付ける。押してメニューが開くとツールチップは閉じる */}
      <TooltipTrigger delay={500}>
        <Button
          aria-label="ファイルの操作"
          className="grid size-8 select-none place-items-center rounded-md text-text-muted data-hovered:bg-surface-2 data-pressed:bg-surface-3 data-focus-visible:outline-2 data-focus-visible:outline-offset-2 data-focus-visible:outline-accent"
        >
          <Icon icon="ph:dots-three" aria-hidden className="size-5" />
        </Button>
        <Tooltip offset={6} className={tooltipClass}>
          ファイルの操作
        </Tooltip>
      </TooltipTrigger>
      <Popover offset={4} placement="bottom end" className={`min-w-56 rounded-lg border border-line bg-surface-2 p-1 shadow-float ${popoverMotion}`}>
        <Menu onAction={(key) => onAction(String(key))} disabledKeys={["move"]} className="outline-none">
          <MenuSection>
            <Header className="px-2 pt-1 pb-1 text-xs text-text-muted select-none">編集</Header>
            <Item id="rename" icon="ph:pencil-simple" label="名前を変更…" shortcut="F2" />
            <Item id="duplicate" icon="ph:copy" label="複製" shortcut={`${mod}D`} />
            <Item id="move" icon="ph:folder-simple" label="別のフォルダへ移動…" shortcut={`${shift}${mod}M`} />
          </MenuSection>
          <Separator className="mx-2 my-1 h-px bg-line" />
          <MenuSection>
            <Item id="delete" icon="ph:trash" label="削除" shortcut={isApple ? "⌫" : "Delete"} danger />
          </MenuSection>
        </Menu>
      </Popover>
    </MenuTrigger>
  );
}
```

- メニューを開くボタンも、アイコンだけのボタンとして `aria-label` とツールチップの両方を付ける。`MenuTrigger` の中で `TooltipTrigger` が `Button` を包んでも、メニューを開く動作は `Button` に届く。ボタンを押すと、ツールチップは閉じてメニューが開く（`TooltipTrigger` の `shouldCloseOnPress` の既定値）。
- 文字の色は、危険の項目とそれ以外で、どちらか一方のクラスだけを付ける。`text-text` と `text-danger` を両方付けると、どちらが効くかはクラスの順ではなく CSS の生成順で決まる。
- 項目とメニューに付けた `outline-none` は、キーボードで移動中の項目を面の明度（`data-focused:bg-surface-3`）で示すためのものである（select.md と同じ）。
- `MenuSection` の中の `Header` は、まとまりの見出しとして読み上げられる。見出しが要らないまとまりでは省いてよい。
- ショートカットキーは `ml-6` で項目の名前から離し、`flex-1` を付けた名前が残りの幅を取ることで、右端に揃う。

## 確認方法

スクリーンショットと実際の操作で、次の点を見る。

1. アイコンだけのボタンすべてに、ツールチップと `aria-label` があるか。両方の文言が同じか。
2. ボタンにマウスを載せて約 0.5 秒後にツールチップが出るか。Tab でフォーカスしたときは待たずに出るか。
3. ツールチップの中に押せるものがないか。操作を含むものがポップオーバー、選択肢の一覧がメニューになっているか。
4. メニューのショートカットキーが右端で縦に揃っているか。macOS とそれ以外で修飾キーの表記が切り替わるか。
5. メニューの削除などの項目が、最後のまとまりに区切り線で分けて置かれ、文字が危険の色か。
6. 上下の矢印キー、Enter、Esc でメニューを操作でき、閉じたあと開いたボタンにフォーカスが戻るか。
7. 開閉の動きが 4px の移動と不透明度で、閉じるときの方が短いか。動きを減らす設定のとき、移動しないか。
