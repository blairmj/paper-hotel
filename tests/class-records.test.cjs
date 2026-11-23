const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');

const source = fs.readFileSync(require.resolve('../class-records.js'), 'utf8');

function storage() {
  const values = new Map();
  return {
    get length() { return values.size; },
    key(index) { return [...values.keys()][index]; },
    getItem(key) { return values.get(key) ?? null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); }
  };
}

function openPage(search, sessionStorage, localStorage, fetch) {
  const context = {
    location: { search }, fetch, crypto: webcrypto,
    URLSearchParams, AbortSignal, sessionStorage, localStorage,
    setTimeout() { return 1; },
    document: { addEventListener() {}, getElementById() {}, querySelector() {} },
    window: { addEventListener() {}, sessionStorage, localStorage }
  };
  vm.runInNewContext(source, context);
  return context.SchoolRecords;
}

test('수업 출발 재시도는 같은 플레이를 쓰고, 다음 도전은 새 플레이를 만든다', async () => {
  const session = storage(), local = storage(), starts = [];
  const fetch = async (url, options) => {
    if (url.endsWith('/check')) return Response.json({ label: '우리 반' });
    starts.push(JSON.parse(options.body));
    return Response.json({ accepted: true, created: 100 });
  };
  await openPage('', session, local, fetch).join('ABCD EFGH JKLM', 12);
  const lesson = openPage('?lesson=1', session, local, fetch);
  const stops = ['library', 'print', 'science'];
  const first = await lesson.reserve(stops);
  const retried = await openPage('?lesson=1', session, local, fetch).reserve(stops);
  assert.equal(retried.id, first.id);
  assert.equal(retried.key, first.key);
  assert.equal(starts[0].seat, 12);
  lesson.started();
  assert.notEqual((await lesson.reserve(stops)).id, first.id);
});

test('방 이동 전 오프라인 기록은 재접속 후 한 번만 전달되며 연습 플레이는 기록을 만들지 않는다', async () => {
  const session = storage(), local = storage(), saved = [];
  let online = false;
  const fetch = async (url, options) => {
    if (!online) throw Error('offline');
    const batch = JSON.parse(options.body);
    saved.push(...batch.events);
    return Response.json({ accepted: batch.events.length });
  };
  const book = {
    lessonAttempt: { id: webcrypto.randomUUID(), key: 'a'.repeat(64) },
    escapeTimer: { startedAt: Date.now() - 1000 }
  };
  openPage('', session, local, fetch).event(book, 'library', 'enter');
  assert.equal(local.length, 0);
  const inRoom = openPage('?lesson=1', session, local, fetch);
  inRoom.event(book, 'library', 'enter');
  inRoom.event(book, 'library', 'enter');
  inRoom.event(book, 'library', 'book', '4:61');
  await inRoom.flush();
  assert.equal(local.length, 2);
  online = true;
  const nextRoom = openPage('?lesson=1', session, local, fetch);
  await nextRoom.flush();
  await nextRoom.flush();
  assert.equal(local.length, 0);
  assert.deepEqual(saved.map(e => e.kind), ['enter', 'book']);
});
