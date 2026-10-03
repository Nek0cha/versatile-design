# スクロールバー

スクロールする領域（サイドバー、一覧、パネル、コードの表示）を作る段階で読む。トークンの名前は `references/tokens-tailwind.md` だけを出典とする。

## 目的

- スクロールできることは分かるが、中身より目立たない、細くて静かなスクロールバーにする。
- スクロールバーが現れたり消えたりしても、中身の位置がずれないようにする。

## 守ること

- 幅は 8px にする。つまみの色は `--color-line`、スクロールする領域にマウスが載っている間だけ `--color-text-faint` に濃くする。溝（トラック）は透明にする。
- ブラウザの差を吸収するため、次の2つの書き方を両方書く。
  - **標準のプロパティ**（Firefox と Chromium）：`scrollbar-width: thin` と `scrollbar-color: <つまみ> <溝>`。
  - **`::-webkit-scrollbar` の疑似要素**（Safari）：幅、つまみ、溝をそれぞれ指定する。
- Chromium は、標準のプロパティを指定した要素では `::-webkit-scrollbar` を無視する。そのため両方を書いても衝突しない。標準のプロパティでは幅を px で指定できず、`thin` の実際の幅はブラウザが決める（8px 前後）。8px を正確に指定できるのは `::-webkit-scrollbar` の側だけである。
- `scrollbar-gutter: stable` を付け、スクロールバーの場所を最初から確保する。中身が増えてスクロールバーが現れたときに、中身が横にずれなくなる。中身を中央に揃える領域では `stable both-edges` にして、左右の余白を揃える。
- スクロールバーの書き方は `@utility` で1つのクラスにまとめ、スクロールする領域ごとにそのクラスを付ける。ページ全体（`html`）には付けず、ページのスクロールバーは `color-scheme`（`references/tokens-tailwind.md` の2節）でテーマに合わせるだけにする。
- つまみの色の変化には動きを付けない。スクロールバーの色は `transition` が効くブラウザと効かないブラウザがあり、動きを揃えられないためである。動きがないため、動きを減らす設定への対応も要らない。

## やってはいけないこと

- スクロールバーを消すこと（`scrollbar-width: none`、`::-webkit-scrollbar { display: none }`）。スクロールできることが分からなくなる。消してよいのは、横にスクロールするタブの列のように、端の部品が切れて見えることでスクロールできると分かり、左右のボタンでも移動できる場合だけである。
- つまみにアクセントの色を使うこと。アクセントは主要な操作、選択中、肯定的な状態にだけ使う（`../design-core/references/color.md` の1節）。
- 片方のブラウザ向けの書き方だけを書くこと。Safari だけ太い標準のスクロールバーになる、などの差が出る。
- `scrollbar-gutter` を付けず、中身の量によってレイアウトが横にずれること。
- スクロールバーを中身の上に重ねて表示する自前の部品で置き換えること。ブラウザのスクロールの手触りとキーボード操作が失われる。

## コード例

`@utility` でまとめたスクロールバーのクラスである。`@theme` を書いた CSS のファイルに足す。

```css
@utility scroll-area {
  overflow: auto;
  scrollbar-gutter: stable;

  /* Firefox と Chromium */
  scrollbar-width: thin;
  scrollbar-color: var(--color-line) transparent;

  &:hover {
    scrollbar-color: var(--color-text-faint) transparent;
  }

  /* Safari（Chromium は上の標準のプロパティを優先し、ここを無視する） */
  &::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  &::-webkit-scrollbar-track,
  &::-webkit-scrollbar-corner {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    /* 2px の透明な枠で、つまみを溝の中央に細く見せる */
    border: 2px solid transparent;
    border-radius: 9999px;
    background-clip: padding-box;
    background-color: var(--color-line);
  }

  &:hover::-webkit-scrollbar-thumb {
    background-color: var(--color-text-faint);
  }
}
```

- Tailwind v4 の `@utility` で定義すると、`scroll-area` を普通のクラスとして使え、`md:scroll-area` のような接頭辞も付けられる。
- つまみの角を丸めるのは、つまみが部品ではなく目印だからである。角丸の段階（`rounded-sm` など）の対象外として、両端を丸める。
- 色は役割名のトークンだけを参照しているため、テーマを切り替えるとスクロールバーの色も追従する。

スクロールする領域での使い方である。

```tsx
const channels = Array.from({ length: 40 }, (_, i) => ({ id: `c${i}`, name: `チャンネル ${i + 1}` }));

export function ChannelSidebar() {
  return (
    <nav aria-label="チャンネル" className="flex h-full w-60 flex-col border-r border-line bg-surface-1">
      <p className="px-3 pt-3 pb-2 text-xs text-text-muted select-none">チャンネル</p>
      {/* 高さを決めた領域にだけ scroll-area を付ける。ページ全体には付けない */}
      <ul className="scroll-area min-h-0 flex-1 px-1 pb-2">
        {channels.map((channel) => (
          <li key={channel.id}>
            <a href={`#${channel.id}`} className="flex h-9 select-none items-center rounded-md px-2 text-sm text-text-muted hover:bg-surface-2 hover:text-text focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent">
              {channel.name}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
```

- フレックスの子要素をスクロールさせるときは `min-h-0` を付ける。付けないと、子要素が中身の高さまで伸び、スクロールバーが出ない。
- スクロールする領域の中のフォーカスリングは、`outline-offset` を負の値にして内側に描く。外側に描くと、領域の端で切れる。

## 確認方法

Firefox、Chromium、Safari のそれぞれで、スクリーンショットと実際の操作で次の点を見る。

1. スクロールバーが細く、つまみが区切り線と同じくらいの控えめな色か。溝が透明か。
2. 領域にマウスを載せたとき、つまみが1段濃くなるか。
3. 中身を増やしてスクロールバーが現れても、中身が横にずれないか。
4. ダークとライトを切り替えたとき、スクロールバーの色も切り替わるか。
5. Safari で、標準の太いスクロールバーのままになっていないか。
6. スクロールバーを消した領域がないか。消した場合は、スクロールできることが別の方法で分かるか。
