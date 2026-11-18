'use strict';

const HALL_STEP=4.45,HALL_WIDTH=2.50,HALL_HEIGHT=2.90;
const hallPosition=id=>{
  const {col,row}=SCHOOL_POINTS[id];
  return {x:(col-2)*HALL_STEP,z:row*HALL_STEP};
};

function hallwayLayout(){
  const bands=(count,offset)=>Array.from({length:count*2-1},(_,i)=>{
    const center=(i/2-offset)*HALL_STEP;
    const half=(i%2?HALL_STEP-HALL_WIDTH:HALL_WIDTH)/2;
    return [center-half,center+half];
  });
  const xs=bands(5,2),zs=bands(3,0);
  const key=(col,row)=>col+','+row;
  const cells=new Map(Object.entries(SCHOOL_POINTS).map(([id,{col,row}])=>[key(2*col,2*row),id]));
  for(const [a,b,blocked] of SCHOOL_PASSAGES){
    if(blocked)continue;
    const p=SCHOOL_POINTS[a],q=SCHOOL_POINTS[b];
    cells.set(key(p.col+q.col,p.row+q.row),null);
  }
  const directions=[
    {dx:0,dz:-1,angle:0},
    {dx:1,dz:0,angle:-Math.PI/2},
    {dx:0,dz:1,angle:Math.PI},
    {dx:-1,dz:0,angle:Math.PI/2}
  ];
  const floors=[],walls=[],doors=[],obstacles=[];
  for(const [row,[front,back]] of zs.entries()){
    for(const [col,[left,right]] of xs.entries()){
      const id=cells.get(key(col,row));
      if(id===undefined){
        obstacles.push([left-.14,right+.14,front-.14,back+.14]);
        continue;
      }
      const x=(left+right)/2,z=(front+back)/2;
      floors.push({x,z,w:right-left,d:back-front});
      for(const {dx,dz,angle} of directions){
        if(cells.has(key(col+dx,row+dz)))continue;
        const point=SCHOOL_POINTS[id];
        const hasDoor=point?.color&&(
          id==='classroom'?dx===-1:id==='computer'?dx===1:dz===(point.row===0?-1:1));
        const wall={x:x+dx*(right-left)/2,z:z+dz*(back-front)/2,
          length:dx?back-front:right-left,angle,door:hasDoor?id:null,
          blocked:(id==='center'&&dz===-1)||(id==='music'&&dz===1)};
        walls.push(wall);
        if(hasDoor)doors.push({
          id,name:point.label+' 들어가기',rotationY:angle,approach:{x,z},
          xyz:[wall.x-dx*.048,1.36,wall.z-dz*.048],surface:{width:1.21,height:2.05}
        });
      }
    }
  }
  return {floors,walls,doors,obstacles,bounds:{
    left:xs[0][0]+.20,right:xs.at(-1)[1]-.20,front:zs[0][0]+.20,back:zs.at(-1)[1]-.20
  }};
}

