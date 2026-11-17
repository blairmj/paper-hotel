const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');

const layoutContext=vm.createContext({REVIEW_ROOMS:[{n:203,kind:'music'},{n:207,kind:'art'}]});
vm.runInContext(fs.readFileSync(path.join(root,'school-interiors.js'),'utf8')+'\nglobalThis.interior=SchoolInterior;',layoutContext);
for(const kind of ['music','art'])test(kind+' keeps half the original floor area and reachable clues',()=>{
 const room=layoutContext.interior.definition(kind),b=room.bounds;
 assert.ok(Math.abs(room.wall.width*room.depth/(19*13.54)-.5)<1e-12);
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
});

function timerHarness(){
 let now=1_000_000,expires=0;
 const values=new Map(),events={},labels=[],jobs=[];
 const element=()=>({dataset:{},className:'',innerHTML:'',textContent:'',setAttribute(){},classList:{toggle(){}},append(){},querySelector(){const label={textContent:''};labels.push(label);return label}});
 const context=vm.createContext({
  Date:{now:()=>now},localStorage:{getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)},
  document:{createElement:element,querySelector:()=>element(),addEventListener:(k,fn)=>events[k]=fn},
  window:{addEventListener:(k,fn)=>events[k]=fn},setInterval:()=>1,clearInterval(){},queueMicrotask:fn=>jobs.push(fn)
 });
 vm.runInContext(fs.readFileSync(path.join(root,'review-rooms.js'),'utf8')+'\nglobalThis.timerFactory=setupSchoolTimer;',context);
 return {advance:ms=>now+=ms,load:(solved=false)=>{const timer=context.timerFactory(203,{isSolved:()=>solved,onExpire:()=>expires++});while(jobs.length)jobs.shift()();return timer},get label(){return labels.at(-1).textContent},get expires(){return expires},events};
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
