'use strict';

const SCHOOL_ROOM_ESTIMATES={
  classroom:60,library:75,music:95,art:105,broadcast:100,science:110,sports:120,computer:90
};

function buildSchoolFloorPlan({position,onSelect}={}){
  const map=document.createElement('div');
  map.className='school-floorplan';
  map.setAttribute('role','group');
  map.setAttribute('aria-label',onSelect?'들를 교실을 고르는 배치도':'학교 복도 배치도');

  const layouts=[
    {name:'wide',along:[10.5,30,50,70,89.5],hall:[32,50,68],room:[16.5,50,83.5]},
    {name:'narrow',along:[11.5,30.5,50,69.5,88.5],hall:[34.6,50,65.4],room:[18.2,50,81.8]}
  ];
  const point=(id,layout,room=false)=>{
    const {col,row}=SCHOOL_POINTS[id];
    const across=(room?layout.room:layout.hall)[row],along=layout.along[col];
    return layout.name==='wide'?[along,across]:[across,along];
  };
  const svgNS='http://www.w3.org/2000/svg';
  function mapPath(svg,className,d=''){
    const mark=document.createElementNS(svgNS,'path');
    mark.setAttribute('class',className);
    mark.setAttribute('d',d);
    svg.append(mark);
    return mark;
  }

  const passages=SCHOOL_PASSAGES.filter(([, , blocked])=>!blocked);
  const roomIds=Object.keys(SCHOOL_POINTS).filter(id=>SCHOOL_POINTS[id].color);
  const paths=layouts.map(layout=>{
    const svg=document.createElementNS(svgNS,'svg');
    svg.setAttribute('viewBox','0 0 100 100');
    svg.setAttribute('preserveAspectRatio','none');
    svg.setAttribute('class','floorplan-lines '+layout.name);
    svg.setAttribute('aria-hidden','true');
    const line=(a,b)=>'M '+a.join(' ')+' L '+b.join(' ');
    const corridor=passages.map(([a,b])=>line(point(a,layout),point(b,layout))).join(' ');
    const doorway=id=>line(point(id,layout),point(id,layout,true));
    mapPath(svg,'floorplan-wall',corridor);
    mapPath(svg,'floorplan-hall',corridor);
    mapPath(svg,'floorplan-entrance',roomIds.filter(id=>isSchoolStop(id)).map(doorway).join(' '));
    const route=mapPath(svg,'floorplan-route'),roomRoute=mapPath(svg,'floorplan-route');
    map.append(svg);
    return {layout,route,roomRoute,doorway};
  });

  function place(node,id,room=false){
    for(const layout of layouts){
      const [x,y]=point(id,layout,room);
      node.style.setProperty('--'+layout.name+'-x',x+'%');
      node.style.setProperty('--'+layout.name+'-y',y+'%');
    }
  }
  const rooms=new Map();
  for(const id of roomIds){
    const room=SCHOOL_POINTS[id];
    const isStop=isSchoolStop(id);
    const marker=document.createElement(onSelect&&isStop?'button':'div');
    marker.className='floorplan-room';
    if(onSelect&&isStop){
      marker.type='button';
      marker.onclick=()=>onSelect(id);
    }
    if(isStop)marker.dataset.wing=room.row===0?'north':'south';
    else marker.dataset.endpoint=id==='classroom'?'start':'end';

    const title=document.createElement('span');
    title.className='floorplan-room-name';
    title.textContent=room.label;
    const time=document.createElement('span');
    time.className='floorplan-room-time';
    const seconds=SCHOOL_ROOM_ESTIMATES[id],remainder=seconds%60;
    time.textContent='약 '+Math.floor(seconds/60)+'분'+(remainder?' '+remainder+'초':'');
    const rank=document.createElement('span');
    rank.className='floorplan-rank';
    rank.setAttribute('aria-hidden','true');

    if(!isStop){
      const sign=document.createElement('span');
      sign.className='floorplan-endpoint';
      sign.textContent=id==='classroom'?'출발':'도착';
      marker.append(sign);
    }
    marker.append(title,time,rank);
    if(isStop){
      const door=document.createElementNS(svgNS,'svg');
      door.setAttribute('class','floorplan-door');
      door.setAttribute('viewBox','0 0 12 12');
      door.setAttribute('aria-hidden','true');
      mapPath(door,'floorplan-door-swing','M 1 1 V 10 A 9 9 0 0 0 10 1');
      marker.append(door);
    }

    if(position===id)marker.setAttribute('aria-current','location');
    place(marker,id,true);
    map.append(marker);
    rooms.set(id,{marker,rank});
  }

  if(position&&!rooms.has(position)){
    const pin=document.createElement('span');
    pin.className='floorplan-position';
    pin.setAttribute('aria-hidden','true');
    place(pin,position);
    map.append(pin);
  }

  function update(plan,chosen){
    for(const [id,{marker,rank}] of rooms){
      if(!isSchoolStop(id))continue;
      const visit=plan?.stops.indexOf(id)??-1;
      const pressed=chosen.has(id);
      marker.dataset.chosen=String(pressed);
      if(onSelect)marker.setAttribute('aria-pressed',String(pressed));
      rank.textContent=visit>=0?String(visit+1):'';
      if(visit>=0)marker.setAttribute('aria-description',(visit+1)+'번째 방문');
      else marker.removeAttribute('aria-description');
    }

    for(const {layout,route,roomRoute,doorway} of paths){
      const coords=plan?.path.map(id=>point(id,layout).join(' '))??[];
      route.setAttribute('d',coords.length?'M '+coords.join(' L '):'');
      roomRoute.setAttribute('d',plan?.stops.map(doorway).join(' ')??'');
    }
  }

  return {map,update};
}

