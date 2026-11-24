'use strict';

function renderSchoolMap(host,{position}={}){
  const route=document.createElement('ol');
  route.className='school-route-plan';
  route.setAttribute('aria-label','교실 방문 순서');
  for(const [i,room] of RECOVERY_ROOMS.entries()){
    const stop=document.createElement('li');
    if(room.kind===position)stop.setAttribute('aria-current','location');
    const label=document.createElement('small');
    const marker=room.kind===position?'현재 위치':i===0?'출발':i===RECOVERY_ROOMS.length-1?'도착':'';
    label.textContent=String(i+1)+(marker?' · '+marker:'');
    const name=document.createElement('strong');
    name.textContent=room.place;
    stop.append(label,name);route.append(stop);
  }
  host.append(route);
}
