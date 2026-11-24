'use strict';

function needsNewSchoolAttempt(entry, {restart, keepResult}) {
  return restart || entry.status === 'new' ||
    (!keepResult && (entry.status === 'expired' || entry.status === 'complete'));
}

async function enterSchool(options, showGuide) {
  const initial = schoolEntryProgress(readSchoolBook(SCHOOL_STORY_KEY));
  if (!needsNewSchoolAttempt(initial, options)) return;
  await showGuide();

  async function enter() {
    const previous = readSchoolBook(SCHOOL_STORY_KEY);
    const entry = schoolEntryProgress(previous);
    // Another tab may have started a game while this student was reading.
    if (entry.startedAt !== initial.startedAt && entry.status !== 'new') return;
    if (!needsNewSchoolAttempt(entry, options)) return;

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
  // Only claim the lock when the student is ready to play.
  if (navigator.locks) await navigator.locks.request(SCHOOL_STORY_KEY, enter);
  else await enter();
}
