# 読み込み

データの取得、保存、変換など、時間のかかる処理の待ち時間を表示する段階で読む。トークンの名前は `references/tokens-tailwind.md` だけを出典とし、待ち時間の伝え方は `references/intuitive-ui.md` の2.3節、動きは `references/motion-web.md` に従う。

## 目的

- 処理が動いていることと、あとどれくらいかかるかを伝え、利用者に「壊れた」と思わせない。
- 短い処理では何も出さず、画面をちらつかせない。
- 中身が届いたときに、部品の位置がずれないようにする。

## 守ること

- 待ち時間の長さで表示を変える。

| 経過した時間 | 表示 |
|---|---|
| 0.3秒未満 | 何も出さない。0.3秒で終わる処理に表示を出すと、一瞬だけ現れて消え、ちらついて見える |
| 0.3〜2秒 | スケルトン（中身の形をした仮の面） |
| 2秒以上、または進み具合が分かる処理 | 進捗の表示（バーと割合、何をしているかの文章） |

- 表示は処理を始めた時点では出さず、0.3秒たってもまだ終わっていないときに出す。2秒たっても終わらないときは、スケルトンに加えて進捗の表示を出す。進み具合が分かる処理（ファイルのアップロード、書き出し）は、0.3秒を過ぎた時点から進捗の表示にする。
- スケルトンは、実際の中身と同じ形にする。行の高さ、行の数、文字の幅、アイコンや画像の位置と大きさを、届いたあとの画面と揃える。中身に置き換わったときに、部品の位置が動かないようにするためである（`references/intuitive-ui.md` の3.2節）。
- スケルトンの面は `bg-surface-2` にし、角丸は置き換わる部品と同じ段階にする。文字の行は、実際の文字の高さより少し低い帯にする。
- 進捗の表示には、何をしているかを具体的に書く（「3件のファイルを変換している」）。「読み込み中」だけにしない。割合が分かる場合は等幅の数字（`tabular-nums`）で示す。進み具合が分からない処理は不定の表示にし、途中で分かった時点で割合の表示に切り替える。
- 中断しても困らない処理には、キャンセルのボタンを置く。
- 進捗の表示は React Aria の `ProgressBar` で作る。`value` を渡すと、読み上げにも割合が伝わる。不定の場合は `isIndeterminate` を付ける。スケルトンを出している領域には `aria-busy="true"` を付け、何を読み込んでいるかを読み上げ用の文字で添える。
- 待っている間も、ほかの操作はできるようにする。画面全体を覆って操作を止めるのは、アプリの起動時の読み込みだけにする。
- アプリの起動時の読み込み画面は、記憶のフックの候補として作り込む（`references/mode-app.md` の1節と2節）。ロゴやコンセプトに沿った演出と、進捗の表示を組み合わせる。演出の進み具合は、実際の進捗に合わせる。

### 繰り返し続く動きの扱い

処理中であることを示す繰り返しの動き（スケルトンの明滅、不定の進捗の帯の往復、ボタンの中の処理中の印の回転）は、アプリ系の所要時間の範囲（120〜240ms、`references/motion-web.md` の調整欄）の対象外とし、1周を 0.9〜1.6 秒にする（小さな印ほど短く、ボタンの中の処理中の印は 0.9 秒、スケルトンは 1.6 秒）。120〜240ms は、操作への反応や開閉のように1回で終わる動きのための範囲である。処理中であることを示す動きは、処理が終わるまで繰り返し続くため、1周を 240ms 以下にすると、画面の端で速く点滅し続けて目障りになり、急かされている印象も与える。イージングは `linear` にせず、加減速のカーブ（`--ease-in-out-quart` と同じ値）で往復させる（`../design-core/references/anti-patterns.md` の X13）。

動きを減らす設定のときは、移動をやめる。スケルトンは明滅させずに止める。不定の進捗の帯は往復させず、不透明度だけをゆっくり変える。進捗の表示が完全に止まると、処理が固まったように見えるためである（`references/intuitive-ui.md` の2.3節）。

## やってはいけないこと

- スピナー（回る印）だけを表示すること。何をしているのか、あとどれくらいかかるのかが分からない。ボタンの中の処理中の印（`references/components/button.md`）のように、ラベルと組にした小さな印だけは使ってよい。
- 0.3秒未満で終わる処理に、読み込みの表示を出すこと。
- 中身と形の違うスケルトン（どの画面でも同じ3本の灰色の帯など）。置き換わったときに画面が跳ねる。
- 進捗を最初だけ速く進めて最後に止めること、実際の進捗と関係なく進む演出。
- 進捗の表示を止まったまま放置すること。処理が本当に止まった場合は、理由とできることを示す（`references/components/states.md`）。
- `animate-pulse` や `animate-spin` など Tailwind の既定のアニメーション（`references/tokens-tailwind.md` の4節）。
- 読み込み中のために、画面全体を暗幕で覆って操作を止めること（起動時を除く）。

## コード例

経過した時間で表示を切り替える仕組みと、中身と同じ形のスケルトンである。

