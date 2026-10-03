// ルール定義。Rule = { id, check(text) → [{ index, message }] }（text は extractText の結果）
// 語のリストは references/anti-patterns.md と一致させる（tests/copy-lint/sync.test.mjs で検査する）。

// どこに出てきても検出する、どの商品にも言える言葉
export const STRONG_EMPTY_WORDS_JA = [
  '価値', '特別', '可能性', 'すべての人', '全ての人', 'あなたらしさ', '想い', '寄り添', '革新', '次世代', '加速', '次のレベル',
];
// 本文では普通の語でもあるため、見出しやキャッチの長さの行（25文字以下）だけで検出する
export const WEAK_EMPTY_WORDS_JA = ['新しい', '未来', '体験', '毎日'];
export const EMPTY_WORDS_EN = [
  'unlock', 'elevate', 'empower', 'seamless', 'supercharge', 'revolutionize', 'revolutionise', 'transform',
  'effortless', 'next level', 'journey',
];
export const STOCK_PHRASES = [
  'と言えるでしょう', 'といえるでしょう', 'ではないでしょうか', 'さまざまな', '様々な', '多様な', '近年、', '昨今、',
];

const SHORT_LINE = 25;
const TRIPLE_LINE = 30;
const TRIPLE_ITEM = 10;
const DEKIMASU_MIN_SENTENCES = 4;
const DEKIMASU_MAX_RATIO = 0.3;

// ---------------------------------------------------------------------------
// 共通の補助関数

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const hasKana = (s) => /[぀-ヿ]/.test(s);

// 行ごとに { index（行頭の位置）, start（文章の先頭の位置）, text（前後の空白を除いた文章） } を返す
function lines(text) {
  const out = [];
  let index = 0;
  for (const raw of text.split('\n')) {
    const lead = raw.length - raw.trimStart().length;
    out.push({ index, start: index + lead, text: raw.trim() });
    index += raw.length + 1;
  }
  return out;
}

// 文ごとに { index, text } を返す。区切りは `。！？!?` と改行。空の文は除く
function sentences(text) {
  const out = [];
  for (const m of text.matchAll(/[^。！？!?\n]+/g)) {
    const body = m[0].trim();
    if (!body) continue;
    out.push({ index: m.index + (m[0].length - m[0].trimStart().length), text: body });
  }
  return out;
}

// 閉じ括弧と空白を除いた文末
const ending = (s) => s.replace(/[」』）)】\]"'\s]+$/, '');

function matchWords(text, re, message) {
  return [...text.matchAll(re)].map((m) => ({ index: m.index, message: message(m[0]) }));
}

// ---------------------------------------------------------------------------
// ルール

const STRONG_RE = new RegExp(STRONG_EMPTY_WORDS_JA.map(escape).join('|'), 'g');
const WEAK_RE = new RegExp(WEAK_EMPTY_WORDS_JA.map(escape).join('|'), 'g');
const EN_RE = new RegExp(String.raw`\b(?:${EMPTY_WORDS_EN.map((w) => escape(w).replace(' ', String.raw`\s+`)).join('|')})\w*`, 'gi');
const emptyMessage = (w) => `「${w}」はどの商品にも言える言葉。その商品にしか言えない事実に置き換えること`;

const emptyWord = {
  id: 'empty-word',
  check(text) {
    const hits = [...matchWords(text, STRONG_RE, emptyMessage), ...matchWords(text, EN_RE, emptyMessage)];
    for (const line of lines(text)) {
      if ([...line.text].length > SHORT_LINE) continue;
      for (const m of line.text.matchAll(WEAK_RE)) {
        hits.push({ index: line.start + m.index, message: `${emptyMessage(m[0])}（見出しやキャッチの長さの行）` });
      }
    }
    return hits.sort((a, b) => a.index - b.index);
  },
};

