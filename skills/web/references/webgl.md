# WebGL（Three.js）

サイト系で、コンセプトの記憶のフックが WebGL の演出（シェーダーの面、画像のゆがみ、粒子など）である場合だけ読む。フックでない場所に WebGL を足さない（`../design-core/references/anti-patterns.md` の X22）。動きの共通の決まりは `references/motion-web.md` に従う。

- 使うのは `three` だけである。React Three Fiber と drei は使わない。依存を増やさず、GSAP から uniform を直接動かせるようにするためである。
- 1ページに置く WebGL の canvas は1つにする。複数の場所で使う場合も、1つの canvas を `position: fixed` で敷き、場所ごとに描き分ける。観察した実例でも、WebGL を使うサイトの多くは画面に固定した canvas を1枚だけ置き、その上に HTML を重ねていた（`references/observations/site.md` の傾向 11）。
- ページ全体を canvas の中で描かない。文字は HTML で置く（同 傾向 11、サイト7、10 の「採らない点」）。
- 3D の物体は、ぼかすか暗さや霧に沈めて、見出しの背後に回す（同 傾向 12）。
- フレームワークごとに、クライアントだけで動かす方法が違う（`references/stack.md` の2節）。

## スキル作者の調整欄

| 項目 | 初期値 | 根拠にした実例 |
|---|---|---|
| 画素の比率の上限 | 2 | — （モデルの知識による） |
| スマートフォン幅での画素の比率の上限 | 1.5 | — （モデルの知識による） |
| 粒子の数の上限 | PC 幅 4000、スマートフォン幅 1500 | — （モデルの知識による） |
| スクロールにつなぐ `scrub` の追従 | 0.6 | `motion-web.md` の既存の例に合わせる |
| 色 | トークンの色だけ（`tokenColor()` で読む）。2色まで | — |

## 1. 必ず守る決まり

| 決まり | 書き方 |
|---|---|
| 動きを減らす設定では止める | 1フレームだけ描き、時間でもスクロールでも動かさない |
| WebGL が使えない環境 | `WebGLRenderer` の作成を `try` で囲み、失敗したら同じ位置に代わりの表示（静止画か CSS の背景）を出す。`webglcontextlost` でも同じ表示に切り替える |
| 画面外では描かない | `IntersectionObserver` で見えている間だけ `gsap.ticker` に描画を登録する |
| 片付け | 効果の戻り値で、ジオメトリ、マテリアル、テクスチャ、レンダラーを `dispose()` し、canvas を DOM から外す |
| 画素の比率 | `renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))` |
| 読み上げ | canvas は `aria-hidden="true"` にする。伝えたい内容は HTML の文字で置く |
| 時計 | 描画のループは `gsap.ticker` に乗せ、GSAP と ScrollTrigger と同じ時計で動かす。Lenis を使う場合もそろう |

## 2. 共通の部品

```tsx
// webgl-utils.ts：トークンの色を Three.js の色に変える
import * as THREE from "three";

// oklch() のトークンは THREE.Color で直接読めないため、2D の canvas に一度塗って sRGB の値を取る
export function tokenColor(name: string): THREE.Color {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx || !value) return new THREE.Color(0, 0, 0);
  ctx.fillStyle = value;
  ctx.fillRect(0, 0, 1, 1);
  const [r = 0, g = 0, b = 0] = ctx.getImageData(0, 0, 1, 1).data;
  return new THREE.Color().setRGB(r / 255, g / 255, b / 255, THREE.SRGBColorSpace);
}

export function maxPixelRatio(): number {
  return Math.min(window.devicePixelRatio, window.matchMedia("(max-width: 767px)").matches ? 1.5 : 2);
}
```

## 3. 見出しや画像の裏に置くシェーダーの面

2色のトークンの境目が、時間とスクロールでゆっくり動く面である。最初の画面の背景に敷き、上に HTML の見出しを重ねる。

```tsx
// ShaderPlane.tsx
"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { gsap } from "./gsap-setup";
import { maxPixelRatio, tokenColor } from "./webgl-utils";

const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`;

