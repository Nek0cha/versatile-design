import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lintCopySource } from '../../skills/copywriting/scripts/lib/copy-engine.mjs';
import { rules } from '../../skills/copywriting/scripts/lib/copy-rules.mjs';

const ids = (src, file = 'x.md') => lintCopySource(src, file, rules).map((v) => v.rule);

test('flags strong empty words anywhere', () => {
  assert.deepEqual(ids('新しい価値を、すべての人へ。\n'), ['empty-word', 'empty-word', 'empty-word']);
  const long = '私たちは創業以来、地域の皆さまに向けて、確かな品質と価値のある商品を届けることを大切にしてきました。\n';
  assert.deepEqual(ids(long), ['empty-word']);
});
test('weak empty words are flagged only on short lines', () => {
  assert.deepEqual(ids('毎日を、ひと匙。\n'), ['empty-word']);
  assert.deepEqual(ids('店主は毎日、朝五時に豆を焙煎し、その日の天気を見て挽き方を少しずつ変えている。\n'), []);
});
test('english empty words match word starts case-insensitively', () => {
  assert.deepEqual(ids('Elevates your craft.\n'), ['empty-word']);
  assert.deepEqual(ids('Take it to the next level.\n'), ['empty-word']);
  assert.deepEqual(ids('Craft beyond the block.\n'), []);
});
test('flags templates', () => {
  assert.deepEqual(ids('毎日を、もっと自由に。\n'), ['empty-word', 'motto-template']);
  assert.deepEqual(ids('コーヒーだけじゃない。\n'), ['dakejanai-template']);
  assert.deepEqual(ids('速い。安い。うまい。\n'), ['triple-list']);
  assert.deepEqual(ids('Not just a tool.\n'), ['english-template']);
  assert.deepEqual(ids('Where code meets craft.\n'), ['english-template']);
  assert.deepEqual(ids('Your desk, reimagined.\n'), ['english-template']);
});
test('does not flag two-part copy', () => {
  assert.deepEqual(ids('日本を、1枚で。\n'), []);
  assert.deepEqual(ids('がんばるひとの、がんばらない時間。\n'), []);
});
test('flags stock phrases', () => assert.deepEqual(ids('理想的と言えるでしょう。\n'), ['stock-phrase']));
test('flags the third repeated ending', () => {
  const v = lintCopySource('豆を焼きます。\n袋に詰めます。\n店に並べます。\n', 'x.md', rules);
  assert.deepEqual(v.map((x) => [x.rule, x.line]), [['repeated-ending', 3]]);
});
test('repeated ending ignores closing brackets', () => {
  assert.deepEqual(ids('「焼きます」。\n「詰めます」。\n「並べます」。\n'), ['repeated-ending']);
});
test('dekimasu ratio needs at least four japanese sentences', () => {
  assert.deepEqual(ids('予約できます。\n持ち帰りできます。\n'), []);
  assert.deepEqual(ids('予約できます。\n持ち帰りも可能です。\n豆は自家焙煎だ。\n朝七時に開く。\n'), ['dekimasu-ratio']);
  assert.deepEqual(ids('You can book. You can take out. You can pay. You can sit.\n'), []);
});
test('dekimasu ratio reports counts once', () => {
  const v = lintCopySource('予約できます。\n持ち帰りも可能です。\n豆は自家焙煎だ。\n朝七時に開く。\n', 'x.md', rules);
  assert.equal(v.length, 1);
  assert.equal(v[0].line, 1);
  assert.match(v[0].message, /4 文中 2 文/);
});
test('scans copy inside tsx', () => {
  assert.deepEqual(ids('<h1 className="transform">Seamless flow</h1>\n', 'x.tsx'), ['empty-word']);
});
test('triple list does not split decimals or thousands separators', () => {
  assert.deepEqual(ids('0.3秒、push の手前で。\n'), []);
  assert.deepEqual(ids('1.5倍速い、2.5倍安い、3.5倍うまい。\n'), ['triple-list']);
});
test('triple list needs three items of the same form', () => {
  assert.deepEqual(ids('風の音も、陽の傾きも、紙に連れて帰る。\n'), []);
  assert.deepEqual(ids('設定ファイルなし。待ち時間、0.3秒。\n'), []);
  assert.deepEqual(ids('おいしく、楽しく、美しく。\n'), ['triple-list']);
  assert.deepEqual(ids('Fast. Simple. Secure.\n'), ['triple-list']);
  assert.deepEqual(ids('Ship it. Then sleep.\n'), []);
});
