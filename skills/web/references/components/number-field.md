# 数値入力

数値を入力する欄と、設定やインスペクタの数値パラメータの1行を作る段階で読む。トークンの名前は `references/tokens-tailwind.md` だけを出典とし、1行の構成と列の幅は `references/mode-app.md` の9節と調整欄に従う。

## 目的

- 正確な値を打てて、少しずつの調整もでき、範囲外の値や意図しない変化が起きない数値入力を作る。
- 数値入力はアプリ系の手触りを決める部品であり、記憶のフックの候補にもなる（`references/mode-app.md` の1節）。

## 守ること

- 土台は React Aria の `NumberField` にする。`minValue`、`maxValue`、`step` で入る値を制限し、範囲外の値は欄を離れたときに範囲内へ丸められる（`references/intuitive-ui.md` の7.2節）。
- ブラウザ標準の矢印（スピンボタン）を CSS で消す。`NumberField` の入力欄は `type="text"` なので標準の矢印は出ないが、既存のコードや他のライブラリが `type="number"` を使っている場合に備え、全体の CSS にも消す指定を置く（下の2つ目の例）。
- 自前の増減ボタンを付ける。アイコンは Iconify の `ph:minus` と `ph:plus` を使い、`slot="decrement"` と `slot="increment"` の `Button` にする。長押しで連続して増減する動作と、上下の矢印キー、Page Up と Page Down での増減は React Aria の標準の動作であり、消さない。
- マウスのホイールでは値を変えない（`isWheelDisabled`）。スクロールの途中で値が変わる事故を防ぐ（`../design-core/references/anti-patterns.md` の X16）。
- 単位は入力欄の中か直後に `text-text-muted` で添え、入力する値と区別する。単位を値の文字列に混ぜない。
- 数字は等幅（`font-variant-numeric: tabular-nums`、クラスは `tabular-nums`）で右寄せにする。値が変わっても桁の位置が動かない。
- フォーカスリングは入力欄を囲む `Group` に付ける（`data-focus-within`）。入力欄そのものの `outline-none` は、リングを `Group` に移すためのものである。
- 増減ボタンには `user-select: none` を付け、押下中の面（`data-pressed:bg-surface-3`）を付ける。押せる範囲は 24px 四方以上にする。
- 数値パラメータの1行は「アイコン＋ラベル＋スライダー＋数値入力＋単位＋リセット」の構成にし、列の幅を CSS グリッドで固定する（`references/mode-app.md` の9節）。スライダーと数値入力は常に同じ値を示す。
- リセットは、値が初期値と違うときだけ押せる状態にし、初期値のときも場所は確保しておく。
- スライダーのドラッグ中の細かな変化は、取り消しの単位として1回にまとめる。React Aria の `Slider` の `onChangeEnd` の時点で履歴に1件として記録する（`references/intuitive-ui.md` の4.3節）。

## やってはいけないこと

- `<input type="number">` をそのまま使うこと（lint の `native-number-input`）。
- 増減ボタンを入力欄の上下に縦に小さく積むこと。押せる範囲が狭く、押し間違える。
- 単位を含めた文字列（「12px」）を入力欄の値にすること。打ち直すときに単位を消す手間が生じる。
- 比例幅の数字のまま右寄せにすること。桁ごとに幅が違い、値が変わるたびに数字が揺れる。
- 行ごとに列の幅が違うパラメータの一覧。スライダーと数値入力の位置が縦に揃わない。
- リセットを初期値のときに消して、行の中の位置をずらすこと。

## コード例

自前の増減ボタンと単位を持つ数値入力である。

```tsx
import { Button, Group, Input, Label, NumberField } from "react-aria-components";
import { Icon } from "@iconify/react";

const stepButton = [
  "grid size-7 shrink-0 select-none place-items-center rounded-sm text-text-muted",
  "transition-colors duration-(--duration-fast) ease-out-quint",
  "data-hovered:bg-surface-2 data-hovered:text-text data-pressed:bg-surface-3",
  "data-disabled:opacity-40",
].join(" ");

export function GapField() {
  return (
    <NumberField defaultValue={12} minValue={0} maxValue={96} step={4} isWheelDisabled className="flex flex-col gap-1.5">
      <Label className="select-none text-sm text-text-muted">要素の間隔</Label>
      <Group
        className={[
          "flex h-9 w-40 items-center gap-1 rounded-md border border-line-control bg-surface-1 px-1",
          "data-focus-within:outline-2 data-focus-within:outline-offset-2 data-focus-within:outline-accent",
        ].join(" ")}
      >
        <Button slot="decrement" aria-label="4 減らす" className={stepButton}>
          <Icon icon="ph:minus" aria-hidden className="size-4" />
        </Button>
        <Input
          className={[
            "min-w-0 flex-1 bg-transparent text-right font-body tabular-nums text-text outline-none",
            // NumberField は type="text" なので標準の矢印は出ないが、念のため消す
            "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
          ].join(" ")}
        />
        <span className="select-none text-sm text-text-muted">px</span>
        <Button slot="increment" aria-label="4 増やす" className={stepButton}>
          <Icon icon="ph:plus" aria-hidden className="size-4" />
        </Button>
      </Group>
    </NumberField>
  );
}
```

`type="number"` の入力欄が残っている場合に、ブラウザ標準の矢印を全体で消す CSS である。`@layer base` に置く。

```css
@layer base {
  input[type="number"] {
    appearance: textfield;
    -moz-appearance: textfield;
  }

  input[type="number"]::-webkit-inner-spin-button,
  input[type="number"]::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
}
```