const fragmentShader = `
precision highp float;
uniform float uTime;
uniform float uProgress;
uniform vec3 uColorA;
uniform vec3 uColorB;
varying vec2 vUv;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
void main() {
  float n = noise(vUv * 3.0 + vec2(uTime * 0.04, uProgress * 1.5));
  float edge = smoothstep(0.42, 0.58, n + (vUv.y - 0.5) * 0.8 - uProgress * 0.4);
  gl_FragColor = vec4(mix(uColorA, uColorB, edge), 1.0);
  #include <colorspace_fragment>
}`;

export function ShaderPlane({ className = "" }: { className?: string }) {
  const host = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "low-power" });
    } catch {
      setFailed(true);
      return;
    }
    renderer.setPixelRatio(maxPixelRatio());
    renderer.domElement.setAttribute("aria-hidden", "true");
    renderer.domElement.className = "block size-full";
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const geometry = new THREE.PlaneGeometry(2, 2);
    const uniforms = {
      uTime: { value: 0 },
      uProgress: { value: 0 },
      uColorA: { value: tokenColor("--color-surface-0") },
      uColorB: { value: tokenColor("--color-accent") },
    };
    const material = new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms });
    scene.add(new THREE.Mesh(geometry, material));

    const render = () => renderer.render(scene, camera);
    const resize = () => {
      const { width, height } = el.getBoundingClientRect();
      renderer.setSize(width, height, false);
      render();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(el);

    let tween: gsap.core.Tween | undefined;
    let visibility: IntersectionObserver | undefined;
    const onLost = (e: Event) => {
      e.preventDefault();
      visibility?.disconnect();
      gsap.ticker.remove(tick);
      renderer.domElement.remove();
      setFailed(true);
    };
    renderer.domElement.addEventListener("webglcontextlost", onLost);

    const tick = (time: number) => {
      uniforms.uTime.value = time;
      render();
    };
    if (!reduce) {
      tween = gsap.to(uniforms.uProgress, {
        value: 1,
        // スクロール量に直接つなぐため、イージングは付けない（scrub の追従で滑らかにする）
        ease: "none",
        scrollTrigger: { trigger: el, start: "top top", end: "bottom top", scrub: 0.6 },
      });
      visibility = new IntersectionObserver(([entry]) => {
        if (entry?.isIntersecting) gsap.ticker.add(tick);
        else gsap.ticker.remove(tick);
      });
      visibility.observe(el);
    }

    return () => {
      visibility?.disconnect();
      gsap.ticker.remove(tick);
      tween?.scrollTrigger?.kill();
      tween?.kill();
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener("webglcontextlost", onLost);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div ref={host} className={`absolute inset-0 -z-10 ${className}`}>
      {failed && <div className="size-full bg-surface-0" />}
    </div>
  );
}
```

- 動きを減らす設定のときは、`ResizeObserver` の最初の呼び出しで1フレームだけ描き、ticker にもスクロールにも登録しない。
- 置く側の要素（最初の画面のセクション）には `relative isolate` を付け、面が `-z-10` でその背後に収まるようにする。
- 代わりの表示は、面の2色のうち背景側の色（`surface-0`）にする。画像を用意できる場合は、面を止めた状態の静止画にしてもよい。
- この例は、最初の画面のセクションの中に面を置く形である。ページの複数の場所で同じ面を使う場合は、外側の要素のクラスを `fixed inset-0 -z-10` に変え、ページに1つだけ置く（冒頭の決まり）。
- `tokenColor()` は sRGB の値を線形の値に変えて渡す。`ShaderMaterial` のフラグメントシェーダーの最後には、必ず `#include <colorspace_fragment>` を書き、表示用の sRGB に戻す。書き忘れると、エラーは出ずに色がトークンより暗く沈む。
- 色を3色以上にしない。虹色のグラデーションの面は X22 に当たる。

## 4. 画像のゆがみと切り替え

作品の画像に、ホバーで波のゆがみをかける。ゆがみの強さを uniform にし、GSAP で上げ下げする。

