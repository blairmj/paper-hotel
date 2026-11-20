'use strict';

function renderSchoolMap(host,{plan,onStart,position=plan?.path[plan.step]}={}){
  let stop=plan?.stop??null,path=plan?.path.slice()??['classroom'],choosing=!!onStart&&!plan;
  const coordinates=id=>{
    const {col,row}=SCHOOL_POINTS[id];
    return [10+20*col,16+34*row];
  };
  const label=id=>{
    const {label,color,col}=SCHOOL_POINTS[id];
    if(id==='classroom')return '5-2 교실';
    return color?label:['왼쪽','가운데','오른쪽'][col-1]+' 갈림길';
  };
  const status=document.createElement('p');
  status.className='map-prompt';
  status.setAttribute('role','status');
  status.tabIndex=-1;
  const instruction=document.createElement('p');
  instruction.className='map-instruction';
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
    if(blocked){
      const cross=document.createElement('span');
      cross.textContent='×';
      line.append(cross);
    }
    line.setAttribute('aria-hidden','true');map.append(line);
    return {a,b,line};
  });
  const fields=new Map();
  for(const [id,point] of Object.entries(SCHOOL_POINTS)){
    const marker=document.createElement(onStart?'button':'span');
    if(onStart){marker.type='button';marker.onclick=()=>selectPoint(id)}
    marker.className=point.color?'map-node map-room':'map-node map-junction';
    const name=document.createElement('span'),note=document.createElement('span');
    name.textContent=point.color?point.label:'갈림길';
    note.className='map-node-note';
    marker.append(note,name);
    if(point.color)marker.style.setProperty('--room-color',point.color);
    const [x,y]=coordinates(id);
    marker.style.left=x+'%';marker.style.top=y+'%';
    map.append(marker);fields.set(id,{marker,note});
  }
  const legend=document.createElement('div');
  legend.className='map-legend';
  legend.innerHTML='<span class="map-key"><span aria-hidden="true">×</span>막힌 복도</span>'+
    '<span class="map-key-pick"><span aria-hidden="true"></span>고른 길 <b class="map-count" aria-live="polite"></b></span>';
  const pathKey=legend.querySelector('.map-key-pick'),count=legend.querySelector('.map-count');
  host.append(status,instruction,map,legend);
  let undo,confirm,chooseAgain,skip;
  if(onStart){
    const controls=document.createElement('div');
    controls.className='map-controls';
    const button=(text,fn)=> {
      const element=document.createElement('button');
      element.type='button';element.textContent=text;element.onclick=fn;
      controls.append(element);
      return element;
    };
    skip=button('중간 교실에 들르지 않기',()=>beginRoute(null));
    skip.className='map-skip';
    chooseAgain=button('교실 다시 고르기',()=>{
      const previous=stop;
      stop=null;path=['classroom'];choosing=true;draw();
      if(previous)fields.get(previous).marker.focus({preventScroll:true});
      else skip.focus({preventScroll:true});
    });
    undo=button('한 칸 되돌리기',()=>{
      const removed=path.pop();
      draw();
      fields.get(removed).marker.focus({preventScroll:true});
    });
    confirm=button('이 길로 출발',()=>{
      onStart({stop,path:path.slice(),step:0});
    });
    confirm.className='primary';
    host.append(controls);
  }
  function beginRoute(room){
    stop=room;choosing=false;draw();
    fields.get(schoolNeighbors(path.at(-1))[0]).marker.focus({preventScroll:true});
  }
  function selectPoint(id){
    if(choosing){beginRoute(id);return}
    if(!schoolNeighbors(path.at(-1)).includes(id)||path.at(-1)==='computer')return;
    path.push(id);draw();
    (confirm.disabled?status:confirm).focus({preventScroll:true});
  }
  function draw(){
    const end=path.at(-1),here=onStart?end:position;
    const arrived=end==='computer',canStart=onStart&&arrived&&validSchoolPath(path,stop);
    const next=onStart&&!choosing&&!arrived?schoolNeighbors(end):[];
    for(const [id,{marker,note}] of fields){
      const tag=id==='classroom'?'출발':id==='computer'?'도착':stop===id?'들름':'';
      note.textContent=tag;
      note.hidden=!tag;
      marker.setAttribute('aria-label',tag?tag+' '+label(id):label(id));
      marker.classList.toggle('on-path',path.includes(id));
      marker.classList.toggle('target-stop',stop===id);
      marker.classList.toggle('current-point',here===id);
      marker.classList.toggle('next-point',next.includes(id));
      if(here===id)marker.setAttribute('aria-current',onStart?'step':'location');
      else marker.removeAttribute('aria-current');
      if(onStart)marker.disabled=choosing?!isSchoolStop(id):!next.includes(id);
    }
    for(const {a,b,line} of passages)line.classList.toggle('on-path',
      path.slice(1).some((point,i)=>point===a&&path[i]===b||point===b&&path[i]===a));
    pathKey.hidden=choosing||!onStart&&!plan;
    count.textContent=(path.length-1)+'칸';
    let message,help='';
    if(onStart){
      skip.hidden=!choosing;
      chooseAgain.hidden=choosing;undo.hidden=choosing;undo.disabled=path.length===1;
      confirm.hidden=choosing;confirm.disabled=!canStart;
      if(choosing){
        message='퍼즐을 풀 교실을 지도에서 하나 고르세요.';
      }else if(!arrived){
        message=stop?label(stop)+'을 거쳐 가장 짧은 길을 찾아보세요.':'컴퓨터실까지 가장 짧은 길을 찾아보세요.';
        help='파란 테두리의 다음 칸을 누르세요. 선 하나가 한 칸이에요.';
      }else if(canStart){
        message='가장 짧은 길을 찾았어요.';
      }else{
        message=stop&&!path.includes(stop)?label(stop)+'을 지나지 않았어요.':'더 짧은 길이 있어요.';
        help='한 칸 되돌려 길을 다시 이어 보세요.';
      }
    }else{
      message=here?'지금 위치 '+label(here):'학교 복도';
    }
    if(status.textContent!==message)status.textContent=message;
    instruction.textContent=help;instruction.hidden=!help;
  }
  draw();
  if(onStart)status.focus({preventScroll:true});
}
