# ブラウザの動き

画面に動きを付ける段階で読む。アプリ系とサイト系のどちらでも読み、モードごとの方針は `references/mode-app.md` の「動き」の節と `references/mode-site.md` の「動き」の節に従う。

- トークンの名前（`--ease-out-quint`、`--duration-base` など）は `references/tokens-tailwind.md` が唯一の出典である。このファイルのコード例も、その名前を使う。
- 優先順位は、プロンプトの指示、`../design-core/user-preferences.md`、下の「スキル作者の調整欄」の順である。
- 禁止事項は `../design-core/references/anti-patterns.md` の X12〜X15 に従う。

## スキル作者の調整欄

以下は初期値である。数値はモデルの知識による。スキル作者が実例を見ながら調整する。`user-preferences.md` とプロンプトの指示が優先される。

### 所要時間と遅延

| 項目 | アプリ系 | サイト系 | トークン |
|---|---|---|---|
| 所要時間の範囲 | 120〜240ms | 600〜1200ms（登場、移動） | — |
| 短い変化（ホバー、押下、ホバー時だけ現れる操作） | 120ms | 100〜300ms（`references/mode-site.md` の調整欄） | `--duration-fast`（120ms） |
| 開閉・移動（メニュー、パネル、並び替え） | 180ms | — | `--duration-base`（180ms） |
| 大きな移動（パネル全体、画面の遷移） | 240ms | — | `--duration-slow`（240ms） |
| 登場 | 180ms（使う場合のみ） | 800ms を既定に 600〜1200ms | `--duration-reveal`（800ms） |
| 退場 | 120ms（登場より短く） | 登場の 2/3 程度 | — |
| 文字・要素ごとの遅延 | 20〜40ms | 40〜80ms | — |
| 流れ続ける帯の1周の時間 | 使わない | 30s 以上 | — |

### イージング

| 項目 | 値 | 使う場所 | トークン |
|---|---|---|---|
| 減速のカーブ（既定） | `cubic-bezier(0.22, 1, 0.36, 1)` | アプリ系のすべての動き、サイト系の登場 | `--ease-out-quint` |
| 強い減速のカーブ | `cubic-bezier(0.19, 1, 0.22, 1)` | サイト系の登場をより強く止めたい場合のみ（`references/mode-site.md` の調整欄） | 使う場合は `--ease-out-expo` として `references/tokens-tailwind.md` に足す |
| 加減速のカーブ | `cubic-bezier(0.76, 0, 0.24, 1)` | 画面の大きな移動、遷移、サイト系のメニューの全画面の開閉 | `--ease-in-out-quart` |
| 柔らかいばね | CSS は `cubic-bezier(0.34, 1.3, 0.64, 1)`、Motion は `{ type: "spring", visualDuration: 0.24, bounce: 0.15 }` | スイッチのつまみ、並び替えの着地、ドラッグを離したあとの戻り | `--ease-spring-soft` |
| 一定の速さ（`linear`） | `linear` | サイト系の流れ続ける帯と、スクロール量に直接つなぐ動き（GSAP の `scrub`）だけ | — |

### 動きを減らす設定のとき

| 項目 | 初期値 |
|---|---|
| 移動、拡大、回転、視差 | 行わない |
| 代わりの動き | 不透明度の変化だけ。所要時間は `--duration-fast`（120ms）以下 |
| 慣性スクロール（Lenis） | 使わない |
| 流れ続ける帯 | 止める |

## 1. ライブラリの使い分け

| 道具 | 使う場面 | 使わない場面 |
|---|---|---|
| CSS の `transition`（Tailwind のクラス） | ホバー、押下、フォーカスの色や不透明度の変化。アプリ系とサイト系の両方 | 出入りする要素（DOM から消える要素）の退場、並び替え |
| **Motion**（`motion/react`） | アプリ系の細かな動き。メニューの開閉、トグル、並び替え、画面遷移、出入りする要素 | スクロール位置に連動する演出、文字単位の演出 |
| **GSAP**（ScrollTrigger、SplitText） | サイト系のスクロール演出、文字単位の演出、時間軸で組み立てる登場 | アプリ系の部品の開閉（状態と動きがずれやすい） |
| **Lenis** | サイト系の慣性スクロール。スクロール演出が多く、スクロールの手触りそのものを印象の一部にしたい場合だけ | アプリ系。長い文章を読むページ。動きを減らす設定のとき |

