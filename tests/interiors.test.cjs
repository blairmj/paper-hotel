const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');

const layoutContext=vm.createContext({RECOVERY_ROOMS:[
 {n:502,kind:'classroom'},{n:203,kind:'music'},{n:207,kind:'art'},{n:208,kind:'sports'},{n:209,kind:'computer'},
 {n:205,kind:'library'},{n:204,kind:'science'},{n:206,kind:'broadcast'},{n:210,kind:'print'},{n:211,kind:'council'}
]});
vm.runInContext(fs.readFileSync(path.join(root,'school-puzzles.js'),'utf8'),layoutContext);
vm.runInContext(fs.readFileSync(path.join(root,'ct-devices.js'),'utf8')+'\nglobalThis.ct=CT;',layoutContext);
vm.runInContext(fs.readFileSync(path.join(root,'school-interiors.js'),'utf8')+'\nglobalThis.interior=SchoolInterior;',layoutContext);
vm.runInContext(fs.readFileSync(path.join(root,'sports-computer-interiors.js'),'utf8')+
 '\nglobalThis.sportsComputer=SportsComputerInteriors;',layoutContext);
vm.runInContext(fs.readFileSync(path.join(root,'classroom-interior.js'),'utf8')+
 '\nglobalThis.classroom=ClassroomInterior;',layoutContext);
vm.runInContext(fs.readFileSync(path.join(root,'specialty-interiors.js'),'utf8')+
 '\nglobalThis.specialty=SpecialtyInteriors;',layoutContext);
for(const kind of ['classroom','music','art','sports','computer','library','science','broadcast','print','council'])test(kind+' has reachable clues',()=>{
 const interiors=kind==='classroom'?layoutContext.classroom:
  ['sports','computer'].includes(kind)?layoutContext.sportsComputer:
  ['music','art'].includes(kind)?layoutContext.interior:layoutContext.specialty;
 const room=interiors.definition(kind),b=room.bounds;
 if(['music','art','sports','computer'].includes(kind)){
  assert.ok(Math.abs(room.wall.width*room.depth/(19*13.54)-.5)<1e-12);
 }
 assert.equal(room.start[1],1.55);
 const open=(x,z)=>x>=b.left&&x<=b.right&&z>=b.front&&z<=b.back&&!room.obstacles.some(([l,r,f,k])=>x>l&&x<r&&z>f&&z<k);
 assert.ok(open(room.start[0],room.start[2]),'start must not be inside furniture or outside the walls');
 // Independently flood the walking surface; this catches an inaccessible
 // approach point even if the runtime pathfinder itself is unchanged.
 const step=.14,cols=Math.floor((b.right-b.left)/step)+1,rows=Math.floor((b.back-b.front)/step)+1;
 const index=(x,z)=>[Math.round((x-b.left)/step),Math.round((z-b.front)/step)];
 const [sx,sz]=index(room.start[0],room.start[2]),seen=new Set(),queue=[[sx,sz]];
 for(let i=0;i<queue.length;i++){
  const [x,z]=queue[i],id=x+','+z;
  if(seen.has(id)||x<0||x>=cols||z<0||z>=rows||!open(b.left+x*step,b.front+z*step))continue;
  seen.add(id);queue.push([x+1,z],[x-1,z],[x,z+1],[x,z-1]);
 }
 for(const target of room.targets){
  assert.ok(open(target.approach.x,target.approach.z),target.id+' approach is free');
  const [x,z]=index(target.approach.x,target.approach.z);
  assert.ok(seen.has(x+','+z),target.id+' is reachable from the entrance');
 }
 const puzzleId=room.lock.id??'lock';
 const device=room.targets.find(target=>target.id===puzzleId);
 const doorControl=puzzleId==='lock'?device:room.targets.find(target=>target.id==='doorGuide');
 assert.ok(doorControl&&Math.hypot(doorControl.xyz[0]-room.door[0],doorControl.xyz[2]-room.door[2])<1.7,
   'the door has a guide even when the puzzle is solved at another station');
 assert.ok(open(room.doorReveal.x,room.doorReveal.z)&&seen.has(index(room.doorReveal.x,room.doorReveal.z).join(',')),
   'the open doorway can be viewed from a reachable position');
 if(kind==='music'){
  assert.deepEqual(Object.values(room.finishes),Array(4).fill('maple-acoustic'));
  assert.deepEqual(Array.from(room.clues,c=>c.id),['paper','clock']);
 }
 if(kind==='art'){
  const [samples,record]=room.clues;
  assert.ok(samples.xyz[0]>1&&samples.xyz[2]>4,'new designs sit on the right workshop table');
  assert.ok(record.xyz[0]<0&&record.xyz[2]<.2,'printing examples are on the front display board');
  assert.ok(Math.hypot(samples.xyz[0]-record.xyz[0],samples.xyz[2]-record.xyz[2])>6);
 }
 if(kind==='sports'){
  const {banks,compartments}=room.layout;
  const balls=room.targets.find(target=>target.id==='ballLine');
  assert.equal(puzzleId,'lock','the password is entered at the door');
  assert.ok(balls&&Math.hypot(balls.xyz[0]-device.xyz[0],balls.xyz[2]-device.xyz[2])>4,
    'the ball shelf is a separate place to observe the moves');
  assert.equal(banks.length,3);
  assert.equal(new Set(compartments.map(slot=>slot.bank)).size,2);
  for(const [i,slot] of compartments.entries()){
   const {x,z}=room.clues[i].approach;
   const [left,right,front,back]=slot.trigger;
   assert.ok(x>left&&x<right&&z>front&&z<back,'walking up to the compartment crosses its trigger');
   assert.ok(room.start[2]>back,'the starting position cannot reveal a compartment');
   assert.ok(left>banks[slot.bank].x&&right<banks[slot.bank+1].x,'only the aisle facing this door opens it');
   assert.ok(x>banks[slot.bank].x&&x<banks[slot.bank+1].x&&open(x,z),'find each clue in a different internal aisle');
  }
 }
 if(kind==='computer'){
  const {rows}=room.layout;
  assert.equal(rows.length,4);
  const {drawer,rearStation}=room.layout;
  assert.deepEqual(Array.from(room.targets,t=>t.id),['lock','recordA','recordB','cardDrawer']);
  assert.equal(rearStation,rows.at(-1)[0]);
  assert.ok(drawer.xyz[0]<rearStation.x&&drawer.xyz[1]<.72&&drawer.xyz[2]===rearStation.z,'drawer is under the back left desk');
  assert.ok(drawer.approach.x<drawer.xyz[0]&&Math.hypot(drawer.xyz[0]-device.xyz[0],drawer.xyz[2]-device.xyz[2])>6);
  assert.ok(rows.every(row=>row.length===6&&row.filter(seat=>seat.x<0).length===3));
  assert.ok(Array.from({length:40},(_,i)=>i*.20+1).every(z=>open(0,z)),'central aisle is unobstructed');
 }
});

