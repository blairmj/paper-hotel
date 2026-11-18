'use strict';

const room=schoolRoomDefinition(document.body.dataset.room);
const puzzle=SCHOOL_PUZZLES[room.kind];
const stage=RECOVERY_ROOMS.findIndex(item=>item.n===room.n);
const params=new URLSearchParams(location.search);
const story=!params.has('review')&&(room.kind==='classroom'||params.get('school')==='1');
const bookKey=story?SCHOOL_STORY_KEY:SCHOOL_REVIEW_KEY;
const book=()=>readSchoolBook(bookKey);
const byId=id=>document.getElementById(id),dialog=byId('inspect'),content=byId('panelBody');
const roomHead=document.querySelector('.room-head'),movement=document.querySelector('.movement');
const saved=book().visits[room.n]?.restoration;
const sequenceLabel=key=>STAMPS[key]?.label??RESET_KEYS[key];
const sequenceGlyph=key=>STAMPS[key]?.glyph??RESET_GLYPHS[key];

function newRun(){
  const entry=puzzle.control==='sequence'?[]:Array(puzzle.answer.length).fill(puzzle.control==='dial'?'0':'');
  return {found:[],entry,solved:false};
}
let run=newRun(),world,countdown,opening=false,finished=false;
if(saved){
  run.found=Array.isArray(saved.found)?saved.found.filter(id=>room.clues.some(clue=>clue.id===id)):[];
  if(Array.isArray(saved.entry)){
    if(puzzle.control==='sequence')run.entry=saved.entry.filter(key=>puzzle.keys.includes(key)).slice(0,puzzle.answer.length);
    else run.entry=run.entry.map((value,i)=>{
      const stored=saved.entry[i];
      const valid=puzzle.control==='dial'?typeof stored==='string'&&/^\d$/.test(stored):Object.hasOwn(ROUTE_NAMES,stored);
      return valid?stored:value;
    });
  }
  run.solved=saved.solved===true;
  if(run.solved)run.entry=puzzle.answer.slice();
}

function save(){
  const next=book(),visit=next.visits[room.n];
  if(story&&visit?.restoration?.solved&&!run.solved)return;
  next.room=room.n;
  next.visits[room.n]={...visit,restoration:run};
  writeSchoolBook(bookKey,next);
}

function modal(title,html,panel='clue'){
  if(opening||finished)return;
  world?.clearKeys();dialog.dataset.panel=panel;
  byId('panelTitle').textContent=title;content.innerHTML=html;
  if(!dialog.open)dialog.showModal();
  content.scrollTop=0;
}
function close(){dialog.close();byId('roomView').focus({preventScroll:true})}
function action(host,label,fn,primary=false){
  const button=document.createElement('button');
  button.type='button';button.textContent=label;button.onclick=fn;
  if(primary)button.className='primary';
  host.append(button);return button;
}
function actions(){const host=document.createElement('div');host.className='actions';content.append(host);return host}
function correct(){return run.entry.length===puzzle.answer.length&&puzzle.answer.every((value,i)=>run.entry[i]===value)}

function showFinish(){
  finished=true;
  roomHead.hidden=true;byId('spots').hidden=true;movement.hidden=true;
  byId('roomView').setAttribute('aria-label','학교 현관');
  const preceding=RECOVERY_ROOMS.slice(0,-1);
  const restored=preceding.filter(item=>roomRestored(book(),item)).length;
  const panel=document.createElement('section');
  panel.className='finale-status';panel.setAttribute('aria-label','학교 출입 복구 결과');
  panel.innerHTML='<p role="status">교실 장치 '+restored+'/'+preceding.length+' 복구</p>';
  byId('musicGame').append(panel);
  world.showFinale(buildSchoolFinale(),()=>{
    panel.innerHTML='<p role="status">교실 장치 '+restored+'/'+preceding.length+' 복구 · 현관 열림</p><h1 tabindex="-1">하교 완료</h1>';
    panel.classList.add('finale-complete');
    action(panel,'처음부터',()=>{
      writeSchoolBook(bookKey,{room:RECOVERY_ROOMS[0].n,visits:{}});
      location.assign('./');
    },true);
    panel.querySelector('h1').focus({preventScroll:true});
  });
}

