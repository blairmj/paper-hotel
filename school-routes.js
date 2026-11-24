'use strict';

function fixedSchoolRoute(){
  const path=RECOVERY_ROOMS.map(room=>room.kind);
  return {version:2,path,stops:path.slice(1,-1),step:0};
}

function schoolRoute(book){
  const route=book.route;
  if(route?.version!==2||!Array.isArray(route.path)||!Array.isArray(route.stops))return null;
  const fixed=fixedSchoolRoute();
  if(route.path.length!==fixed.path.length||!fixed.path.every((kind,i)=>route.path[i]===kind)||
    route.stops.length!==fixed.stops.length||!fixed.stops.every((kind,i)=>route.stops[i]===kind))return null;
  return {...fixed,step:Math.max(0,Math.min(fixed.path.length-1,Number.isInteger(route.step)?route.step:0))};
}

function schoolRoomToPlay(book,plan=schoolRoute(book)){
  if(!plan)return RECOVERY_ROOMS[0];
  return RECOVERY_ROOMS.find(room=>!roomRestored(book,room))??RECOVERY_ROOMS.at(-1);
}

function schoolEntryProgress(book,now=Date.now()){
  const timer=schoolEscapeTimer(book),plan=schoolRoute(book);
  if(!timer||!plan)return {status:'new'};
  const room=schoolRoomToPlay(book,plan);
  const completed=timer.stopped&&roomRestored(book,RECOVERY_ROOMS.at(-1));
  const status=completed?'complete':timer.deadline<=now?'expired':'active';
  return {status,room,plan,startedAt:timer.startedAt};
}
