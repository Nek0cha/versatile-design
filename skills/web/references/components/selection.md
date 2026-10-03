# 文字の選択とコピー

`user-select` を決める段階と、コピーされやすい値を表示する段階で読む。トークンの名前は `references/tokens-tailwind.md` だけを出典とし、アプリ系での考え方は `references/mode-app.md` の10節に従う。

## 目的

- 操作の部品を連打したりドラッグしたりしたときに、文字が選択されて反転するのを防ぐ。
- 利用者がコピーしたい文字は、選択してコピーできるように残す。よくコピーされる値は、ボタン1つでコピーできるようにする。

## 守ること

### `user-select` のルール

| 扱い | 対象 | Tailwind のクラス |
|---|---|---|
| `none` にする | ボタン、タブ、ナビゲーション、メニュー項目、アイコン、バッジ、チェックボックスやトグルのラベル、ドラッグできる要素 | `select-none` |
| 選択できるまま残す | 本文、見出し、記事の中身、エラーメッセージ、ID・注文番号・API キー・コード・メールアドレス、入力欄の中身 | 何も付けない |
| 1回のクリックで全体を選ぶ | ID、API キー、注文番号など、一部だけを選ぶことがない短い値 | `select-all` |

- `select-none` は部品ごとに付ける。ページ全体や大きな領域（`body`、サイドバー全体など）にまとめてかけない。まとめてかけると、中にある本文やエラーまで選択できなくなる。
- 入力欄のラベルには `select-none` を付けてよいが、入力欄の中身には付けない。
- 一部だけを選ぶことがある文字（本文、エラーの文章、複数行のコード）には `select-all` を付けない。

### コピーボタン

- ID、API キー、コード、招待のリンクなど、コピーされやすい値の横にはコピーボタンを置く。値と同じ行の右端か、コードの表示の右上の角に置く。
- コピーボタンはアイコンだけのボタン（`ph:copy`）にし、`aria-label` とツールチップを付ける（`references/components/tooltip-popover-menu.md`）。
- 押したらアイコンをチェック（`ph:check`）に替え、1.5 秒たったら元のアイコンに戻す。ツールチップの文言も「コピー」から「コピーした」に替える。読み上げ用に、`role="status"` の領域で「コピーした」と伝える。
- アイコンの入れ替えは、不透明度とわずかな拡大（0.8 倍から等倍）を `--duration-fast`（120ms）と `--ease-out-quint` で行う。動きを減らす設定のときは、拡大をやめて不透明度だけを変える。
- チェックのアイコンはアクセントの色（`text-success`）にする。完了は「肯定的な状態」に当たる（`../design-core/references/color.md` の1節）。
- クリップボードへの書き込みに失敗したとき（権限がない、安全でない接続など）は、値の文字を選択した状態にして、ツールチップで「コピーできなかった。選択した文字をコピーする」と伝える。何も起きないまま終わらせない。
- コピーする値は、表示している文字と同じにする。表示を省略している場合（API キーの一部を伏せるなど）も、コピーするのは完全な値にし、そのことをツールチップに書く。

## やってはいけないこと

- `body` や画面全体に `select-none` をかけること。
- エラーメッセージ、ID、コードに `select-none` を付けること。
- ボタンやタブに `select-none` を付け忘れ、連打したときにラベルが青く反転すること。
- コピーしたことを、トーストやダイアログで知らせること。押したボタンの場所で知らせる。
- コピーした後のアイコンを、元に戻さずにチェックのまま残すこと。もう一度コピーできるか分からなくなる。
- 絵文字や文字の記号（「✓」など）をコピー済みの印に使うこと（`../design-core/references/anti-patterns.md` の X6）。

## コード例

コピーボタンと、API キーの行での使い方である。

