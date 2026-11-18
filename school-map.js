'use strict';

function renderSchoolMap(host,{plan,onStart,position=plan?.path[plan.step]}={}){
  let stop=plan?.stop??null,path=plan?.path.slice()??['classroom'],choosing=!!onStart;
  const coordinates=id=>{
    const {col,row}=SCHOOL_POINTS[id];
    return [10+20*col,16+34*row];
  };
  const label=id=>SCHOOL_POINTS[id].color?SCHOOL_POINTS[id].label:'갈림길 '+SCHOOL_POINTS[id].label;
  const status=document.createElement('p');
  status.className='map-prompt';
  status.setAttribute('role','status');
  const map=document.createElement('div');
  map.className='school-map';
  map.setAttribute('role','group');
  map.setAttribute('aria-label','복도 안내도');
  const passages=SCHOOL_PASSAGES.map(([a,b,blocked])=>{
    const [x1,y1]=coordinates(a),[x2,y2]=coordinates(b);
    const line=document.createElement('span');
    line.className='map-passage '+(x1===x2?'vertical':'horizontal');
    line.style.left=Math.min(x1,x2)+'%';line.style.top=Math.min(y1,y2)+'%';
    line.style.setProperty('--length',Math.max(Math.abs(x2-x1),Math.abs(y2-y1))+'%');
    line.classList.toggle('blocked',!!blocked);
    if(blocked)line.textContent='×';
    line.setAttribute('aria-hidden','true');map.append(line);
    return {a,b,line};
  });
  const fields=new Map();
  for(const [id,point] of Object.entries(SCHOOL_POINTS)){
    const marker=document.createElement(onStart?'button':'span');
    if(onStart){marker.type='button';marker.onclick=()=>selectPoint(id)}
    marker.className=point.color?'map-node map-room':'map-node map-junction';
    marker.textContent=point.label;
    marker.setAttribute('aria-label',label(id));
    if(point.color)marker.style.setProperty('--room-color',point.color);
    const [x,y]=coordinates(id);
    marker.style.left=x+'%';marker.style.top=y+'%';
    map.append(marker);fields.set(id,marker);
  }
  const legend=document.createElement('p');
  legend.className='map-legend';legend.textContent='선 하나 = 1구간  ·  × 통행 금지';
  host.append(status,map,legend);
  let undo,confirm,chooseAgain;
  if(onStart){
    const controls=document.createElement('div');
    controls.className='map-controls';
    const button=(text,fn)=> {
      const element=document.createElement('button');
      element.type='button';element.textContent=text;element.onclick=fn;
      controls.append(element);
      return element;
    };
    chooseAgain=button('들를 곳 다시 고르기',()=>{
      stop=null;path=['classroom'];choosing=true;draw();fields.get('library').focus();
    });
    undo=button('한 구간 지우기',()=>{
      path.pop();draw();
      const next=schoolNeighbors(path.at(-1))[0];
      fields.get(next)?.focus();
    });
    confirm=button('이 길로 출발',()=>{
      if(stop&&!path.includes(stop)){draw(label(stop)+'을 거치는 길을 골라 주세요.');return}
      if(!validSchoolPath(path,stop)){draw('더 짧은 길이 있습니다. 안내도를 한번 더 확인해 보세요.');return}
      onStart({stop,path:path.slice(),step:0});
    });
    confirm.className='primary';
    host.append(controls);
  }
  function selectPoint(id){
    if(choosing){
      stop=id==='computer'?null:id;
      choosing=false;draw();
      fields.get('west').focus();
      return;
    }
    if(!schoolNeighbors(path.at(-1)).includes(id)||path.at(-1)==='computer')return;
    path.push(id);draw();
    if(id==='computer')confirm.focus();
    else fields.get(schoolNeighbors(id).find(next=>next!==path.at(-2)))?.focus();
  }
  function draw(message){
    const end=path.at(-1),here=onStart?end:position;
    for(const [id,marker] of fields){
      marker.classList.toggle('on-path',path.includes(id));
      marker.classList.toggle('target-stop',stop===id);
      marker.classList.toggle('current-point',here===id);
      if(here===id)marker.setAttribute('aria-current','location');
      else marker.removeAttribute('aria-current');
      if(onStart)marker.disabled=choosing?!(isSchoolStop(id)||id==='computer'):
        end==='computer'||!schoolNeighbors(end).includes(id);
    }
    for(const {a,b,line} of passages)line.classList.toggle('on-path',
      path.slice(1).some((point,i)=>point===a&&path[i]===b||point===b&&path[i]===a));
    if(onStart){
      chooseAgain.hidden=choosing;undo.hidden=choosing;undo.disabled=path.length===1;
      confirm.hidden=choosing;confirm.disabled=end!=='computer';
    }
    status.textContent=message??(choosing?'들를 교실을 고르세요. 컴퓨터실을 누르면 바로 갑니다.':
      onStart?(stop?label(stop)+'을 거쳐 ':'')+'컴퓨터실까지 연결하세요. · '+(path.length-1)+'구간':
      (stop?label(stop)+' 경유':'컴퓨터실로 바로')+' · '+(path.length-1)+'구간');
  }
  draw();
}
