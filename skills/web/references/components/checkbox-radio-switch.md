# チェックボックス、ラジオ、スイッチ

ON と OFF、または少数の選択肢から選ぶ部品を作る段階で読む。トークンの名前は `references/tokens-tailwind.md` だけを出典とし、アクセントの使い方は `../design-core/references/color.md` の1節に従う。

## 目的

- 3つの部品を役割で使い分け、利用者が「押したらすぐ反映されるのか、保存が必要なのか」を見た目で予測できるようにする。
- 状態（ON、OFF、一部だけ選択、無効）を、色だけに頼らずに伝える。

## 守ること

- 使い分けは次のとおりにする。
  - **スイッチ**：押した瞬間に設定が反映される場合（通知を受け取る、自動で保存する）。保存ボタンと一緒に使わない。
  - **チェックボックス**：保存や送信のボタンを押して初めて反映される場合と、複数を選ぶ場合（同意する、一覧の行を選ぶ）。一部だけ選ばれた状態（`isIndeterminate`）も表せる。
  - **ラジオ**：互いに排他な2〜5個の選択肢から1つを選ぶ場合。選択肢を常に見せたいときに使う。6個以上なら選択欄（select.md のレシピ）にする。
- ON（選択中）の状態はアクセント（`--color-accent`）で示す。面に `bg-accent` を塗り、中の印は `text-accent-ink` にする。アクセントを使う「肯定的な状態」「選択中」の典型である（`../design-core/references/color.md` の1節）。
- 色に加えて形でも状態を示す。チェックボックスはチェックのアイコン（`ph:check-bold`）と一部選択のアイコン（`ph:minus-bold`）、ラジオは内側の点、スイッチはつまみの位置で示す。
- スイッチのつまみの移動は `--duration-fast`（120ms）と `--ease-spring-soft` で行う。右側が ON である（`references/intuitive-ui.md` の1.2節）。動きを減らす設定のときは、つまみを移動させる動きをやめ、即座に位置を変える（色の変化は残す）。
- OFF の状態の枠は、操作できる部品の枠（`border-line-control`、3:1 以上）にする。
- ラベルは部品の右に置き、ラベルを押しても切り替わるようにする（React Aria の部品は、ラベルを含めた全体が押せる範囲になる）。ラベルには `user-select: none` を付ける。
- フォーカスリングは、キーボード操作のとき（`data-focus-visible`）に、印の部分にアクセントの 2px の線を `outline-offset: 2px` で付ける。
- 無効の状態は不透明度を下げ、なぜ使えないかを補足の文字で示す（`references/intuitive-ui.md` の2.4節）。

## やってはいけないこと

- 保存ボタンのあるフォームの中にスイッチを置くこと。押した時点で反映されたのか分からなくなる。
- スイッチの ON と OFF を色だけで区別すること、左右の意味を逆にすること。
- 「有効にする／無効にする」のように、ラベルの文言が状態によって変わるスイッチ。ラベルは設定の名前（「自動で保存」）にし、状態はスイッチの位置で示す。
- ON の状態に、アクセント以外の色（成功の緑など）を新しく作ること。
- 印の枠に区切り線の `border-line` を使い、背景から見分けにくくすること。

## コード例

チェックボックスとラジオである。どちらも、保存のボタンを押して初めて反映される設定に使う。