- 1つの要素を2つのライブラリで同時に動かさない。互いの値を上書きし合う。
- アプリ系の画面では、原則として CSS と Motion だけを使う。サイト系の画面では、CSS と GSAP を基本にし、出入りする要素がある場合だけ Motion を足す。
- GSAP は ScrollTrigger、SplitText、CustomEase を含めて無償で使える。プラグインは使う前に `gsap.registerPlugin()` で登録する。
- 動かすのは原則として `transform` と `opacity` だけにする。`width`、`height`、`top` などを動かすと、描画が重くなる。

## 2. CSS とトークンだけで済む動き

ホバーと押下は CSS で書く。動かすプロパティとイージングを必ず書く（X13、X14）。

```css
.row-action {
  opacity: 0;
  transition:
    opacity var(--duration-fast) var(--ease-out-quint),
    background-color var(--duration-fast) var(--ease-out-quint);
}

.row:hover .row-action,
.row:focus-within .row-action {
  opacity: 1;
}

.toggle-thumb {
  transition: transform var(--duration-base) var(--ease-spring-soft);
}

.toggle[data-selected] .toggle-thumb {
  transform: translateX(16px);
}

@media (prefers-reduced-motion: reduce) {
  .toggle-thumb {
    transition: transform 0ms var(--ease-out-quint);
  }
}
```

### サイト系の流れ続ける帯

一定の速さで流れ続けることに意味があるため、`linear` を使ってよい（X13 の「理由」に当たる）。抑制コメントで理由を書き、報告にも書く。

```css
@keyframes marquee {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-50%);
  }
}

.marquee-track {
  /* design-lint-disable-next-line default-easing -- 流れ続ける帯は一定の速さで動くことに意味がある（X13 の理由） */
  animation: marquee 40s linear infinite;
}

@media (prefers-reduced-motion: reduce) {
  .marquee-track {
    animation: none;
  }
}
```

## 3. Motion（アプリ系）

### 準備

アプリ全体を `MotionConfig` で包み、`reducedMotion="user"` を指定する。動きを減らす設定のとき、Motion は移動と拡大の動きを止め、不透明度の変化だけを残す。所要時間とイージングの既定値もここで1回だけ決める。

```tsx
// motion-tokens.ts：tokens-tailwind.md のトークンを Motion の単位（秒）に写したもの
export const ease = {
  outQuint: [0.22, 1, 0.36, 1],
  inOutQuart: [0.76, 0, 0.24, 1],
} as const;

export const duration = {
  fast: 0.12,
  base: 0.18,
  slow: 0.24,
} as const;

export const springSoft = { type: "spring", visualDuration: 0.24, bounce: 0.15 } as const;
```

```tsx
"use client";
import type { ReactNode } from "react";
import { MotionConfig } from "motion/react";
import { duration, ease } from "./motion-tokens";

export function MotionRoot({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={{ duration: duration.base, ease: ease.outQuint }}>
      {children}
    </MotionConfig>
  );
}
```

### 登場（一覧）

主役と補助で動きを変える（X12）。見出しは動かさず、項目だけを短い距離で順に出す。遅延は 20〜40ms の範囲にする。

```tsx
"use client";
import { motion, stagger } from "motion/react";
import { duration, ease } from "./motion-tokens";

const list = {
  hidden: {},
  shown: { transition: { delayChildren: stagger(0.03) } },
};

const item = {
  hidden: { opacity: 0, y: 6 },
  shown: { opacity: 1, y: 0, transition: { duration: duration.base, ease: ease.outQuint } },
};

export function ResultList({ rows }: { rows: { id: string; label: string }[] }) {
  return (
    <motion.ul variants={list} initial="hidden" animate="shown" className="divide-y divide-line">
      {rows.map((row) => (
        <motion.li key={row.id} variants={item} className="h-10 px-3 text-text">
          {row.label}
        </motion.li>
      ))}
    </motion.ul>
  );
}
```

### メニューの開閉

開くときは押した場所から広がるように動かし、閉じるときは開くときより短くする。`AnimatePresence` で包むと、DOM から消える要素にも退場の動きを付けられる。

```tsx
"use client";
import type { ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { duration, ease } from "./motion-tokens";

export function MenuPanel({ open, children }: { open: boolean; children: ReactNode }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="menu"
          className="origin-top rounded-lg border border-line bg-surface-2 p-1 shadow-float"
          initial={{ opacity: 0, scale: 0.96, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0, transition: { duration: duration.base, ease: ease.outQuint } }}
          exit={{ opacity: 0, scale: 0.98, transition: { duration: duration.fast, ease: ease.outQuint } }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

### 並び替えと、設定を自分で読む場合

並び替えは `layout` を付けた要素に `springSoft` を渡す。`MotionConfig` の外で動きを組み立てる場合や、移動の距離そのものを変えたい場合は、`useReducedMotion()` で設定を読む。

```tsx
"use client";
import { motion, useReducedMotion } from "motion/react";
import { duration, ease, springSoft } from "./motion-tokens";