function buildHallway(scene,layout,{canEnter,onWalk}){
  const {box,rounded,standard,patchPlane}=SchoolInterior;
  const wallPaint=standard('#fcfaff',.93),base=standard('#cdd9ed',.82);
  const rail=standard('#4d7ddd',.69),floor=standard('#e2e8ed',.86),ceiling=standard('#f3f5fb',.91);
  const lamp=new THREE.MeshBasicMaterial({color:'#fffdf6'});
  const metal=standard('#cbd5dd',.38,.25), closures=standard('#ea6859',.72);
  const hinges=new Map();
  const fill=new THREE.HemisphereLight('#fafdff','#aabae1',2.62);
  const key=new THREE.DirectionalLight('#fff9ec',1.05);key.position.set(-5,6,8);scene.add(fill,key);
  for(const point of layout.floors){
    const {x,z,w,d}=point;
    box(scene,w,.06,d,x,-.033,z,floor);
    box(scene,w,.06,d,x,HALL_HEIGHT+.03,z,ceiling);
    if(Math.abs(w-HALL_WIDTH)<.01&&Math.abs(d-HALL_WIDTH)<.01){
      rounded(scene,.52,.034,1.05,x,HALL_HEIGHT-.018,z,lamp,.012);
    }
  }
  for(const wall of layout.walls){
    const group=new THREE.Group();
    group.position.set(wall.x,0,wall.z);group.rotation.y=wall.angle;scene.add(group);
    const finish=(width,x)=>{
      box(group,width,HALL_HEIGHT,.10,x,HALL_HEIGHT/2,-.04,wallPaint);
      box(group,width,.075,.027,x,.038,.021,base);
      box(group,width,.19,.025,x,.93,.025,rail);
    };
    if(wall.door){
      const id=wall.door,point=SCHOOL_POINTS[id],w=1.26,h=2.18;
      const trim=standard(point.color,.74),doorPaint=standard(point.color,.65);
      finish((wall.length-w)/2,-(wall.length+w)/4);
      finish((wall.length-w)/2,(wall.length+w)/4);
      box(group,w,HALL_HEIGHT-h,.11,0,(HALL_HEIGHT+h)/2,-.04,wallPaint);
      box(group,w,.045,.88,0,-.024,-.46,floor);
      box(group,w,h,.10,0,h/2,-.88,wallPaint);
      for(const x of [-w/2,w/2]){
        box(group,.09,h,.12,x,h/2,0,trim);
        box(group,.06,h,.78,x,h/2,-.46,wallPaint);
      }
      box(group,w+.07,.075,.12,0,h,0,trim);
      const hinge=new THREE.Group();hinge.position.set(w/2-.043,.016,-.006);group.add(hinge);
      rounded(hinge,w-.11,h-.083,.071,-(w-.11)/2,(h-.083)/2,0,doorPaint,.016);
      box(hinge,.25,.061,.077,-w+.244,1.01,.058,metal);
      hinges.set(id,hinge);
      const sign=InteriorArtwork.canvasMap(486,140,(g,width,height)=>{
        g.fillStyle='#fbfcff';g.fillRect(0,0,width,height);
        g.fillStyle=point.color;g.fillRect(0,0,21,height);
        g.fillStyle='#263656';g.font='650 62px Malgun Gothic, sans-serif';
        g.textBaseline='middle';g.textAlign='center';g.fillText(point.label,width/2+7,height/2+3);
      });
      patchPlane(group,1.42,.34,0,2.47,.022,sign);
    }else{
      finish(wall.length,0);
      if(wall.blocked){
        const sign=InteriorArtwork.canvasMap(368,106,(g,width,height)=>{
          g.fillStyle='#fff5ed';g.fillRect(0,0,width,height);
          g.fillStyle='#ae4038';g.font='700 46px Malgun Gothic, sans-serif';
          g.textAlign='center';g.textBaseline='middle';g.fillText('×  통행 금지',width/2,height/2+2);
        });
        rounded(group,1.14,.60,.08,0,.84,.08,closures,.025);
        patchPlane(group,1.17,.34,0,1.40,.027,sign);
      }
    }
  }
  let opening;
  return {
    setDoor(){},setDigits(){},onWalk,canInspect:canEnter,
    openDoor(id,done){opening={hinge:hinges.get(id),elapsed:0,done}},
    animate(dt,reduced){
      if(!opening)return false;
      opening.elapsed+=dt;
      const t=reduced?1:Math.min(opening.elapsed/.54,1);
      opening.hinge.rotation.y=1.46*(1-(1-t)**3);
      if(t<1)return true;
      const {done}=opening;opening=null;done();return false;
    }
  };
}

