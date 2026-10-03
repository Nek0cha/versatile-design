# タブ

同じ場所に表示する内容を切り替えるタブを作る段階で読む。トークンの名前は `references/tokens-tailwind.md` だけを出典とし、動きは `references/motion-web.md` の3節に従う。

## 目的

- 今どのタブを見ているかが一目で分かり、切り替えたときに選択中の印がどこからどこへ移ったかが分かるタブを作る。

## 守ること

- 土台は React Aria の `Tabs`、`TabList`、`Tab`、`TabPanel` にする。左右の矢印キーでの移動、Home と End、選択中のタブだけが Tab キーの対象になる動作は、React Aria の標準の動作であり、消さない。
- 選択中の表示は、次の2つのどちらかにし、画面全体で統一する。
  - **下線**：選択中のタブの下にアクセント（`bg-accent`）の 2px の線を引く。内容の上に置く、ページの区分を切り替えるタブに使う。
  - **背景の島**：タブの列を1段明るい面で囲み、選択中のタブの後ろに `bg-surface-3` の角丸の面を置く。表示の切り替え（一覧と格子など）のように、少数の選択肢を並べたものに使う。
- 選択中の印は、タブを切り替えたときに前のタブの位置から新しいタブの位置へ移動させる。Motion の `layoutId` を使い、同じ `layoutId` を持つ要素が別の場所に描画されたときに、間をつないで動かす。所要時間は `--duration-base`（180ms 相当）と `--ease-out-quint` にする。
- `layoutId` は、同じ画面に置いたタブの組ごとに別の値にする（`useId()` で作る）。同じ値を使うと、別の組のタブの間で印が飛ぶ。
- アプリ全体を `MotionConfig reducedMotion="user"` で包む（`references/motion-web.md` の3節）。動きを減らす設定のときは、印を移動させず、新しい位置で不透明度だけを変える。
- 各タブにはアイコン（Iconify）とラベルを組にして置く。アイコンだけのタブにしない。件数を付ける場合は、ラベルの後ろに `text-text-muted` の等幅数字で置く（`references/mode-app.md` の7節）。
- 選択中のタブの文字は `text-text-strong`、それ以外は `text-text-muted` にし、ホバーで `text-text` にする。
- タブには `user-select: none` を付ける。
- フォーカスリングは、キーボード操作のとき（`data-focus-visible`）にアクセントの 2px の線で付ける。タブの内容（`TabPanel`）もフォーカスを受けるため、同じリングを付ける。Tailwind v4 の `outline-none` は線の種類を `none` にし、後から付けた `outline-2` の線も消えてしまうため、フォーカスリングを出す要素には `outline-none` を書かない。

## やってはいけないこと

- 選択中を文字の色だけで示すこと。印の線か面を必ず付ける。
- 選択中の印を、移動の動きなしに切り替えること、または 300ms を超える長い動きにすること。
- 1つの画面で、下線のタブと背景の島のタブを混ぜること。
- 下線と背景の島の両方にアクセントを使い、アクセントの面積を増やすこと。
- タブの切り替えで内容の高さが変わり、タブより下の部品が上下に跳ねること。高さが大きく違う場合は、内容の側で高さを確保する。
- 文字の矢印や絵文字をタブのアイコンに使うこと。

## コード例

下線が移動するタブである。

```tsx
import { useId } from "react";
import { Tab, TabList, TabPanel, Tabs } from "react-aria-components";
import { Icon } from "@iconify/react";
import { MotionConfig, motion, useReducedMotion } from "motion/react";

const tabs = [
  { id: "activity", label: "更新の履歴", icon: "ph:clock-counter-clockwise", count: 12 },
  { id: "members", label: "メンバー", icon: "ph:users", count: 4 },
  { id: "settings", label: "設定", icon: "ph:gear-six", count: 0 },
];

function Underline({ layoutId }: { layoutId: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.span
      layoutId={reduce ? undefined : layoutId}
      initial={reduce ? { opacity: 0 } : false}
      animate={{ opacity: 1 }}
      transition={{ duration: reduce ? 0.12 : 0.18, ease: [0.22, 1, 0.36, 1] }}
      className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-accent"
    />
  );
}

export function ProjectTabs() {
  const layoutId = `tab-underline-${useId()}`;
  return (
    <MotionConfig reducedMotion="user">
      <Tabs defaultSelectedKey="activity" className="flex flex-col">
        <TabList aria-label="プロジェクトの表示" items={tabs} className="flex gap-1 border-b border-line">
          {(tab) => (
            <Tab
              id={tab.id}
              className={[
                "relative flex h-10 cursor-default select-none items-center gap-2 px-3 text-sm text-text-muted",
                "transition-colors duration-(--duration-fast) ease-out-quint",
                "data-hovered:text-text data-selected:text-text-strong",
                "data-focus-visible:outline-2 data-focus-visible:outline-offset-2 data-focus-visible:outline-accent",
              ].join(" ")}
            >
              {({ isSelected }) => (
                <>
                  <Icon icon={tab.icon} aria-hidden className="size-4" />
                  <span>{tab.label}</span>
                  {tab.count > 0 && <span className="font-mono text-xs tabular-nums text-text-muted">{tab.count}</span>}
                  {isSelected && <Underline layoutId={layoutId} />}
                </>
              )}
            </Tab>
          )}
        </TabList>
        {tabs.map((tab) => (
          <TabPanel key={tab.id} id={tab.id} className="min-h-64 rounded-md py-4 text-text data-focus-visible:outline-2 data-focus-visible:outline-offset-2 data-focus-visible:outline-accent">
            {tab.label}の内容が入る。
          </TabPanel>
        ))}
      </Tabs>
    </MotionConfig>
  );
}
```

