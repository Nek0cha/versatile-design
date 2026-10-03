# トースト

操作の結果を、作業を止めずに一時的に知らせるトーストを作る段階で読む。トークンの名前は `references/tokens-tailwind.md` だけを出典とし、トーストを使う場面は `references/intuitive-ui.md` の2.2節と4.1節に従う。

## 目的

- 「知っておくべきだが、今の作業は止めなくてよい」情報を、決まった場所に短く出す。
- 取り消せる操作を確認なしで実行し、トーストの「元に戻す」で取り消せるようにする。確認のダイアログを減らすための部品である。

## 守ること

- 表示する位置は画面の右下にする。スマートフォン幅（640px 未満）では下の中央にし、左右に 16px の余白を残して横幅いっぱいに広げる。位置は画面全体で1か所に決め、場所を変えない。
- 自動で消えるまでの時間は 5 秒にする。トーストの上にマウスがある間と、トーストの中にフォーカスがある間は、時間を止める。ほかのタブを見ている間（`document.visibilityState` が `hidden`）も止める。止めた時点の残り時間から再開する。
- 取り消せる操作（削除、移動、アーカイブなど）のトーストには「元に戻す」ボタンを付ける。何が取り消されるかが分かるように、本文に対象の名前を書く（「『議事録』を削除した」）。
- 「元に戻す」は、アプリの取り消しのショートカットキー（Ctrl+Z、macOS では ⌘Z）でも実行できるようにする。キーボードだけで操作する利用者は、トーストのボタンまで移動しにくい。
- エラーのトーストは自動で消さない。閉じるボタンで閉じるまで残す。何が起きたか、なぜか、次に何をすればよいかを書き（`references/intuitive-ui.md` の2.4節）、文章は選択してコピーできるまま残す。エラーにはアイコン（`ph:warning-circle`）を付け、色だけで示さない。
- 同時に表示するのは3件までにする。それより多い場合は、エラー以外の古いものから消す。エラーと、新しく出したトーストは押し出さない。押し出せるものがない場合（エラーが3件残っている場合など）は、3件を超えて表示する。新しいトーストは画面の端に最も近い位置（一番下）に出す。
- 閉じるボタンはアイコンだけのボタンにし、`aria-label` とツールチップを付ける（`references/components/tooltip-popover-menu.md`）。
- 読み上げにも伝える。トーストの一覧を `aria-live="polite"` の領域にし、エラーだけは `role="alert"` にして作業を中断して読み上げさせる。一覧全体を `<section aria-label="通知">` で包み、ランドマークとして移動できるようにする。
- トーストは浮いているものとして、`rounded-lg`、`bg-surface-2`、`border border-line`、`shadow-float` の組で作る。
- 登場は、下からの 8px の移動と不透明度を `--duration-base`（180ms）と `--ease-out-quint` で行う。消えるときは不透明度だけを `--duration-fast`（120ms）で変える。残ったトーストが詰めるときは、位置の移動を動きでつなぐ。動きを減らす設定のときは、移動をやめ、不透明度の変化だけにする。
- 成功をすべて知らせない。支払い、送信、公開など重要な操作の完了と、取り消せる操作の結果だけに使う（`references/intuitive-ui.md` の2.4節）。

## React Aria のトーストを使わない理由

React Aria Components 1.21.1 には `UNSTABLE_ToastRegion`、`UNSTABLE_Toast`、`UNSTABLE_ToastQueue` があるが、名前のとおり安定版ではなく、今後の版で名前や使い方が変わる可能性がある。このレシピでは安定した部品だけで組むため、トーストの一覧と時間の管理を自前で書き、ボタンとツールチップに React Aria を使う。React Aria のトーストが安定版になったら、それに置き換えてよい。その場合も、このレシピの位置、時間、エラーの扱いは変えない。安定版になる前に使う場合は、不安定な API であることを報告に書き、版を固定する。

## やってはいけないこと

- エラーを自動で消すこと。読む前に消えると、何が起きたか分からないまま作業が続く。
- 「元に戻す」がないのに、取り消せない削除をトーストだけで知らせること。戻せない操作は、実行の前に確認する（`references/components/modal.md`）。
- トーストを画面の上の中央や、画面ごとに違う場所に出すこと。
- 3秒未満で消すこと、ホバー中も時間を進めること。
- 「保存した」のような、毎回起きる小さな成功をすべてトーストで知らせること。保存の状態は対象のそばに控えめに常に表示する（`references/mode-app.md` の7節）。
- トーストに成功の緑など新しい色を足すこと。肯定的な状態を示す場合は、アクセントのアイコンだけにする。
- 「エラーが発生しました」だけのエラー。

