# 選択欄

決まった選択肢から1つを選ぶ欄を作る段階で読む。トークンの名前は `references/tokens-tailwind.md` だけを出典とし、浮いている一覧の見た目は `references/mode-app.md` の6.2節、開閉の動きは `references/motion-web.md` に従う。

## 目的

- 開かなくても現在の値が分かり、開いたときにどこから出てきたかが分かり、キーボードだけでも選べる選択欄を作る。
- 選択肢が多い場合は、探す時間を減らすために検索欄付きにする。

## 守ること

- 土台は React Aria の `Select` にする。選択肢が10個を超える場合は、検索欄付きの `ComboBox` にする。
- 閉じた状態のボタンには、現在の値（なければ「選択する」などの案内）と、開閉できることを示すアイコン（Iconify の `ph:caret-up-down` など）を表示する（`references/intuitive-ui.md` の1.3節）。
- 一覧の開閉は、`--duration-base`（180ms）と `--ease-out-quint` で、上下 4px の移動と不透明度を同時に変える。一覧はボタンの側から出てくる向きに動かす（下に開くときは上から、上に開くときは下から）。閉じるときは `--duration-fast`（120ms）で、開くときより短くする。
- 動きを減らす設定のときは、移動をやめ、不透明度の変化だけを `--duration-fast` で行う。
- 選択中の項目には、チェックのアイコン（`ph:check`）を項目の決まった位置に付ける。色だけで示さない。アイコンの場所は選択されていない項目でも確保し、文字の位置を揃える。
- キーボードで移動中の項目（`data-focused`）は面の明度（`bg-surface-3`）で示す。マウスのホバーと同じ見た目にする。
- 一覧は浮いているものとして、`rounded-lg`、`bg-surface-2`、`border border-line`、`shadow-float` の組で作る。一覧の幅はボタンの幅（`--trigger-width`）以上にする。
- 項目の高さは密な一覧の 36px にし、項目には `user-select: none` を付ける。
- 上下の矢印キーで移動、Enter で確定、Esc で閉じる、文字を打つとその文字で始まる項目へ移る、という React Aria の標準のキーボード操作を消さない。
- 検索欄付きの場合、入力した文字に一致する項目がなければ、一覧の中に「一致する項目がない」ことを表示する。

## やってはいけないこと

- ブラウザ標準の `<select>` をそのまま使うこと（lint の `native-select`）。開いた一覧の見た目を制御できない。
- 選択中を、文字の色やアクセントの面だけで示すこと。
- 一覧の開閉に `transition-all`、既定のイージング、300ms を超える時間を使うこと。開くときと閉じるときを同じ長さにすること。
- 一覧に、浮いているもの用以外の影を付けること。影の段階を増やすこと。
- 30個の選択肢を、検索欄なしで1つの一覧に並べること。
- 選択肢が2〜3個しかないのに選択欄にすること。常に見えているラジオか、切り替えのタブの方が速い。

## コード例

選択肢が10個以下の選択欄である。

```tsx
import { Button, Label, ListBox, ListBoxItem, Popover, Select, SelectValue } from "react-aria-components";
import { Icon } from "@iconify/react";

const intervals = [
  { id: "never", name: "同期しない" },
  { id: "5m", name: "5分ごと" },
  { id: "15m", name: "15分ごと" },
  { id: "1h", name: "1時間ごと" },
  { id: "1d", name: "1日ごと" },
];

// 一覧の開閉。開くときは base、閉じるときは fast。動きを減らす設定では不透明度だけを動かす
const popoverMotion = [
  "transition-[opacity,translate] duration-(--duration-base) ease-out-quint",
  "data-entering:opacity-0 data-exiting:opacity-0 data-exiting:duration-(--duration-fast)",
  "data-[placement=bottom]:data-entering:-translate-y-1 data-[placement=bottom]:data-exiting:-translate-y-1",
  "data-[placement=top]:data-entering:translate-y-1 data-[placement=top]:data-exiting:translate-y-1",
  "motion-reduce:transition-opacity motion-reduce:duration-(--duration-fast)",
].join(" ");

const optionClass = [
  "flex h-9 cursor-default select-none items-center gap-2 rounded-md px-2 text-sm text-text outline-none",
  "data-focused:bg-surface-3 data-disabled:text-text-faint",
].join(" ");

export function SyncIntervalSelect() {
  return (
    <Select defaultSelectedKey="15m" className="flex w-56 flex-col gap-1.5">
      <Label className="select-none text-sm text-text-muted">同期の間隔</Label>
      <Button
        className={[
          "flex h-9 select-none items-center justify-between gap-2 rounded-md border border-line-control bg-surface-1 px-3 text-left text-text",
          "transition-colors duration-(--duration-fast) ease-out-quint",
          "data-hovered:bg-surface-2 data-pressed:bg-surface-3",
          "data-focus-visible:outline-2 data-focus-visible:outline-offset-2 data-focus-visible:outline-accent",
        ].join(" ")}
      >
        <SelectValue className="truncate data-placeholder:text-text-faint" />
        <Icon icon="ph:caret-up-down" aria-hidden className="size-4 shrink-0 text-text-muted" />
      </Button>
      <Popover
        offset={4}
        className={`w-(--trigger-width) rounded-lg border border-line bg-surface-2 p-1 shadow-float ${popoverMotion}`}
      >
        <ListBox items={intervals} className="max-h-72 overflow-auto outline-none">
          {(item) => (
            <ListBoxItem id={item.id} textValue={item.name} className={optionClass}>
              {({ isSelected }) => (
                <>
                  <span className="grid size-4 shrink-0 place-items-center">
                    {isSelected && <Icon icon="ph:check" aria-hidden className="size-4 text-text-strong" />}
                  </span>
                  <span className="truncate">{item.name}</span>
                </>
              )}
            </ListBoxItem>
          )}
        </ListBox>
      </Popover>
    </Select>
  );
}
```

