'use strict';

const SCHOOL_POINTS = {
  classroom:{col:0,row:1,label:'우리 반 교실',color:'#3067d6'},
  west:{col:1,row:1,label:'A'},
  center:{col:2,row:1,label:'B'},
  east:{col:3,row:1,label:'C'},
  computer:{col:4,row:1,label:'컴퓨터실',color:'#3067d6'},
  library:{col:1,row:0,label:'도서실',color:'#e9ad22'},
  music:{col:2,row:0,label:'음악실',color:'#4b72ce'},
  art:{col:3,row:0,label:'미술실',color:'#e76352'},
  broadcast:{col:1,row:2,label:'방송실',color:'#e65350'},
  science:{col:2,row:2,label:'과학실',color:'#12a9a9'},
  sports:{col:3,row:2,label:'체육 준비실',color:'#e98c29'}
};

const SCHOOL_PASSAGES = [
  ['classroom','west'],['west','center'],['center','east'],['east','computer'],
  ['west','library'],['library','music'],['music','art'],['art','east'],
  ['west','broadcast'],['broadcast','science'],['science','sports'],['sports','east'],
  ['center','science'],['center','music',true]
];
const SCHOOL_MIN_STOPS = 3;

function schoolNeighbors(id) {
  const neighbors=[];
  for(const [a,b,blocked] of SCHOOL_PASSAGES){
    if(blocked)continue;
    if(id===a)neighbors.push(b);
    if(id===b)neighbors.push(a);
  }
  return neighbors;
}

function isSchoolStop(id) {
  return typeof id==='string'&&!!SCHOOL_POINTS[id]?.color&&id!=='classroom'&&id!=='computer';
}

function validSchoolStops(stops) {
  return Array.isArray(stops)&&stops.length>=SCHOOL_MIN_STOPS&&
    stops.every(isSchoolStop)&&new Set(stops).size===stops.length;
}

function planSchoolRoute(stops) {
  if(!validSchoolStops(stops))return null;
  const bits=new Map(stops.map((id,i)=>[id,1<<i]));
  const allVisited=(1<<stops.length)-1;
  const queue=[{point:'classroom',visited:0,previous:null}];
  const seen=new Set(['classroom:0']);
  // A junction can be visited again after a new classroom has been reached.
  for(let i=0;i<queue.length;i++){
    const state=queue[i];
    if(state.point==='computer'){
      const path=[];
      for(let edge=state;edge;edge=edge.previous)path.push(edge.point);
      path.reverse();
      return {path,stops:[...new Set(path.filter(id=>bits.has(id)))],step:0};
    }
    for(const point of schoolNeighbors(state.point)){
      const visited=state.visited|(bits.get(point)??0);
      const key=point+':'+visited;
      if(seen.has(key)||point==='classroom'||(point==='computer'&&visited!==allVisited))continue;
      seen.add(key);
      queue.push({point,visited,previous:state});
    }
  }
  return null;
}

function schoolRoute(book) {
  const plan=book.route;
  if(!plan||!validSchoolStops(plan.stops)||!Array.isArray(plan.path)||
    !Number.isInteger(plan.step)||plan.step<0||plan.step>=plan.path.length)return null;
  if(plan.path[0]!=='classroom'||plan.path.at(-1)!=='computer'||
    plan.path.slice(1,-1).some(id=>id==='classroom'||id==='computer')||
    !plan.path.slice(1).every((point,i)=>schoolNeighbors(plan.path[i]).includes(point)))return null;
  const ordered=[...new Set(plan.path.filter(id=>plan.stops.includes(id)))];
  return plan.stops.every((id,i)=>id===ordered[i])?plan:null;
}

function schoolRoomToPlay(book,plan=schoolRoute(book)) {
  const classroom=RECOVERY_ROOMS[0];
  if(!plan||!roomRestored(book,classroom))return classroom;
  for(const kind of plan.stops){
    const room=RECOVERY_ROOMS.find(item=>item.kind===kind);
    if(!roomRestored(book,room))return room;
  }
  return RECOVERY_ROOMS.find(room=>room.kind==='computer');
}
