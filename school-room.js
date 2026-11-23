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
const stored=book().visits[room.n]?.restoration;
const saved=puzzle.control==='pin' ? migrateSportsProgress(stored) : stored;
const outdated=saved?.revision!==puzzle.revision;

function migrateSportsProgress(previous){
  if(!previous||previous.revision!==undefined)return previous;
  // In the old puzzle entry held confirmed move counts. None were typed at the door.
  let picked=0;
  while(picked<puzzle.answer.length&&previous.entry?.[picked]===puzzle.answer[picked])picked++;
  if(previous.awaitingCount===true&&picked<BALL_PICKUP.length)picked++;
  return {...previous,revision:puzzle.revision,picked,entry:[]};
}

function newRun(){
  if(puzzle.control==='shelf')return {revision:puzzle.revision,found:[],entry:[],shelf:makeLibraryShelf(),solved:false};
  if(puzzle.control==='device')return {revision:puzzle.revision,found:[],entry:[],device:CT.fresh(room.kind),solved:false};
  return {revision:puzzle.revision,found:[],entry:[],picked:0,solved:false};
}
let run=newRun(),world,countdown,attempt,reviewJump,opening=false,finished=false;
if(saved&&(!outdated||puzzle.control==='shelf')){
  run.found=Array.isArray(saved.found)?saved.found.filter(id=>room.clues.some(clue=>clue.id===id)):[];
}
if(saved&&!outdated){
  if(puzzle.control==='pin'&&Number.isInteger(saved.picked)&&saved.picked>=0&&saved.picked<=BALL_PICKUP.length)run.picked=saved.picked;
  if(puzzle.control==='device')run.device=CT.restore(room.kind,saved.device,run.device);
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
    else if(puzzle.control==='pin'&&saved.entry.length<puzzle.answer.length&&saved.entry.every(value=>puzzle.keys.includes(value)))run.entry=saved.entry.slice();
  }
}
run.solved=saved?.solved===true&&(!outdated||story);
if(run.solved&&puzzle.control==='pin'){
  run.entry=puzzle.answer.slice();
}

