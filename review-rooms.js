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
}