```tsx
import { useEffect, useState } from "react";
import { Label, ProgressBar } from "react-aria-components";
import { Icon } from "@iconify/react";
import { motion, useReducedMotion } from "motion/react";

type Phase = "none" | "skeleton" | "progress";

// 0.3秒まで何も出さず、2秒まではスケルトン、それ以降は進捗の表示も出す
export function useLoadingPhase(isLoading: boolean): Phase {
  const [phase, setPhase] = useState<Phase>("none");
  useEffect(() => {
    if (!isLoading) {
      setPhase("none");
      return;
    }
    const toSkeleton = window.setTimeout(() => setPhase("skeleton"), 300);
    const toProgress = window.setTimeout(() => setPhase("progress"), 2000);
    return () => {
      window.clearTimeout(toSkeleton);
      window.clearTimeout(toProgress);
    };
  }, [isLoading]);
  return phase;
}

// 実際の行と同じ形：高さ 52px、左に 32px のアイコン、主と補足の2段
function SkeletonRow({ index }: { index: number }) {
  const reduce = useReducedMotion();
  // 文字の帯の幅を行ごとに変え、同じ帯が並ぶ機械的な見た目を避ける
  const widths = ["w-48", "w-36", "w-56", "w-40"];
  return (
    <motion.li
      className="flex h-13 items-center gap-3 px-3"
      // 繰り返し続く動きは 120〜240ms の対象外。1周 1.6 秒で、行ごとに 0.08 秒ずらす
      animate={reduce ? undefined : { opacity: [1, 0.55, 1] }}
      transition={reduce ? undefined : { duration: 1.6, ease: [0.76, 0, 0.24, 1], repeat: Infinity, delay: index * 0.08 }}
    >
      <span className="size-8 shrink-0 rounded-md bg-surface-2" />
      <span className="flex flex-col gap-2">
        <span className={`h-3 rounded-sm bg-surface-2 ${widths[index % widths.length]}`} />
        <span className="h-2.5 w-24 rounded-sm bg-surface-2" />
      </span>
    </motion.li>
  );
}

type FileItem = { id: string; name: string; updated: string };

export function FileList({ files, isLoading, total, loaded }: { files: FileItem[]; isLoading: boolean; total: number; loaded: number }) {
  const phase = useLoadingPhase(isLoading);
  if (isLoading) {
    return (
      <section aria-busy="true" aria-label="ファイルの一覧" className="flex flex-col gap-3">
        {phase === "progress" && (
          <ProgressBar value={loaded} maxValue={total} className="flex flex-col gap-1.5 px-3">
            {({ percentage }) => (
              <>
                <span className="flex justify-between text-sm">
                  <Label className="text-text">{total}件のファイルを読み込んでいる</Label>
                  <span className="font-mono tabular-nums text-text-muted">{Math.round(percentage ?? 0)}%</span>
                </span>
                <span className="h-1 overflow-hidden rounded-full bg-surface-2">
                  <span
                    className="block h-full origin-left rounded-full bg-accent transition-transform duration-(--duration-base) ease-out-quint motion-reduce:transition-none"
                    style={{ transform: `scaleX(${(percentage ?? 0) / 100})` }}
                  />
                </span>
              </>
            )}
          </ProgressBar>
        )}
        {phase !== "none" && <p className="sr-only">ファイルの一覧を読み込んでいる</p>}
        {phase !== "none" && (
          <ul aria-hidden className="divide-y divide-line">
            {Array.from({ length: 6 }, (_, i) => (
              <SkeletonRow key={i} index={i} />
            ))}
          </ul>
        )}
      </section>
    );
  }
  return (
    <ul aria-label="ファイルの一覧" className="divide-y divide-line">
      {files.map((file) => (
        <li key={file.id} className="flex h-13 items-center gap-3 px-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-md bg-surface-2 text-text-muted">
            <Icon icon="ph:file-text" aria-hidden className="size-4" />
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-sm text-text-strong">{file.name}</span>
            <span className="text-xs text-text-muted">{file.updated}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
```

- `useLoadingPhase` は、処理が 0.3 秒未満で終われば `"none"` のまま戻るため、何も描画されない。
- スケルトンの行と実際の行は、高さ（`h-13`、52px）、アイコンの大きさ、2段の構成を揃えている。置き換わっても、下にある部品の位置が変わらない。
- 進捗のバーは幅ではなく `scaleX` で伸ばす（`references/motion-web.md` の1節。`width` を動かさない）。動きを減らす設定のときは、値の変化をすぐに反映する。
- 進捗のバーはアクセントで塗る。処理が進んでいることは「肯定的な状態」に当たる（`../design-core/references/color.md` の1節）。

進み具合が分からない処理の、不定の進捗の表示である。キャンセルのボタンと組にする。