export function SortableRow({ id, label }: { id: string; label: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.li
      layout={!reduce}
      layoutId={id}
      transition={reduce ? { duration: duration.fast, ease: ease.outQuint } : springSoft}
      className="h-10 rounded-md bg-surface-1 px-3 text-text"
    >
      {label}
    </motion.li>
  );
}
```

## 4. GSAP（サイト系）

### 準備

プラグインは1か所で登録する。イージングは CustomEase でトークンと同じ値を名前付きで作り、各所ではその名前だけを使う。React では `@gsap/react` の `useGSAP` を使うと、画面を離れたときに動きが自動で片付けられる。

```tsx
// gsap-setup.ts
"use client";
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, CustomEase, ScrollTrigger, SplitText);

CustomEase.create("outQuint", "0.22, 1, 0.36, 1");
CustomEase.create("inOutQuart", "0.76, 0, 0.24, 1");

export { gsap, ScrollTrigger, SplitText, useGSAP };
```

### 登場、文字単位の演出、スクロール連動

`gsap.matchMedia()` で、動きを減らす設定かどうかによって組み立てを分ける。設定が変わると、GSAP が前の組み立てを片付けて作り直す。次の例は、1つのセクションに3種類の動きを役割ごとに付けたものである（X12）。

- 見出し：文字単位で下から出す（主役。遅延 40ms）
- 本文：遅れて不透明度と短い移動で出す（補助。短く小さく）
- 写真：スクロール量に合わせてゆっくりずらす（スクロール連動）

```tsx
"use client";
import { useRef } from "react";
import { gsap, SplitText, useGSAP } from "./gsap-setup";

export function StorySection() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        SplitText.create(".js-title", {
          type: "lines, chars",
          mask: "lines",
          autoSplit: true,
          onSplit(self) {
            return gsap.from(self.chars, {
              yPercent: 110,
              duration: 0.8,
              ease: "outQuint",
              stagger: 0.04,
              scrollTrigger: { trigger: self.lines[0], start: "top 85%", once: true },
            });
          },
        });

        gsap.from(".js-body", {
          opacity: 0,
          y: 16,
          duration: 0.6,
          delay: 0.2,
          ease: "outQuint",
          scrollTrigger: { trigger: ".js-body", start: "top 85%", once: true },
        });

        // スクロール量に直接つなぐため、イージングは付けない（scrub の追従で滑らかにする）
        gsap.to(".js-photo", {
          yPercent: -12,
          ease: "none",
          scrollTrigger: { trigger: ".js-photo-frame", start: "top bottom", end: "bottom top", scrub: 0.6 },
        });
      });

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.from(".js-title, .js-body", {
          opacity: 0,
          duration: 0.12,
          ease: "outQuint",
          scrollTrigger: { trigger: ".js-title", start: "top 85%", once: true },
        });
      });

      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} className="grid gap-12 bg-surface-0 px-6 py-32">
      <h2 className="js-title font-display text-5xl text-text-strong">余白のある仕事</h2>
      <p className="js-body max-w-[34em] font-body text-text-muted">本文の段落が入る。</p>
      <div className="js-photo-frame overflow-hidden rounded-lg">
        <img className="js-photo h-[120%] w-full object-cover" src="/images/story.jpg" alt="作業中の机" />
      </div>
    </section>
  );
}
```

- `SplitText.create()` は、分割した文字に読み上げ用の `aria-label` を自動で付ける（`aria: "auto"` が既定）。`autoSplit: true` と、`onSplit` で動きを `return` する書き方を組にすると、フォントの読み込みや幅の変化で行が組み直されたときに、動きも作り直される。
- 和文の見出しは文字単位（`chars`）で分ける。欧文の見出しは単語単位（`words`）の方が読みやすい場合がある。
- `ease: "none"` は `linear` と同じであり、スクロール量に直接つなぐ動き（`scrub`）にだけ使う。手触りは `scrub` に渡す追従の秒数で調整する。時間で動く演出には使わない（X13）。
- 登場は `once: true` にして、スクロールを戻すたびに繰り返さない。

### サイト系のメニューの全画面の開閉

全画面のメニューのように大きな面が動く場合は、加減速のカーブ（`inOutQuart`）を使い、中の項目は面が開き切る前から少しずつ遅らせて出す。

```tsx
"use client";
import { useRef } from "react";
import { gsap, useGSAP } from "./gsap-setup";