```tsx
import { useEffect, useRef, useState, type RefObject } from "react";
import { Button, Tooltip, TooltipTrigger } from "react-aria-components";
import { Icon } from "@iconify/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

type CopyState = "idle" | "copied" | "failed";

const RESET_MS = 1500;

export function CopyButton({ value, label, valueRef }: { value: string; label: string; valueRef?: RefObject<HTMLElement | null> }) {
  const [state, setState] = useState<CopyState>("idle");
  const timer = useRef<number | undefined>(undefined);
  const reduce = useReducedMotion();

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async () => {
    window.clearTimeout(timer.current);
    try {
      await navigator.clipboard.writeText(value);
      setState("copied");
    } catch {
      // 書き込めなかったときは値の文字を選択し、利用者が自分でコピーできるようにする
      const el = valueRef?.current;
      if (el) {
        const range = document.createRange();
        range.selectNodeContents(el);
        window.getSelection()?.removeAllRanges();
        window.getSelection()?.addRange(range);
      }
      setState("failed");
    }
    // 1.5 秒たったら元のアイコンに戻す
    timer.current = window.setTimeout(() => setState("idle"), RESET_MS);
  };

  const tooltip = state === "copied" ? "コピーした" : state === "failed" ? "コピーできなかった。選択した文字をコピーする" : label;
  const swap = {
    initial: reduce ? { opacity: 0 } : { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    exit: reduce ? { opacity: 0 } : { opacity: 0, scale: 0.8 },
    transition: { duration: 0.12, ease: [0.22, 1, 0.36, 1] as const },
  };

  return (
    <>
      {/* 押してもツールチップを閉じない。既定（shouldCloseOnPress が true）では押した時点で閉じ、「コピーした」が見えない */}
      <TooltipTrigger delay={500} shouldCloseOnPress={false}>
        <Button
          aria-label={label}
          onPress={copy}
          className={[
            "relative grid size-7 shrink-0 select-none place-items-center rounded-md text-text-muted",
            "transition-colors duration-(--duration-fast) ease-out-quint",
            "data-hovered:bg-surface-2 data-hovered:text-text data-pressed:bg-surface-3",
            "data-focus-visible:outline-2 data-focus-visible:outline-offset-2 data-focus-visible:outline-accent",
          ].join(" ")}
        >
          <AnimatePresence initial={false} mode="popLayout">
            {state === "copied" ? (
              <motion.span key="check" {...swap} className="grid place-items-center text-success">
                <Icon icon="ph:check" aria-hidden className="size-4" />
              </motion.span>
            ) : (
              <motion.span key="copy" {...swap} className="grid place-items-center">
                <Icon icon="ph:copy" aria-hidden className="size-4" />
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
        <Tooltip offset={6} className="rounded-sm border border-line bg-surface-2 px-2 py-1 text-xs text-text shadow-float">
          {tooltip}
        </Tooltip>
      </TooltipTrigger>
      {/* 読み上げ用。見た目には出さない */}
      <span role="status" className="sr-only">
        {state === "copied" ? "コピーした" : state === "failed" ? "コピーできなかった" : ""}
      </span>
    </>
  );
}

export function ApiKeyRow({ apiKey }: { apiKey: string }) {
  const valueRef = useRef<HTMLElement>(null);
  return (
    <div className="flex h-11 items-center gap-3 border-b border-line px-3">
      {/* ラベルは操作の対象ではないため選択させない。値は1回のクリックで全体を選べるようにする */}
      <span className="w-28 shrink-0 select-none text-sm text-text-muted">API キー</span>
      <code ref={valueRef} className="min-w-0 flex-1 truncate font-mono text-sm text-text select-all">
        {apiKey}
      </code>
      <CopyButton value={apiKey} label="API キーをコピー" valueRef={valueRef} />
    </div>
  );
}
```

- `AnimatePresence` の `mode="popLayout"` は、出ていくアイコンを配置から外し、入ってくるアイコンと同じ場所で重ねて入れ替える。ボタンの大きさは変わらない。
- 1.5 秒の間にもう一度押した場合は、前のタイマーを消してから数え直す。画面から消えたときもタイマーを消す。
- React Aria の `TooltipTrigger` は、既定ではボタンを押した時点でツールチップを閉じる。`shouldCloseOnPress={false}` にすると、マウスを載せたまま押した場合と、キーボードでフォーカスして Enter で押した場合に、ツールチップが開いたまま文言だけが「コピーした」に替わる。ツールチップが出る前（0.5 秒以内）に押した場合も、マウスが載っていれば 0.5 秒後に「コピーした」で出る。
- 読み上げ用の `role="status"` の領域は、ボタンの外に常に置いておく。中の文字が変わったときに読み上げられる。

## 確認方法

スクリーンショットと実際の操作で、次の点を見る。

1. ボタン、タブ、メニュー項目を素早く何度も押したり、ドラッグしたりしても、ラベルが選択されて反転しないか。
2. 本文、見出し、エラーメッセージ、ID、コード、入力欄の中身をドラッグして選択し、コピーできるか。
3. ID や API キーを1回クリックすると、値の全体が選択されるか。
4. コピーボタンを押すとアイコンがチェックに替わり、約 1.5 秒で元に戻るか。ツールチップの文言も替わるか。読み上げで「コピーした」と伝わるか。
5. 動きを減らす設定のとき、アイコンが拡大せずに不透明度だけで入れ替わるか。
6. 安全でない接続（`http`）で開いてコピーに失敗したとき、値が選択された状態になり、そのことが伝わるか。