function logPlay(kind,detail=''){
  if(story&&globalThis.SchoolRecords?.lesson)SchoolRecords.event(book(),room.kind,kind,detail);
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
  world?.leaveWorkbench?.();
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
  if(puzzle.control==='device')return run.device;
  return run.shelf?run.shelf.map((number,slot)=>run.entry.includes(slot)?number:null):run.entry;
}
function resetWorld(){
  world.reset(run.solved,deviceEntry());
  if(puzzle.control==='pin')world.setBalls(run.picked);
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
  logPlay('solve');
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

function collectClue(id){
  if(!run.found.includes(id)){run.found.push(id);save();logPlay('clue',id)}
  byId('bag').hidden=false;
}

function inspectClue(id){
  const clue=room.clues.find(item=>item.id===id);
  if(!clue)return;
  collectClue(id);
  if(clue.lines){
    modal(clue.lines.join(' '),'','library-note');
    return;
  }
  if(id==='practiceRail'){devicePanel(id,clue.name);return}
  if(CT.clues[id]){
    modal(clue.name,'<div class="ct-clue" id="clueDetail"></div>','ct-clue');
    CTDeviceUI.clue(id,byId('clueDetail'));
  }else modal(clue.name,'<div class="school-clue">'+schoolClueSvg(id)+'</div>');
}
function inventory(){
  modal('찾은 단서','<div class="collected-clues" id="collectedClues"></div>');
  for(const clue of room.clues.filter(clue=>run.found.includes(clue.id))){
    action(byId('collectedClues'),clue.name,()=>{
      if(clue.id==='practiceRail'){close();world.inspectTarget(clue.id)}
      else inspectClue(clue.id);
    });
  }
}

function deviceInstructions(style='object-note'){
  return '<p class="'+style+'" id="deviceInstructions">'+puzzle.instructions+'</p>';
}

function shelfPanel(firstCommand){
  modal(puzzle.title,'<div class="shelf-ticket" id="shelfCount"></div>'+
    '<div class="shelf-row" id="shelfRow" role="group" tabindex="-1" aria-label="왼쪽부터 번호순으로 꽂힌 일곱 권"></div>'+
    '<p class="shelf-feedback" id="shelfFeedback" role="status"></p>','shelf');
  const feedback=byId('shelfFeedback'),row=byId('shelfRow');
  const buttons=SHELF_BINDINGS.map((color,slot)=>{
    const button=action(row,'',()=>{
      if(opening||run.solved||countdown.check()||!canOpenLibraryBook(run.shelf,run.entry,slot))return;
      run.entry.push(slot);
      logPlay('book',(slot+1)+':'+run.shelf[slot]);
      world.setDigits(deviceEntry());draw();
      if(run.shelf[slot]===LOAN_NUMBER){solve(850);return}
      if(run.entry.length===SHELF_LIMIT)logPlay('wrong');
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
      button.disabled=!canOpenLibraryBook(run.shelf,run.entry,slot);
    }
    retry.hidden=remaining>0||found;
    if(found)feedback.textContent=LOAN_NUMBER+'번 책을 찾았어요!';
    else if(last===undefined)feedback.textContent='';
    else if(!remaining)feedback.textContent=last+'번이에요. 세 권을 모두 펼쳤어요.';
    else feedback.textContent=last+'번 책을 펼쳤어요.';
  }
  draw();
  if(firstCommand)buttons.find(button=>button.dataset.command===firstCommand)?.click();
}

function ballLockerPanel(){
  if(run.solved)return;
  collectClue('ballLine');
  modal('공 꺼내기','<p class="ball-task" id="ballTask" role="status"></p>'+
    '<div class="ball-row-label" id="ballBeforeBox" hidden>빼기 전<div class="ball-row" id="ballBefore"></div></div>'+
    '<div class="ball-row-label">지금 놓인 공<div class="ball-row" id="ballCurrent" role="group" aria-label="남은 공"></div></div>'+
    '<p class="ball-feedback" id="entryFeedback" role="status"></p>','ball-locker');
  const tray=byId('ballCurrent'),before=byId('ballBefore');
  const feedback=byId('entryFeedback');
  const pickers=new Map(BALLS.map((label,i)=>{
    const button=action(tray,label,()=>pick(label));
    button.className='locker-ball';
    button.dataset.command=label;
    button.setAttribute('aria-label',label+' 공 빼기');
    button.style.setProperty('--ball',BALL_COLORS[i]);
    return [label,button];
  }));
  const reset=action(actions(),'공 다시 놓기',()=>{
    if(countdown.check()||run.solved)return;
    run.picked=0;world.setBalls(0);save();draw();
    tray.querySelector('button')?.focus({preventScroll:true});
  });
  function fillRow(host,row,interactive){
    host.replaceChildren();
    for(const label of row){
      const chip=interactive?pickers.get(label):document.createElement('span');
      if(interactive)chip.disabled=run.picked===BALL_PICKUP.length;
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
    const picked=run.picked;
    let task='회수 순서에 맞춰 공을 하나씩 빼세요.';
    if(picked){
      task=picked+'번째로 '+BALL_PICKUP[picked-1]+' 공을 뺐어요. 뺀 공을 제외하고 자리가 바뀐 공은 몇 개인가요?';
      if(picked===BALL_PICKUP.length)task+=' 네 번 센 개수를 문 옆 번호판에 누르세요.';
      fillRow(before,ballRowAfter(picked-1),false);
    }
    byId('ballTask').textContent=task;
    byId('ballBeforeBox').hidden=!picked;
    reset.hidden=!picked;
    fillRow(tray,ballRowAfter(picked),true);
    feedback.textContent='';
  }
  function pick(label){
    if(countdown.check()||run.solved||run.picked===BALL_PICKUP.length)return;
    if(label!==BALL_PICKUP[run.picked]){
      logPlay('wrong');
      feedback.textContent='회수 순서 단서를 다시 확인해 보세요.';
      return;
    }
    run.picked++;
    world.setBalls(run.picked,true);
    save();draw();
    (tray.querySelector('button:enabled')??reset).focus({preventScroll:true});
  }
  draw();
}

function sportsPinPanel(){
  modal(puzzle.title,deviceInstructions()+
    '<div class="pin-device"><output id="pinDisplay" aria-label="입력한 비밀번호"></output>'+
    '<div id="pinKeys" role="group" aria-label="숫자 키패드"></div></div>'+
    '<p class="ball-feedback" id="entryFeedback" role="status"></p>','sports-pin');
  const keys=byId('pinKeys'),feedback=byId('entryFeedback');
  function draw(){
    byId('pinDisplay').textContent=puzzle.answer.map((_,i)=>run.entry[i]??'–').join(' ');
    erase.disabled=!run.entry.length;
  }
  function press(key){
    if(opening||run.solved||countdown.check())return;
    feedback.textContent='';
    if(key==='Backspace')run.entry.pop();
    else{
      run.entry.push(key);
      if(run.entry.length===puzzle.answer.length&&!correct()){
        logPlay('wrong');run.entry=[];
        feedback.textContent='비밀번호가 맞지 않아요. 네 자리를 다시 눌러 보세요.';
      }
    }
    draw();changed();
  }
  for(const digit of puzzle.keys){
    const button=action(keys,digit,()=>press(digit));
    if(digit==='0')button.className='pin-zero';
  }
  const erase=action(keys,'⌫',()=>press('Backspace'));
  erase.setAttribute('aria-label','마지막 숫자 지우기');
  keys.onkeydown=event=>{
    if(event.ctrlKey||event.altKey||event.metaKey||!(puzzle.keys.includes(event.key)||event.key==='Backspace'))return;
    event.preventDefault();
    if(!event.repeat)press(event.key);
  };
  draw();
  keys.firstElementChild.focus({preventScroll:true});
}

function devicePanel(kind,title,command){
  const practice=kind==='practiceRail';
  modal(title,(practice?'<p>'+CT.clues.practiceRail[1]+'</p>':deviceInstructions())+
    '<div id="deviceSurface"></div>','ct-device');
  const host=byId('deviceSurface');
  CTDeviceUI.open(kind,run.device,host,{
    save,solve,record:logPlay,
    active:()=>dialog.open&&!countdown.check(),
    update:()=>world.setDigits(deviceEntry())
  },command);
}
function inspectLock(command){
  if(run.solved||!countdown||countdown.check())return;
  if(puzzle.control==='device')devicePanel(room.kind,puzzle.title,command);
  else if(puzzle.control==='pin')sportsPinPanel();
  else shelfPanel(command);
  if(!run.solved)appendRoomTextHint(content,countdown,puzzle.hint);
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
  const previous=run;
  run=newRun();
  if(room.kind==='science')run.device.lower=previous.device.lower==='left'?'right':'left';
  opening=false;save();byId('bag').hidden=true;byId('escape').hidden=true;
  roomHead.inert=false;byId('spots').inert=false;
  movement.hidden=false;resetWorld();
  countdown?.reset();
}
function beginTimer(){
  if(story)attempt=schoolEscapeTimer(book())?.startedAt;
  countdown=setupSchoolTimer(room.n,{key:bookKey,isSolved:()=>run.solved,onExpire:()=>{
    logPlay('timeout');
    world.leaveWorkbench?.();
    world.clearKeys();opening=false;roomHead.inert=true;
    byId('escape').hidden=true;
    placeJumpInDialog();
    showSchoolTimeout(dialog,story?retrySchool:restart);
  }});
  const canPlay=!countdown.check();
  if(canPlay&&!run.solved)logPlay('enter');
  return canPlay;
}
function intro(){
  placeJumpInDialog();
  modal('들를 교실 고르기','','intro');
  renderSchoolRoutePicker(content,{heading:byId('panelTitle'),onStart:async plan=>{
    const progress=book();
    if(schoolEscapeTimer(progress)&&schoolRoute(progress)){location.reload();return}
    const enrollment=await SchoolRecords.reserve(plan.stops);
    if(!beginSchoolAttempt(plan,enrollment))return false;
    if(enrollment)SchoolRecords.started();
    run=newRun();resetWorld();byId('bag').hidden=true;
    close();beginTimer();save();
  }});
}
function mandatoryDialog(){return ['intro','timeout'].includes(dialog.dataset.panel)}

function start(){
  if(SchoolRecords.lesson&&!SchoolRecords.storyKey){location.replace('join.html');return}
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
  if((outdated||saved!==stored)&&!run.solved&&(!story||plan)){
    progress.visits[room.n]={restoration:run};
    updated=true;
  }
  if(updated)writeSchoolBook(bookKey,progress);
  byId('dismiss').onclick=close;byId('bag').onclick=inventory;byId('map').onclick=directory;
  byId('replay').onclick=restart;
  dialog.addEventListener('cancel',event=>{if(mandatoryDialog())event.preventDefault()});
  // A touch released in the room can open this dialog before the browser sends its click.
  let pressStartedInDialog=false;
  document.addEventListener('pointerdown',event=>{
    if(event.isPrimary)pressStartedInDialog=dialog.contains(event.target);
  },true);
  dialog.addEventListener('click',event=>{
    if(event.detail>0&&!pressStartedInDialog){
      event.preventDefault();event.stopImmediatePropagation();
    }
  },true);
  dialog.addEventListener('click',event=>{
    if(event.target!==dialog||mandatoryDialog())return;
    const r=dialog.getBoundingClientRect();
    if(event.clientX>=r.left&&event.clientX<=r.right&&event.clientY>=r.top&&event.clientY<=r.bottom)return;
    const command=['mixer','shelf','ball-locker'].includes(dialog.dataset.panel)&&world.commandAt?.(event.clientX,event.clientY);
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
    onInspect:(id,command)=>{
      if(!countdown||countdown.check())return;
      if(id===(room.lock?.id??'lock'))inspectLock(command);
      else if(id==='ballLine')ballLockerPanel();
      else if(id==='doorGuide')modal(puzzle.doorTitle??(room.place+' 문제'),deviceInstructions(),'door-question');
      else inspectClue(id);
    }
  }).then(created=>{
    world=created;resetWorld();byId('bag').hidden=!run.found.length;
    if(story&&!plan){intro();return}
    if(beginTimer()&&run.solved)showExit();
  }).catch(error=>{
    console.error(error);
    modal('교실을 열지 못했어요.','','error');
    action(actions(),'다시 열기',()=>location.reload(),true);
  });
}
start();