export function SiteMenu({ open }: { open: boolean }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) {
        gsap.to(root.current, { autoAlpha: open ? 1 : 0, duration: 0.12, ease: "outQuint" });
        return;
      }
      const tl = gsap.timeline();
      if (open) {
        tl.set(root.current, { autoAlpha: 1 })
          .fromTo(root.current, { clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0% 0)", duration: 0.8, ease: "inOutQuart" })
          .from(".js-menu-item", { yPercent: 60, opacity: 0, duration: 0.6, ease: "outQuint", stagger: 0.06 }, "-=0.4");
      } else {
        tl.to(root.current, { clipPath: "inset(0 0 100% 0)", duration: 0.6, ease: "inOutQuart" }).set(root.current, { autoAlpha: 0 });
      }
    },
    { scope: root, dependencies: [open] },
  );

  return (
    <div ref={root} className="invisible fixed inset-0 z-50 bg-surface-1">
      <nav className="grid gap-4 p-8 font-display text-4xl text-text-strong">
        <a className="js-menu-item" href="#works">仕事</a>
        <a className="js-menu-item" href="#about">人</a>
        <a className="js-menu-item" href="#contact">連絡先</a>
      </nav>
    </div>
  );
}
```

## 5. Lenis（サイト系の慣性スクロール）

慣性スクロールは、スクロールの手触りを印象の一部にしたい場合だけ使う。利用者の操作とずれるため、迷ったら使わない。使う場合は ScrollTrigger と時計を揃え、動きを減らす設定のときは作らない。

```tsx
"use client";
import { useEffect } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { gsap, ScrollTrigger } from "./gsap-setup";

export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({ lerp: 0.1, autoRaf: false });
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, []);

  return null;
}
```

- `lerp` は追従の強さで、小さいほど慣性が長くなる。0.08〜0.12 の範囲にし、それより小さくしない。操作に遅れて感じられる。
- Lenis の `respectReducedMotion`（既定で有効）も設定を読むが、上の例のように作らないことを基本にする。
- 内部のスクロール領域（メニュー、ダイアログ）には `data-lenis-prevent` を付け、Lenis の対象から外す。

## 6. 動きを減らす設定（`prefers-reduced-motion`）への対応

すべての動きに対応を書く（X15）。lint の `no-reduced-motion` は、アニメーションがあるのに対応がどこにもない場合を検出する。

| 道具 | 書き方 |
|---|---|
| CSS | `@media (prefers-reduced-motion: reduce)` の中で、移動と拡大をやめ、不透明度の変化だけにするか動きをなくす（2節） |
| Motion | `MotionConfig reducedMotion="user"` をアプリの外側に置く。移動の距離などを自分で変える場合は `useReducedMotion()` を読む（3節） |
| GSAP | `gsap.matchMedia()` で `(prefers-reduced-motion: no-preference)` と `(prefers-reduced-motion: reduce)` の組み立てを分ける（4節） |
| Lenis | 設定が有効なら作らない（5節） |

設定が有効なときも、状態の変化（開いた、閉じた、選択した）は不透明度の短い変化で伝える。動きを完全に消すと、何が起きたか分からなくなる場合がある。

## 7. 禁止事項

- すべての要素を、同じ所要時間・同じ方向・同じ遅延で動かすこと（X12）。主役だけを先に、または大きく動かし、補助的な要素は短く小さく動かす。方向は要素の役割に合わせる（メニューは押した場所から、通知は出てくる端から）。
- 理由のない `ease`、`linear`、`ease-in-out`、イージングの指定漏れ（X13）。`linear` を使ってよいのは、流れ続ける帯とスクロール量に直接つなぐ動きだけである。
- `transition: all` と `transition-all`（X14）。
- 動きを減らす設定への未対応（X15）。
- 調整欄の範囲を外れた所要時間。アプリ系で 300ms を超える動き、サイト系で 1200ms を超える登場は、待ち時間になる。
- ページを開いた直後に、すべてのセクションを一度に動かすこと。演出は記憶のフックと主役に絞る（`references/mode-site.md` の「動き」の節）。
- 押してから処理が終わるまで、何も反応しない時間を作ること。押下の見た目は押した時点で返す（`references/mode-app.md` の「動き」の節）。

## 8. `motion` スキル（動画）との役割分担

このファイルと `web` スキルが扱うのは、ブラウザの上で利用者の操作やスクロールに応じて動く UI とページの動きである。所要時間は操作に対する反応として決め、動きを減らす設定への対応を必ず含める。これに対して、将来追加する `motion` スキルは、書き出して再生する動画（製品紹介の映像、SNS 向けの短い動画など）を扱い、時間軸に沿った演出の組み立て、尺、書き出しの形式を受け持つ。同じ動きの考え方（減速のカーブ、主役と補助の差）は共有するが、数値の初期値はそれぞれのスキルの調整欄で別に管理する。