const mottoTemplate = {
  id: 'motto-template',
  check: (text) =>
    matchWords(text, /を、?もっと[^。\n]{1,12}に/g, () => '「〜を、もっと〜に」の型。空欄が抽象語で埋まりやすいため、事実を言い切る形にすること'),
};

const dakejanaiTemplate = {
  id: 'dakejanai-template',
  check: (text) =>
    matchWords(text, /だけ(?:じゃ|では)ない/g, () => '「〜だけじゃない」の型。足し算で言わず、一番の事実を1つ言い切ること'),
};

const shortItem = (s) => [...s].length <= TRIPLE_ITEM;
const englishWord = (s) => /^[A-Za-z'-]+$/.test(s);
function sameForm(a, b) {
  if (!shortItem(a) || !shortItem(b)) return false;
  if (englishWord(a) && englishWord(b)) return true;
  return hasKana(a + b) && [...a].at(-1) === [...b].at(-1);
}

const tripleList = {
  id: 'triple-list',
  check(text) {
    const hits = [];
    for (const line of lines(text)) {
      if (!line.text || [...line.text].length > TRIPLE_LINE) continue;
      const items = line.text.split(/[、。]|[,.](?!\d)/).map((s) => s.trim()).filter(Boolean);
      // 同じ形の項目（日本語は末尾の文字が同じ、英語は1語）が3つ以上続くときだけを三つ並べとする
      let run = 1;
      for (let i = 1; i < items.length; i++) {
        run = sameForm(items[i - 1], items[i]) ? run + 1 : 1;
        if (run >= 3) {
          hits.push({ index: line.start, message: '三つ並べの型。一番伝えたい1つに絞ること' });
          break;
        }
      }
    }
    return hits;
  },
};

const englishTemplate = {
  id: 'english-template',
  check: (text) =>
    matchWords(
      text,
      /\bnot just\b|\bwhere\s+\S+\s+meets\s+\S+|,\s*reimagined\b/gi,
      (m) => `英語の定型「${m.trim()}」。意味の二重化か文法の崩しで言い直すこと`,
    ),
};

const STOCK_RE = new RegExp(STOCK_PHRASES.map(escape).join('|'), 'g');
const stockPhrase = {
  id: 'stock-phrase',
  check: (text) => matchWords(text, STOCK_RE, (w) => `決まり文句「${w}」。具体的な事実で書き直すこと`),
};

const repeatedEnding = {
  id: 'repeated-ending',
  check(text) {
    const ja = sentences(text).filter((s) => hasKana(s.text));
    const hits = [];
    for (let i = 2; i < ja.length; i++) {
      const tail = ending(ja[i].text).slice(-2);
      if (tail.length === 2 && ending(ja[i - 1].text).endsWith(tail) && ending(ja[i - 2].text).endsWith(tail)) {
        hits.push({ index: ja[i].index, message: `文末「${tail}」が3回続いている。言い切りや体言止めを混ぜること` });
      }
    }
    return hits;
  },
};

const DEKIMASU_RE = /(?:できます|できる|可能です|可能だ|可能となります)$/;
const dekimasuRatio = {
  id: 'dekimasu-ratio',
  check(text) {
    const ja = sentences(text).filter((s) => hasKana(s.text));
    if (ja.length < DEKIMASU_MIN_SENTENCES) return [];
    const matched = ja.filter((s) => DEKIMASU_RE.test(ending(s.text)));
    if (matched.length / ja.length <= DEKIMASU_MAX_RATIO) return [];
    return [
      {
        index: matched[0].index,
        message: `「〜できます」「〜が可能です」で終わる文が多い（${ja.length} 文中 ${matched.length} 文）。言い切りに書き換えること`,
      },
    ];
  },
};

export const rules = [
  emptyWord,
  mottoTemplate,
  dakejanaiTemplate,
  tripleList,
  englishTemplate,
  stockPhrase,
  repeatedEnding,
  dekimasuRatio,
];