const cameraCode=vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(root,'music-world.js'),'utf8'),cameraCode);

test('camera walks ease out at their exact endpoint and repeated steps can keep their speed',()=>{
 const progress=cameraCode.walkingProgress;
 for(const rate of [0,1,2.5]){
  const positions=Array.from({length:101},(_,i)=>progress(i/100,rate));
  assert.equal(positions[0],0);assert.equal(positions.at(-1),1);
  assert.ok(positions.slice(1).every((p,i)=>p>=positions[i]&&p<=1));
  assert.ok(1-progress(.999,rate)<.000004,'no last-frame jump');
  assert.ok(Math.abs(progress(.00001,rate)/.00001-rate)<.0001,'velocity carries into the next step');
 }
 assert.ok(progress(.25)<.20&&progress(.75)>.80,'ease in and out on normal walks');
});

test('a camera rounds furniture corners only when the entire rounded path is walkable',()=>{
 const start={x:0,z:0},bend={x:0,z:2},end={x:2,z:2};
 const path=clear=>cameraCode.cameraPath(start,[bend,end],clear);
 const rounded=path(()=>true);
 assert.ok(rounded.some(p=>p.x>0&&p.z<2));
 assert.ok(rounded.at(-1).at<4&&rounded.at(-1).at>3.5);
 const blocked=path((a,b)=>!Array.from({length:11},(_,i)=>{
  const t=i/10;return a.x+(b.x-a.x)*t>.01&&a.z+(b.z-a.z)*t<1.99;
 }).some(Boolean));
 assert.deepEqual(Array.from(blocked,p=>[p.x,p.z,p.at]),[[0,0,0],[0,2,2],[2,2,4]]);
});