function showExit(){
  const next=RECOVERY_ROOMS[stage+1];
  if(story&&!next){showFinish();return}
  movement.hidden=true;byId('escape').hidden=false;
  byId('replay').hidden=story;
  const link=byId('nextRoom');
  link.href=next?recoveryRoomLink(next,story):'./';
  link.textContent=next?next.place+'로 이동':'우리 교실부터 시작';
  link.focus({preventScroll:true});
}
function solve(){
  if(run.solved||opening||!countdown?.stop())return;
  run.solved=true;save();close();opening=true;
  byId('spots').inert=true;roomHead.inert=true;
  world.facingDoor(()=>{
    opening=false;byId('spots').inert=false;roomHead.inert=false;
    showExit();
  });
}
function changed(){
  world.setDigits(run.entry);
  if(correct())solve();
  else save();
}

function scoreSheet(){
  return '<div class="number-score" aria-label="악보에 적힌 건반 번호">'+
    MUSIC_KEYS.map(number=>'<span><b aria-hidden="true">♩</b>'+number+'</span>').join('')+'</div>';
}
function stampMark(shape){
  return '<span class="stamp-mark" style="--ink:'+STAMPS[shape].color+'" aria-hidden="true">'+sequenceGlyph(shape)+'</span>';
}
function stampTray(){
  return '<div class="stamp-tray">'+puzzle.keys.map(shape=>'<span class="stamp-swatch">'+stampMark(shape)+
    '<span>'+STAMPS[shape].label+'</span></span>').join('')+'</div>';
}
function signalRecords(){
  const fields=Object.keys(SIGNAL_FIELDS);
  return '<table class="record-table"><thead><tr><th scope="col">신호</th>'+
    fields.map(field=>'<th scope="col">'+SIGNAL_FIELDS[field]+'</th>').join('')+
    '<th scope="col">결과</th></tr></thead><tbody>'+
    SAMPLE_SIGNALS.map(signal=>'<tr><th scope="row">'+signal.name+'</th>'+
      fields.map(field=>'<td>'+signalValue(signal,field)+'</td>').join('')+
      '<td>'+ROUTE_NAMES[routeSignal(signal)]+'</td></tr>').join('')+'</tbody></table>';
}
function ballTray(){
  let row=BALLS.slice();
  const tray=byId('ballTray'),status=byId('ballStatus');
  const reset=action(actions(),'처음 배열',()=>{row=BALLS.slice();draw()});
  function draw(from=-1){
    tray.replaceChildren();
    row.forEach((label,i)=>{
      const ball=action(tray,label,()=>{
        row.splice(i,1);
        draw(i);
        const next=tray.children[i]?.matches('button')?tray.children[i]:reset;
        next.focus({preventScroll:true});
      });
      ball.className=i>=from&&from>=0?'tray-ball shifted':'tray-ball';
      ball.setAttribute('aria-label',label+' 공 빼기');
      ball.style.setProperty('--ball',BALL_COLORS[BALLS.indexOf(label)]);
    });
    for(let i=row.length;i<BALLS.length;i++){
      const space=document.createElement('span');space.className='tray-empty';tray.append(space);
    }
    status.textContent='남은 공 '+row.join(' ');
  }
  draw();
}

function inspectClue(id){
  const clue=room.clues.find(item=>item.id===id);
  if(!clue)return;
  if(!run.found.includes(id)){run.found.push(id);save()}
  byId('bag').hidden=false;
  switch(id){
    case 'paper':modal(clue.name,scoreSheet());break;
    case 'stamps':modal(clue.name,stampTray());break;
    case 'recordA':modal(clue.name,signalRecords());break;
    case 'ballLine':
      modal(clue.name,'<p class="object-note">공을 하나 뺄 때마다 <strong>뺀 공을 제외하고 배열에서 움직인 공의 개수</strong>를 구하세요.</p>'+
        '<p class="object-note">공을 눌러 빼면 오른쪽 공들이 한 칸씩 왼쪽으로 이동합니다.</p>'+
        '<div class="ball-tray" id="ballTray"></div><span class="sr-only" id="ballStatus" role="status"></span>');
      ballTray();break;
    default:modal(clue.name,'<div class="school-clue">'+schoolClueSvg(id)+'</div>');
  }
}
function inventory(){
  modal('찾은 단서','<div class="collected-clues" id="collectedClues"></div>');
  for(const clue of room.clues.filter(clue=>run.found.includes(clue.id))){
    action(byId('collectedClues'),clue.name,()=>inspectClue(clue.id));
  }
}

