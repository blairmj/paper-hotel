'use strict';

function schoolPointLabel(id){
  const {label,color,col}=SCHOOL_POINTS[id];
  return color?label:['왼쪽','가운데','오른쪽'][col-1]+' 갈림길';
}

function renderSchoolMap(host,{plan,position=plan?.path[plan.step],preview=false}={}){
  const path=plan?.path??[],stops=plan?.stops??[];
  const coordinates=id=>{
    const {col,row}=SCHOOL_POINTS[id];
    return [10+20*col,16+34*row];
  };

  if(position&&!preview){
    const status=document.createElement('p');
    status.className='map-prompt';
    status.textContent='지금 위치 '+schoolPointLabel(position);
    host.append(status);
  }
  const map=document.createElement('div');
  map.className='school-map';
  map.setAttribute('role','group');
  map.setAttribute('aria-label','복도 안내도');
  for(const [a,b,blocked] of SCHOOL_PASSAGES){
    const [x1,y1]=coordinates(a),[x2,y2]=coordinates(b);
    const line=document.createElement('span');
    line.className='map-passage '+(x1===x2?'vertical':'horizontal');
    line.style.left=Math.min(x1,x2)+'%';line.style.top=Math.min(y1,y2)+'%';
    line.style.setProperty('--length',Math.max(Math.abs(x2-x1),Math.abs(y2-y1))+'%');
    line.classList.toggle('on-path',path.slice(1).some((point,i)=>
      (point===a&&path[i]===b)||(point===b&&path[i]===a)));
    if(blocked){
      line.classList.add('blocked');
      const cross=document.createElement('span');
      cross.textContent='×';
      line.append(cross);
    }
    line.setAttribute('aria-hidden','true');
    map.append(line);
  }

  for(const [id,point] of Object.entries(SCHOOL_POINTS)){
    const marker=document.createElement('span');
    marker.className=point.color?'map-node map-room':'map-node map-junction';
    const visit=stops.indexOf(id);
    const tag=id==='classroom'?'출발':id==='computer'?'도착':visit>=0?(visit+1)+'번째':'';
    if(tag){
      const note=document.createElement('span');
      note.className='map-node-note';note.textContent=tag;
      marker.append(note);
    }
    const name=document.createElement('span');
    name.textContent=point.color?point.label:'갈림길';
    marker.append(name);
    if(point.color)marker.style.setProperty('--room-color',point.color);
    const [x,y]=coordinates(id);
    marker.style.left=x+'%';marker.style.top=y+'%';
    marker.classList.toggle('on-path',path.includes(id));
    marker.classList.toggle('target-stop',visit>=0);
    marker.classList.toggle('current-point',position===id);
    if(position===id&&!preview)marker.setAttribute('aria-current','location');
    map.append(marker);
  }

  const legend=document.createElement('div');
  legend.className='map-legend';
  legend.innerHTML='<span class="map-key"><span aria-hidden="true">×</span>막힌 복도</span>';
  if(plan)legend.insertAdjacentHTML('beforeend','<span class="map-key-pick"><span aria-hidden="true"></span>이동 경로</span>');
  host.append(map,legend);

  if(plan){
    const order=document.createElement('ol');
    order.className='map-itinerary';
    order.setAttribute('aria-label','방문 순서');
    for(const id of ['classroom',...stops,'computer']){
      const item=document.createElement('li');
      item.textContent=SCHOOL_POINTS[id].label;
      order.append(item);
    }
    host.append(order);
  }
}

function renderSchoolRoutePicker(host,{heading,onStart}){
  const selected=new Set();
  heading.tabIndex=-1;
  function button(label,onClick,primary=false){
    const element=document.createElement('button');
    element.type='button';element.textContent=label;element.onclick=onClick;
    if(primary)element.className='primary';
    return element;
  }
  function choose(){
    heading.textContent='들를 교실 고르기';
    const story=document.createElement('p');
    story.textContent='학교 출입 시스템이 멈췄어요. 컴퓨터실에서 고칠 수 있어요.';
    const choices=document.createElement('div');
    choices.className='map-room-choices';
    choices.setAttribute('role','group');
    choices.setAttribute('aria-label','들를 교실');
    choices.setAttribute('aria-describedby','schoolStopNotice');
    const notice=document.createElement('p');
    notice.id='schoolStopNotice';notice.className='map-selection-note';
    notice.textContent='교실을 '+SCHOOL_MIN_STOPS+'개 이상 선택하세요.';
    const controls=document.createElement('div');
    controls.className='map-controls';
    const next=button('경로 보기',()=>{
      const plan=planSchoolRoute([...selected]);
      if(plan)preview(plan);
    },true);

    function refresh(){
      next.disabled=selected.size<SCHOOL_MIN_STOPS;
      notice.dataset.required=String(next.disabled);
    }
    for(const [id,{label,color}] of Object.entries(SCHOOL_POINTS)){
      if(!isSchoolStop(id))continue;
      const pick=button(label,()=>{
        if(selected.has(id))selected.delete(id);
        else selected.add(id);
        pick.setAttribute('aria-pressed',String(selected.has(id)));
        refresh();
      });
      pick.style.setProperty('--room-color',color);
      pick.setAttribute('aria-pressed',String(selected.has(id)));
      choices.append(pick);
    }
    controls.append(next);
    refresh();
    host.replaceChildren(story,choices,notice,controls);
    heading.focus({preventScroll:true});
  }

  function preview(plan){
    heading.textContent='컴퓨터실까지 갈 길';
    host.replaceChildren();
    renderSchoolMap(host,{plan,preview:true});
    const time=document.createElement('p');
    time.className='map-start-time';
    time.textContent='출발하면 '+(SCHOOL_ESCAPE_DURATION/60_000)+'분 안에 탈출해야 해요.';
    const feedback=document.createElement('p');
    feedback.className='map-selection-note';
    feedback.setAttribute('role','alert');
    feedback.hidden=true;
    const controls=document.createElement('div');
    controls.className='map-controls';
    controls.append(button('교실 다시 고르기',choose),button('이 길로 출발',()=>{
      if(onStart(plan)===false){
        feedback.textContent='진행을 저장할 수 없어요. 브라우저 설정을 확인해 주세요.';
        feedback.hidden=false;
      }
    },true));
    host.append(time,feedback,controls);
    heading.focus({preventScroll:true});
  }

  choose();
}
