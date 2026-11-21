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
const panelTop=dialog.querySelector('.panel-top');
const saved=book().visits[room.n]?.restoration;
const outdated=saved?.revision!==puzzle.revision;

function newRun(){
  if(puzzle.control==='shelf')return {revision:puzzle.revision,found:[],entry:[],shelf:makeLibraryShelf(),solved:false};
  let entry=Array(puzzle.answer.length).fill(['routing','debug','water'].includes(puzzle.control)?'':'0');
  if(['sequence','balls'].includes(puzzle.control))entry=[];
  const restoration={revision:puzzle.revision,found:[],entry,solved:false};
  if(puzzle.control==='balls')restoration.awaitingCount=false;
  return restoration;
}
let run=newRun(),world,countdown,attempt,reviewJump,opening=false,finished=false;
if(saved&&(!outdated||puzzle.control==='shelf')){
  run.found=Array.isArray(saved.found)?saved.found.filter(id=>room.clues.some(clue=>clue.id===id)):[];
}
if(saved&&!outdated){
  if(Array.isArray(saved.entry)){
    if(puzzle.control==='shelf'){
      if(validLibraryShelf(saved.shelf)){
        run.shelf=saved.shelf;
        for(const slot of saved.entry.slice(0,SHELF_LIMIT)){
          if(!canOpenLibraryBook(run.shelf,run.entry,slot))break;
          run.entry.push(slot);
        }
      }
    }
    else if(puzzle.control==='sequence')run.entry=saved.entry.filter(key=>puzzle.keys.includes(key)).slice(0,puzzle.answer.length);
    else if(puzzle.control==='balls'){
      for(const [i,value] of saved.entry.slice(0,puzzle.answer.length).entries()){
        if(value!==puzzle.answer[i])break;
        run.entry.push(value);
      }
      run.awaitingCount=saved.awaitingCount===true&&run.entry.length<puzzle.answer.length;
    }
    else run.entry=run.entry.map((value,i)=>{
      const stored=saved.entry[i];
      let valid;
      if(puzzle.control==='selection')valid=stored==='0'||stored==='1';
      else if(puzzle.control==='dial')valid=typeof stored==='string'&&/^\d$/.test(stored);
      else if(puzzle.control==='debug')valid=Object.hasOwn(BROADCAST_COMMANDS,stored);
      else if(puzzle.control==='water')valid=puzzle.keys.includes(stored);
      else valid=Object.hasOwn(ROUTE_NAMES,stored);
      return valid?stored:value;
    });
  }
}
run.solved=saved?.solved===true&&(!outdated||story);
if(run.solved&&puzzle.control!=='shelf'){
  run.entry=puzzle.answer.slice();
  if(puzzle.control==='balls')run.awaitingCount=false;
}

function recordRestoration(next){
  next.room=room.n;
  next.visits[room.n]={...next.visits[room.n],restoration:run};
}

function save(){
  const next=book();
  if(story&&(schoolEscapeTimer(next)?.startedAt!==attempt||
    next.visits[room.n]?.restoration?.solved&&!run.solved))return false;
  recordRestoration(next);
  return writeSchoolBook(bookKey,next);
}

function modal(title,html,panel='clue'){
  if(opening||finished)return;
  world?.clearKeys();dialog.dataset.panel=panel;
  byId('panelTitle').textContent=title;content.innerHTML=html;
  if(byId('deviceInstructions'))dialog.setAttribute('aria-describedby','deviceInstructions');
  else dialog.removeAttribute('aria-describedby');
  if(!dialog.open)dialog.showModal();
  content.scrollTop=0;
}
function close(){
  dialog.close();
  if(reviewJump&&dialog.contains(reviewJump)){
    reviewJump.open=false;
    roomHead.querySelector('.room-location').append(reviewJump);
  }
  byId('roomView').focus({preventScroll:true});
}
function placeJumpInDialog(){
  reviewJump.open=false;
  panelTop.prepend(reviewJump);
}
function action(host,label,fn,primary=false){
  const button=document.createElement('button');
  button.type='button';button.textContent=label;button.onclick=fn;
  if(primary)button.className='primary';
  host.append(button);return button;
}
function actions(){const host=document.createElement('div');host.className='actions';content.append(host);return host}
function correct(){return run.entry.length===puzzle.answer.length&&puzzle.answer.every((value,i)=>run.entry[i]===value)}
function deviceEntry(){
  return run.shelf?run.shelf.map((number,slot)=>run.entry.includes(slot)?number:null):run.entry;
}