function sequencePanel(){
  modal(puzzle.title,'<div class="sequence-output" id="sequenceOutput" aria-label="입력한 순서"></div>'+
    '<div class="sequence-keys" id="sequenceKeys"></div><p class="readout" id="entryFeedback" role="status"></p>','lock');
  function draw(){
    const steps=puzzle.answer.map((_,i)=>'<span>'+
      (run.entry[i]?(room.kind==='art'?stampMark(run.entry[i]):sequenceGlyph(run.entry[i])):'·')+'</span>');
    byId('sequenceOutput').innerHTML=steps.join('');
    byId('entryFeedback').textContent=run.entry.length===puzzle.answer.length&&!correct()?'순서를 다시 확인해 보세요.':'';
  }
  for(const key of puzzle.keys){
    const label=sequenceLabel(key);
    const button=action(byId('sequenceKeys'),label,()=>{
      if(run.entry.length>=puzzle.answer.length)return;
      run.entry.push(key);draw();changed();
    });
    button.innerHTML=(room.kind==='art'?stampMark(key):'<b aria-hidden="true">'+sequenceGlyph(key)+'</b>')+'<span>'+label+'</span>';
  }
  action(actions(),'한 단계 지우기',()=>{run.entry.pop();draw();changed()});
  draw();
}

function dial(host,i) {
  const wheel=document.createElement('div');wheel.className='digit';host.append(wheel);
  const output=document.createElement('output');
  output.textContent=run.entry[i];output.setAttribute('aria-label',(i+1)+'번째 숫자');
  function rotate(delta){
    run.entry[i]=String((Number(run.entry[i])+delta+10)%10);
    output.textContent=run.entry[i];changed();
  }
  action(wheel,'▲',()=>rotate(1)).setAttribute('aria-label',(i+1)+'번째 숫자 올리기');
  wheel.append(output);
  action(wheel,'▼',()=>rotate(-1)).setAttribute('aria-label',(i+1)+'번째 숫자 내리기');
}
function dialPanel(){
  if(room.kind==='sports'){
    modal(puzzle.title,'<p class="object-note">차례마다 <strong>뺀 공을 제외하고 배열에서 움직인 공의 개수</strong>를 세어 네 칸에 순서대로 맞추세요.</p>'+
      '<div class="switches four-digits" id="wheels"></div>','lock');
    run.entry.forEach((_,i)=>dial(byId('wheels'),i));
    return;
  }
  modal(puzzle.title,'<div class="dial-pairs" id="wheels" aria-label="변환 결과"></div>','lock');
  for(let i=0;i<MUSIC_CONVERTED.length;i+=2){
    const pair=document.createElement('div');pair.className='dial-pair';byId('wheels').append(pair);
    for(const position of [i,i+1]){
      const gap=MUSIC_GAPS.indexOf(position);
      if(gap>=0)dial(pair,gap);
      else{
        const value=document.createElement('span');value.className='fixed-digit';
        value.textContent=MUSIC_CONVERTED[position];pair.append(value);
      }
    }
  }
}