async function startHallway(){
  const read=()=>readSchoolBook(SCHOOL_STORY_KEY);
  const progress=read(),plan=schoolRoute(progress);
  if(!plan||!roomRestored(progress,RECOVERY_ROOMS[0])){
    location.replace('./');return;
  }
  const layout=hallwayLayout(),byId=id=>document.getElementById(id);
  const dialog=byId('inspect'),panel=byId('panelBody'),action=byId('hallAction');
  const current=()=>plan.path[plan.step],next=()=>plan.path[plan.step+1];
  const start=hallPosition(current()),look=hallPosition(next()??current());
  const destination=layout.doors.find(door=>door.id===current());
  const stop=RECOVERY_ROOMS.find(item=>item.kind===plan.stop);
  const stopRestored=stop&&roomRestored(progress,stop);
  let model,world,leaving=false;
  const room={
    interior:true,
    wall:{width:2*(layout.bounds.right+.20),height:HALL_HEIGHT,z:layout.bounds.front-.20,back:layout.bounds.back+.20},
    bounds:layout.bounds,obstacles:layout.obstacles,
    start:[start.x,1.55,start.z],
    firstView:destination&&canEnterSchoolRoom(progress,current())?destination.xyz:[look.x,1.42,look.z],
    targets:layout.doors.filter(door=>door.id===plan.stop||door.id==='computer'),
    stops:[
      [start.x+25,1.47,start.z],[start.x-25,1.47,start.z],
      [start.x,1.47,start.z+25],[start.x,1.47,start.z-25]
    ]
  };

  function mustVisit(){
    return stop?.kind===current()&&!stopRestored;
  }

  function refresh(){
    const book=read();
    const ready=canEnterSchoolRoom(book,current());
    const waiting=mustVisit(),done=!next();
    byId('hallProgress').textContent=plan.step+' / '+(plan.path.length-1)+'구간';
    action.textContent=waiting||done&&ready?SCHOOL_POINTS[current()].label+' 들어가기':'다음 구간 걷기';
    action.disabled=leaving||(done&&!ready);
    byId('roomView').dataset.routeStep=String(plan.step);
  }

  function enter(id){
    if(leaving||!canEnterSchoolRoom(read(),id))return;
    const door=layout.doors.find(item=>item.id===id);
    const destination=RECOVERY_ROOMS.find(item=>item.kind===id);
    world.walkTo(door.approach,door.xyz,()=>{
      leaving=true;
      refresh();
      model.openDoor(id,()=>location.assign(recoveryRoomLink(destination,true)));
    });
  }

  function progressOnWalk(_oldX,_oldZ,x,z){
    if(!next()||mustVisit())return;
    const point=hallPosition(next());
    if(Math.max(Math.abs(point.x-x),Math.abs(point.z-z))>HALL_WIDTH/2-.12)return;
    const book=read();
    plan.step++;
    book.route=plan;
    writeSchoolBook(SCHOOL_STORY_KEY,book);
    refresh();
  }

  world=await createMusicWorld({
    room,
    buildRoom:scene=>{
      model=buildHallway(scene,layout,{onWalk:progressOnWalk,
        canEnter:id=>id===current()&&(!next()||mustVisit())});
      return model;
    },
    onInspect:enter,onReadyToMove:()=>!dialog.open&&!leaving
  });
  room.portraitView=room.firstView;
  world.reset();
  refresh();
  action.onclick=()=>{
    if(mustVisit()||!next()){enter(current());return}
    const point=hallPosition(next());
    const after=plan.path[plan.step+2],door=layout.doors.find(item=>item.id===next());
    const look=hallPosition(after??next());
    const face=door&&(!after||door.id===plan.stop&&!stopRestored)?door.xyz:[look.x,1.42,look.z];
    world.walkTo(point,face);
  };
  byId('map').onclick=()=>{
    world.clearKeys();panel.replaceChildren();renderSchoolMap(panel,{plan});
    dialog.showModal();
  };
  byId('dismiss').onclick=()=>dialog.close();
  window.addEventListener('pageshow',event=>{if(event.persisted)location.reload()});
}

startHallway().catch(error=>{
  console.error(error);
  document.getElementById('hallProgress').textContent='복도를 열지 못했어요.';
  const button=document.getElementById('hallAction');
  button.disabled=false;button.textContent='다시 열기';button.onclick=()=>location.reload();
});
