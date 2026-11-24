'use strict';

function renderSchoolMap(host,{position}={}){
  const route=document.createElement('ol');
  route.className='school-route-plan';
  route.setAttribute('aria-label','교실 방문 순서');
  for(const [i,room] of RECOVERY_ROOMS.entries()){
    const stop=document.createElement('li');
    if(room.kind===position)stop.setAttribute('aria-current','location');
    const label=document.createElement('small');
    label.textContent=i===0?'출발':i===RECOVERY_ROOMS.length-1?'도착':String(i);
    const name=document.createElement('strong');
    name.textContent=room.place;
    stop.append(label,name);route.append(stop);
  }
  host.append(route);
}

function renderSchoolStart(host,onStart){
  const info=document.createElement('p');
  info.textContent='학교 출입 시스템이 멈췄어요. 10분 안에 교실의 문을 열고 컴퓨터실까지 가세요.';
  const identity=document.createElement('p');
  identity.className='lesson-identity';
  if(SchoolRecords.lesson){
    const student=SchoolRecords.context();
    identity.textContent=student.label+' · '+student.seat+'번';
  }else identity.hidden=true;
  host.append(info,identity);
  renderSchoolMap(host,{position:'classroom'});
  const error=document.createElement('p');
  error.hidden=true;error.setAttribute('role','alert');
  const actions=document.createElement('div');actions.className='map-controls';
  const start=document.createElement('button');
  start.type='button';start.className='primary';start.textContent='시작하기';
  start.onclick=async()=>{
    if(start.disabled)return;
    start.disabled=true;error.hidden=true;
    try{if(await onStart(fixedSchoolRoute())===false)throw Error('진행을 저장할 수 없어요. 다시 시도해 주세요.')}
    catch(e){error.textContent=e.message;error.hidden=false}
    finally{start.disabled=false}
  };
  actions.append(start);host.append(error,actions);
  if(!SchoolRecords.lesson){
    const links=document.createElement('div');links.className='lesson-access';
    for(const [href,text] of [['join.html','학급 코드로 참여'],['teacher.html','교사용 대시보드']]){
      const link=document.createElement('a');link.href=href;link.textContent=text;links.append(link);
    }
    host.append(links);
  }
}