## コード例

トーストの仕組み（表示する場所、時間の管理）と、取り消せる削除の例である。

```tsx
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Button, Tooltip, TooltipTrigger } from "react-aria-components";
import { Icon } from "@iconify/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

const AUTO_DISMISS_MS = 5000;
const MAX_VISIBLE = 3;

type CloseReason = "timeout" | "action" | "dismiss";

type ToastOptions = {
  message: string;
  tone?: "info" | "error";
  action?: { label: string; onAction: () => void };
  // 閉じた理由を渡す。取り消せる削除では、"action" 以外で閉じたときに本当に削除する
  onClose?: (reason: CloseReason) => void;
};

type ToastItem = ToastOptions & { id: number };

const ToastContext = createContext<((options: ToastOptions) => void) | null>(null);

export function useToast() {
  const show = useContext(ToastContext);
  if (!show) throw new Error("ToastProvider の中で使う");
  return show;
}

// 時間を止めている間は数えず、再開したときは残りの時間から数える
function useAutoDismiss(enabled: boolean, paused: boolean, onTimeout: () => void) {
  const remaining = useRef(AUTO_DISMISS_MS);
  const latest = useRef(onTimeout);
  useEffect(() => {
    latest.current = onTimeout;
  });
  useEffect(() => {
    if (!enabled || paused) return;
    const startedAt = Date.now();
    const timer = window.setTimeout(() => latest.current(), remaining.current);
    return () => {
      window.clearTimeout(timer);
      remaining.current -= Date.now() - startedAt;
    };
  }, [enabled, paused]);
}

function usePageHidden() {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const update = () => setHidden(document.visibilityState === "hidden");
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);
  return hidden;
}

const ring = "data-focus-visible:outline-2 data-focus-visible:outline-offset-2 data-focus-visible:outline-accent";

function ToastCard({ toast, paused, onClose }: { toast: ToastItem; paused: boolean; onClose: (reason: CloseReason) => void }) {
  const reduce = useReducedMotion();
  const isError = toast.tone === "error";
  // エラーは自動で消さない
  useAutoDismiss(!isError, paused, () => onClose("timeout"));
  return (
    <motion.li
      layout={!reduce}
      role={isError ? "alert" : undefined}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0, transition: { duration: reduce ? 0.12 : 0.18, ease: [0.22, 1, 0.36, 1] } }}
      // 残ったトーストが詰めるときの移動。既定のばねではなく、トークンと同じ時間とカーブにする
      transition={{ layout: { duration: 0.18, ease: [0.22, 1, 0.36, 1] } }}
      exit={{ opacity: 0, transition: { duration: 0.12, ease: [0.22, 1, 0.36, 1] } }}
      className="flex w-full items-start gap-3 rounded-lg border border-line bg-surface-2 py-2.5 pr-2 pl-3.5 shadow-float sm:w-96"
    >
      {isError && <Icon icon="ph:warning-circle" aria-hidden className="mt-0.5 size-4 shrink-0 text-danger" />}
      {/* 本文は選択してコピーできるまま残す */}
      <p className="flex-1 py-0.5 text-sm text-text">{toast.message}</p>
      {toast.action && (
        <Button
          onPress={() => {
            toast.action?.onAction();
            onClose("action");
          }}
          className={`h-7 shrink-0 select-none rounded-md px-2 text-sm text-text-strong data-hovered:bg-surface-3 ${ring}`}
        >
          {toast.action.label}
        </Button>
      )}
      <TooltipTrigger delay={500}>
        <Button aria-label="通知を閉じる" onPress={() => onClose("dismiss")} className={`grid size-7 shrink-0 select-none place-items-center rounded-md text-text-muted data-hovered:bg-surface-3 ${ring}`}>
          <Icon icon="ph:x" aria-hidden className="size-4" />
        </Button>
        <Tooltip offset={6} className="rounded-sm border border-line bg-surface-2 px-2 py-1 text-xs text-text shadow-float">
          通知を閉じる
        </Tooltip>
      </TooltipTrigger>
    </motion.li>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const pageHidden = usePageHidden();
  const nextId = useRef(0);
  // onClose は状態の更新関数の外で呼ぶ。更新関数の中で呼ぶと、開発時の StrictMode で2回呼ばれ、削除が二重に走る
  const listRef = useRef<ToastItem[]>([]);
  const update = (next: ToastItem[]) => {
    listRef.current = next;
    setToasts(next);
  };

  const close = (id: number, reason: CloseReason) => {
    const target = listRef.current.find((t) => t.id === id);
    // 時間切れと「元に戻す」が重なっても、閉じる処理は1回だけにする
    if (!target) return;
    update(listRef.current.filter((t) => t.id !== id));
    // ボタンで閉じるとフォーカスしていた要素が消え、blur が届かないため、止めていた状態をここで戻す
    if (reason !== "timeout") setFocused(false);
    if (listRef.current.length === 0) setHovered(false);
    target.onClose?.(reason);
  };

  const show = (options: ToastOptions) => {
    const next = [...listRef.current, { ...options, id: nextId.current++ }];
    // 3件を超えたら、エラー以外の古いものから閉じる。エラーは自動で消さないため押し出さない。新しく出したトーストも押し出さない
    const overflow: ToastItem[] = [];
    const evictable = next.slice(0, -1).filter((t) => t.tone !== "error");
    while (next.length - overflow.length > MAX_VISIBLE && overflow.length < evictable.length) overflow.push(evictable[overflow.length]);
    update(next.filter((t) => !overflow.includes(t)));
    // 取り消せる削除は、ここで確定する
    for (const old of overflow) old.onClose?.("timeout");
  };

  return (
    <ToastContext.Provider value={show}>
      {children}
      <section
        aria-label="通知"
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        onFocus={() => setFocused(true)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
        }}
        className="fixed inset-x-4 bottom-4 z-50 sm:inset-x-auto sm:right-4"
      >
        <ol aria-live="polite" className="flex flex-col items-center gap-2 sm:items-end">
          <AnimatePresence initial={false}>
            {toasts.map((toast) => (
              <ToastCard key={toast.id} toast={toast} paused={hovered || focused || pageHidden} onClose={(reason) => close(toast.id, reason)} />
            ))}
          </AnimatePresence>
        </ol>
      </section>
    </ToastContext.Provider>
  );
}

// 使い方：取り消せる削除。画面からはすぐ消し、実際の削除はトーストが閉じるまで遅らせる
type Note = { id: string; title: string };

export function NoteList({ notes, deleteOnServer }: { notes: Note[]; deleteOnServer: (id: string) => void }) {
  const toast = useToast();
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);

  const remove = (note: Note) => {
    setHiddenIds((ids) => [...ids, note.id]);
    toast({
      message: `「${note.title}」を削除した`,
      action: { label: "元に戻す", onAction: () => setHiddenIds((ids) => ids.filter((id) => id !== note.id)) },
      onClose: (reason) => {
        if (reason !== "action") deleteOnServer(note.id);
      },
    });
  };

  return (
    <ul className="divide-y divide-line">
      {notes
        .filter((note) => !hiddenIds.includes(note.id))
        .map((note) => (
          <li key={note.id} className="flex h-10 items-center justify-between px-3 text-text">
            <span className="truncate">{note.title}</span>
            <Button onPress={() => remove(note)} className={`inline-flex h-7 select-none items-center gap-1.5 rounded-md px-2 text-sm text-text-muted data-hovered:bg-surface-2 ${ring}`}>
              <Icon icon="ph:trash" aria-hidden className="size-4" />
              <span>削除</span>
            </Button>
          </li>
        ))}
    </ul>
  );
}

// 使い方：エラー。自動では消えない。原因と次にすることを本文に書く
export function useSaveErrorToast() {
  const toast = useToast();
  return (fileName: string) =>
    toast({
      tone: "error",
      message: `「${fileName}」を保存できなかった。ネットワークの接続が切れている。接続を確認してから、もう一度保存する。`,
    });
}
```

- 時間を止める条件（ホバー、フォーカス、ほかのタブの表示）は、表示中のトーストすべてに同時にかける。1件だけ止めると、読んでいる間に隣のトーストが消えて位置がずれる。
- `useAutoDismiss` は、時間を止めるたびに経過した時間を残りの時間から引く。再開したときに 5 秒から数え直さない。
- 取り消せる削除は、トーストが閉じるまでサーバーへの削除を遅らせる。トーストが出ている間にページを閉じると削除されないため、`beforeunload` で確定するか、すぐに削除してサーバー側で復元できるようにする方法を選ぶ。