function routingPanel(){
  modal(puzzle.title,'<div class="signal-tests" id="signalTests"></div><p class="readout" id="entryFeedback" role="status"></p>','routing');
  function feedback(){
    byId('entryFeedback').textContent=run.entry.every(Boolean)&&!correct()?'신호 경로를 다시 확인해 보세요.':'';
  }
  for(const [i,signal] of NEW_SIGNALS.entries()){
    const card=document.createElement('fieldset');
    card.innerHTML='<legend>신호 '+signal.name+'</legend><div class="signal-flags">'+
      Object.entries(SIGNAL_FIELDS).map(([field,label])=>'<span>'+label+' <b>'+signalValue(signal,field)+'</b></span>').join('')+'</div>';
    const select=document.createElement('select');
    select.setAttribute('aria-label','신호 '+signal.name+'의 경로');
    select.innerHTML='<option value="">경로 선택</option>'+
      Object.entries(ROUTE_NAMES).map(([value,label])=>'<option value="'+value+'">'+label+'</option>').join('');
    select.value=run.entry[i];
    select.onchange=()=>{run.entry[i]=select.value;feedback();changed()};
    card.append(select);byId('signalTests').append(card);
  }
  feedback();
}
function inspectLock(){
  if(run.solved||!countdown||countdown.check())return;
  const panels={sequence:sequencePanel,dial:dialPanel,routing:routingPanel};
  panels[puzzle.control]();
  appendRoomTextHint(content,countdown,puzzle.hint);
}

function directory(){
  if(story){
    const progress=book();
    modal('학교 안내도','<ol class="route-list">'+RECOVERY_ROOMS.map(item=>'<li'+
      (item.n===room.n?' aria-current="step"':'')+'><span>'+item.place+'</span><span>'+
      (roomRestored(progress,item)?'복구':'대기')+'</span></li>').join('')+'</ol>','map');
  }else{
    modal('학교 안내도','<div class="map-list">'+RECOVERY_ROOMS.map(item=>
      '<a href="'+recoveryRoomLink(item,false)+'">'+item.place+'</a>').join('')+'</div>','map');
  }
}
function restart(){
  close();
  run=newRun();opening=false;save();byId('bag').hidden=true;byId('escape').hidden=true;
  movement.hidden=false;world.reset(false,run.entry);
  countdown?.reset();
}
function beginTimer(){
  countdown=setupSchoolTimer(room.n,{key:bookKey,isSolved:()=>run.solved,onExpire:()=>{
    world.clearKeys();modal('시간이 끝났어요.','','timeout');
    action(actions(),'다시 도전',restart,true);
  }});
}
function intro(){
  modal('하교 직전','<p>하교 종이 울렸습니다. 학교 출입 시스템의 연결이 끊겼습니다.</p>'+
    '<p>교실 장치를 복구하고 컴퓨터실로 이동하세요.</p>','intro');
  action(actions(),'복구 시작',()=>{
    const progress=book();progress.started=true;writeSchoolBook(bookKey,progress);
    close();beginTimer();
  },true);
}
function mandatoryDialog(){return ['intro','timeout'].includes(dialog.dataset.panel)}

function start(){
  const progress=book(),next=firstUnrestoredRoom(progress)??RECOVERY_ROOMS.at(-1);
  const nextStage=RECOVERY_ROOMS.indexOf(next);
  if(story&&(stage>nextStage||(stage===0&&nextStage>0))){
    location.replace(recoveryRoomLink(next,true));
    return;
  }
  byId('dismiss').onclick=close;byId('bag').onclick=inventory;byId('map').onclick=directory;
  byId('replay').onclick=restart;
  dialog.addEventListener('cancel',event=>{if(mandatoryDialog())event.preventDefault()});
  dialog.addEventListener('click',event=>{
    if(event.target!==dialog||mandatoryDialog())return;
    const r=dialog.getBoundingClientRect();
    if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)close();
  });
  setupReviewNavigation(room.n,{rooms:RECOVERY_ROOMS,showJump:!story,urlFor:item=>recoveryRoomLink(item,false)});
  createMusicWorld({
    room,buildRoom:buildSchoolRoom,
    onReadyToMove:()=>!!countdown&&!dialog.open&&!opening&&!finished&&!countdown.expired,
    onInspect:id=>{if(id==='lock')inspectLock();else inspectClue(id)}
  }).then(created=>{
    world=created;world.reset(run.solved,run.entry);byId('bag').hidden=!run.found.length;
    if(story&&stage===0&&!progress.started&&!run.solved){intro();return}
    beginTimer();
    if(run.solved)showExit();
  }).catch(error=>{
    console.error(error);
    modal('교실을 열지 못했어요.','','error');
    action(actions(),'다시 열기',()=>location.reload(),true);
  });
}
start();
