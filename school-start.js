'use strict';

(() => {
  if(new URLSearchParams(location.search).has('review')){
    location.replace(recoveryRoomLink(RECOVERY_ROOMS[0],false));return;
  }
  if(SchoolRecords.lesson&&!SchoolRecords.storyKey){location.replace('join.html');return}

  const id=name=>document.getElementById(name);
  const cover=id('cover'),guide=id('guide'),start=id('startGame'),resume=id('returnGame');
  const note=id('saveNote'),error=id('entryError'),back=id('showCover');
  const progress=()=>schoolEntryProgress(readSchoolBook(SCHOOL_STORY_KEY));
  let shown,starting=false;

  for(const room of RECOVERY_ROOMS){
    const link=document.createElement('a');
    link.href=recoveryRoomLink(room,false);link.textContent=room.place;id('roomLinks').append(link);
  }
  document.addEventListener('click',event=>{
    if(!id('entryJump').contains(event.target))id('entryJump').open=false;
  });
  if(SchoolRecords.lesson){
    const student=SchoolRecords.context();
    id('studentIdentity').textContent=student.label+' · '+student.seat+'번';
    id('studentIdentity').hidden=false;document.querySelector('.class-links').hidden=true;
  }
  renderSchoolMap(id('entryRoute'));

  function updateGuide(){
    shown=progress();
    const active=shown.status==='active';
    note.hidden=shown.status==='new';
    resume.hidden=shown.status==='new';
    start.classList.toggle('primary',!active);
    resume.classList.toggle('primary',active);
    start.textContent=shown.status==='new'?'우리 반 교실에서 시작':'처음부터 시작';
    resume.textContent=active?'이어서 하기':'지난 결과 보기';
    if(active)note.textContent=shown.room.place+'에서 이어 할 수 있어요. 처음부터 시작하면 지난 풀이가 지워져요.';
    else if(!note.hidden)note.textContent=shown.status==='complete'?'지난번에 하교를 마쳤어요.':'지난 게임의 제한 시간이 끝났어요.';
    // Keep keyboard and visual order the same when continuing is the main action.
    if(active)start.before(resume);else start.after(resume);
  }
  function showCover(focus=false){
    starting=false;start.disabled=resume.disabled=back.disabled=false;
    cover.hidden=false;guide.hidden=true;error.hidden=true;id('entryJump').open=false;
    if(focus)id('gameTitle').focus();
  }
  id('openGuide').onclick=()=>{
    cover.hidden=true;guide.hidden=false;error.hidden=true;updateGuide();id('guideTitle').focus();
  };
  back.onclick=()=>showCover(true);
  resume.onclick=()=>{
    const latest=progress();
    if(latest.status!==shown.status||latest.startedAt!==shown.startedAt){updateGuide();return}
    location.assign(recoveryRoomLink(latest.room,true));
  };
  start.onclick=async()=>{
    if(starting)return;
    const latest=progress();
    if(latest.status!==shown.status||latest.startedAt!==shown.startedAt){updateGuide();return}
    starting=true;start.disabled=resume.disabled=back.disabled=true;error.hidden=true;
    try{
      const plan=fixedSchoolRoute(),enrollment=await SchoolRecords.reserve(plan.stops);
      if(!beginSchoolAttempt(plan,enrollment))throw Error('이 기기에 진행을 저장할 수 없어요. 브라우저의 저장 설정을 확인해 주세요.');
      if(enrollment)SchoolRecords.started();
      location.assign(recoveryRoomLink(RECOVERY_ROOMS[0],true));
    }catch(e){
      starting=false;start.disabled=resume.disabled=back.disabled=false;
      error.textContent=e.message;error.hidden=false;
    }
  };
  window.addEventListener('pageshow',event=>{if(event.persisted)showCover()});
  window.addEventListener('storage',event=>{
    if(event.key===SCHOOL_STORY_KEY&&!guide.hidden&&!starting)updateGuide();
  });
})();
