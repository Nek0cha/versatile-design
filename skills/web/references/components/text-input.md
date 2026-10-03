# テキスト入力

1行の入力欄と複数行の入力欄（テキストエリア）を作る段階で読む。トークンの名前は `references/tokens-tailwind.md` だけを出典とし、ラベルと検証の考え方は `references/intuitive-ui.md` の2.5節と7.3節に従う。

## 目的

- 何を入れる欄かが入力の前も途中も分かり、間違えたときは原因と直し方がその場で分かる入力欄を作る。

## 守ること

- ラベルは入力欄の上に常に表示する（`text-text-muted`）。補足の説明はラベルと入力欄の間か入力欄の下に置く。
- エラーは入力欄の下に、危険の色（`--color-danger`）の文字とアイコン（Iconify の `ph:warning-circle` など）で出す。入力欄の枠も危険の色にする。色だけで伝えない（`references/intuitive-ui.md` の2.5節）。
- エラーの文章は、何が起きたかと直し方を書き、選択してコピーできるまま残す（`select-none` を付けない）。
- 検証は入力の途中では行わず、欄を離れたときか送信のときに行う。React Aria の `TextField` に `validationBehavior="aria"` を指定し、エラーを `aria-invalid` と `aria-describedby` で入力欄につなぐ（React Aria が自動で行う）。
- フォーカスリングはアクセント（`--color-accent`）の 2px の線を `outline-offset: 2px` で付ける。入力欄は文字を打つ場所なので、マウスで押したときもフォーカスリングを出す（`data-focused`）。
- 入力欄の枠は操作できる部品の枠（`border-line-control`、3:1 以上）にする。区切り線の `border-line` を使わない（`../design-core/references/color.md` の5節）。
- 入力欄の幅は入る文字の量に合わせる。郵便番号や数桁のコードの欄を全幅にしない。
- テキストエリアは、最低の行数を決めて高さを確保し、文字数の上限がある場合は残りの文字数を等幅の数字（`tabular-nums`）で右下に出す。
- 入力欄の中身は選択できるまま残す。ラベルは `select-none` にしてよいが、入力欄の中身にはかけない。

## やってはいけないこと

- プレースホルダーをラベルの代わりにすること。入力を始めると消え、何の欄だったか分からなくなる。プレースホルダーは入力例（「例：山田 花子」）にだけ使う。
- 1文字打つたびにエラーを出すこと。
- 「入力内容に誤りがあります」だけのエラー、入力欄から離れた場所（画面の上端だけ）に出すエラー。
- エラーのときに入力した内容を消すこと。
- 枠を消して下線だけにするなど、押せる場所が分からない入力欄。

## コード例

ラベル、説明、エラーを持つ1行の入力欄である。

```tsx
import { FieldError, Input, Label, Text, TextField } from "react-aria-components";
import { Icon } from "@iconify/react";

export function EmailField() {
  return (
    <TextField
      name="email"
      type="email"
      isRequired
      validationBehavior="aria"
      validate={(value) => (value.includes("@") ? null : "「@」を含むメールアドレスを入力する。例：name@example.com")}
      className="group flex w-80 flex-col gap-1.5"
    >
      <Label className="select-none text-sm text-text-muted">通知を受け取るメールアドレス</Label>
      <Input
        placeholder="name@example.com"
        className={[
          "h-9 rounded-md border border-line-control bg-surface-1 px-3 font-body text-text",
          "placeholder:text-text-faint",
          "transition-colors duration-(--duration-fast) ease-out-quint",
          "data-hovered:border-text-muted",
          "data-focused:outline-2 data-focused:outline-offset-2 data-focused:outline-accent",
          "data-invalid:border-danger",
          "data-disabled:opacity-50",
        ].join(" ")}
      />
      <Text slot="description" className="text-xs text-text-muted group-data-invalid:hidden">
        更新のお知らせだけを送る。
      </Text>
      <FieldError className="flex items-start gap-1.5 text-xs text-danger">
        {({ validationErrors }) => (
          <>
            <Icon icon="ph:warning-circle" aria-hidden className="mt-px size-3.5 shrink-0" />
            <span>{validationErrors.join(" ")}</span>
          </>
        )}
      </FieldError>
    </TextField>
  );
}
```

- `validationBehavior="aria"` では、送信を止めずに、欄を離れたときと値が変わったときにエラーの状態を付け直す。入力の途中でエラーを出さないため、エラーの表示は欄を離れた後（`onBlur` の後）に限る作りにしてもよい。
- `FieldError` は、エラーがあるときだけ描画される。子に関数を1つだけ渡すと `validate` が返した文章（`validationErrors`）を受け取れるため、アイコンと並べても文章を2か所に書かずに済む。アイコンも関数の中に入れる。

文字数の上限があるテキストエリアである。

```tsx
import { useState } from "react";
import { FieldError, Label, Text, TextArea, TextField } from "react-aria-components";
import { Icon } from "@iconify/react";

const MAX = 200;

export function NoteField() {
  const [value, setValue] = useState("");
  const rest = MAX - value.length;
  return (
    <TextField
      value={value}
      onChange={setValue}
      validationBehavior="aria"
      validate={(v) => (v.length > MAX ? `${v.length - MAX}文字多い。${MAX}文字以内に短くする。` : null)}
      className="flex w-full max-w-[34em] flex-col gap-1.5"
    >
      <Label className="select-none text-sm text-text-muted">担当者へのメモ</Label>
      <TextArea
        rows={4}
        className={[
          "min-h-24 resize-y rounded-md border border-line-control bg-surface-1 px-3 py-2 font-body text-text",
          "transition-colors duration-(--duration-fast) ease-out-quint",
          "data-focused:outline-2 data-focused:outline-offset-2 data-focused:outline-accent",
          "data-invalid:border-danger",
        ].join(" ")}
      />
      <div className="flex items-start justify-between gap-3">
        <FieldError className="flex items-start gap-1.5 text-xs text-danger">
          {({ validationErrors }) => (
            <>
              <Icon icon="ph:warning-circle" aria-hidden className="mt-px size-3.5 shrink-0" />
              <span>{validationErrors.join(" ")}</span>
            </>
          )}
        </FieldError>
        <Text slot="description" className={`ml-auto text-xs tabular-nums ${rest < 0 ? "text-danger" : "text-text-muted"}`}>
          残り {rest} 文字
        </Text>
      </div>
    </TextField>
  );
}
```

## 確認方法

スクリーンショットと実際の操作で、次の点を見る。

1. 入力を始めた後も、ラベルで何の欄か分かるか。プレースホルダーがラベルの代わりになっていないか。
2. エラーのとき、入力欄の下に危険の色の文章とアイコンが並び、枠も危険の色になっているか。白黒で見ても、アイコンと文章でエラーと分かるか。
3. 文字を打っている途中でエラーが出ないか。欄を離れたときか送信のときに出るか。
4. エラーの文章をドラッグして選択し、コピーできるか。
5. フォーカスリングがアクセントの 2px で、入力欄から 2px 離れているか。ダークとライトの両方で、入力欄の枠が背景から見分けられるか。
6. 入力欄の幅が、入る文字の量に合っているか。