function showFinish(){
  finished=true;
  roomHead.hidden=true;byId('spots').hidden=true;movement.hidden=true;
  byId('roomView').setAttribute('aria-label','학교 현관');
  const progress=book(),plan=schoolRoute(progress);
  const preceding=RECOVERY_ROOMS.filter(item=>item.kind==='classroom'||plan?.stops.includes(item.kind));
  const restored=preceding.filter(item=>roomRestored(progress,item)).length;
  const panel=document.createElement('section');
  panel.className='finale-status';panel.setAttribute('aria-label','학교 출입 복구 결과');
  panel.innerHTML='<p role="status">교실 장치 '+restored+'/'+preceding.length+' 복구</p>';
  byId('musicGame').append(panel);
  world.showFinale(buildSchoolFinale(),()=>{
    panel.innerHTML='<p role="status">교실 장치 '+restored+'/'+preceding.length+' 복구 · 현관 열림</p><h1 tabindex="-1">하교 완료</h1>';
    panel.classList.add('finale-complete');
    action(panel,'처음부터',retrySchool,true);
    panel.querySelector('h1').focus({preventScroll:true});
  });
}

function showExit(){
  if(countdown.check())return;
  if(story){
    if(room.kind==='computer'){
      showFinish();
      return;
    }
    const destination=schoolRoomToPlay(book());
    const notice=byId('escape'),status=notice.querySelector('[role=status]');
    movement.hidden=true;
    notice.classList.add('room-transfer');
    notice.querySelector('div').hidden=true;
    status.classList.remove('sr-only');
    notice.hidden=false;
    status.textContent=destination.place+'로 이동합니다.';
    setTimeout(()=>{
      if(!countdown.check())location.replace(recoveryRoomLink(destination,true));
    },1700);
    return;
  }
  const next=RECOVERY_ROOMS[stage+1];
  movement.hidden=true;byId('escape').hidden=false;
  const link=byId('nextRoom');
  link.href=next?recoveryRoomLink(next,false):'./';
  link.textContent=next?next.place+'로 이동':'우리 반 교실부터 시작';
  link.onclick=event=>{if(countdown.check())event.preventDefault()};
  link.focus({preventScroll:true});
}
function solve(revealMs=0){
  if(run.solved||opening||!countdown||countdown.check())return;
  if(story){
    const destination=schoolRoomToPlay(book());
    if(destination.kind!==room.kind){
      location.replace(recoveryRoomLink(destination,true));
      return;
    }
  }
  run.solved=true;
  const saved=story&&room.kind!=='computer'?save():countdown.stop(recordRestoration);
  if(!saved){run.solved=false;return}
  opening=true;
  byId('spots').inert=true;roomHead.inert=true;
  function openDoor(){
    if(countdown.check())return;
    close();
    world.facingDoor(()=>{
      if(countdown.check())return;
      if(!story){
        opening=false;
        byId('spots').inert=false;roomHead.inert=false;
      }
      showExit();
    });
  }
  if(revealMs){
    content.querySelectorAll('button').forEach(button=>{button.disabled=true});
    setTimeout(openDoor,revealMs);
  }
  else openDoor();
}
function changed(){
  if(countdown.check())return;
  world.setDigits(run.entry);
  if(correct())solve();
  else save();
}

