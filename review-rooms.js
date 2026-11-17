'use strict';

const REVIEW_ROOMS = [
  {n:203, place:'음악실', href:'music.html', kind:'music'},
  {n:207, place:'미술실', href:'art.html', kind:'art'},
  {n:208, place:'체육 준비실', href:'sports.html', kind:'sports'},
  {n:209, place:'컴퓨터실', href:'computer.html', kind:'computer'}
];

function readSchoolBook(key='paperhotel.explore.v1'){
  try{
    const book=JSON.parse(localStorage.getItem(key));
    if(book && book.visits && typeof book.visits==='object')return book;
  }catch{}
  return {room:203,visits:{}};
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

function setupReviewNavigation(number){
  const school=document.querySelector('.school'),location=document.createElement('div');
  location.className='room-location';
  school.before(location);location.append(school);
  const jump=document.createElement('details');
  jump.className='review-jump';jump.id='reviewJump';
  const summary=document.createElement('summary');summary.textContent='바로가기';
  const links=document.createElement('nav');links.setAttribute('aria-label','검토용 교실 바로가기');
  for(const room of REVIEW_ROOMS){
    const link=document.createElement('a');link.href=room.href;link.textContent=room.place;
    if(room.n===number){
      link.setAttribute('aria-current','page');
      link.onclick=event=>{event.preventDefault();jump.open=false};
    }
    links.append(link);
  }
  jump.append(summary,links);location.append(jump);
  document.addEventListener('click',event=>{if(!jump.contains(event.target))jump.open=false});
  const paths={bag:'M12 5Q7 2 3 4V20Q7 18 12 21Q17 18 21 20V4Q17 2 12 5V21',map:'M3 5L9 3L15 5L21 3V19L15 21L9 19L3 21ZM9 3V19M15 5V21'};
  for(const [id,path]of Object.entries(paths)){
    const button=document.getElementById(id),label=button.textContent;
    button.setAttribute('aria-label',label);button.title=label;button.classList.add('menu-icon');
    button.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="'+path+'"/></svg>';
  }
}

function setupSchoolTimer(number,{isSolved,onExpire}){
  const duration=120000,key='paperhotel.explore.v1',saved=readSchoolBook().visits[number]?.escapeTimer;
  let deadline=Number.isFinite(saved?.deadline)?saved.deadline:Date.now()+duration;
  let expired=false,stopped=isSolved(),remaining=stopped?(saved?.remaining??duration):duration;
  const badge=document.createElement('span');badge.className='room-timer';badge.setAttribute('aria-label','남은 시간');
  badge.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 6V12L16 14"/></svg><span id="roomTime"></span>';
  document.querySelector('.room-head > nav').append(badge);
  const text=badge.querySelector('#roomTime');
  function save(){
    const book=readSchoolBook();book.visits[number]={...book.visits[number],escapeTimer:{deadline,remaining,expired,stopped}};
    try{localStorage.setItem(key,JSON.stringify(book))}catch{}
  }
  function render(){
    const seconds=Math.max(0,Math.ceil(remaining/1000));text.textContent=Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0');
    badge.dataset.expired=String(expired);badge.classList.toggle('running-low',!stopped&&seconds<=20);
  }
  function check(){
    if(stopped)return false;
    remaining=Math.max(0,deadline-Date.now());render();
    if(remaining===0&&!expired){expired=true;save();render();onExpire()}
    return expired;
  }
  let tick=setInterval(check,200);
  document.addEventListener('visibilitychange',check);window.addEventListener('pagehide',()=>clearInterval(tick));
  window.addEventListener('pageshow',()=>{clearInterval(tick);tick=setInterval(check,200);check()});
  save();render();queueMicrotask(check);
  return {
    get expired(){return expired||(!stopped&&Date.now()>=deadline)},check,
    stop(){if(check())return false;remaining=Math.max(0,deadline-Date.now());stopped=true;save();render();return true},
    reset(){deadline=Date.now()+duration;remaining=duration;expired=false;stopped=false;save();render()}
  };
}