test('the science door guide clearance blocks the former landing point and leaves its approach aisle free',()=>{
 const room=layoutContext.specialty.definition('science');
 const clearance=target=>cameraCode.wallPanelClearance(room.wall,{
  point:{x:target.xyz[0],z:target.xyz[2]},surface:target.surface
 });
 const dial=room.targets.find(t=>t.id==='doorGuide');
 const [left,right,front,back]=clearance(dial);
 const inside=(x,z)=>x>left&&x<right&&z>front&&z<back;
 const [x,,z]=dial.xyz;
 assert.ok(inside(room.bounds.right,z),'the former landing at 17 cm from the dial is blocked');
 assert.ok(inside(x-.55,z+dial.surface.width/2+.10),'a near miss beside the panel has the same clearance');
 assert.ok(!inside(dial.approach.x,dial.approach.z),'the approach aisle stays walkable');
 assert.ok(!inside(room.doorReveal.x,room.doorReveal.z),'the automatic doorway sequence stays reachable');
 assert.equal(clearance(room.targets.find(t=>t.id==='marbleRail')),null,'a freestanding table uses its own geometry');
});

test('the default enclosure preserves the colors of painted textures',()=>{
 for(const file of ['vendor/gl-matrix.min.js','vendor/earcut.min.js','webgl/model.js','webgl/geometry.js']){
   vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),layoutContext);
 }
 const native=vm.runInContext('School3D',layoutContext);
 const scene=new native.Scene();
 const artwork=new native.Texture();
 layoutContext.interior.enclosure(scene,layoutContext.interior.definition('art'),{surface:()=>artwork},'#cab797');
 const paintedSurfaces=scene.children.filter(object=>object.material?.map===artwork);
 assert.equal(paintedSurfaces.length,8);
 for(const {material} of paintedSurfaces)assert.deepEqual(Array.from(material.color.toArray()),[1,1,1]);
});

function timerHarness(){
 let now=1_000_000,expires=0;
 const values=new Map(),events={},labels=[],jobs=[],badges=[];
 const element=()=>({dataset:{},className:'',innerHTML:'',textContent:'',setAttribute(){},append(){}});
 const timerBadge=()=>{
  const badge=element(),classes=new Set();
  badge.classList={toggle:(name,enabled)=>enabled?classes.add(name):classes.delete(name),contains:name=>classes.has(name)};
  badge.querySelector=()=>{const label={textContent:''};labels.push(label);return label};
  badges.push(badge);
  return badge;
 };
 const context=vm.createContext({
  Date:{now:()=>now},localStorage:{getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)},
  document:{createElement:timerBadge,querySelector:selector=>selector==='.hint-confirm[open]'?null:element(),addEventListener:(k,fn)=>events[k]=fn},
  window:{addEventListener:(k,fn)=>events[k]=fn},setInterval:()=>1,clearInterval(){},queueMicrotask:fn=>jobs.push(fn)
 });
 vm.runInContext(fs.readFileSync(path.join(root,'review-rooms.js'),'utf8')+'\nglobalThis.timerFactory=setupSchoolTimer;',context);
 const storyKey=vm.runInContext('SCHOOL_STORY_KEY',context);
 return {advance:ms=>now+=ms,storyKey,
  startSchool:()=>context.beginSchoolAttempt({path:['classroom'],stops:[],step:0}),
  storyBook:()=>context.readSchoolBook(storyKey),
  load:(solved=false,key,number=203)=>{const timer=context.timerFactory(number,{key,isSolved:()=>solved,onExpire:()=>expires++});while(jobs.length)jobs.shift()();return timer},
  get label(){return labels.at(-1).textContent},get warning(){return badges.at(-1).classList.contains('running-low')},get expires(){return expires},events};
}
test('deadline survives reload and expiration fires exactly once',()=>{
 const h=timerHarness();h.load();assert.equal(h.label,'2:00');h.advance(60_000);
 const timer=h.load();assert.equal(h.label,'1:00');h.advance(59_999);assert.equal(timer.check(),false);assert.equal(h.label,'0:01');
 h.advance(1);assert.equal(timer.check(),true);assert.equal(h.label,'0:00');assert.equal(h.expires,1);
 timer.check();assert.equal(h.expires,1);assert.equal(timer.stop(),false,'a late answer cannot escape');
});
test('a successful escape freezes time and retry starts a new two-minute attempt',()=>{
 const h=timerHarness(),timer=h.load();h.advance(32_000);assert.equal(timer.stop(),true);assert.equal(h.label,'1:28');
 h.advance(180_000);assert.equal(timer.check(),false);assert.equal(h.expires,0);assert.equal(h.label,'1:28');
 timer.reset();assert.equal(h.label,'2:00');h.advance(120_000);assert.equal(timer.check(),true);assert.equal(h.expires,1);
});

