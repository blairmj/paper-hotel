const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');

const layoutContext=vm.createContext({RECOVERY_ROOMS:[
 {n:502,kind:'classroom'},{n:203,kind:'music'},{n:207,kind:'art'},{n:208,kind:'sports'},{n:209,kind:'computer'},
 {n:205,kind:'library'},{n:204,kind:'science'},{n:206,kind:'broadcast'}
]});
vm.runInContext(fs.readFileSync(path.join(root,'school-puzzles.js'),'utf8'),layoutContext);
vm.runInContext(fs.readFileSync(path.join(root,'school-interiors.js'),'utf8')+'\nglobalThis.interior=SchoolInterior;',layoutContext);
vm.runInContext(fs.readFileSync(path.join(root,'sports-computer-interiors.js'),'utf8')+
 '\nglobalThis.sportsComputer=SportsComputerInteriors;',layoutContext);
vm.runInContext(fs.readFileSync(path.join(root,'classroom-interior.js'),'utf8')+
 '\nglobalThis.classroom=ClassroomInterior;',layoutContext);
vm.runInContext(fs.readFileSync(path.join(root,'specialty-interiors.js'),'utf8')+
 '\nglobalThis.specialty=SpecialtyInteriors;',layoutContext);
for(const kind of ['classroom','music','art','sports','computer','library','science','broadcast'])test(kind+' has reachable clues',()=>{
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
 if(kind==='music')assert.deepEqual(Object.values(room.finishes),Array(4).fill('black-acoustic'));
 if(kind==='art'){
  const [samples,record]=room.clues;
  assert.ok(samples.xyz[0]>1&&samples.xyz[2]>4,'new designs sit on the right workshop table');
  assert.ok(record.xyz[0]<0&&record.xyz[2]<.2,'printing examples are on the front display board');
  assert.ok(Math.hypot(samples.xyz[0]-record.xyz[0],samples.xyz[2]-record.xyz[2])>6);
 }
 if(kind==='sports'){
  const {banks,compartments}=room.layout;
  assert.equal(banks.length,3);
  assert.equal(new Set(compartments.map(slot=>slot.bank)).size,2);
  for(const [i,slot] of compartments.entries()){
   const {x,z}=room.clues[i].approach;
   assert.ok(x>banks[slot.bank].x&&x<banks[slot.bank+1].x&&open(x,z),'find each clue in a different internal aisle');
  }
 }
 if(kind==='computer'){
  const {rows}=room.layout;
  assert.equal(rows.length,4);
  assert.ok(rows.every(row=>row.length===6&&row.filter(seat=>seat.x<0).length===3));
  assert.ok(Array.from({length:40},(_,i)=>i*.20+1).every(z=>open(0,z)),'central aisle is unobstructed');
 }
});

