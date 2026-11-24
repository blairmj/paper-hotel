'use strict';

const REVIEW_ROOMS = [
  {n:203, place:'음악실', href:'music.html', kind:'music'},
  {n:207, place:'미술실', href:'art.html', kind:'art'},
  {n:208, place:'체육 준비실', href:'sports.html', kind:'sports'},
  {n:205, place:'도서실', href:'library.html', kind:'library'},
  {n:204, place:'과학실', href:'science.html', kind:'science'},
  {n:206, place:'방송실', href:'broadcast.html', kind:'broadcast'},
  {n:210, place:'인쇄실', href:'print.html', kind:'print'},
  {n:211, place:'학생회실', href:'council.html', kind:'council'},
  {n:209, place:'컴퓨터실', href:'computer.html', kind:'computer'}
];

const RECOVERY_ROOMS = [{n:502,place:'우리 반 교실',href:'index.html',kind:'classroom'},...REVIEW_ROOMS];
const SCHOOL_STORY_KEY = globalThis.SchoolRecords?.storyKey || 'paperhotel.recovery.school.v2';
const SCHOOL_REVIEW_KEY = 'paperhotel.recovery.review.v1';
const SCHOOL_ESCAPE_DURATION = 10*60_000;
const HINT_COST_SECONDS = 30;

function recoveryRoomLink(room, story) {
  const enrolled=story&&globalThis.SchoolRecords?.lesson;
  if (room.kind==='classroom') return story ? (enrolled?'./?lesson=1':'./') : 'index.html?review=1';
  return room.href+(enrolled?'?school=1&lesson=1':story?'?school=1':'');
}

function roomRestored(book, room) {
  return book.visits[room.n]?.restoration?.solved===true;
}

function readSchoolBook(key='paperhotel.explore.v1'){
  for(const store of (key.startsWith('school.escape.lesson.')?['sessionStorage']:['localStorage','sessionStorage'])){
    try{
      const book=JSON.parse(globalThis[store].getItem(key));
      if(book && book.visits && typeof book.visits==='object')return book;
    }catch{}
  }
  return {room:203,visits:{}};
}

function writeSchoolBook(key,book){
  const value=JSON.stringify(book);
  for(const store of (key.startsWith('school.escape.lesson.')?['sessionStorage']:['localStorage','sessionStorage'])){
    try{globalThis[store].setItem(key,value);return true}catch{}
  }
  return false;
}

function schoolEscapeTimer(book){
  const timer=book.escapeTimer;
  return Number.isFinite(timer?.startedAt)&&Number.isFinite(timer.deadline)?timer:null;
}

function beginSchoolAttempt(plan,lessonAttempt=null){
  const startedAt=Date.now();
  return writeSchoolBook(SCHOOL_STORY_KEY,{
    room:RECOVERY_ROOMS[0].n,visits:{},route:plan,...(lessonAttempt?{lessonAttempt}:{}),
    escapeTimer:{startedAt,deadline:startedAt+SCHOOL_ESCAPE_DURATION}
  });
}

function retrySchool(){
  writeSchoolBook(SCHOOL_STORY_KEY,{room:RECOVERY_ROOMS[0].n,visits:{}});
  location.replace(recoveryRoomLink(RECOVERY_ROOMS[0],true));
}

function showSchoolTimeout(dialog,retry){
  dialog.dataset.panel='timeout';
  dialog.querySelector('#panelTitle').textContent='시간이 끝났어요.';
  const actions=document.createElement('div');
  actions.className='actions';
  const button=document.createElement('button');
  button.type='button';button.className='primary';button.textContent='다시 도전';button.onclick=retry;
  actions.append(button);
  dialog.querySelector('#panelBody').replaceChildren(actions);
  if(!dialog.open)dialog.showModal();
  button.focus();
}

function reviewRoomSolved(room,book=readSchoolBook()){
  const visit=book.visits[room.n];
  return room.kind==='music'
    ? visit?.clockPuzzle?.solved===true
    : visit?.reviewPuzzle?.puzzle===room.kind && visit.reviewPuzzle.solved===true;
}

function nextReviewRoom(number){
  const index=REVIEW_ROOMS.findIndex(room=>room.n===number),book=readSchoolBook();
  const following=[...REVIEW_ROOMS.slice(index+1),...REVIEW_ROOMS.slice(0,index)];
  return following.find(room=>!reviewRoomSolved(room,book));
}

function setupReviewNavigation(number,{showJump=true,rooms=REVIEW_ROOMS,urlFor=room=>room.href}={}){
  const school=document.querySelector('.school'),location=document.createElement('div');
  location.className='room-location';
  school.before(location);location.append(school);
  let jump;
  if(showJump){
    jump=document.createElement('details');
    jump.className='review-jump';jump.id='reviewJump';
    const summary=document.createElement('summary');summary.textContent='바로가기';
    const links=document.createElement('nav');links.setAttribute('aria-label','검토용 교실 바로가기');
    for(const room of rooms){
      const link=document.createElement('a');link.href=urlFor(room);link.textContent=room.place;
      if(room.n===number){
        link.setAttribute('aria-current','page');
        link.onclick=event=>{event.preventDefault();jump.open=false};
      }
      links.append(link);
    }
    jump.append(summary,links);location.append(jump);
    document.addEventListener('click',event=>{if(!jump.contains(event.target))jump.open=false});
  }
  const paths={bag:'M12 5Q7 2 3 4V20Q7 18 12 21Q17 18 21 20V4Q17 2 12 5V21',map:'M3 5L9 3L15 5L21 3V19L15 21L9 19L3 21ZM9 3V19M15 5V21'};
  for(const [id,path]of Object.entries(paths)){
    const button=document.getElementById(id),label=button.textContent;
    button.setAttribute('aria-label',label);button.title=label;button.classList.add('menu-icon');
    button.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="'+path+'"/></svg>';
  }
  return jump;
}