test('a hint shortens the saved deadline by thirty seconds',()=>{
 const h=timerHarness(),timer=h.load();h.advance(6_000);
 assert.equal(timer.spendHint(),true);
 assert.equal(h.label,'1:24');
 h.advance(3_000);h.load();
 assert.equal(h.label,'1:21');
});

test('the last-ten-seconds warning begins at 0:10 and ends when the room is solved',()=>{
 const h=timerHarness(),timer=h.load();h.advance(109_999);timer.check();
 assert.equal(h.label,'0:11');assert.equal(h.warning,false);
 h.advance(1);timer.check();
 assert.equal(h.label,'0:10');assert.equal(h.warning,true);
 assert.equal(timer.stop(),true);assert.equal(h.warning,false);
 assert.equal(timer.spendHint(),false);assert.equal(h.label,'0:10');
});

test('when a hint uses all the remaining time, expiration happens instead of revealing it',()=>{
 const h=timerHarness(),timer=h.load();h.advance(90_000);
 assert.equal(timer.spendHint(),false);assert.equal(h.label,'0:00');assert.equal(h.warning,false);
 assert.equal(h.expires,1);assert.equal(timer.spendHint(),false);assert.equal(h.expires,1);
 h.load();assert.equal(h.label,'0:00');
});

test('a review room visit does not spend the story timer',()=>{
 const h=timerHarness();h.startSchool();h.load(false,h.storyKey);h.advance(35_000);
 h.load(false,'review');assert.equal(h.label,'2:00');
 h.load(false,h.storyKey);assert.equal(h.label,'9:25');
});

test('the same ten-minute countdown runs in solved rooms, the hallway and the next room',()=>{
 const h=timerHarness();h.startSchool();h.load(false,h.storyKey,502);assert.equal(h.label,'10:00');
 h.advance(125_000);h.load(true,h.storyKey,502);assert.equal(h.label,'7:55');
 h.advance(5_000);h.load(false,h.storyKey,0);assert.equal(h.label,'7:50');
 const room=h.load(false,h.storyKey,205);assert.equal(room.spendHint(),true);assert.equal(h.label,'7:20');
 assert.equal(h.storyBook().escapeTimer.remaining,440_000);
 h.advance(430_000);
 const last=h.load(false,h.storyKey,209);assert.equal(h.label,'0:10');assert.equal(h.warning,true);
 h.advance(10_000);assert.equal(last.stop(),false);assert.equal(last.check(),true);
 assert.equal(h.label,'0:00');assert.equal(h.expires,1);
});

test('finishing writes the last puzzle and freezes the shared time together',()=>{
 const h=timerHarness();h.startSchool();
 const timer=h.load(false,h.storyKey,209);h.advance(68_000);
 assert.equal(timer.stop(book=>{book.visits[209]={restoration:{solved:true}}}),true);
 const saved=h.storyBook();
 assert.equal(saved.visits[209].restoration.solved,true);assert.equal(saved.escapeTimer.stopped,true);
 h.advance(600_000);h.load(true,h.storyKey,209);
 assert.equal(h.label,'8:52');assert.equal(h.expires,0);
});

const routeContext=vm.createContext({});
for(const file of ['review-rooms.js','school-routes.js']){
 vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),routeContext);
}
const schoolOrder=['classroom','music','art','sports','library','science','computer'];
test('the school has one fixed route with five intermediate rooms',()=>{
 const {fixedSchoolRoute,schoolRoute}=routeContext;
 const route=fixedSchoolRoute();
 assert.deepEqual([...route.path],schoolOrder);
 assert.deepEqual([...route.stops],schoolOrder.slice(1,-1));
 assert.equal(schoolRoute({route:{...route,step:4}}).step,4);
 assert.equal(schoolRoute({route:{...route,stops:route.stops.slice(1)}}),null);
 assert.equal(schoolRoute({route:{...route,path:[...route.path].reverse()}}),null);
 assert.equal(schoolRoute({route:{path:['classroom','broadcast','computer'],stops:['broadcast'],step:0}}),null);
});