```tsx
// DistortImage.tsx
"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { gsap } from "./gsap-setup";
import { maxPixelRatio } from "./webgl-utils";

const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`;

const fragmentShader = `
precision highp float;
uniform sampler2D uTexture;
uniform float uHover;
uniform float uTime;
varying vec2 vUv;
void main() {
  vec2 uv = vUv;
  uv.x += sin(uv.y * 12.0 + uTime * 2.0) * 0.015 * uHover;
  uv.y += cos(uv.x * 10.0 + uTime * 2.0) * 0.010 * uHover;
  gl_FragColor = texture2D(uTexture, uv);
  #include <colorspace_fragment>
}`;

export function DistortImage({ src, alt }: { src: string; alt: string }) {
  const host = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, powerPreference: "low-power" });
    } catch {
      return;
    }
    renderer.setPixelRatio(maxPixelRatio());
    renderer.domElement.setAttribute("aria-hidden", "true");
    renderer.domElement.className = "absolute inset-0 size-full";

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const geometry = new THREE.PlaneGeometry(2, 2);
    const texture = new THREE.TextureLoader().load(src, () => {
      el.appendChild(renderer.domElement);
      setReady(true);
      render();
    });
    texture.colorSpace = THREE.SRGBColorSpace;
    const uniforms = { uTexture: { value: texture }, uHover: { value: 0 }, uTime: { value: 0 } };
    const material = new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms });
    scene.add(new THREE.Mesh(geometry, material));

    const render = () => renderer.render(scene, camera);
    const resize = () => {
      const { width, height } = el.getBoundingClientRect();
      renderer.setSize(width, height, false);
      render();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(el);

    const tick = (time: number) => {
      uniforms.uTime.value = time;
      render();
    };
    const enter = () => {
      gsap.ticker.add(tick);
      gsap.to(uniforms.uHover, { value: 1, duration: 0.6, ease: "outQuint" });
    };
    const leave = () => {
      gsap.to(uniforms.uHover, { value: 0, duration: 0.4, ease: "outQuint", onComplete: () => gsap.ticker.remove(tick) });
    };
    el.addEventListener("pointerenter", enter);
    el.addEventListener("pointerleave", leave);

    return () => {
      el.removeEventListener("pointerenter", enter);
      el.removeEventListener("pointerleave", leave);
      gsap.ticker.remove(tick);
      gsap.killTweensOf(uniforms.uHover);
      resizeObserver.disconnect();
      geometry.dispose();
      material.dispose();
      texture.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [src]);

  return (
    <div ref={host} className="relative aspect-[4/3] overflow-hidden rounded-md">
      <img className={`size-full object-cover ${ready ? "invisible" : ""}`} src={src} alt={alt} />
    </div>
  );
}
```

- 元の `<img>` は常に DOM に残し、`alt` で内容を伝える。WebGL の準備ができたときだけ見た目を canvas に切り替える（`invisible` は場所と読み上げを残したまま見えなくする）。
- 動きを減らす設定のとき、WebGL が使えないとき、テクスチャの読み込み前は、元の `<img>` がそのまま表示される。
- 描画は、ホバーしている間とゆがみが戻るまでの間だけ行う。
- 画像は同じオリジンか、CORS を許可した配信元に置く。許可がないとテクスチャを読めない。

## 5. 粒子と線

点を格子状や面の形に並べ、スクロールで集まったり散ったりさせる。マウスの位置に粒子を付いてこさせる演出は X22 に当たるため使わない。

```tsx
// ParticleField.tsx
"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { gsap } from "./gsap-setup";
import { maxPixelRatio, tokenColor } from "./webgl-utils";