- React Aria の `Popover` は、開くときに最初の1回だけ `data-entering` を付け、閉じるときに `data-exiting` を付けて、CSS の変化が終わるまで要素を残す。そのため `transition` だけで開閉の動きを付けられる。開く向きは `data-placement` で分かる。
- `motion-reduce:transition-opacity` にすると、動きを減らす設定のときは移動の変化が即座に終わり、不透明度だけが変わる。

選択肢が10個を超える場合の、検索欄付きの選択欄である。

```tsx
import { Button, ComboBox, Input, Label, ListBox, ListBoxItem, Popover } from "react-aria-components";
import { Icon } from "@iconify/react";

const regions = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
  "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
].map((name) => ({ id: name, name }));

const popoverMotion = [
  "transition-[opacity,translate] duration-(--duration-base) ease-out-quint",
  "data-entering:opacity-0 data-exiting:opacity-0 data-exiting:duration-(--duration-fast)",
  "data-[placement=bottom]:data-entering:-translate-y-1 data-[placement=bottom]:data-exiting:-translate-y-1",
  "data-[placement=top]:data-entering:translate-y-1 data-[placement=top]:data-exiting:translate-y-1",
  "motion-reduce:transition-opacity motion-reduce:duration-(--duration-fast)",
].join(" ");

export function RegionComboBox() {
  return (
    <ComboBox defaultItems={regions} menuTrigger="focus" className="flex w-64 flex-col gap-1.5">
      <Label className="select-none text-sm text-text-muted">配送先の都道府県</Label>
      <div className="relative">
        <Icon icon="ph:magnifying-glass" aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-muted" />
        <Input
          placeholder="例：東京"
          className={[
            "h-9 w-full rounded-md border border-line-control bg-surface-1 px-9 text-text placeholder:text-text-faint",
            "data-focused:outline-2 data-focused:outline-offset-2 data-focused:outline-accent",
          ].join(" ")}
        />
        <Button
          aria-label="候補をすべて表示"
          className="absolute top-1/2 right-1 grid size-7 -translate-y-1/2 select-none place-items-center rounded-sm text-text-muted data-hovered:bg-surface-2 data-pressed:bg-surface-3"
        >
          <Icon icon="ph:caret-up-down" aria-hidden className="size-4" />
        </Button>
      </div>
      <Popover offset={4} className={`w-(--trigger-width) rounded-lg border border-line bg-surface-2 p-1 shadow-float ${popoverMotion}`}>
        <ListBox
          className="max-h-72 overflow-auto outline-none"
          renderEmptyState={() => <p className="px-2 py-2 text-sm text-text-muted">一致する都道府県がない</p>}
        >
          {(item: { id: string; name: string }) => (
            <ListBoxItem
              id={item.id}
              textValue={item.name}
              className="flex h-9 cursor-default select-none items-center gap-2 rounded-md px-2 text-sm text-text outline-none data-focused:bg-surface-3"
            >
              {({ isSelected }) => (
                <>
                  <span className="grid size-4 shrink-0 place-items-center">
                    {isSelected && <Icon icon="ph:check" aria-hidden className="size-4 text-text-strong" />}
                  </span>
                  <span className="truncate">{item.name}</span>
                </>
              )}
            </ListBoxItem>
          )}
        </ListBox>
      </Popover>
    </ComboBox>
  );
}
```

- `ComboBox` は入力した文字で項目を絞り込み、上下の矢印キーで候補を移動し、Enter で確定する。確定した値は入力欄に表示される。
- `defaultItems` を渡すと、絞り込みは React Aria が行う。サーバーで検索する場合は `items` と `onInputChange` を使う。

## 確認方法

スクリーンショットと実際の操作で、次の点を見る。

1. 閉じた状態で、現在の値と開閉のアイコンが見えるか。
2. 開くとき、一覧がボタンの側から 4px 動きながら現れるか。閉じるときの方が短いか。動きを減らす設定のとき、移動せずに不透明度だけで開閉するか。
3. 選択中の項目にチェックのアイコンがあり、選択されていない項目と文字の位置が揃っているか。
4. キーボードだけで、開く、移動する、選ぶ、閉じる、の操作ができるか。文字を打つと、その文字で始まる項目に移るか。
5. 一覧が浮いて見えるか（ダークでは線と面の明度、ライトでは影）。影が `shadow-float` の1種類だけか。
6. 10個を超える選択肢の欄が、検索欄付きになっているか。一致しない文字を入れたときに、そのことが表示されるか。
