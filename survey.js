'use strict';

function showStudentSurvey() {
  const fields = ['favorite', 'hardest', 'easiest'];
  const form = document.getElementById('surveyForm');
  const note = document.getElementById('surveyNote');
  const error = document.getElementById('surveyError');
  const send = document.getElementById('sendSurvey');
  const back = document.getElementById('surveyBack');
  const params = new URLSearchParams(location.search);
  const lesson = SchoolRecords.lesson;
  const context = SchoolRecords.context();
  const progress = readSchoolBook(SCHOOL_STORY_KEY);
  const timer = schoolEscapeTimer(progress);
  if (!lesson && !params.has('solo') && context?.session) {
    const enrolled = readSchoolBook('school.escape.lesson.' + context.session);
    if (enrolled.lessonAttempt && enrolled.escapeTimer?.startedAt >= (timer?.startedAt ?? 0)) {
      location.replace('survey.html?lesson=1');
      return;
    }
  }

  const plan = schoolRoute(progress);
  const computer = RECOVERY_ROOMS.find(room => room.kind === 'computer');
  const completed = timer?.stopped && roomRestored(progress, computer);
  const timedOut = timer && !timer.stopped && timer.deadline <= Date.now() && progress.surveyTimeoutRoom;
  const validLesson = !lesson || (SchoolRecords.storyKey && progress.lessonAttempt);
  const formerRooms = [{kind:'broadcast',place:'방송실',n:206},{kind:'print',place:'인쇄실',n:210},{kind:'council',place:'학생회실',n:211}];
  const surveyRooms = plan ? RECOVERY_ROOMS : [...RECOVERY_ROOMS, ...formerRooms];
  const stops = plan?.stops ?? progress.route?.stops;
  const eligible = Array.isArray(stops) && validLesson && (completed || timedOut);
  const destination = schoolRoomToPlay(progress, plan);
  back.href = lesson && !SchoolRecords.storyKey ? 'join.html' : recoveryRoomLink(destination, true);
  if (!eligible) {
    note.textContent = '게임을 마치면 다녀온 교실 중에서 답을 고를 수 있어요.';
    for (const key of fields) form.elements.namedItem(key).hidden = true;
    back.textContent = lesson && !SchoolRecords.storyKey ? '학급으로 참여하기' : plan ? '게임으로 돌아가기' : '게임 시작';
    return;
  }

  back.textContent = plan ? '결과로 돌아가기' : '게임 시작';
  const visited = ['classroom', ...new Set(stops), 'computer']
    .map(id => surveyRooms.find(room => room.kind === id))
    .filter(room => room && (roomRestored(progress, room) || room.kind === timedOut));
  const saved = progress.survey;
  const selects = fields.map(key => form.elements.namedItem(key));
  function done(focus = false) {
    form.hidden = true;
    note.hidden = true;
    const message = document.getElementById('surveyDone');
    message.textContent = lesson ? '설문을 보냈어요. 고마워요!' : '이 기기에 응답을 저장했어요.';
    message.hidden = false;
    if (focus) message.focus();
  }
  if (saved?.status === 'sent') { done(); return; }
  if (!lesson) note.textContent = '혼자 플레이한 설문은 이 기기에 저장돼요.';
  for (const select of selects) {
    for (const room of visited) select.add(new Option(room.place, room.kind));
    select.add(new Option('잘 모르겠어요', 'unsure'));
    select.hidden = false;
    const previous = saved?.answers?.[select.name];
    if (previous && [...select.options].some(o => o.value === previous)) select.value = previous;
  }
  send.hidden = false;
  send.textContent = lesson ? '설문 보내기' : '응답 저장';

  function answers() {
    return Object.fromEntries(selects.map(select => [select.name, select.value]));
  }
  function remember(status, picks) {
    const latest = readSchoolBook(SCHOOL_STORY_KEY);
    if (latest.escapeTimer?.startedAt !== timer.startedAt) return false;
    latest.survey = {status, answers:picks};
    return writeSchoolBook(SCHOOL_STORY_KEY, latest);
  }
  form.addEventListener('change', () => {
    error.hidden = true;
    remember('draft', answers());
  });
  let busy = false;
  async function submit() {
    if (busy || form.hidden || !form.reportValidity()) return;
    const picks = answers();
    if (readSchoolBook(SCHOOL_STORY_KEY).escapeTimer?.startedAt !== timer.startedAt) {
      error.textContent = '새 플레이가 시작됐어요. 게임으로 돌아가 주세요.';
      error.hidden = false;
      return;
    }
    busy = true;
    send.disabled = true;
    for (const select of selects) select.disabled = true;
    error.hidden = true;
    try {
      if (lesson) {
        remember('pending', picks);
        send.textContent = '보내는 중';
        await SchoolRecords.submitSurvey(progress.lessonAttempt, picks);
        remember('sent', picks);
      } else if (!remember('sent', picks)) {
        throw Error('이 기기에 저장하지 못했어요. 브라우저 저장소를 확인해 주세요.');
      }
      done(true);
    } catch (e) {
      error.textContent = e.message;
      error.hidden = false;
      send.textContent = lesson ? '다시 보내기' : '다시 저장';
    } finally {
      busy = false;
      send.disabled = false;
      for (const select of selects) select.disabled = false;
    }
  }
  form.addEventListener('submit', e => { e.preventDefault(); submit(); });
  function resume() {
    const latest = readSchoolBook(SCHOOL_STORY_KEY);
    if (lesson && latest.escapeTimer?.startedAt === timer.startedAt && latest.survey?.status === 'pending') submit();
  }
  window.addEventListener('online', resume);
  if (navigator.onLine) resume();
}
showStudentSurvey();