export function ParticleField() {
  const host = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const count = window.matchMedia("(max-width: 767px)").matches ? 1500 : 4000;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, powerPreference: "low-power" });
    } catch {
      setFailed(true);
      return;
    }
    renderer.setPixelRatio(maxPixelRatio());
    renderer.domElement.setAttribute("aria-hidden", "true");
    renderer.domElement.className = "block size-full";
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.z = 6;

    // 散った位置と、格子に揃った位置の2組を持ち、uProgress で補間する
    const scattered = new Float32Array(count * 3);
    const aligned = new Float32Array(count * 3);
    const side = Math.ceil(Math.sqrt(count));
    for (let i = 0; i < count; i++) {
      scattered.set([(Math.random() - 0.5) * 10, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 4], i * 3);
      aligned.set([((i % side) / side - 0.5) * 6, (Math.floor(i / side) / side - 0.5) * 6, 0], i * 3);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(scattered, 3));
    geometry.setAttribute("aAligned", new THREE.BufferAttribute(aligned, 3));
    const material = new THREE.ShaderMaterial({
      transparent: true,
      uniforms: { uProgress: { value: reduce ? 1 : 0 }, uColor: { value: tokenColor("--color-text-strong") }, uSize: { value: 2 * maxPixelRatio() } },
      vertexShader: `
        attribute vec3 aAligned;
        uniform float uProgress;
        uniform float uSize;
        void main() {
          vec3 p = mix(position, aAligned, uProgress);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
          gl_PointSize = uSize;
        }`,
      fragmentShader: `
        precision highp float;
        uniform vec3 uColor;
        void main() {
          if (length(gl_PointCoord - 0.5) > 0.5) discard;
          gl_FragColor = vec4(uColor, 0.8);
          #include <colorspace_fragment>
        }`,
    });
    const points = new THREE.Points(geometry, material);
    scene.add(points);

    const render = () => renderer.render(scene, camera);
    const resize = () => {
      const { width, height } = el.getBoundingClientRect();
      renderer.setSize(width, height, false);
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
      render();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(el);

    let tween: gsap.core.Tween | undefined;
    let visibility: IntersectionObserver | undefined;
    if (!reduce) {
      const progress = material.uniforms.uProgress as { value: number };
      tween = gsap.to(progress, {
        value: 1,
        // スクロール量に直接つなぐため、イージングは付けない（scrub の追従で滑らかにする）
        ease: "none",
        scrollTrigger: { trigger: el, start: "top bottom", end: "center center", scrub: 0.6 },
      });
      visibility = new IntersectionObserver(([entry]) => {
        if (entry?.isIntersecting) gsap.ticker.add(render);
        else gsap.ticker.remove(render);
      });
      visibility.observe(el);
    }

    return () => {
      visibility?.disconnect();
      gsap.ticker.remove(render);
      tween?.scrollTrigger?.kill();
      tween?.kill();
      resizeObserver.disconnect();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={host} className="relative h-[80vh]">{failed && <div className="size-full bg-surface-0" />}</div>;
}
```

- 動きを減らす設定のときは、揃った状態（`uProgress` が 1）で1フレームだけ描く。
- 粒子の数は調整欄の上限を超えない。

## 6. スクロールと uniform をつなぐ

3節と5節の例のとおり、uniform のオブジェクト（`{ value: number }`）を `gsap.to` の対象にし、`value` を動かす。

- スクロール量に直接つなぐ場合は `ease: "none"` と `scrub` を組にする（`references/motion-web.md` の4節と同じ）。
- 時間で動かす場合（ホバー、登場）は `outQuint` などのトークンのイージングを使う。
- 描画は `gsap.ticker` に登録した関数で行い、`requestAnimationFrame` を別に回さない。

## 7. 確かめ方

- スクリーンショット（`scripts/screenshot.mjs`）は WebGL の描画を待つため、`--wait 2500` 以上にする。ヘッドレスのブラウザで WebGL が使えない場合は代わりの表示が写るため、報告に「WebGL の面は代わりの表示で確認した」と書く。
- 動きを減らす設定を有効にしたブラウザで、面が止まっていることを確かめる。
- 画面外にスクロールしたとき、開発者ツールのパフォーマンスで描画が止まっていることを確かめる（できない環境では、コードで `IntersectionObserver` と ticker の登録・解除が組になっていることを確かめ、報告に書く）。
