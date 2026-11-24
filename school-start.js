'use strict';

async function enterSchool({restart, keepResult}) {
  async function enter() {
    const previous = readSchoolBook(SCHOOL_STORY_KEY);
    const entry = schoolEntryProgress(previous);
    if (!restart && (entry.status === 'active' || (keepResult && entry.status !== 'new'))) return;

    const plan = fixedSchoolRoute();
    const enrollment = SchoolRecords.lesson ? await SchoolRecords.reserve(plan.stops) : null;
    const storageError = '게임을 저장할 수 없어요. 브라우저에서 저장 공간을 허용한 뒤 다시 열어 주세요.';
    if (entry.status === 'complete' || entry.status === 'expired') {
      if (entry.status === 'expired' && !previous.surveyTimeoutRoom) {
        previous.surveyTimeoutRoom = entry.room.kind;
        SchoolRecords.event(previous, entry.room.kind, 'timeout');
      }
      if (!writeSchoolBook(SCHOOL_PREVIOUS_KEY, previous)) throw Error(storageError);
    }
    if (!beginSchoolAttempt(plan, enrollment)) throw Error(storageError);
    if (enrollment) SchoolRecords.started();
  }
  // Two tabs opening the student link should join the same ten-minute game.
  if (navigator.locks) await navigator.locks.request(SCHOOL_STORY_KEY, enter);
  else await enter();
}