```tsx
import { Button, ProgressBar } from "react-aria-components";
import { Icon } from "@iconify/react";
import { motion, useReducedMotion } from "motion/react";

export function ConvertingStatus({ fileCount, onCancel }: { fileCount: number; onCancel: () => void }) {
  const reduce = useReducedMotion();
  return (
    <div className="flex items-center gap-3 rounded-island bg-surface-1 px-3 py-2.5">
      <ProgressBar isIndeterminate aria-label={`${fileCount}件のファイルを変換している`} className="flex flex-1 flex-col gap-1.5">
        <span className="text-sm text-text">{fileCount}件のファイルを変換している</span>
        <span className="relative h-1 overflow-hidden rounded-full bg-surface-2">
          <motion.span
            className="absolute inset-y-0 left-0 w-1/3 rounded-full bg-accent"
            // 繰り返し続く動きは 120〜240ms の対象外。1周 1.4 秒で往復させる。動きを減らす設定では移動せず、不透明度だけをゆっくり変える
            animate={reduce ? { opacity: [1, 0.4, 1] } : { x: ["-100%", "300%"] }}
            transition={{ duration: reduce ? 1.6 : 1.4, ease: [0.76, 0, 0.24, 1], repeat: Infinity }}
          />
        </span>
      </ProgressBar>
      <Button
        onPress={onCancel}
        className="inline-flex h-8 select-none items-center gap-1.5 rounded-md border border-line-control px-2.5 text-sm text-text data-hovered:bg-surface-2 data-pressed:bg-surface-3 data-focus-visible:outline-2 data-focus-visible:outline-offset-2 data-focus-visible:outline-accent"
      >
        <Icon icon="ph:x" aria-hidden className="size-4" />
        <span>変換を中止</span>
      </Button>
    </div>
  );
}
```

アプリの起動時の、ページ全体の読み込み画面である。ロゴの線が実際の進捗に合わせて描かれ、下に何をしているかと割合を出す。ロゴの形は仮のものであり、コンセプトに合わせて差し替える。

```tsx
import { ProgressBar } from "react-aria-components";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

type Props = {
  // 0〜1。実際に読み込んだ量から計算する。演出のために進め方を変えない
  progress: number;
  // 今していること。「フォントを読み込んでいる」「作業中のファイルを開いている」など
  stage: string;
  done: boolean;
};

export function AppLoadingScreen({ progress, stage, done }: Props) {
  const reduce = useReducedMotion();
  const percent = Math.round(progress * 100);
  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          key="loading"
          // 起動時の読み込みだけは、画面全体を覆ってよい
          className="fixed inset-0 z-50 grid place-items-center bg-surface-0"
          exit={{ opacity: 0, transition: { duration: reduce ? 0.12 : 0.24, ease: [0.22, 1, 0.36, 1] } }}
        >
          <div className="flex w-64 flex-col items-center gap-8">
            {/* ロゴ（仮の形）。線の描かれた長さが進捗を表す */}
            <svg viewBox="0 0 64 64" aria-hidden className="size-16 text-text-strong">
              <path d="M8 56 L32 8 L56 56 Z" fill="none" stroke="currentColor" strokeOpacity={0.15} strokeWidth={2} strokeLinejoin="round" />
              <motion.path
                d="M8 56 L32 8 L56 56 Z"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: progress }}
                // 動きを減らす設定では、描く動きを省き、進捗の値をそのまま反映する
                transition={reduce ? { duration: 0 } : { duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              />
            </svg>
            <ProgressBar value={percent} aria-label="アプリを準備している" className="flex w-full flex-col gap-2">
              <span className="h-px w-full overflow-hidden bg-line">
                <span
                  className="block h-full origin-left bg-text-strong transition-transform duration-(--duration-slow) ease-out-quint motion-reduce:transition-none"
                  style={{ transform: `scaleX(${progress})` }}
                />
              </span>
              <span className="flex justify-between text-xs">
                <span className="text-text-muted">{stage}</span>
                <span className="font-mono tabular-nums text-text-muted">{percent}%</span>
              </span>
            </ProgressBar>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

- 起動時の読み込み画面も、0.3秒未満で起動が終わる場合は出さない。1つ目のコード例の `useLoadingPhase` と同じ考え方で、0.3秒たってから描画する。
- ロゴの線と進捗のバーは、同じ `progress` の値から作る。演出だけが先に進んだり、最後に止まったりしないようにする。
- 起動時の読み込み画面では、アクセントではなく最も強い文字の色（`text-strong`）で描いている。ロゴの演出は主要な操作でも選択中でもないためである。
- 消えるときは `--duration-slow`（240ms）で不透明度だけを変え、アプリの画面に切り替える。

## 確認方法

開発者ツールで通信の速度を落とし、スクリーンショットと実際の操作で次の点を見る。

1. 0.3秒未満で終わる処理で、読み込みの表示が一瞬でも出ないか。
2. スケルトンが中身に置き換わったときに、部品の位置や画面の高さが変わらないか。スケルトンと中身のスクリーンショットを重ねて比べる。
3. 2秒以上かかる処理で、何をしているかの文章と進捗が出るか。割合の数字が等幅で、桁が変わっても位置がずれないか。
4. スピナーだけの表示がないか。
5. 動きを減らす設定のとき、スケルトンが止まり、不定の進捗の帯が移動せずに不透明度だけで変化するか。
6. 起動時の読み込み画面の演出が、実際の進捗と同じ速さで進むか。最後に止まって待たされないか。
7. 読み込み中も、ほかの部分を操作できるか。
