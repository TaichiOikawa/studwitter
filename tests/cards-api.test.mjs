import {test} from 'node:test';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
import {rows} from './fixtures/cards-api.mjs';

registerHooks({
  resolve(specifier,context,nextResolve) {
    if (specifier === '@/app/lib/auth' || specifier === '@/app/lib/prisma') {
      return nextResolve(new URL('./fixtures/cards-api.mjs',import.meta.url).href,context);
    }
    if (specifier === '@/app/lib/hashtags') {
      return nextResolve(new URL('../app/lib/hashtags.ts',import.meta.url).href,context);
    }
    return nextResolve(specifier,context);
  },
});
const {GET,PUT} = await import('../app/api/cards/route.ts');
const base = {id:'card',text:'普通の本文',likes:0,createdAt:1,note:'',image:null,auto:false,maskedRanges:[]};
function request(cards, authenticated = true) {
  const headers = authenticated ? {authorization:'test-session'} : {};
  return new Request('http://localhost/api/cards',cards ? {method:'PUT',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({cards})} : {headers});
}

test('mask splitting round-trips more than 100 resulting ranges without losing surrounding masks', async () => {
  rows.length = 0;
  const text = '前 '+Array.from({length:101},(_,i)=>`#tag${i} 後 `).join('');
  const response = await PUT(request([{...base,text,maskedRanges:[{start:0,end:text.length}]}]));
  assert.equal(response.status,200);
  const loaded = await GET(request());
  assert.equal(loaded.status,200);
  const {cards} = await loaded.json();
  assert.equal(cards[0].maskedRanges.length,102);
  assert.equal(cards[0].text,text);
  assert.equal((await PUT(request(cards))).status,200);
  assert.equal((await GET(request())).status,200);
});

test('route still rejects malformed ranges and unauthenticated requests', async () => {
  assert.equal((await GET(request(undefined,false))).status,401);
  assert.equal((await PUT(request([base],false))).status,401);
  for (const maskedRanges of [[{start:0,end:999}],[{start:0,end:2},{start:1,end:3}],[{start:0.5,end:2}]]) {
    assert.equal((await PUT(request([{...base,maskedRanges}]))).status,400);
  }
  const tooMany = Array.from({length:101},(_,i)=>({start:2*i,end:2*i+1}));
  assert.equal((await PUT(request([{...base,text:'a'.repeat(300),maskedRanges:tooMany}]))).status,400);
});

test('saving a full collection preserves unfiltered cards and isolates other users', async () => {
  rows.length = 0;
  rows.push({...base,id:'other',userId:'other-user',createdAt:new Date(1),maskedRanges:'[]'});
  assert.equal((await PUT(request([{...base,id:'english',text:'#英語'},{...base,id:'math',text:'#数学'}]))).status,200);
  const {cards} = await (await GET(request())).json();
  assert.deepEqual(cards.map(card=>card.id),['english','math']);
  assert.equal((await PUT(request(cards.map(card=>({...card,likes:card.id==='english'?1:0}))))).status,200);
  assert.equal(rows.length,3);
  assert.ok(rows.some(row=>row.userId==='other-user'));
});