test('the default enclosure preserves the colors of painted textures',()=>{
 const THREE=require('../three.min.js');
 layoutContext.THREE=THREE;
 const scene=new THREE.Scene();
 const artwork=new THREE.Texture();
 layoutContext.interior.enclosure(scene,layoutContext.interior.definition('art'),{surface:()=>artwork},'#cab797');
 const paintedSurfaces=scene.children.filter(object=>object.material?.map===artwork);
 assert.equal(paintedSurfaces.length,8);
 for(const {material} of paintedSurfaces)assert.deepEqual(material.color.toArray(),[1,1,1]);
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

test('a hint shortens the saved deadline by ten seconds',()=>{
 const h=timerHarness(),timer=h.load();h.advance(6_000);
 assert.equal(timer.spendHint(),true);
 assert.equal(h.label,'1:44');
 h.advance(3_000);h.load();
 assert.equal(h.label,'1:41');
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
 const h=timerHarness(),timer=h.load();h.advance(111_000);
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
 const room=h.load(false,h.storyKey,205);assert.equal(room.spendHint(),true);assert.equal(h.label,'7:40');
 h.advance(450_000);
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

test('every supported selection creates a route through at least three distinct rooms',()=>{
 const ctx=vm.createContext({});
 vm.runInContext(fs.readFileSync(path.join(root,'school-routes.js'),'utf8'),ctx);
 const rooms=['library','music','art','broadcast','science','sports'];
 for(let mask=0;mask<(1<<rooms.length);mask++){
  const selected=rooms.filter((_,i)=>mask&(1<<i));
  const plan=ctx.planSchoolRoute(selected);
  if(selected.length<3){assert.equal(plan,null);continue}
  assert.equal(ctx.schoolRoute({route:plan}),plan,selected.join(', '));
  assert.deepEqual([...plan.stops].sort(),selected.slice().sort());
  assert.deepEqual([...plan.stops],[...new Set(plan.path.filter(id=>selected.includes(id)))]);
  assert.equal(plan.path[0],'classroom');assert.equal(plan.path.at(-1),'computer');
  assert.equal(plan.path.some((id,i)=>[id,plan.path[i+1]].sort().join(',')==='center,music'),false);
 }
 assert.equal(ctx.planSchoolRoute(['library','library','art']),null);
 assert.equal(ctx.planSchoolRoute(['library','music','computer']),null);
 assert.deepEqual([...ctx.planSchoolRoute(['art','music','library']).path],['classroom','west','library','music','art','east','computer']);
 assert.equal(ctx.planSchoolRoute(rooms).path.length-1,12);
 const blocked={path:['classroom','west','library','west','center','music','art','east','computer'],stops:['library','music','art'],step:0};
 assert.equal(ctx.schoolRoute({route:blocked}),null);
});

test('direct transitions follow the confirmed visits from any saved corridor step',()=>{
 const ctx=vm.createContext({});
 for(const file of ['review-rooms.js','school-routes.js']){
  vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx);
 }
 const progress={visits:{}};
 assert.equal(ctx.schoolRoomToPlay(progress).kind,'classroom');
 progress.route=ctx.planSchoolRoute(['sports','art','music']);
 assert.deepEqual([...progress.route.stops],['music','art','sports']);
 assert.ok(progress.route.path.includes('library'),'the diagram passes a classroom that was not selected');
 for(const [kind,n] of [['classroom',502],['music',203],['art',207],['sports',208]]){
  for(let step=0;step<progress.route.path.length;step++){
   progress.route.step=step;
   assert.equal(ctx.schoolRoomToPlay(progress).kind,kind);
  }
  progress.visits[n]={restoration:{solved:true}};
 }
 assert.equal(ctx.schoolRoomToPlay(progress).kind,'computer');
 progress.visits[209]={restoration:{solved:true}};
 assert.equal(ctx.schoolRoomToPlay(progress).kind,'computer','a completed attempt can reopen its ending');
});

test('a saved hallway link resumes the current selected classroom',()=>{
 let saved=null,destination;
 const ctx=vm.createContext({
  localStorage:{getItem:()=>saved},
  location:{replace:url=>{destination=url}}
 });
 for(const file of ['review-rooms.js','school-routes.js']){
  vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx);
 }
 const redirect=fs.readFileSync(path.join(root,'school-hallway.js'),'utf8');
 vm.runInContext('{'+redirect+'}',ctx);
 assert.equal(destination,'./');
 const route=ctx.planSchoolRoute(['sports','art','music']);
 route.step=route.path.indexOf('library');
 saved=JSON.stringify({route,visits:{502:{restoration:{solved:true}}},
  escapeTimer:{startedAt:1_000,deadline:601_000}});
 vm.runInContext('{'+redirect+'}',ctx);
 assert.equal(destination,'music.html?school=1');
});

test('the puzzle answers come from the displayed sequence, printing, queue and decision rules',()=>{
 const ctx=vm.createContext({});
 vm.runInContext(fs.readFileSync(path.join(root,'school-puzzles.js'),'utf8')+
  '\nglobalThis.puzzles=SCHOOL_PUZZLES;',ctx);
 assert.deepEqual(Array.from(ctx.encodeMusic(['1','1','2','1'])),['2','1','1','2','1','1']);
 assert.equal(ctx.puzzles.music.answer.join(''),'43');
 assert.equal(ctx.puzzles.art.answer.join(''),'001010');
 assert.equal(ctx.shouldPrint({frame:true,dots:8}),true);
 assert.equal(ctx.shouldPrint({frame:true,dots:5}),false);
 assert.equal(ctx.shouldPrint({frame:false,dots:6}),false);
 assert.equal(ctx.puzzles.sports.answer.join(''),'2331');
 assert.equal(ctx.routeSignal({reply:false,power:true,code:true}),'link');
 assert.equal(ctx.puzzles.computer.answer.join(','),'link,code,send');
 assert.equal(ctx.puzzles.library.answer.join(','),'49,74,61');
 assert.equal(ctx.puzzles.science.answer.join(''),'4203');
 const broken=ctx.broadcastTrace(['mic','record','save','save']);
 assert.equal(broken.passed,false);
 assert.equal(broken.trace.length,2);
 assert.equal(ctx.broadcastTrace(ctx.puzzles.broadcast.answer).passed,true);
});