スライダー、数値入力、単位、リセットを組み合わせた数値パラメータの1行である。行が何十個並んでも列が縦に揃うよう、列の幅をグリッドで固定する。

```tsx
import { useId, useState } from "react";
import { Button, Group, Input, NumberField, Slider, SliderThumb, SliderTrack } from "react-aria-components";
import { Icon } from "@iconify/react";

type ParamRowProps = {
  icon: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  initial: number;
  // 取り消しの履歴に1件として積む。ドラッグ中は呼ばれず、離したときに1回だけ呼ばれる
  onCommit: (value: number) => void;
};

const iconButton = [
  "grid size-6 select-none place-items-center rounded-sm text-text-muted",
  "transition-[background-color,opacity] duration-(--duration-fast) ease-out-quint",
  "data-hovered:bg-surface-2 data-pressed:bg-surface-3",
  "data-focus-visible:outline-2 data-focus-visible:outline-offset-2 data-focus-visible:outline-accent",
  "data-disabled:opacity-0",
].join(" ");

export function ParamRow({ icon, label, unit, min, max, step, initial, onCommit }: ParamRowProps) {
  const [value, setValue] = useState(initial);
  const labelId = useId();

  return (
    <div className="grid h-9 grid-cols-[16px_112px_minmax(0,1fr)_64px_24px_24px] items-center gap-2 px-3">
      <Icon icon={icon} aria-hidden className="size-4 text-text-muted" />
      <span id={labelId} className="select-none truncate text-sm text-text-muted">
        {label}
      </span>

      <Slider
        aria-labelledby={labelId}
        value={value}
        minValue={min}
        maxValue={max}
        step={step}
        onChange={setValue}
        onChangeEnd={onCommit}
        className="flex h-6 items-center"
      >
        <SliderTrack className="relative h-6 w-full">
          {({ state }) => (
            <>
              <div className="absolute top-1/2 h-1 w-full -translate-y-1/2 rounded-full bg-surface-3" />
              <div
                className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-text-muted"
                style={{ width: `${state.getThumbPercent(0) * 100}%` }}
              />
              <SliderThumb
                className={[
                  "top-1/2 size-3.5 -translate-y-1/2 rounded-full border border-line-control bg-text-strong",
                  "data-dragging:bg-text",
                  "data-focus-visible:outline-2 data-focus-visible:outline-offset-2 data-focus-visible:outline-accent",
                ].join(" ")}
              />
            </>
          )}
        </SliderTrack>
      </Slider>

      <NumberField
        aria-labelledby={labelId}
        value={value}
        minValue={min}
        maxValue={max}
        step={step}
        isWheelDisabled
        onChange={(v) => {
          if (Number.isNaN(v)) return;
          setValue(v);
          onCommit(v);
        }}
      >
        <Group className="flex h-7 items-center rounded-sm border border-line-control bg-surface-1 data-focus-within:outline-2 data-focus-within:outline-offset-2 data-focus-within:outline-accent">
          <Input className="w-full min-w-0 bg-transparent px-1.5 text-right font-body text-sm tabular-nums text-text outline-none" />
        </Group>
      </NumberField>
      <span className="select-none text-xs text-text-muted">{unit}</span>

      <Button
        aria-label={`${label}を初期値（${initial}${unit}）に戻す`}
        isDisabled={value === initial}
        onPress={() => {
          setValue(initial);
          onCommit(initial);
        }}
        className={iconButton}
      >
        <Icon icon="ph:arrow-counter-clockwise" aria-hidden className="size-3.5" />
      </Button>
    </div>
  );
}

export function TypePanel({ record }: { record: (name: string, value: number) => void }) {
  return (
    <div className="flex flex-col divide-y divide-line">
      <ParamRow icon="ph:text-aa" label="文字の大きさ" unit="px" min={10} max={96} step={1} initial={16} onCommit={(v) => record("size", v)} />
      <ParamRow icon="ph:arrows-out-line-vertical" label="行の高さ" unit="%" min={100} max={250} step={5} initial={170} onCommit={(v) => record("leading", v)} />
      <ParamRow icon="ph:arrows-out-line-horizontal" label="字間" unit="em" min={-0.1} max={0.4} step={0.01} initial={0} onCommit={(v) => record("tracking", v)} />
    </div>
  );
}
```

- リセットは、初期値のときに `data-disabled:opacity-0` で見えなくするが、グリッドの列は残るため、行の中の位置は動かない。
- スライダーの塗りはグレーの段階（`bg-text-muted`）にする。アクセントは選択中と肯定的な状態にだけ使い（`../design-core/references/color.md` の1節）、ここではフォーカスリングにだけ使う。
- 値の幅が狭い（目安として10段階以下）値はスライダーを省き、その列を空けたまま数値入力だけを置く。

## 確認方法

スクリーンショットと実際の操作で、次の点を見る。

1. ブラウザ標準の矢印が、どのブラウザでも出ていないか。
2. 増減ボタンを長押しすると値が連続して変わり、離すと止まるか。上下の矢印キーでも増減するか。
3. ページをスクロールしているときに、マウスのホイールで値が変わらないか。
4. 値が 9 から 10、99 から 100 に変わるとき、数字の位置が揺れないか。単位が値と区別できる薄さか。
5. パラメータの行を並べたとき、アイコン、ラベル、スライダー、数値入力、単位、リセットの列が縦に揃っているか。
6. 初期値のときにリセットが押せず、値を変えると現れて、他の列の位置が動かないか。
7. スライダーを一度ドラッグした後に取り消すと、ドラッグの前の値に1回で戻るか。