test('returning to the school resumes the first unfinished room',()=>{
 const progress={visits:{}},ctx=routeContext;
 assert.equal(ctx.schoolRoomToPlay(progress).kind,'classroom');
 progress.route=ctx.fixedSchoolRoute();
 for(const [i,n] of [502,203,207,208,205,204,209].entries()){
  for(let step=0;step<schoolOrder.length;step++){
   progress.route.step=step;
   assert.equal(ctx.schoolRoomToPlay(progress).kind,schoolOrder[i]);
  }
  progress.visits[n]={restoration:{solved:true}};
 }
 assert.equal(ctx.schoolRoomToPlay(progress).kind,'computer');
});

test('entry distinguishes new, active, expired and finished games without changing the save',()=>{
 const {schoolEntryProgress,fixedSchoolRoute}=routeContext;
 const book={visits:{502:{restoration:{solved:true}}},route:fixedSchoolRoute()};
 assert.equal(schoolEntryProgress(book,9000).status,'new');
 book.escapeTimer={startedAt:1000,deadline:12000};
 assert.equal(schoolEntryProgress({...book,route:null},9000).status,'new');
 const saved=JSON.stringify(book);
 const active=schoolEntryProgress(book,9000);
 assert.equal(active.status,'active');assert.equal(active.room.kind,'music');assert.equal(active.startedAt,1000);
 assert.equal(schoolEntryProgress(book,12000).status,'expired');
 assert.equal(JSON.stringify(book),saved);
 for(const n of [203,207,208,205,204,209])book.visits[n]={restoration:{solved:true}};
 book.escapeTimer.stopped=true;
 const complete=schoolEntryProgress(book,40000);
 assert.equal(complete.status,'complete');assert.equal(complete.room.kind,'computer');
});

test('the classroom guide starts the clock on confirmation and preserves active games and previous surveys',async()=>{
 const storage=new Map(),events=[];
 const db={getItem:key=>storage.get(key),setItem:(key,value)=>storage.set(key,value)};
 let now=80000,available=true,reservations=0;
 const records={
   lesson:true,storyKey:'school.escape.lesson.example',
   reserve:async()=>{if(!available)throw Error('offline');return {id:String(++reservations)}},
   event:(_book,room,kind)=>events.push([room,kind]),started(){}
 };
 const ctx=vm.createContext({navigator:{},sessionStorage:db,Date:{now:()=>now},SchoolRecords:records});
 for(const file of ['review-rooms.js','school-routes.js','school-start.js']){
   vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx);
 }
 const freshVisit={restart:false,keepResult:false},key=records.storyKey;
 const confirmGuide=async()=>{};
 const unexpectedGuide=()=>assert.fail('showed the guide while resuming a game');
 let startFirst,startSecond;
 const firstTab=ctx.enterSchool(freshVisit,()=>new Promise(resolve=>{startFirst=resolve}));
 const secondTab=ctx.enterSchool(freshVisit,()=>new Promise(resolve=>{startSecond=resolve}));
 now+=150000;
 assert.equal(storage.has(key),false);
 assert.equal(reservations,0);
 startFirst();await firstTab;
 const first=ctx.readSchoolBook(key);
 assert.equal(first.startGuideSeen,true);
 assert.equal(first.escapeTimer.deadline,now+600000);
 now+=2000;startSecond();await secondTab;
 assert.equal(ctx.readSchoolBook(key).escapeTimer.deadline,first.escapeTimer.deadline);
 assert.equal(reservations,1);
 first.visits[502]={restoration:{solved:true}};
 first.survey={status:'draft'};
 ctx.writeSchoolBook(key,first);
 now+=1000;await ctx.enterSchool(freshVisit,unexpectedGuide);
 assert.equal(ctx.schoolRoomToPlay(ctx.readSchoolBook(key)).kind,'music');
 assert.equal(reservations,1);
 now+=600000;await ctx.enterSchool({restart:false,keepResult:true},unexpectedGuide);
 assert.equal(reservations,1);
 available=false;
 await assert.rejects(ctx.enterSchool(freshVisit,confirmGuide),/offline/);
 assert.equal(storage.get(key),JSON.stringify(first));
 available=true;await ctx.enterSchool(freshVisit,confirmGuide);
 const archive=ctx.readSchoolBook(key+'.previous');
 assert.equal(archive.survey.status,'draft');assert.equal(archive.surveyTimeoutRoom,'music');
 assert.deepEqual(events,[['music','timeout']]);assert.equal(reservations,2);
 assert.equal(ctx.schoolRoomToPlay(ctx.readSchoolBook(key)).kind,'classroom');
 assert.equal(ctx.readSchoolBook(key).escapeTimer.startedAt,now);
});

