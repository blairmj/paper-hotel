'use strict';

const room=schoolRoomDefinition(document.body.dataset.room);
const byId=id=>document.getElementById(id),dialog=byId('inspect'),content=byId('panelBody');
const prior=readSchoolBook().visits[room.n],saved=prior?.reviewPuzzle;
function newRun(){return {puzzle:room.kind,found:[],flipped:[false,false,false],digits:[0,0,0,0],letters:[],pixels:Array(9).fill(0),solved:false}}
let run=newRun(),world,countdown,opening=false;
if(saved?.puzzle===room.kind){
  run.found=Array.isArray(saved.found)?saved.found.filter(id=>room.clues.some(c=>c.id===id)):[];
  run.flipped=[0,1,2].map(i=>saved.flipped?.[i]===true);
  if(Array.isArray(saved.digits)&&saved.digits.length===4&&saved.digits.every(n=>Number.isInteger(n)&&n>=0&&n<=9))run.digits=saved.digits.slice();
  if(Array.isArray(saved.letters))run.letters=saved.letters.filter(letter=>['I','P','E'].includes(letter)).slice(0,6);
  if(Array.isArray(saved.pixels)&&saved.pixels.length===9)run.pixels=saved.pixels.map(value=>value===1?1:0);
  run.solved=saved.solved===true;
}
if(!saved && prior?.escaped===true)run.solved=true;
if(run.solved){
  const answer=SCHOOL_ROOMS.find(r=>r.n===room.n).answer;
  run.found=room.clues.map(clue=>clue.id);
  if(room.kind==='art')run.letters=[...answer];
  else if(room.kind==='sports')run.digits=[...answer].map(Number);
  else run.pixels=[...answer].map(Number);
}
function save(){
  const book=readSchoolBook();
  book.room=room.n;
  book.visits[room.n]={...book.visits[room.n],reviewPuzzle:run,solved:run.solved,escaped:run.solved};
  try{localStorage.setItem('paperhotel.explore.v1',JSON.stringify(book))}catch{}
}
function modal(title,html,panel='clue'){
  if(opening)return;
  world?.clearKeys();dialog.dataset.panel=panel;
  byId('panelTitle').textContent=title;content.innerHTML=html;
  if(!dialog.open)dialog.showModal();
  content.scrollTop=0;
}
function close(){dialog.close();byId('roomView').focus({preventScroll:true})}
function action(host,label,fn,primary=false){
  const button=document.createElement('button');button.type='button';button.textContent=label;
  if(primary)button.className='primary';
  button.onclick=fn;host.append(button);return button;
}
function actions(){const host=document.createElement('div');host.className='actions';content.append(host);return host}
function stationValues(){return room.kind==='art'?run.letters:room.kind==='sports'?run.digits:run.pixels}
function showExit(){
  document.querySelector('.movement').hidden=true;byId('escape').hidden=false;
  const next=nextReviewRoom(room.n);
  byId('nextRoom').href=next?.href||'music.html';
  byId('nextRoom').textContent=next?next.place+'로 이동':'음악실로 돌아가기';
}
function solve(){
  if(run.solved||opening||countdown?.check())return;
  run.solved=true;save();close();opening=true;
  countdown?.stop();
  byId('spots').inert=true;document.querySelector('.room-head').inert=true;
  world.facingDoor(()=>{
    opening=false;byId('spots').inert=false;document.querySelector('.room-head').inert=false;
    showExit();byId('nextRoom').focus({preventScroll:true});
  });
}
function inspectClue(id){
  const clue=room.clues.find(clue=>clue.id===id);
  if(!run.found.includes(id)){run.found.push(id);save()}
  byId('bag').hidden=false;
  let illustration='<div class="school-clue">'+schoolClueSvg(id)+'</div>';
  if(id==='stamps')illustration='<div class="stamp-tray" id="stampTray"></div><p class="stamp-instruction">도장을 눌러 뒤집기</p>';
  if(id==='recordA'||id==='recordB'){
    const values=COMPUTER_INPUTS[id];
    illustration='<div class="signal-device"><section><h2>입력</h2><div class="pixel-grid input-grid">'+
      [...values].map(n=>'<span>'+n+'</span>').join('')+'</div></section><section><h2>출력</h2><div class="pixel-grid sample-output">'+
      [...values].map(n=>'<span class="'+(Number(n)%2?'on':'')+'" aria-label="'+(Number(n)%2?'켜짐':'꺼짐')+'"></span>').join('')+'</div></section></div>'+
      (id==='recordB'?'<p class="trial-record">5 → 켜짐　　4 → 꺼짐</p>':'');
  }
  modal(clue.name,illustration);
  if(id==='stamps'){
    ['I','P','E'].forEach((letter,i)=>{
      const button=action(byId('stampTray'),'',()=>{
        run.flipped[i]=!run.flipped[i];save();draw();
      });
      button.className='stamp';button.setAttribute('aria-label',letter+' 도장 뒤집기');
      function draw(){
        button.setAttribute('aria-pressed',String(run.flipped[i]));
        button.innerHTML=run.flipped[i]
          ? '<span class="stamp-dots" aria-label="'+(i+1)+'개의 자국">'+Array(i+1).fill('<i></i>').join('')+'</span>'
          : '<span class="stamp-letter" style="font-size:'+([30,44,60][i])+'px">'+letter+'</span>';
      }
      draw();
    });
  }
}
function inventory(){
  modal('찾은 단서','<div class="collected-clues" id="collectedClues"></div>');
  for(const clue of room.clues.filter(clue=>run.found.includes(clue.id)))action(byId('collectedClues'),clue.name,()=>inspectClue(clue.id));
}
function hint(text){content.insertAdjacentHTML('beforeend','<details class="hint"><summary>힌트</summary><p>'+text+'</p></details>')}
function inspectLock(){
  if(run.solved)return;
  const answer=SCHOOL_ROOMS.find(r=>r.n===room.n).answer;
  if(room.kind==='art'){
    modal('문 인쇄판','<div class="code-strip" id="letterCode" role="status" aria-label="입력한 여섯 글자"></div><div class="letter-keys" id="letterKeys"></div><p class="readout" id="entryFeedback" role="status"></p>','lock');
    function draw(){
      byId('letterCode').innerHTML=Array.from({length:6},(_,i)=>'<span>'+ (run.letters[i]||'')+'</span>').join('');
      byId('entryFeedback').textContent=run.letters.length===6&&run.letters.join('')!==answer?'잠김':'';
    }
    ['I','P','E'].forEach(letter=>action(byId('letterKeys'),letter,()=>{
      if(run.letters.length===6)return;
      run.letters.push(letter);draw();world.setDigits(run.letters);save();
      if(run.letters.join('')===answer)solve();
    }));
    action(actions(),'한 글자 지우기',()=>{run.letters.pop();draw();world.setDigits(run.letters);save()});
    hint('도장을 뒤집어 자국을 확인하고, 인쇄 순서 카드와 비교해 보세요.');draw();
  }else if(room.kind==='sports'){
    modal('문 다이얼','<div class="switches four-digits" id="wheels"></div>','lock');
    run.digits.forEach((value,i)=>{
      const wheel=document.createElement('div');wheel.className='digit';byId('wheels').append(wheel);
      let output;
      function rotate(delta){
        run.digits[i]=(run.digits[i]+delta+10)%10;output.textContent=run.digits[i];
        world.setDigits(run.digits);save();
        if(run.digits.join('')===answer)solve();
      }
      action(wheel,'▲',()=>rotate(1)).setAttribute('aria-label',(i+1)+'번째 숫자 올리기');
      output=document.createElement('output');output.textContent=value;output.setAttribute('aria-label',(i+1)+'번째 숫자');wheel.append(output);
      action(wheel,'▼',()=>rotate(-1)).setAttribute('aria-label',(i+1)+'번째 숫자 내리기');
    });
    hint('사진 속 공을 종류별로 세고, 반납 순서대로 놓아 보세요.');
  }else{
    modal('문 신호판','<div class="signal-device"><section><h2>입력</h2><div class="pixel-grid input-grid">'+[...COMPUTER_INPUTS.target].map(n=>'<span>'+n+'</span>').join('')+'</div></section><section><h2>출력</h2><div class="pixel-grid" id="pixelKeys"></div></section></div>','pixels');
    run.pixels.forEach((value,i)=>{
      const button=action(byId('pixelKeys'),'',()=>{
        run.pixels[i]^=1;button.setAttribute('aria-pressed',String(run.pixels[i]===1));
        world.setDigits(run.pixels);save();
        if(run.pixels.join('')===answer)solve();
      });
      button.className='pixel-key';button.setAttribute('aria-label',(i+1)+'번 픽셀');
      button.setAttribute('aria-pressed',String(value===1));
    });
    hint('두 출력 기록에서 켜진 칸과 꺼진 칸의 수를 비교해 보세요.');
  }
}
function directory(){
  modal('학교 안내도','<div class="map-list">'+REVIEW_ROOMS.map(r=>'<a href="'+r.href+'">'+r.n+'호 · '+r.place+'</a>').join('')+'</div>','map');
}
byId('dismiss').onclick=close;byId('bag').onclick=inventory;byId('map').onclick=directory;
dialog.addEventListener('click',event=>{
  if(event.target!==dialog)return;
  const r=dialog.getBoundingClientRect();
  if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)close();
});
function restart(){
  close();
  run=newRun();opening=false;save();byId('bag').hidden=true;byId('escape').hidden=true;
  document.querySelector('.movement').hidden=false;world.reset(false,stationValues());
  countdown?.reset();
}
byId('replay').onclick=restart;
document.querySelector('.school').innerHTML='<span>'+room.n+'</span>'+room.place;
setupReviewNavigation(room.n);
createMusicWorld({
  room,buildRoom:buildSchoolRoom,
  onReadyToMove:()=>!dialog.open&&!opening&&!countdown?.expired,
  onInspect:id=>{if(!opening){if(id==='lock')inspectLock();else inspectClue(id)}}
}).then(created=>{
  world=created;world.reset(run.solved,stationValues());byId('bag').hidden=!run.found.length;save();
  countdown=setupSchoolTimer(room.n,{isSolved:()=>run.solved,onExpire:()=>{
    world.clearKeys();modal('시간이 끝났어요.','','timeout');action(actions(),'다시 도전',restart,true);
  }});
  if(run.solved)showExit();
}).catch(error=>{
  console.error(error);
  modal('교실을 열지 못했어요.','');
  action(actions(),'다시 열기',()=>location.reload(),true);
});