function confirmRoomHint(timer, reveal){
  if(!timer || timer.check())return;

  const prompt=document.createElement('dialog');
  prompt.className='hint-confirm';
  prompt.setAttribute('role','alertdialog');
  prompt.setAttribute('aria-label','힌트 확인');
  prompt.setAttribute('aria-describedby','hintCostMessage');
  prompt.innerHTML=`
    <form method="dialog">
      <p id="hintCostMessage">힌트를 보면 시간이 ${HINT_COST_SECONDS}초 줄어듭니다. 그래도 보시겠습니까?</p>
      <div class="actions">
        <button value="cancel" autofocus>취소</button>
        <button value="confirm" class="primary">확인</button>
      </div>
    </form>`;
  prompt.addEventListener('close',()=>{
    const confirmed=prompt.returnValue==='confirm';
    prompt.remove();
    if(confirmed && timer.spendHint())reveal();
  },{once:true});
  document.body.append(prompt);
  prompt.showModal();
}

function appendRoomTextHint(host,timer,text){
  const hint=document.createElement('div');
  hint.className='hint';
  const trigger=document.createElement('button');
  trigger.type='button';
  trigger.textContent='힌트 보기';
  trigger.setAttribute('aria-haspopup','dialog');
  trigger.onclick=()=>confirmRoomHint(timer,()=>{
    const message=document.createElement('p');
    message.textContent=text;
    message.tabIndex=-1;
    hint.replaceChildren(message);
    message.focus({preventScroll:true});
  });
  hint.append(trigger);
  host.append(hint);
}

function setupSchoolTimer(number,{isSolved=()=>false,onExpire,key='paperhotel.explore.v1'}){
  const shared=key===SCHOOL_STORY_KEY,progress=readSchoolBook(key);
  const duration=shared?SCHOOL_ESCAPE_DURATION:120_000;
  const saved=shared?schoolEscapeTimer(progress):progress.visits[number]?.escapeTimer;
  const attempt=saved?.startedAt;
  let deadline=Number.isFinite(saved?.deadline)?saved.deadline:Date.now()+duration;
  let expired=false,replaced=false,stopped=shared?saved?.stopped===true:isSolved();
  let remaining=stopped?(saved?.remaining??duration):Math.max(0,deadline-Date.now());
  const badge=document.createElement('span');badge.className='room-timer';badge.setAttribute('aria-label','남은 시간');
  badge.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 6V12L16 14"/></svg><span id="roomTime"></span>';
  document.querySelector('.room-head > nav').append(badge);
  const text=badge.querySelector('#roomTime');
  function save(complete){
    const book=readSchoolBook(key),state={deadline,remaining,expired,stopped};
    if(shared){
      const latest=schoolEscapeTimer(book);
      if(!latest||latest.startedAt!==attempt||latest.stopped)return false;
      book.escapeTimer={...state,startedAt:attempt};
    }else{
      book.visits[number]={...book.visits[number],escapeTimer:state};
    }
    complete?.(book);
    return writeSchoolBook(key,book);
  }
  function render(){
    const seconds=Math.max(0,Math.ceil(remaining/1000));text.textContent=Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0');
    badge.dataset.expired=String(expired);badge.classList.toggle('running-low',!stopped&&seconds>0&&seconds<=10);
  }
  function check(){
    if(replaced)return true;
    if(shared){
      const latest=schoolEscapeTimer(readSchoolBook(key));
      if(!latest||latest.startedAt!==attempt){
        replaced=true;
        location.reload();
        return true;
      }
      deadline=latest.deadline;
      stopped=latest.stopped===true;
      if(stopped){remaining=latest.remaining;render();return false}
    }
    if(stopped)return false;
    remaining=Math.max(0,deadline-Date.now());
    if(remaining===0&&!expired){
      expired=true;
      if(!shared)save();
      render();
      document.querySelector('.hint-confirm[open]')?.close('cancel');
      onExpire();
    }else{
      render();
    }
    return expired;
  }
  let tick=setInterval(check,200);
  document.addEventListener('visibilitychange',check);window.addEventListener('pagehide',()=>clearInterval(tick));
  window.addEventListener('pageshow',()=>{clearInterval(tick);tick=setInterval(check,200);check()});
  if(!shared)save();
  render();queueMicrotask(check);
  return {
    get expired(){return replaced||expired||(!stopped&&Date.now()>=deadline)},check,
    spendHint(){
      if(check()||stopped)return false;
      const originalDeadline=deadline,originalRemaining=remaining;
      deadline-=HINT_COST_SECONDS*1000;
      remaining=Math.max(0,deadline-Date.now());
      if(!save()){deadline=originalDeadline;remaining=originalRemaining;return false}
      if(shared){const room=RECOVERY_ROOMS.find(item=>item.n===number);if(room)globalThis.SchoolRecords?.event(readSchoolBook(key),room.kind,'hint')}
      return !check();
    },
    stop(complete){
      if(check()||stopped)return false;
      stopped=true;
      if(!save(complete)){stopped=false;return false}
      render();return true;
    },
    reset(){
      if(shared)return;
      deadline=Date.now()+duration;remaining=duration;expired=false;stopped=false;
      save();render();
    }
  };
}