test('a saved hallway link resumes the current classroom',()=>{
 let saved=null,destination;
 const ctx=vm.createContext({localStorage:{getItem:()=>saved},location:{replace:url=>{destination=url}}});
 for(const file of ['review-rooms.js','school-routes.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx);
 const redirect=fs.readFileSync(path.join(root,'school-hallway.js'),'utf8');
 vm.runInContext('{'+redirect+'}',ctx);
 assert.equal(destination,'./');
 saved=JSON.stringify({route:ctx.fixedSchoolRoute(),visits:{502:{restoration:{solved:true}}},
  escapeTimer:{startedAt:1000,deadline:601000}});
 vm.runInContext('{'+redirect+'}',ctx);
 assert.equal(destination,'music.html?school=1');
});

test('one repair restores even parity in every row and column',()=>{
 const ct=layoutContext.ct;
 assert.deepEqual(Array.from({length:16},(_,i)=>i).filter(i=>ct.parity(i)),[9]);
});

test('each transparent score gives the product of its hands and the clock uses the same rule',()=>{
 const [marks,clock]=vm.runInContext('[MUSIC_SCORE,MUSIC_CLOCK]',layoutContext);
 assert.deepEqual(Array.from(marks,m=>m.value),[54,36,8,77]);
 assert.ok(marks.every(m=>m.a*m.b===m.value));
 assert.ok(new Set(marks.map(({a,b})=>Math.min(Math.abs(a-b),12-Math.abs(a-b)))).size>=3);
 assert.equal(clock.hour*clock.minuteMark,48);
 const ct=layoutContext.ct,state=ct.restore('music',{digits:[4,7],overlay:true},ct.fresh('music'));
 assert.deepEqual([...state.digits],[4,7]);assert.ok(state.overlay);
});

test('a paint drop covers only its vertical neighbors, including edges and overlaps',()=>{
 const ct=layoutContext.ct;
 assert.deepEqual([...ct.paintCells([9])],[5,9,13]);
 assert.deepEqual([...ct.paintCells([0])],[0,4]);
 assert.deepEqual([...ct.paintCells([23])],[19,23]);
 assert.deepEqual([...ct.paintCells([9,13])],[5,9,13,17]);
 const chosen=[0,16,9,13,6,18,23];
 assert.ok(ct.artSolved(chosen));assert.equal(ct.artSolved(chosen.slice(1)),false);
 const restore=drops=>[...ct.restore('art',{drops},ct.fresh('art')).drops];
 assert.deepEqual(restore(chosen),chosen);assert.deepEqual(restore([9,9]),[]);assert.deepEqual(restore([24]),[]);
});

test('the art reference needs exactly the available seven drops and has a unique minimum solution',()=>{
 const ct=layoutContext.ct,w=ct.artWidth,h=ct.artRows.length;
 let total=0;
 for(let col=0;col<w;col++){
  const matches=[];
  for(let mask=0;mask<2**h;mask++){
   const drops=[];
   for(let r=0;r<h;r++)if(mask&(1<<r))drops.push(r*w+col);
   const paint=ct.paintCells(drops);
   if(ct.artRows.every((line,r)=>paint.has(r*w+col)===(line[col]==='#')))matches.push(drops.length);
  }
  const min=Math.min(...matches);
  assert.equal(matches.filter(n=>n===min).length,1);
  total+=min;
 }
 assert.equal(total,ct.inkLimit);
});
test('the rail changes only visited gates and the predicted cup survives a reload',()=>{
 const ct=layoutContext.ct;
 for(const [lower,cups] of [['left',['왼쪽','오른쪽','가운데']],['right',['가운데','오른쪽','왼쪽']]]){
  const steps=ct.experiment(lower);
  assert.deepEqual(Array.from(steps,r=>r.cup),cups);
  assert.equal(steps[1].lowerVisited,false);assert.equal(steps[0].nextLower,steps[1].nextLower);
  const state=ct.restore('science',{lower,cup:cups[2]},ct.fresh('science'));
  assert.equal(state.lower,lower);assert.equal(state.cup,cups[2]);assert.equal(state.practice,undefined);
 }
});
test('signal codewords are prefix-free',()=>{
 const ct=layoutContext.ct,commands=vm.runInContext('BROADCAST_COMMANDS',layoutContext);
 const words=Object.values(commands).map(x=>x.code.split(' '));
 for(const a of words)for(const b of words){if(a!==b)assert.ok(!a.every((v,i)=>v===b[i]))}
 assert.equal(['weather','meal','song'].map(id=>commands[id].code).join(' '),ct.signal.join(' '));
});
test('exactly one drawer card produces the recovery signal on the single pad',()=>{
 const ct=layoutContext.ct,goal=vm.runInContext('PAD_RECOVERY_CODE',layoutContext);
 for(const pair of ct.clues.recordA.slice(2)){
  const [input,reading]=pair.replace(/\s/g,'').split('→');
  assert.equal(ct.readCard(input),reading);
 }
 assert.deepEqual(Array.from(ct.cards).filter(c=>ct.readCard(c)===goal),['★★●']);
 const restore=s=>ct.restore('computer',s,ct.fresh('computer'));
 assert.equal(restore({card:'★★●',wasRead:true}).wasRead,true);
 assert.equal(restore({card:'★●★'}).card,'★●★');
 assert.equal(restore({test:'★★●',seen:['A','B'],fault:'A'}).card,null);
 assert.equal(restore({card:'absent',wasRead:true}).wasRead,false);
});
test('the four displayed move counts agree with the surviving balls that changed slots',()=>{
 const {ballRowAfter}=layoutContext;
 const counts=vm.runInContext('SCHOOL_PUZZLES.sports.answer',layoutContext);
 for(let i=0;i<counts.length;i++){
  const before=ballRowAfter(i),after=ballRowAfter(i+1);
  assert.equal(after.filter((ball,slot)=>before.indexOf(ball)!==slot).length,Number(counts[i]));
 }
});
test('only the two feasible print schedules succeed and the ticket display preserves both privacy and identification',()=>{
 const ct=layoutContext.ct,choices=['','별','달'],solutions=[];
 for(let code=0;code<3**6;code++){
   const row=Array.from({length:6},(_,i)=>choices[Math.floor(code/3**i)%3]);
   if(!ct.schedule(row))solutions.push(row.join(','));
 }
 assert.deepEqual(solutions.sort(),[['별','','달','별','','달'].join(','),['달','','별','달','','별'].join(',')].sort());
 assert.equal(new Set(ct.tickets.map(t=>t.class)).size,1);
 assert.equal(new Set(ct.tickets.map(t=>t.id)).size,2);
 assert.equal(vm.runInContext("SCHOOL_PUZZLES.sports.answer.join('')",layoutContext),'2331');
});

test('the covered shelf can hold the requested book in any slot and a midpoint search always fits the allowance',()=>{
 const ctx=layoutContext;
 const limit=vm.runInContext('SHELF_LIMIT',ctx);
 for(let target=0;target<7;target++){
  const shelf=ctx.makeLibraryShelf(()=>(target+.5)/7);
  assert.equal(ctx.validLibraryShelf(shelf),true);
  assert.equal(shelf.indexOf(61),target);
  for(let first=0;first<7;first++){
   assert.equal(ctx.canOpenLibraryBook(shelf,[],first),true);
   for(let next=0;next<7;next++){
    assert.equal(ctx.canOpenLibraryBook(shelf,[first],next),first!==target&&next!==first);
   }
  }
  const opened=[];let left=0,right=shelf.length-1;
  while(opened.length<limit){
   const slot=Math.floor((left+right)/2);
   assert.equal(ctx.canOpenLibraryBook(shelf,opened,slot),true);
   opened.push(slot);
   if(shelf[slot]===61)break;
   if(shelf[slot]<61)left=slot+1;
   else right=slot-1;
  }
  assert.equal(shelf[opened.at(-1)],61);
  assert.equal(ctx.canOpenLibraryBook(shelf,[0,1,2],4),false);
 }
 assert.equal(ctx.validLibraryShelf([12,19,31,49,58,74,92]),false);
 assert.equal(ctx.validLibraryShelf([24,12,37,49,61,74,86]),false);
});