function scoreSheet(){
  return '<div class="number-score" aria-label="악보에 적힌 건반 번호">'+
    MUSIC_KEYS.map(number=>'<span><b aria-hidden="true">♩</b>'+number+'</span>').join('')+'</div>';
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
function collectClue(id){
  if(!run.found.includes(id)){run.found.push(id);save()}
  byId('bag').hidden=false;
}

function inspectClue(id){
  const clue=room.clues.find(item=>item.id===id);
  if(!clue)return;
  collectClue(id);
  switch(id){
    case 'paper':modal(clue.name,scoreSheet());break;
    case 'recordA':modal(clue.name,signalRecords());break;
    default:modal(clue.name,'<div class="school-clue">'+schoolClueSvg(id)+'</div>');
  }
}
function inventory(){
  modal('찾은 단서','<div class="collected-clues" id="collectedClues"></div>');
  for(const clue of room.clues.filter(clue=>run.found.includes(clue.id))){
    action(byId('collectedClues'),clue.name,()=>inspectClue(clue.id));
  }
}

function deviceInstructions(style='object-note'){
  return '<p class="'+style+'" id="deviceInstructions">'+puzzle.instructions+'</p>';
}

function sequencePanel(){
  modal(puzzle.title,deviceInstructions()+'<div class="sequence-output" id="sequenceOutput" aria-label="입력한 순서"></div>'+
    '<div class="sequence-keys" id="sequenceKeys"></div><p class="readout" id="entryFeedback" role="status"></p>','lock');
  function draw(){
    const steps=puzzle.answer.map((_,i)=>'<span data-next="'+(i===run.entry.length)+'">'+
      (RESET_GLYPHS[run.entry[i]]??run.entry[i]??'·')+'</span>');
    const failed=run.entry.length===puzzle.answer.length&&!correct();
    const output=byId('sequenceOutput');
    output.innerHTML=steps.join('');
    output.dataset.invalid=String(failed);
    byId('entryFeedback').textContent=failed?'순서를 다시 확인해 보세요.':'';
    undo.disabled=!run.entry.length;
  }
  for(const key of puzzle.keys){
    const label=RESET_KEYS[key];
    const button=action(byId('sequenceKeys'),label,()=>{
      if(countdown.check()||run.entry.length>=puzzle.answer.length)return;
      run.entry.push(key);draw();changed();
    });
    button.innerHTML='<b aria-hidden="true">'+RESET_GLYPHS[key]+'</b><span>'+label+'</span>';
  }
  const undo=action(actions(),'한 단계 지우기',()=>{
    if(countdown.check())return;
    run.entry.pop();draw();changed();
  });
  draw();
}

function shelfPanel(){
  const hasMemo=run.found.includes('loanSlip');
  modal(puzzle.title,deviceInstructions()+
    '<div class="shelf-ticket"><span id="loanTarget"></span><span id="shelfCount"></span></div>'+
    '<div class="shelf-row" id="shelfRow" role="group" tabindex="-1" aria-label="왼쪽부터 번호순으로 꽂힌 일곱 권"></div>'+
    '<p class="shelf-feedback" id="shelfFeedback" role="status"></p>','shelf');
  byId('loanTarget').textContent=hasMemo?'대출 메모 · '+LOAN_NUMBER+'번':'대출 메모 미확인';
  const feedback=byId('shelfFeedback'),row=byId('shelfRow');
  const buttons=SHELF_BINDINGS.map((color,slot)=>{
    const button=action(row,'',()=>{
      if(!hasMemo||opening||run.solved||button.disabled||countdown.check())return;
      run.entry.push(slot);
      world.setDigits(deviceEntry());draw();
      if(run.shelf[slot]===LOAN_NUMBER){solve(850);return}
      save();
      if(retry.hidden)row.focus({preventScroll:true});
      else retry.focus({preventScroll:true});
    });
    button.dataset.command='book-'+slot;
    button.style.setProperty('--binding',color);
    return button;
  });
  const retry=action(content,'새 서가로 다시 찾기',()=>{
    if(countdown.check()||run.solved||opening)return;
    run.shelf=makeLibraryShelf();run.entry=[];
    world.setDigits(deviceEntry());save();draw();
    row.focus({preventScroll:true});
  });
  retry.className='shelf-retry';
  function draw(){
    const last=run.shelf[run.entry.at(-1)],found=last===LOAN_NUMBER;
    const remaining=SHELF_LIMIT-run.entry.length;
    byId('shelfCount').textContent='남은 기회 '+remaining+'회';
    for(const [slot,button] of buttons.entries()){
      const opened=run.entry.includes(slot);
      button.dataset.state=opened?'opened':'closed';
      button.textContent=opened?run.shelf[slot]:'';
      const description=opened?run.shelf[slot]+'번':'번호 가림';
      button.setAttribute('aria-label','왼쪽에서 '+(slot+1)+'번째 책, '+description);
      button.disabled=!hasMemo||!canOpenLibraryBook(run.shelf,run.entry,slot);
    }
    retry.hidden=remaining>0||found;
    if(found)feedback.textContent=LOAN_NUMBER+'번 책을 찾았어요!';
    else if(!hasMemo)feedback.textContent='열람대에서 대출 메모를 먼저 찾아보세요.';
    else if(last===undefined)feedback.textContent='';
    else if(!remaining)feedback.textContent=last+'번이에요. 세 권을 모두 펼쳤어요.';
    else feedback.textContent=last+'번 책을 펼쳤어요.';
  }
  draw();
}

function selectionPanel(){
  modal(puzzle.title,deviceInstructions()+
    '<div class="print-keys" id="printKeys" aria-label="인쇄할 도안"></div>','lock');
  const keys=byId('printKeys');
  for(const [i,{label}] of PRINT_SAMPLES.entries()){
    const button=action(keys,label,()=>{
      run.entry[i]=run.entry[i]==='1'?'0':'1';
      button.setAttribute('aria-pressed',String(run.entry[i]==='1'));
      changed();
    });
    button.setAttribute('aria-label','도안 '+label);
    button.setAttribute('aria-pressed',String(run.entry[i]==='1'));
  }
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
  if(room.kind!=='music'){
    modal(puzzle.title,deviceInstructions()+
      '<div class="switches four-digits" id="wheels"></div>','lock');
    run.entry.forEach((_,i)=>dial(byId('wheels'),i));
    return;
  }
  modal(puzzle.title,deviceInstructions()+'<div class="dial-pairs" id="wheels" aria-label="변환 결과"></div>','lock');
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
  modal(puzzle.title,deviceInstructions()+'<div class="signal-tests" id="signalTests"></div><p class="readout" id="entryFeedback" role="status"></p>','routing');
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

function mixerPanel(){
  const result=()=>run.entry.every(Boolean)?broadcastTrace(run.entry):null;
  const initial=result();
  if(initial?.passed){solve();return}
  modal(puzzle.title,deviceInstructions('mixer-guide')+
    '<div class="mixer-order" id="mixerOrder" role="group" aria-label="방송 순서"></div>'+
    '<div class="mixer-pads" id="mixerPads" role="group" aria-label="방송 명령"></div>'+
    '<p class="mixer-feedback" id="entryFeedback" role="status"></p>','mixer');
  let selected=initial?.trace.length??run.entry.indexOf('');
  const feedback=byId('entryFeedback');
  const slots=run.entry.map((_,i)=>{
    const slot=action(byId('mixerOrder'),String(i+1),()=>{selected=i;draw(result())});
    slot.innerHTML='<small aria-hidden="true">'+(i+1)+'</small><span></span>';
    return slot;
  });
  function draw(outcome){
    const failed=outcome&&!outcome.passed?outcome.trace.length:-1;
    for(const [i,slot] of slots.entries()){
      const label=BROADCAST_COMMANDS[run.entry[i]]?.label;
      slot.lastElementChild.textContent=label??'—';
      slot.setAttribute('aria-label',(i+1)+'단계 '+(label??'비어 있음'));
      slot.setAttribute('aria-pressed',String(i===selected));
      slot.dataset.result=i===failed?'failed':i<failed?'passed':'';
    }
    feedback.textContent=failed<0?'':(failed+1)+'단계에서 멈췄어요. 현재 상태는 '+outcome.state+'입니다.';
  }
  for(const [key,{label}] of Object.entries(BROADCAST_COMMANDS)){
    const pad=action(byId('mixerPads'),label,()=>{
      if(countdown.check())return;
      run.entry[selected]=key;
      world.setDigits(run.entry);
      const outcome=result();
      if(outcome?.passed){solve();return}
      const next=run.entry.findIndex((value,i)=>!value&&i>selected);
      selected=outcome?.trace.length??(next<0?run.entry.indexOf(''):next);
      save();draw(outcome);
    });
    pad.dataset.command=key;
  }
  draw(result());
}

function waterPanel(){
  collectClue('waterStart');
  if(correct()){solve();return}
  modal(puzzle.title,deviceInstructions('water-guide')+
    '<div class="water-readings"><span>시작 눈금 <b>'+WATER_CYCLE.initial+'칸</b></span>'+
    '<span>현재 눈금 <b id="waterReading" aria-live="polite"></b></span></div>'+
    '<div class="water-order" id="waterOrder" role="group" aria-label="회차별 물 높이"></div>'+
    '<div class="water-levels" id="waterLevels" role="group" aria-label="물 높이 조절"></div>'+
    '<p class="water-feedback" id="entryFeedback" role="status"></p>','water');
  const firstIncorrect=()=>run.entry.every(Boolean)?run.entry.findIndex((level,i)=>level!==puzzle.answer[i]):-1;
  let round=run.entry.indexOf('');
  if(round<0)round=firstIncorrect();
  const feedback=byId('entryFeedback'),reading=byId('waterReading');
  const rounds=run.entry.map((_,i)=>{
    const slot=action(byId('waterOrder'),(i+1)+'회차',()=>{
      round=i;previewRound();draw();
    });
    slot.innerHTML='<small aria-hidden="true">'+(i+1)+'회차</small><span></span>';
    return slot;
  });
  function preview(level){
    world.setDigits(run.entry,level);
    reading.textContent=level+'칸';
  }
  function previewRound(){
    preview(run.entry[round]||run.entry[round-1]||String(WATER_CYCLE.initial));
  }
  function draw(){
    const incorrect=firstIncorrect();
    for(const [i,slot] of rounds.entries()){
      const level=run.entry[i];
      slot.lastElementChild.textContent=level?level+'칸':'—';
      slot.setAttribute('aria-label',(i+1)+'회차 '+(level?level+'칸':'비어 있음'));
      slot.setAttribute('aria-pressed',String(i===round));
      slot.dataset.result=i===incorrect?'failed':'';
    }
    feedback.textContent=incorrect<0?'':(incorrect+1)+'회차 물 높이를 다시 확인해 보세요.';
  }
  for(const level of puzzle.keys){
    const key=action(byId('waterLevels'),level+'칸',()=>{
      if(countdown.check())return;
      run.entry[round]=level;preview(level);
      if(correct()){solve();return}
      const next=run.entry.findIndex((value,i)=>!value&&i>round);
      const incorrect=firstIncorrect();
      round=incorrect<0?(next<0?run.entry.indexOf(''):next):incorrect;
      if(incorrect>=0)previewRound();
      save();draw();
    });
    key.dataset.command=level;
  }
  previewRound();draw();
}

function ballLockerPanel(){
  collectClue('ballLine');
  if(correct()){solve();return}
  modal(puzzle.title,deviceInstructions('ball-guide')+
    '<div class="ball-record" id="ballRecord" role="group" aria-label="회차별 기록"></div>'+
    '<p class="ball-task" id="ballTask"></p>'+
    '<div class="ball-row-label" id="ballBeforeBox" hidden>빼기 전<div class="ball-row" id="ballBefore"></div></div>'+
    '<div class="ball-row-label">현재 배열<div class="ball-row" id="ballCurrent" role="group" aria-label="남은 공"></div></div>'+
    '<div class="ball-counts" id="ballCounts" role="group" aria-label="움직인 공의 개수" hidden></div>'+
    '<p class="ball-feedback" id="entryFeedback" role="status"></p>','ball-locker');
  const tray=byId('ballCurrent'),before=byId('ballBefore'),counts=byId('ballCounts');
  const feedback=byId('entryFeedback');
  const pickers=new Map(BALLS.map((label,i)=>{
    const button=action(tray,label,()=>pick(label));
    button.className='locker-ball';
    button.dataset.command=label;
    button.setAttribute('aria-label',label+' 공 빼기');
    button.style.setProperty('--ball',BALL_COLORS[i]);
    return [label,button];
  }));
  for(const value of puzzle.keys)action(counts,value+'개',()=>record(value));
  function fillRow(host,row,interactive){
    host.replaceChildren();
    for(const label of row){
      const chip=interactive?pickers.get(label):document.createElement('span');
      if(interactive)chip.disabled=run.awaitingCount;
      else{
        chip.className='locker-ball';
        chip.textContent=label;
        chip.style.setProperty('--ball',BALL_COLORS[BALLS.indexOf(label)]);
      }
      host.append(chip);
    }
    for(let i=row.length;i<BALLS.length;i++){
      const gap=document.createElement('span');
      gap.className='ball-empty';
      host.append(gap);
    }
  }
  function draw(){
    const round=run.entry.length,waiting=run.awaitingCount;
    byId('ballRecord').innerHTML=puzzle.answer.map((_,i)=>
      '<div data-active="'+(i===round)+'"><small>'+(i+1)+'회</small><b>'+
      (run.entry[i]===undefined?'—':run.entry[i]+'개')+'</b></div>').join('');
    byId('ballTask').textContent=waiting?BALL_PICKUP[round]+' 공을 뺐어요. 움직인 공은 몇 개인가요?':'회수 순서에 맞춰 공을 고르세요.';
    byId('ballBeforeBox').hidden=!waiting;
    counts.hidden=!waiting;
    if(waiting)fillRow(before,ballRowAfter(round),false);
    fillRow(tray,ballRowAfter(round+Number(waiting)),true);
    feedback.textContent='';
  }
  function pick(label){
    if(countdown.check()||run.awaitingCount)return;
    if(label!==BALL_PICKUP[run.entry.length]){
      feedback.textContent='회수 순서 단서를 다시 확인해 보세요.';
      return;
    }
    run.awaitingCount=true;
    world.setDigits(run.entry,{pending:true,animate:true});
    save();draw();
    counts.firstElementChild.focus({preventScroll:true});
  }
  function record(value){
    if(countdown.check()||!run.awaitingCount)return;
    if(value!==puzzle.answer[run.entry.length]){
      feedback.textContent='남은 공 중 자리가 바뀐 공만 다시 세어 보세요.';
      return;
    }
    run.entry.push(value);
    run.awaitingCount=false;
    if(correct()){solve();return}
    save();draw();
    tray.querySelector('button')?.focus({preventScroll:true});
  }
  draw();
}

function inspectLock(){
  if(run.solved||!countdown||countdown.check())return;
  const panels={sequence:sequencePanel,selection:selectionPanel,dial:dialPanel,routing:routingPanel,debug:mixerPanel,
    water:waterPanel,balls:ballLockerPanel,shelf:shelfPanel};
  panels[puzzle.control]();
  appendRoomTextHint(content,countdown,puzzle.hint);
}

function directory(){
  if(story){
    modal('학교 안내도','','map');
    renderSchoolMap(content,{plan:schoolRoute(book()),position:room.kind});
  }else{
    modal('학교 안내도','<div class="map-list">'+RECOVERY_ROOMS.map(item=>
      '<a href="'+recoveryRoomLink(item,false)+'">'+item.place+'</a>').join('')+'</div>','map');
  }
}
function restart(){
  close();
  run=newRun();opening=false;save();byId('bag').hidden=true;byId('escape').hidden=true;
  roomHead.inert=false;byId('spots').inert=false;
  movement.hidden=false;world.reset(false,deviceEntry());
  countdown?.reset();
}
function beginTimer(){
  if(story)attempt=schoolEscapeTimer(book())?.startedAt;
  countdown=setupSchoolTimer(room.n,{key:bookKey,isSolved:()=>run.solved,onExpire:()=>{
    world.clearKeys();opening=false;roomHead.inert=true;
    byId('escape').hidden=true;
    placeJumpInDialog();
    showSchoolTimeout(dialog,story?retrySchool:restart);
  }});
  return !countdown.check();
}
function intro(){
  placeJumpInDialog();
  modal('들를 교실 고르기','','intro');
  renderSchoolRoutePicker(content,{heading:byId('panelTitle'),onStart:plan=>{
    const progress=book();
    if(schoolEscapeTimer(progress)&&schoolRoute(progress)){location.reload();return}
    if(!beginSchoolAttempt(plan))return false;
    run=newRun();world.reset(false,deviceEntry());byId('bag').hidden=true;
    close();beginTimer();
  }});
}
function mandatoryDialog(){return ['intro','timeout'].includes(dialog.dataset.panel)}

function start(){
  const progress=book(),plan=schoolEscapeTimer(progress)&&schoolRoute(progress);
  let updated=false;
  if(story){
    const destination=schoolRoomToPlay(progress,plan);
    if(destination.kind!==room.kind){
      location.replace(recoveryRoomLink(destination,true));
      return;
    }
    if(plan&&plan.path[plan.step]!==room.kind){
      progress.route={...plan,step:plan.path.indexOf(room.kind)};
      progress.room=room.n;
      updated=true;
    }
  }
  if(outdated&&!run.solved&&(!story||plan)){
    progress.visits[room.n]={restoration:run};
    updated=true;
  }
  if(updated)writeSchoolBook(bookKey,progress);
  byId('dismiss').onclick=close;byId('bag').onclick=inventory;byId('map').onclick=directory;
  byId('replay').onclick=restart;
  dialog.addEventListener('cancel',event=>{if(mandatoryDialog())event.preventDefault()});
  dialog.addEventListener('click',event=>{
    if(event.target!==dialog||mandatoryDialog())return;
    const r=dialog.getBoundingClientRect();
    if(event.clientX>=r.left&&event.clientX<=r.right&&event.clientY>=r.top&&event.clientY<=r.bottom)return;
    const command=['mixer','water','shelf','ball-locker'].includes(dialog.dataset.panel)&&world.commandAt?.(event.clientX,event.clientY);
    if(command){
      content.querySelector('[data-command="'+command+'"]')?.click();
      return;
    }
    close();
  });
  reviewJump=setupReviewNavigation(story?null:room.n,{rooms:RECOVERY_ROOMS,urlFor:item=>recoveryRoomLink(item,false)});
  if(story)window.addEventListener('pageshow',event=>{if(event.persisted)location.reload()});
  createMusicWorld({
    room,buildRoom:buildSchoolRoom,deviceInstructions:puzzle.instructions,
    onReadyToMove:()=>!!countdown&&!dialog.open&&!opening&&!finished&&!countdown.expired,
    onInspect:id=>{
      if(!countdown||countdown.check())return;
      if(id===(room.lock?.id??'lock'))inspectLock();
      else if(id!=='doorGuide')inspectClue(id);
    }
  }).then(created=>{
    world=created;world.reset(run.solved,deviceEntry());byId('bag').hidden=!run.found.length;
    if(run.awaitingCount)world.setDigits(run.entry,{pending:true});
    if(story&&!plan){intro();return}
    if(beginTimer()&&run.solved)showExit();
  }).catch(error=>{
    console.error(error);
    modal('교실을 열지 못했어요.','','error');
    action(actions(),'다시 열기',()=>location.reload(),true);
  });
}
start();
