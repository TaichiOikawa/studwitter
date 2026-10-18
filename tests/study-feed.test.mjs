import { test } from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { filterByTags, parseHashtags } from '../app/lib/hashtags.ts';

// Resolve the app's extensionless TypeScript imports in Node's native test runner.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[a-z]+$/i.test(specifier)) {
      return nextResolve(`${specifier}.ts`, context);
    }
    return nextResolve(specifier, context);
  },
});
const { createSampleCards, createPostCards, loadCards, saveCards, pickWeighted } = await import('../app/lib/study-feed.ts');

test('new samples have only their selected subject tag and retain sample metadata', () => {
  const samples = createSampleCards(['英語', '数学']);
  assert.equal(samples.length, 4);
  assert.equal(filterByTags(samples, ['英語']).length, 2);
  assert.equal(filterByTags(samples, ['数学']).length, 2);
  assert.equal(filterByTags(samples, ['英語', '数学']).length, 0);
  assert.ok(samples.every(card => card.auto && card.maskedRanges.length === 0));
});

test('creating a post trims text, adjusts UTF-16 masks and excludes hashtags', () => {
  const [post] = createPostCards('  😀答え #英語 復習  ', null, [{start:2,end:14}]);
  assert.equal(post.text, '😀答え #英語 復習');
  const [tag] = parseHashtags(post.text);
  assert.ok(post.maskedRanges.every(range => range.end <= tag.start || range.start >= tag.end));
  assert.deepEqual(post.maskedRanges[0], {start:0,end:tag.start});
});

test('legacy cards are protected on load and filtered review saves the complete collection', async (t) => {
  const base = { likes:0, createdAt:1, note:'注釈 #対象外', image:null, auto:false };
  const legacy = [
    {...base, id:'a', text:'答え #英語 復習', maskedRanges:[{start:0,end:9}]},
    {...base, id:'b', text:'別のカード #数学', maskedRanges:[]},
  ];
  let saved;
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, '/api/cards');
    if (options?.method === 'PUT') {
      saved = JSON.parse(options.body).cards;
      return Response.json({saved:saved.length});
    }
    return Response.json({cards:legacy});
  });
  const loaded = await loadCards();
  const pool = filterByTags(loaded, ['英語']);
  assert.equal(pool.length, 1);
  assert.ok(pickWeighted(pool, 20).every(id => id === 'a'));
  loaded[0].likes += 1;
  await saveCards(loaded);
  assert.deepEqual(saved.map(card=>card.id), ['a', 'b']);
  assert.deepEqual(saved[0].maskedRanges, [{start:0,end:3},{start:6,end:9}]);
  assert.equal(saved[0].likes, 1);
  assert.equal(saved[1].note, base.note);
  assert.deepEqual(pickWeighted(filterByTags(loaded, ['不存在']), 5), []);
});
