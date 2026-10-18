import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseHashtags, cardTags, protectHashtags, filterByTags } from '../app/lib/hashtags.ts';

test('recognizes only whitespace-delimited halfwidth hashtags with original offsets', () => {
  const text = '#英語、復習\n#ＡＢＣ #abc #cafe\u0301 #数学_2 C# https://example/#no 今日は#no ＃no #';
  assert.deepEqual(cardTags(text), ['英語', 'abc', 'café', '数学_2']);
  for (const tag of parseHashtags(text)) {
    assert.equal(text.slice(tag.start, tag.end).slice(1).normalize('NFKC').toLowerCase(), tag.name);
  }
});

test('removes only hashtag intersections, keeping emoji UTF-16 offsets and adjacent masks', () => {
  const text = '😀答え #英語 次 #数学 終';
  const tags = parseHashtags(text);
  assert.deepEqual(protectHashtags(text, [{ start: 0, end: text.length }]), [
    { start: 0, end: tags[0].start },
    { start: tags[0].end, end: tags[1].start },
    { start: tags[1].end, end: text.length },
  ]);
  assert.deepEqual(protectHashtags(text, [{start: tags[0].start + 1, end: tags[0].end}]), []);
  const clean = [{start: 0, end: tags[0].start}];
  assert.deepEqual(protectHashtags(text, clean), clean);
});

test('AND filtering never mutates the canonical cards used for full-list saves', () => {
  const cards = [{text: '#英語 #苦手'}, {text: '#英語'}, {text: '#数学'}, {text: 'タグなし'}];
  assert.deepEqual(filterByTags(cards, ['英語', '苦手']), [cards[0]]);
  assert.deepEqual(filterByTags(cards, ['不存在']), []);
  assert.equal(filterByTags(cards, []), cards);
  assert.equal(cards.length, 4);
  assert.equal(filterByTags([{text: '#ＥＮＧＬＩＳＨ'}], ['english']).length, 1);
});
