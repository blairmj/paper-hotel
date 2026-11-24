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
const freshSportsVisit=!story&&room.kind==='sports'&&!history.state?.sportsVisit;

function newRun(){
  if(puzzle.control==='shelf')return {revision:puzzle.revision,found:[],entry:[],shelf:makeLibraryShelf(),solved:false};
  if(puzzle.control==='device')return {revision:puzzle.revision,found:[],entry:[],device:CT.fresh(room.kind),solved:false};
  return {revision:puzzle.revision,found:[],entry:[],picked:0,solved:false};
}
let run,world,countdown,attempt,reviewJump,opening=false,finished=false;
function restoreRun(saved,outdated){
  run=newRun();
  if(saved&&(!outdated||puzzle.control==='shelf')){
    run.found=Array.isArray(saved.found)?saved.found.filter(id=>room.clues.some(clue=>clue.id===id)&&!(outdated&&id==='loanSlip')):[];
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
  if(run.solved&&puzzle.control==='pin')run.entry=puzzle.answer.slice();
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

function openSurvey(){
  location.assign(SchoolRecords.lesson?'survey.html?lesson=1':'survey.html?solo=1');
}

function showFinish(){
  roomHead.hidden=true;byId('spots').hidden=true;movement.hidden=true;
  byId('roomView').setAttribute('aria-label','학교 현관');
  let result='컴퓨터실 출입 패드 복구';
  if(story){
    const progress=book();
    const restored=RECOVERY_ROOMS.filter(item=>roomRestored(progress,item)).length;
    result='교실 장치 '+restored+'/'+RECOVERY_ROOMS.length+' 복구';
  }
  const panel=document.createElement('section');
  panel.className='finale-status';panel.setAttribute('aria-label','학교 출입 복구 결과');
  panel.innerHTML='<p role="status">'+result+'</p>';
  byId('musicGame').append(panel);
  world.showFinale(buildSchoolFinale(),()=>{
    panel.innerHTML='<p role="status">'+result+' · 현관 열림</p><h1 tabindex="-1">하교 완료</h1>';
    panel.classList.add('finale-complete');
    const buttons=document.createElement('div');buttons.className='survey-actions';panel.append(buttons);
    if(story){
      action(buttons,'학생 설문',openSurvey,true);
      action(buttons,'처음부터',retrySchool);
    }else{
      action(buttons,'우리 반 교실부터 시작',()=>location.assign(schoolStartLink()),true);
      action(buttons,'다시 풀기',()=>{
        history.replaceState(null,'');
        location.reload();
      });
    }
    panel.querySelector('h1').focus({preventScroll:true});
  });
}

function showExit(){
  if(finished||countdown.check())return;
  finished=true;
  if(room.kind==='computer'){showFinish();return}
  const destination=story?schoolRoomToPlay(book()):RECOVERY_ROOMS[stage+1];
  const notice=byId('escape');
  movement.hidden=true;
  notice.hidden=false;
  notice.textContent=destination.place+'로 이동합니다.';
  setTimeout(()=>{
    if(!countdown.check())location.replace(recoveryRoomLink(destination,story));
  },1700);
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
  // A refresh during a review transfer should continue it. A new visit allows a replay.
  if(!story)history.replaceState({...history.state,clearedReviewRoom:room.kind},'');
  logPlay('solve');
  opening=true;
  byId('spots').inert=true;roomHead.inert=true;
  function openDoor(){
    if(countdown.check())return;
    close();
    world.facingDoor(showExit);
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

function inspectClue(id,command){
  const clue=room.clues.find(item=>item.id===id);
  if(!clue)return;
  if(id==='paper'){MusicClock.showPaper();return}
  collectClue(id);
  if(id==='clock'){MusicClock.showClock(command==='overlay'&&run.device.overlay&&run.found.includes('paper')?0:null);return}
  if(clue.lines){
    modal(clue.lines.join(' '),'','library-note');
    return;
  }
  if(CT.clues[id]){
    modal(clue.name,'<div class="ct-clue" id="clueDetail"></div>','ct-clue');
    CTDeviceUI.clue(id,byId('clueDetail'));
  }else modal(clue.name,'<div class="school-clue">'+schoolClueSvg(id)+'</div>');
}
function inventory(){
  modal('찾은 단서','<div class="collected-clues" id="collectedClues"></div>');
  if(room.kind==='computer'&&run.device.card){
    const carried=document.createElement('p');
    carried.textContent='가져온 카드　'+[...run.device.card].join(' ');
    byId('collectedClues').append(carried);
  }
  for(const clue of room.clues.filter(clue=>run.found.includes(clue.id))){
    action(byId('collectedClues'),clue.name,()=>{
      inspectClue(clue.id);
    });
  }
}

function deviceInstructions(text=puzzle.instructions){
  return text?'<p class="object-note" id="deviceInstructions">'+text+'</p>':'';
}

function shelfPanel(){
  modal(puzzle.title,deviceInstructions()+'<div class="shelf-ticket" id="shelfCount"></div>'+
    '<div class="shelf-row" id="shelfRow" role="group" tabindex="-1" aria-label="왼쪽부터 번호순으로 꽂힌 일곱 권"></div>'+
    '<p class="shelf-feedback" id="shelfFeedback" role="status"></p>','shelf');
  const feedback=byId('shelfFeedback'),row=byId('shelfRow');
  const buttons=SHELF_BINDINGS.map((color,slot)=>{
    const button=action(row,'',()=>{
      if(opening||run.solved||countdown.check()||!canOpenLibraryBook(run.shelf,run.entry,slot))return;
      if(!run.found.includes('loanSlip')){feedback.textContent='서가의 책 사이에 대출 쪽지가 있어요. 쪽지부터 찾아보세요.';return}
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
  const retry=action(content,'다시 찾기',()=>{
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
    else if(!remaining)feedback.textContent=last+'번이에요. 세 권을 다 펼쳤어요. 다시 찾기를 누르면 책이 번호순으로 새로 놓여요.';
    else feedback.textContent=last+'번 책을 펼쳤어요.';
  }
  draw();
}

function ballLockerPanel(){
  if(run.solved)return;
  collectClue('ballLine');
  modal('공 꺼내기','<p class="ball-task" id="ballTask" role="status"></p>'+
    '<div class="ball-slots" aria-hidden="true">'+BALLS.map((_,i)=>'<span>'+(i+1)+'</span>').join('')+'</div>'+
    '<div class="ball-lane" id="ballCurrent" role="group" aria-label="여섯 자리 공 선반"></div>'+
    '<div class="ball-moves" id="ballMoves" role="status" aria-atomic="true" hidden><strong>움직인 공</strong><ol></ol></div>'+
    '<p class="ball-feedback" id="entryFeedback" role="status"></p>','ball-locker');
  const lane=byId('ballCurrent'),status=byId('ballTask'),feedback=byId('entryFeedback');
  const moves=byId('ballMoves'),counts=moves.querySelector('ol');
  const controls=actions();
  let animating=false;
  const chips=BALLS.map((label,i)=>{
    const chip=action(lane,label,()=>pick(label));
    chip.className='locker-ball';chip.dataset.command=label;
    chip.setAttribute('aria-label',label+' 공 빼기');
    chip.style.setProperty('--ball',BALL_COLORS[i]);return chip;
  });
  const replay=action(controls,'움직임 다시 보기',()=>animate(run.picked));
  const reset=action(controls,'공 다시 놓기',()=>{
    if(animating||countdown.check())return;
    run.picked=0;run.entry=[];world.setBalls(0);save();draw(0);showCounts(0);prompt();
  });
  function showCounts(count){
    moves.hidden=count===0;
    counts.replaceChildren();
    for(let i=0;i<count;i++){
      const item=document.createElement('li'),value=document.createElement('b');
      value.textContent=puzzle.answer[i]+'개';
      item.append(BALL_PICKUP[i]+'를 뺀 뒤 ',value);counts.append(item);
    }
  }
  function draw(count){
    const balls=ballRowAfter(count);
    chips.forEach((chip,i)=>{
      const pos=balls.indexOf(BALLS[i]);chip.hidden=pos<0;
      if(pos>=0)chip.style.left=((pos+.5)*100/BALLS.length)+'%';
      chip.disabled=animating||count===BALL_PICKUP.length;
    });
  }
  function prompt(){
    const n=run.picked;
    if(!n)status.textContent='선반에 공이 여섯 개 있어요. 회수표의 첫 번째 공을 눌러 보세요.';
    else if(animating)status.textContent=BALL_PICKUP[n-1]+' 공을 빼는 중이에요.';
    else status.textContent=BALL_PICKUP[n-1]+' 공을 빼자 남은 공 '+puzzle.answer[n-1]+'개가 왼쪽으로 움직였어요.';
    const complete=!animating&&n===BALL_PICKUP.length;
    feedback.classList.toggle('ball-next-step',complete);
    feedback.textContent=complete?'네 번의 기록을 문 옆 번호판에 차례로 입력하세요.':'';
    replay.hidden=reset.hidden=!n;
    replay.disabled=reset.disabled=animating;
  }
  function animate(n){
    if(animating||!n||countdown.check())return;
    animating=true;lane.classList.remove('sliding');draw(n-1);prompt();
    const removed=chips[BALLS.indexOf(BALL_PICKUP[n-1])];removed.classList.add('leaving');
    setTimeout(()=>{
      if(!lane.isConnected)return;
      removed.classList.remove('leaving');lane.classList.add('sliding');draw(n);
      setTimeout(()=>{if(!lane.isConnected)return;animating=false;draw(n);showCounts(n);prompt()},850);
    },340);
  }
  function pick(label){
    if(animating||countdown.check()||run.solved)return;
    if(label!==BALL_PICKUP[run.picked]){logPlay('wrong');feedback.textContent='회수표에서 다음에 뺄 공을 확인해 보세요.';return}
    run.picked++;save();world.setBalls(run.picked,true);animate(run.picked);
  }
  draw(run.picked);showCounts(run.picked);prompt();
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
  const inDrawer=kind==='cardDrawer';
  modal(title,deviceInstructions(inDrawer?'출입 패드에 꽂을 카드를 한 장 고르세요.':puzzle.instructions)+
    '<div id="deviceSurface"></div>',inDrawer?'card-drawer':'ct-device');
  const host=byId('deviceSurface');
  CTDeviceUI.open(kind,run.device,host,{
    save,solve,record:logPlay,hasSample:run.found.includes('printSamples'),
    walkToDevice:id=>{close();world.inspectTarget(id)},
    active:()=>dialog.open&&!countdown.check(),
    update:()=>{
      world.setDigits(deviceEntry());
      if(inDrawer&&run.device.card)byId('bag').hidden=false;
    }
  },command);
}
function inspectLock(command){
  if(run.solved||!countdown||countdown.check())return;
  if(room.kind==='music'){MusicClock.dial();return}
  if(puzzle.control==='device')devicePanel(room.kind,puzzle.title,command);
  else if(puzzle.control==='pin')sportsPinPanel();
  else shelfPanel();
  if(!run.solved)appendRoomTextHint(content,countdown,puzzle.hint);
}

function directory(){
  if(story){
    modal('학교 안내도','','map');
    renderSchoolMap(content,{position:room.kind});
    const menu=document.createElement('nav');
    menu.className='lesson-access';menu.setAttribute('aria-label','게임과 수업');
    function link(label,href){
      const a=document.createElement('a');a.href=href;a.textContent=label;menu.append(a);
    }
    if(SchoolRecords.lesson){
      const student=SchoolRecords.context();
      const name=document.createElement('span');name.textContent=student.label+' · '+student.seat+'번';menu.append(name);
    }else{
      link('학급 코드로 참여','join.html');
      link('교사용 대시보드','teacher.html');
    }
    if(schoolEscapeTimer(readSchoolBook(SCHOOL_PREVIOUS_KEY))){
      link('지난 게임 설문',SchoolRecords.lesson?'survey.html?lesson=1&previous=1':'survey.html?solo=1&previous=1');
    }
    content.append(menu);
    action(actions(),'처음부터 다시 시작',()=>{
      if(window.confirm('우리 반 교실에서 다시 시작할까요? 지금 풀던 게임의 진행은 지워져요.'))retrySchool();
    });
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
    if(story){
      const progress=book();
      if(!progress.surveyTimeoutRoom&&schoolEscapeTimer(progress)?.startedAt===attempt){
        progress.surveyTimeoutRoom=room.kind;
        writeSchoolBook(bookKey,progress);
      }
      action(content.querySelector('.actions'),'학생 설문',openSurvey);
    }
  }});
  const canPlay=!countdown.check();
  if(canPlay&&!run.solved)logPlay('enter');
  return canPlay;
}
function mandatoryDialog(){return dialog.dataset.panel==='timeout'}

async function start(){
  if(room.kind==='classroom'&&params.has('review')&&SchoolRecords.lesson){
    location.replace(recoveryRoomLink(RECOVERY_ROOMS[0],false));return;
  }
  if(SchoolRecords.lesson&&!SchoolRecords.storyKey){location.replace('join.html');return}
  if(story&&room.kind==='classroom'){
    try{
      await enterSchool({restart:params.get('restart')==='1',keepResult:params.get('school')==='1'||!!history.state?.schoolAttempt});
    }catch(error){
      modal('게임을 시작하지 못했어요.','','error');
      const reason=document.createElement('p');reason.textContent=error.message;content.append(reason);
      action(actions(),'다시 열기',()=>location.reload(),true);
      return;
    }
    const address=new URL(location.href);
    address.searchParams.delete('restart');
    history.replaceState({...history.state,schoolAttempt:schoolEscapeTimer(book()).startedAt},'',address.href);
  }
  const progress=book(),plan=schoolEscapeTimer(progress)&&schoolRoute(progress);
  let updated=false;
  if(story){
    if(!plan){location.replace(schoolStartLink());return}
    const destination=schoolRoomToPlay(progress,plan);
    if(destination.kind!==room.kind){
      location.replace(recoveryRoomLink(destination,true));
      return;
    }
    if(plan.path[plan.step]!==room.kind){
      progress.route={...plan,step:plan.path.indexOf(room.kind)};
      progress.room=room.n;
      updated=true;
    }
  }
  const saved=freshSportsVisit?null:progress.visits[room.n]?.restoration;
  const outdated=saved?.revision!==puzzle.revision;
  restoreRun(saved,outdated);
  if(freshSportsVisit)history.replaceState({...history.state,sportsVisit:true},'');
  if(outdated&&!run.solved){
    progress.visits[room.n]={restoration:run};
    updated=true;
  }
  if(updated)writeSchoolBook(bookKey,progress);
  byId('dismiss').onclick=close;byId('bag').onclick=inventory;byId('map').onclick=directory;
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
    const command=['mixer','shelf','ball-locker','card-drawer'].includes(dialog.dataset.panel)&&world.commandAt?.(event.clientX,event.clientY);
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
      else if(id==='cardDrawer')devicePanel(id,'책상 서랍');
      else if(id==='ballLine')ballLockerPanel();
      else if(id==='doorGuide')modal(puzzle.doorTitle??(room.place+' 탈출'),deviceInstructions(),'door-question');
      else inspectClue(id,command);
    }
  }).then(created=>{
    world=created;resetWorld();byId('bag').hidden=!run.found.length&&!(room.kind==='computer'&&run.device.card);
    if(beginTimer()&&run.solved){
      if(story||history.state?.clearedReviewRoom===room.kind)showExit();
      else restart();
    }
  }).catch(error=>{
    console.error(error);
    modal('교실을 열지 못했어요.','','error');
    action(actions(),'다시 열기',()=>location.reload(),true);
  });
}
start();