- 下線は選択中のタブの中にだけ描画する。選択が変わると、前のタブの下線が消えて新しいタブに同じ `layoutId` の下線が現れ、Motion がその間を移動の動きでつなぐ。
- 動きを減らす設定のときは `layoutId` を外し、新しいタブの下線を不透明度だけで出す。`MotionConfig reducedMotion="user"` もレイアウトの移動を止めるが、どちらの設定でも同じ見た目になるよう、部品の側でも分けておく。

背景の島が移動する、表示の切り替えのタブである。

```tsx
import { useId } from "react";
import { Tab, TabList, Tabs } from "react-aria-components";
import { Icon } from "@iconify/react";
import { MotionConfig, motion, useReducedMotion } from "motion/react";

const views = [
  { id: "list", label: "一覧", icon: "ph:list-bullets" },
  { id: "grid", label: "格子", icon: "ph:squares-four" },
  { id: "board", label: "ボード", icon: "ph:kanban" },
];

export function ViewSwitcher({ onChange }: { onChange: (view: string) => void }) {
  const layoutId = `view-island-${useId()}`;
  const reduce = useReducedMotion();
  return (
    <MotionConfig reducedMotion="user">
      <Tabs defaultSelectedKey="list" onSelectionChange={(key) => onChange(String(key))}>
        <TabList aria-label="表示の切り替え" items={views} className="inline-flex gap-0.5 rounded-island bg-surface-1 p-0.5">
          {(view) => (
            <Tab
              id={view.id}
              className={[
                "relative flex h-8 cursor-default select-none items-center gap-1.5 rounded-md px-2.5 text-sm text-text-muted",
                "transition-colors duration-(--duration-fast) ease-out-quint",
                "data-hovered:text-text data-selected:text-text-strong",
                "data-focus-visible:outline-2 data-focus-visible:outline-offset-2 data-focus-visible:outline-accent",
              ].join(" ")}
            >
              {({ isSelected }) => (
                <>
                  {isSelected && (
                    <motion.span
                      layoutId={reduce ? undefined : layoutId}
                      initial={reduce ? { opacity: 0 } : false}
                      animate={{ opacity: 1 }}
                      transition={{ duration: reduce ? 0.12 : 0.18, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute inset-0 rounded-md bg-surface-3"
                    />
                  )}
                  <Icon icon={view.icon} aria-hidden className="relative size-4" />
                  <span className="relative">{view.label}</span>
                </>
              )}
            </Tab>
          )}
        </TabList>
      </Tabs>
    </MotionConfig>
  );
}
```

- 島の面は文字より後ろに置くため、アイコンとラベルに `relative` を付けて、面より手前に描画する。
- 背景の島ではアクセントを使わず、面の明度（`bg-surface-3`）だけで選択中を示す。アクセントはフォーカスリングにだけ使う。

## 確認方法

スクリーンショットと実際の操作で、次の点を見る。

1. どのタブが選択中か、文字の色と、下線か背景の島の両方で分かるか。
2. タブを切り替えると、印が前のタブから新しいタブへ滑らかに移動するか。動きが 300ms より短く、終わり際に減速しているか。
3. 動きを減らす設定のとき、印が移動せず、新しい位置に不透明度の変化で現れるか。
4. 同じ画面に2組のタブがあるとき、印が別の組へ飛ばないか。
5. 各タブにアイコンとラベルがあり、タブを連打してもラベルが選択されないか。
6. 左右の矢印キーでタブを移動でき、Tab キーでタブの列から内容へ移れるか。
7. タブを切り替えても、タブより下の部品が上下に跳ねないか。