function schoolVisitOrder(){
  const list=document.createElement('ol');
  list.className='floorplan-itinerary';
  list.setAttribute('aria-label','방문 순서');
  return list;
}

function updateSchoolVisitOrder(list,plan){
  list.hidden=!plan;
  const visits=plan?['classroom',...plan.stops,'computer']:[];
  list.replaceChildren(...visits.map(id=>{
    const item=document.createElement('li');
    item.textContent=SCHOOL_POINTS[id].label;
    return item;
  }));
}

function renderSchoolMap(host,{plan,position=plan?.path[plan.step]}={}){
  const {map,update}=buildSchoolFloorPlan({position});
  if(position){
    const status=document.createElement('p');
    status.className='floorplan-location';
    const place=SCHOOL_POINTS[position];
    status.textContent='지금 위치 '+(place.color?place.label:'복도');
    host.append(status);
  }
  const order=schoolVisitOrder();
  update(plan,new Set(plan?.stops));
  updateSchoolVisitOrder(order,plan);
  host.append(map,order);
}

function renderSchoolRoutePicker(host,{heading,onStart}){
  const selected=new Set();
  let plan;
  heading.textContent='교실 배치도';
  heading.tabIndex=-1;
  const overview=document.createElement('div');
  overview.className='floorplan-overview';
  const story=document.createElement('span');
  story.textContent='멈춘 출입 시스템을 고치러 컴퓨터실로 가요.';
  const time=document.createElement('span');
  time.className='floorplan-limit';
  time.textContent='제한 시간 '+SCHOOL_ESCAPE_DURATION/60_000+'분';
  overview.append(story,time);

  const {map,update}=buildSchoolFloorPlan({onSelect:id=>{
    if(selected.has(id))selected.delete(id);
    else selected.add(id);
    refresh();
  }});
  const result=document.createElement('div');
  result.className='floorplan-result';
  result.setAttribute('aria-live','polite');
  result.setAttribute('aria-atomic','true');
  const notice=document.createElement('p');
  notice.id='schoolStopNotice';
  notice.className='floorplan-notice';
  notice.textContent='교실을 '+SCHOOL_MIN_STOPS+'개 이상 선택하세요.';
  const order=schoolVisitOrder();
  result.append(notice,order);

  const error=document.createElement('p');
  error.className='floorplan-notice';
  error.hidden=true;
  error.setAttribute('role','alert');
  const controls=document.createElement('div');
  controls.className='map-controls';
  const reset=document.createElement('button'),confirm=document.createElement('button');
  reset.type=confirm.type='button';
  reset.textContent='다시 고르기';
  confirm.className='primary';
  confirm.textContent='이 길로 출발';
  reset.onclick=()=>{
    selected.clear();
    refresh();
    map.querySelector('button').focus({preventScroll:true});
  };
  confirm.onclick=()=>{
    if(plan&&onStart(plan)===false){
      error.textContent='진행을 저장할 수 없어요. 브라우저 설정을 확인해 주세요.';
      error.hidden=false;
    }
  };
  controls.append(reset,confirm);

  function refresh(){
    plan=planSchoolRoute([...selected]);
    notice.hidden=!!plan;
    if(plan)map.removeAttribute('aria-describedby');
    else map.setAttribute('aria-describedby',notice.id);
    error.hidden=true;
    update(plan,selected);
    updateSchoolVisitOrder(order,plan);
    reset.disabled=!selected.size;
    confirm.disabled=!plan;
  }

  const scrollArea=document.createElement('div');
  scrollArea.className='route-scroll';
  scrollArea.append(overview,map,result,error);
  host.replaceChildren(scrollArea,controls);
  refresh();
  heading.focus({preventScroll:true});
}
