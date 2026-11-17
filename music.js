'use strict';
const byId=id=>document.getElementById(id);
const dialog=byId('inspect'),content=byId('panelBody'),closeButton=byId('dismiss');
const saveKey='paperhotel.explore.v1';
// Bookmarked previews and old cache-busting links now open this same room.
if(location.search || location.hash)history.replaceState(null,'',location.pathname);
function readBook(key=saveKey){
  try{const book=JSON.parse(localStorage.getItem(key));if(book&&typeof book.visits==='object'&&book.visits)return book}catch{}
  return {room:203,visits:{}};
}
function newVisit(){return {singleScoreSave:true,paper:false,overlaid:false,solved:false,digits:[0,0]}}
let visit=newVisit();
const current=readBook().visits[203]?.clockPuzzle;
const previews=current?.singleScoreSave?[]:['paperhotel.musicroom.preview.v2','paperhotel.musicroom.preview.v1']
  .map(key=>readBook(key).visits[203]?.clockPuzzle).filter(Boolean);
const saved=current||previews[0];
if(saved){
  const previous=[saved,...previews];
  visit.paper=previous.some(run=>run.paper===true || run.overlaid===true);
  visit.overlaid=previous.some(run=>run.overlaid===true);
  visit.solved=saved.solved===true;
  if(visit.solved){
    visit.digits=Array.from(SCHOOL_ROOMS[0].answer,Number);
  }else if(Array.isArray(saved.digits)&&saved.digits.length===2&&saved.digits.every(n=>Number.isInteger(n)&&n>=0&&n<=9)){
    visit.digits=saved.digits.slice();
  }
}
let world,opening=false,overlay=false,example=0;
function storeVisit(restart=false){
  const book=readBook(),old=book.visits[203]||{};
  if(!restart && old.clockPuzzle?.paper){
    visit.paper=true;
    visit.overlaid ||= old.clockPuzzle.overlaid===true;
  }
  book.room=203;
  book.visits[203]={found:[],tests:[],...old,clockPuzzle:visit,
    solved:!!((!restart&&old.solved)||visit.solved),escaped:!!((!restart&&old.escaped)||visit.solved)};
  try{localStorage.setItem(saveKey,JSON.stringify(book))}catch{}
}
function modal(title,html,panel='message'){
  if(opening)return;
  world?.clearKeys();
  dialog.dataset.panel=panel;
  byId('panelTitle').textContent=title;
  content.innerHTML=html;
  if(!dialog.open)dialog.showModal();
  content.scrollTop=0;
}
function closePanel(){if(dialog.open)dialog.close();byId('roomView').focus({preventScroll:true})}
function action(host,text,fn,primary=false){
  const b=document.createElement('button');b.type='button';b.textContent=text;if(primary)b.className='primary';b.onclick=fn;host.append(b);return b;
}
function row(){const div=document.createElement('div');div.className='actions';content.append(div);return div}
function hand(a,b,center,radius,stroke,width){
  const [ax,ay]=clockPoint(a,radius,center),[bx,by]=clockPoint(b,radius*.74,center);
  return '<g fill="none" stroke="'+stroke+'" stroke-linecap="round">'+
    '<path d="M'+center+' '+center+'L'+ax+' '+ay+'" stroke-width="'+width*.65+'"/>'+
    '<path d="M'+center+' '+center+'L'+bx+' '+by+'" stroke-width="'+width+'"/></g>';
}
function scoreHands(pair,color='#3a657e'){
  return '<svg viewBox="3 3 54 54" aria-hidden="true">'+hand(pair.a,pair.b,30,21,color,3.2)+'<circle cx="30" cy="30" r="3" fill="'+color+'"/></svg>';
}
function sheet(){
  return '<div class="clue-sheet" role="list" aria-label="투명 악보 기록"><div class="samples">'+
    MUSIC_SCORE.map(e=>'<div class="sample" role="listitem" aria-label="'+e.a+'시와 '+e.b+'시 방향의 두 바늘, 기록 '+e.value+'"><span class="notation">'+scoreHands(e)+'</span><span>= '+e.value+'</span></div>').join('')+'</div></div>';
}
function inspectPaper(){
  modal(visit.paper?'내 악보':'피아노의 투명 악보',sheet(),'paper');
  if(!visit.paper){
    action(row(),'악보 얻기',()=>{
      visit.paper=true;
      storeVisit();
      byId('bag').hidden=false;
      closePanel();
      byId('bag').focus({preventScroll:true});
    },true);
  }
}
function clockDrawing(pair){
  let s='<svg class="clock-face" viewBox="0 0 200 200" role="img" aria-label="'+(pair?'악보 선의 두 끝이 가리키는 수: '+pair.a+', '+pair.b:'긴 바늘은 '+MUSIC_CLOCK.minuteMark+', 짧은 바늘은 '+MUSIC_CLOCK.hour+'를 가리킵니다.')+'"><circle cx="100" cy="100" r="95" fill="#3b4750"/><circle cx="100" cy="100" r="88" fill="#fbfcfc"/>';
  for(let n=1;n<=12;n++){
    const [x,y]=clockPoint(n,72,100),lit=pair&&(n===pair.a||n===pair.b);
    if(lit)s+='<circle cx="'+x+'" cy="'+y+'" r="12" fill="#497593"/>';
    s+='<text x="'+x+'" y="'+(y+5.4)+'" text-anchor="middle" font-family="Georgia,serif" font-size="16" fill="'+(lit?'#ffffff':'#2f3740')+'">'+n+'</text>';
  }
  const opacity=pair?'.23':'1';
  for(const [mark,length,width] of [[MUSIC_CLOCK.minuteMark,56,4],[MUSIC_CLOCK.hour,43,6]]){
    const [x,y]=clockPoint(mark,length,100);
    s+='<path opacity="'+opacity+'" d="M100 100L'+x+' '+y+'" stroke="#25323b" stroke-width="'+width+'" stroke-linecap="round"/>';
  }
  if(pair)s+='<g class="film"><rect x="21" y="21" width="158" height="158" rx="5" fill="#cfe1ef" fill-opacity=".13" stroke="#819dac" stroke-dasharray="3 3"/>'+hand(pair.a,pair.b,100,57,'#436f8c',4)+'</g>';
  return s+'<circle cx="100" cy="100" r="4.5" fill="#293941"/></svg>';
}
function clockPanel(){
  const pair=overlay?MUSIC_SCORE[example]:null;
  modal('멈춘 벽시계','<div class="clock-area">'+clockDrawing(pair)+'</div>'+
    (pair?'<div class="tabs" id="recordTabs" aria-label="악보의 예시"></div>':''),'clock');
  if(pair){
    MUSIC_SCORE.forEach((e,i)=>{
      const t=action(byId('recordTabs'),'',()=>{example=i;clockPanel();byId('recordTabs').children[i].focus()});
      t.innerHTML=scoreHands(e,'currentColor')+e.value;t.setAttribute('aria-label',e.value+' 기록 겹치기');t.setAttribute('aria-pressed',String(i===example));
    });
  }
  const a=row();
  if(visit.paper){
    action(a,pair?'악보 걷기':'악보 겹치기',()=>{overlay=!overlay;if(overlay){visit.overlaid=true;storeVisit()}clockPanel()},true);
    const reference=document.createElement('details');
    reference.className='clock-score';
    reference.innerHTML='<summary>내 악보 보기</summary>'+sheet();
    content.append(reference);
  } else {
    const missing=action(a,'악보 겹치기',()=>{});
    missing.disabled=true;
    action(a,'피아노 악보 보기',()=>{closePanel();world.lookAtPiano()});
  }
}
function solve(){
  if(opening||visit.solved)return;
  visit.solved=true;storeVisit();closePanel();opening=true;
  byId('spots').inert=true;
  document.querySelector('.room-head').inert=true;
  world.facingDoor(()=>{
    opening=false;byId('spots').inert=false;document.querySelector('.room-head').inert=false;
    showExit();byId('nextRoom').focus({preventScroll:true});
  });
}
function showExit(){
  document.querySelector('.movement').hidden=true;
  byId('escape').hidden=false;
}
function inspectLock(){
  modal('문 다이얼','<div class="switches" id="wheels"></div><p class="readout" id="lockReadout" role="status"></p>','lock');
  let digitsChanged=false;
  const outputs=[];
  function rotate(i,amount){
    visit.digits[i]=(visit.digits[i]+amount+10)%10;
    outputs[i].textContent=String(visit.digits[i]);
    world.setDigits(visit.digits);
    if(visit.digits.join('')===SCHOOL_ROOMS[0].answer){solve();return}
    storeVisit();
    if(!digitsChanged){byId('lockReadout').textContent='잠김';digitsChanged=true}
  }
  for(let i=0;i<2;i++){
    const label=i?'일의 자리':'십의 자리',wheel=document.createElement('div');wheel.className='digit';
    const title=document.createElement('small');title.textContent=label;wheel.append(title);byId('wheels').append(wheel);
    action(wheel,'▲',()=>rotate(i,1)).setAttribute('aria-label',label+' 올리기');
    const out=document.createElement('output');out.setAttribute('aria-label',label);out.textContent=String(visit.digits[i]);outputs.push(out);wheel.append(out);
    action(wheel,'▼',()=>rotate(i,-1)).setAttribute('aria-label',label+' 내리기');
  }
  content.insertAdjacentHTML('beforeend','<details class="hint"><summary>힌트</summary><p>'+(visit.overlaid?'악보에서 찾은 계산을 실제 바늘에도 적용해 보세요.':'피아노의 악보를 벽시계에 겹쳐 보세요.')+'</p></details>');

}
function directory(){
  modal('학교 안내도','<div class="map-list" id="classList"></div>','map');
  for(const r of SCHOOL_ROOMS){
    const el=document.createElement('a');el.textContent=r.n+'호 · '+r.place;
    el.href=r.n===203?'music.html':'index.html?room='+r.n;
    if(r.n===203)el.onclick=e=>{e.preventDefault();closePanel()};
    byId('classList').append(el);
  }
}
closeButton.onclick=closePanel;
dialog.addEventListener('click',e=>{
  if(e.target!==dialog)return;
  const r=dialog.getBoundingClientRect();
  if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closePanel();
});
byId('bag').onclick=inspectPaper;byId('map').onclick=directory;
byId('replay').onclick=()=>{
  visit=newVisit();overlay=false;example=0;opening=false;
  byId('escape').hidden=true;byId('spots').inert=false;byId('bag').hidden=true;
  document.querySelector('.movement').hidden=false;
  world.reset();storeVisit(true);
};
function failed(){
  modal('음악실을 열지 못했어요.','');
  action(row(),'다시 열기',()=>location.reload(),true);
}
createMusicWorld({
  onInspect:id=>{if(!opening){if(id==='paper')inspectPaper();if(id==='clock'){overlay=false;clockPanel()}if(id==='lock'&&!visit.solved)inspectLock()}},
  onReadyToMove:()=>!dialog.open&&!opening,
  onError:failed
}).then(w=>{
  if(!w)return;
  world=w;byId('bag').hidden=!visit.paper;world.reset(visit.solved,visit.digits);storeVisit();
  const next=SCHOOL_ROOMS.slice(1).find(r=>!readBook().visits[r.n]?.escaped);
  if(next){byId('nextRoom').href='index.html?room='+next.n;byId('nextRoom').textContent=next.place+'로 이동'}
  else{byId('nextRoom').textContent='학교 안내도';byId('nextRoom').onclick=e=>{e.preventDefault();directory()}}
  if(visit.solved)showExit()

}).catch(failed);
