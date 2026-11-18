'use strict';

const SCHOOL_POINTS = {
  classroom:{col:0,row:1,label:'5-2',color:'#3067d6'},
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

function schoolNeighbors(id) {
  const neighbors=[];
  for(const [a,b,blocked] of SCHOOL_PASSAGES){
    if(blocked)continue;
    if(id===a)neighbors.push(b);
    if(id===b)neighbors.push(a);
  }
  return neighbors;
}

function schoolDistance(from,to) {
  const queue=[from],distances=new Map([[from,0]]);
  for(let i=0;i<queue.length;i++){
    const point=queue[i],distance=distances.get(point);
    if(point===to)return distance;
    for(const next of schoolNeighbors(point)){
      if(distances.has(next))continue;
      distances.set(next,distance+1);
      queue.push(next);
    }
  }
  return Infinity;
}

function isSchoolStop(id) {
  return !!SCHOOL_POINTS[id]?.color&&id!=='classroom'&&id!=='computer';
}

function schoolRouteMinimum(stop) {
  return stop?schoolDistance('classroom',stop)+schoolDistance(stop,'computer'):
    schoolDistance('classroom','computer');
}

function validSchoolPath(path,stop) {
  return Array.isArray(path)&&path[0]==='classroom'&&path.at(-1)==='computer'&&
    (!stop||(isSchoolStop(stop)&&path.includes(stop)))&&
    path.length-1===schoolRouteMinimum(stop)&&
    path.slice(1).every((point,i)=>schoolNeighbors(path[i]).includes(point));
}

function schoolRoute(book) {
  const plan=book.route;
  return plan&&Number.isInteger(plan.step)&&plan.step>=0&&validSchoolPath(plan.path,plan.stop)&&
    plan.step<plan.path.length?plan:null;
}

function canEnterSchoolRoom(book,kind) {
  const plan=schoolRoute(book);
  if(!plan||!roomRestored(book,RECOVERY_ROOMS[0])||plan.path[plan.step]!==kind)return false;
  if(kind==='computer'){
    return !plan.stop||roomRestored(book,RECOVERY_ROOMS.find(room=>room.kind===plan.stop));
  }
  return kind===plan.stop;
}