```tsx
import { Checkbox, Label, Radio, RadioGroup } from "react-aria-components";
import { Icon } from "@iconify/react";

const ring = "group-data-focus-visible:outline-2 group-data-focus-visible:outline-offset-2 group-data-focus-visible:outline-accent";

export function ExportOptions() {
  return (
    <form className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Checkbox name="header" defaultSelected className="group flex select-none items-center gap-2 text-sm text-text data-disabled:opacity-50">
          {({ isSelected, isIndeterminate }) => (
            <>
              <span
                className={[
                  "grid size-4 place-items-center rounded-sm border border-line-control text-accent-ink",
                  "transition-colors duration-(--duration-fast) ease-out-quint",
                  "group-data-selected:border-accent group-data-selected:bg-accent",
                  "group-data-indeterminate:border-accent group-data-indeterminate:bg-accent",
                  ring,
                ].join(" ")}
              >
                {isIndeterminate ? (
                  <Icon icon="ph:minus-bold" aria-hidden className="size-3" />
                ) : isSelected ? (
                  <Icon icon="ph:check-bold" aria-hidden className="size-3" />
                ) : null}
              </span>
              見出しの行を含める
            </>
          )}
        </Checkbox>
      </div>

      <RadioGroup name="format" defaultValue="csv" className="flex flex-col gap-2">
        <Label className="select-none text-sm text-text-muted">書き出しの形式</Label>
        {[
          { value: "csv", label: "CSV（表計算ソフト向け）" },
          { value: "json", label: "JSON（プログラム向け）" },
        ].map((option) => (
          <Radio key={option.value} value={option.value} className="group flex select-none items-center gap-2 text-sm text-text">
            <span
              className={[
                "grid size-4 place-items-center rounded-full border border-line-control",
                "transition-colors duration-(--duration-fast) ease-out-quint",
                "group-data-selected:border-accent group-data-selected:bg-accent",
                ring,
              ].join(" ")}
            >
              <span className="size-1.5 rounded-full bg-accent-ink opacity-0 group-data-selected:opacity-100" />
            </span>
            {option.label}
          </Radio>
        ))}
      </RadioGroup>
    </form>
  );
}
```

押した瞬間に反映される設定のスイッチである。

```tsx
import { Switch } from "react-aria-components";

export function AutoSaveSwitch({ isSelected, onChange }: { isSelected: boolean; onChange: (value: boolean) => void }) {
  return (
    <Switch
      isSelected={isSelected}
      onChange={onChange}
      className="group flex select-none items-center justify-between gap-3 text-sm text-text data-disabled:opacity-50"
    >
      自動で保存
      <span
        className={[
          "flex h-5 w-9 shrink-0 items-center rounded-full border border-line-control bg-surface-3 px-0.5",
          "transition-colors duration-(--duration-fast) ease-out-quint",
          "group-data-selected:border-accent group-data-selected:bg-accent",
          "group-data-focus-visible:outline-2 group-data-focus-visible:outline-offset-2 group-data-focus-visible:outline-accent",
        ].join(" ")}
      >
        <span
          className={[
            "size-3.5 rounded-full bg-text-muted",
            "transition-[translate,background-color] duration-(--duration-fast) ease-spring-soft",
            "group-data-selected:translate-x-4 group-data-selected:bg-accent-ink",
            "motion-reduce:transition-colors",
          ].join(" ")}
        />
      </span>
    </Switch>
  );
}
```

- `motion-reduce:transition-colors` にすると、動きを減らす設定のときはつまみの移動が即座に終わり、色の変化だけが残る。
- スイッチの結果の保存に時間がかかる場合でも、つまみは押した時点で動かす。保存に失敗したら元の位置に戻し、理由をそばに表示する。

## 確認方法

スクリーンショットと実際の操作で、次の点を見る。

1. 保存ボタンのあるフォームにスイッチが混ざっていないか。押してすぐ反映される設定にチェックボックスを使っていないか。
2. ON の状態がアクセントの面で示され、白黒で見ても印の形とつまみの位置で状態が分かるか。
3. OFF の状態の枠が、ダークとライトの両方で背景から見分けられるか。
4. スイッチのつまみが右に動くと ON になり、わずかに行き過ぎて戻る程度の動きか。動きを減らす設定のとき、移動の動きがなくなるか。
5. ラベルを押しても切り替わり、連打してもラベルの文字が選択されないか。
6. Tab で移動したとき、印の部分にフォーカスリングが出るか。Space で切り替わるか。
