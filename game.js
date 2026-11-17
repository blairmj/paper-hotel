'use strict';
const $=id=>document.getElementById(id), canvas=$('world'),dlg=$('sheet'),body=$('modalBody');
let renderer,scene,camera,root,room,markers=[];
let yaw=0,pitch=0,facingTarget=null,moving=null,clockLast=0,tipTimer,dirty=true;
let hinge, opening=null;
const keys=new Set(),angles=['정면','오른쪽','뒤쪽','왼쪽'];
const STORE='paperhotel.explore.v1'; // Keep progress saved at the existing student link.
let book={room:203,visits:{}};
try{const s=JSON.parse(localStorage.getItem(STORE));if(s&&s.visits&&typeof s.visits==='object'&&SCHOOL_ROOMS.some(r=>r.n===s.room))book=s}catch{}
function progress(n=room.n){const v=book.visits[n];if(v&&Array.isArray(v.found)&&Array.isArray(v.tests))return v;return book.visits[n]={found:[],tests:[],solved:false}}
function save(){try{localStorage.setItem(STORE,JSON.stringify(book))}catch{}}
// In earlier saves the answer unlocked the door, but a separate click recorded the exit.
for(const state of Object.values(book.visits)){
 if(state && (state.solved || state.escaped)) state.solved=state.escaped=true;
}
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a)),limit=(v,a,b)=>Math.max(a,Math.min(b,v));
function tip(t){$('tip').textContent=t;$('tip').classList.add('on');clearTimeout(tipTimer);tipTimer=setTimeout(()=>$('tip').classList.remove('on'),3300)}
function focusGame(){canvas.focus({preventScroll:true})}
function closeSheet(){if(dlg.open)dlg.close()}
dlg.addEventListener('close',()=>{keys.clear();focusGame();dirty=true});
$('close').onclick=closeSheet;dlg.addEventListener('click',e=>{if(e.target===dlg){const r=dlg.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeSheet()}});
function modal(kicker,title,html,wide=false){if(opening)return;facingTarget=null;keys.clear();moving=null;dlg.classList.toggle('wide',wide);$('modalKicker').textContent=kicker;$('modalTitle').textContent=title;body.innerHTML=html;if(!dlg.open)dlg.showModal();dlg.scrollTop=0}
const tag=()=> room.n+'호 '+room.place;
function btn(text,fn,host=body,primary=false){const el=document.createElement('button');el.type='button';el.className='action'+(primary?' primary':'');el.textContent=text;el.onclick=fn;host.append(el);return el}
function row(){const el=document.createElement('div');el.className='row';body.append(el);return el}
function cells(s,cols=3,lit=false){return '<span class="cells '+(cols===2?'two':'')+'">'+[...s].map(n=>'<span class="'+(lit&&Number(n)%2?'lit':'')+'">'+n+'</span>').join('')+'</span>'}
function clueExtra(id){
 if(id==='type')return '<div class="slip sample">ㅅ ㅏ ㅁ　/　ㅍ ㅏ ㄹ　/　ㅇ ㅣ</div>';
 if(id==='shelf')return '<div class="diagram">'+cells(archiveCard(0),2)+' → '+cells(archiveCard(1),2)+'</div>';
 if(id==='sort')return '<div class="diagram">'+cells(archiveCard(2),2)+'</div>';
 if(id==='photo')return '<div class="slip" style="font-size:29px;line-height:1.5;max-width:260px" aria-label="농구공 다섯, 테니스공 둘, 배구공 셋, 미식축구공 넷">'+sportsBalls.join(' ')+'</div>';
 if(id==='flag')return '<div class="slip sample">🏐　🏈　🎾　🏀</div>';
 if(id==='bag'||id==='apron'){const s=id==='bag'?'111010010':'131232030';return '<div class="diagram">'+cells(s)+' → '+cells([...s].map(v=>Number(v)%2).join(''),3,true)+'</div><small>오른쪽 점검 기록은 1이 켜짐, 0이 꺼짐입니다.</small>'}
 if(id==='stencil')return '<div class="skystars">'+['★★★','★★★★','★★','★★★★★'].map(v=>'<span>'+v+'</span>').join('')+'</div>';
 return '';
}
function sync(){const st=progress();$('clueCount').textContent=st.found.length+'/'+room.clues.length;for(const m of markers){const checked=st.found.includes(m.id);m.el.firstChild.textContent=checked?'✓':m.id==='station'?'◎':'＋'}dirty=true}
function findClue(id){
 const clue=room.clues.find(c=>c[0]===id);if(!clue)return;
 const st=progress();if(!st.found.includes(id)){st.found.push(id);save();sync()}
 modal(tag()+'  /  단서 수첩에 기록',clue[1],'<p>'+clue[2]+'</p>'+clueExtra(id));btn('방으로 돌아가기',closeSheet,row(),true);
}
function mazeSvg(){
 const xy=n=>[23+n%5*51,23+Math.floor(n/5)*51];let paths='';
 for(const [a,b] of mazeRoads){let [x,y]=xy(a),[u,v]=xy(b);paths+='<path d="M'+x+' '+y+' L'+u+' '+v+'" fill="none" stroke="#faf0ce" stroke-width="21" stroke-linecap="square"/>'}
 const labels=[[0,'▲'],[6,'중'],[12,'간'],[19,'칸'],[24,'●'],[2,'위'],[8,'칸'],[10,'앞'],[15,'뒤'],[22,'아'],[20,'래']];
 return '<svg class="map" viewBox="0 0 250 250" role="img" aria-label="종이 미로. 삼각형에서 동그라미로 이어진 길을 따라 글자를 읽으세요."><rect width="250" height="250" fill="#647368"/>'+paths+labels.map(([n,t])=>{let [x,y]=xy(n);return '<text x="'+x+'" y="'+(y+5)+'" text-anchor="middle" font-size="15" fill="#48342c">'+t+'</text>'}).join('')+'</svg>';
}
function doorView() {
 const center=hinge.parent.localToWorld(new THREE.Vector3(0,1.35,0));
 center.sub(camera.position);
 return {yaw:Math.atan2(center.x,-center.z),pitch:Math.atan2(center.y,Math.hypot(center.x,center.z))};
}
function showExit() {
 const next=SCHOOL_ROOMS.find(r=>r.n>room.n&&!progress(r.n).escaped)||SCHOOL_ROOMS.find(r=>!progress(r.n).escaped);
 $('exitText').textContent=room.place+' 문이 열렸어요.'+(next?'':' 여덟 교실 탈출 완료!');
 const button=$('continueRoom');
 button.textContent=next?next.place+'로 이동':'학교 안내도';
 button.onclick=next?()=>enter(next.n):directory;
 $('exitNotice').hidden=false;
}
function openDoor() {
 const state=progress();
 if(state.solved)return;
 state.solved=state.escaped=true;
 save();closeSheet();sync();
 keys.clear();moving=facingTarget=drag=null;
 const view=doorView();
 opening={start:performance.now(),yaw,pitch,view};
 document.body.classList.add('opening');
 $('tip').classList.remove('on');
 if(matchMedia('(prefers-reduced-motion: reduce)').matches) animateDoor(1);
}
function animateDoor(t) {
 const aim=Math.min(1,t/.48);
 const ease=1-(1-aim)**3;
 yaw=opening.yaw+wrap(opening.view.yaw-opening.yaw)*ease;
 pitch=opening.pitch+(opening.view.pitch-opening.pitch)*ease;
 hinge.rotation.y=doorway.angle*t*t*(3-2*t);
 renderer.shadowMap.needsUpdate=true;dirty=true;
 if(t===1){
   opening=null;document.body.classList.remove('opening');showExit();
 }
}
function puzzle(){
 if(progress().solved)return;
 const st=progress();
 const remaining=room.clues.filter(c=>!st.found.includes(c[0]));if(remaining.length){
 const lines=remaining.map(c=>'<li>'+c[1]+'</li>').join('');modal(tag(),room.station,'<p>장치를 살펴보니 아직 맞춰 볼 단서가 남아 있다.</p><ul>'+lines+'</ul>');btn('단서 찾아보기',closeSheet,row(),true);return}
 const questions={204:'활자 서랍의 세 줄을 견본처럼 찍으면 어떤 세 자리 수가 될까?',205:'지도 조각을 맞췄다. ▲에서 ●까지 이어지는 길에서 읽은 글자가 가리키는 서랍을 열자.',206:'테두리를 따라 이동하는 숫자들. 네 번째 카드 여섯 칸을 맨 위부터 한 줄씩 왼쪽에서 오른쪽으로 입력하자.',207:'견본 글자를 작은 것부터 인쇄한다. 문에 들어갈 여섯 글자는?',208:'운동회 사진과 우승 깃발을 보고 장비함의 네 다이얼을 맞춰 보자.',209:'새 입력표가 떴다. 출력 예시와 같은 규칙으로 모니터의 픽셀을 켜자.',210:'별판과 투사지의 초승달을 맞췄다. 하나가 남는 구역의 스위치를 모두 켜자.'};
 modal(tag()+'  /  잠금 장치',room.station,'<p>'+questions[room.n]+'</p>');
 let get;const n=room.n;
 if(n===205){body.insertAdjacentHTML('beforeend',mazeSvg());const host=row();for(const v of ['위칸','중간칸','아래칸'])btn(v,()=>check(v),host)}
 else if(n===209||n===210){
 body.insertAdjacentHTML('beforeend',n===209?'<div class="diagram">'+cells('525333525')+'</div>':clueExtra('stencil'));
 const mask=Array(n===209?9:4).fill(0),panel=document.createElement('div');panel.className=n===209?'lights':'options';body.append(panel);
 mask.forEach((_,i)=>{const el=document.createElement('button');el.type='button';el.className='bulb';el.textContent=i+1;el.setAttribute('aria-label',(i+1)+'번 '+(n===209?'픽셀':'스위치'));el.setAttribute('aria-pressed','false');el.onclick=()=>{mask[i]^=1;el.classList.toggle('on',!!mask[i]);el.setAttribute('aria-pressed',!!mask[i])};panel.append(el)});get=()=>mask.join('');btn('장치 작동',()=>check(get()),row(),true)
 }else{
 const digits=room.answer.length;body.insertAdjacentHTML('beforeend','<form class="entry"><input aria-label="장치 비밀번호" autocomplete="off" autocapitalize="characters" maxlength="'+digits+'" inputmode="'+(n===207?'text':'numeric')+'" placeholder="'+'·'.repeat(digits)+'"><button class="action primary">다이얼 확인</button></form>');body.querySelector('form').onsubmit=e=>{e.preventDefault();check(e.target.querySelector('input').value.trim().toUpperCase())}
 }
 const feedback=document.createElement('p');feedback.className='feedback';feedback.setAttribute('role','status');body.append(feedback);
 function check(v){if(v===room.answer)openDoor();else feedback.textContent='장치가 그대로예요. 단서의 순서와 규칙을 다시 확인해 보세요.'}
 const tools=row();btn('단서 펼치기',()=>{const old=$('inlineClues');if(old){old.remove();return}const d=document.createElement('div');d.id='inlineClues';d.innerHTML=room.clues.map(c=>'<article class="slip"><b>'+c[1]+'</b><p>'+c[2]+'</p>'+clueExtra(c[0])+'</article>').join('');body.append(d)},tools);btn('힌트',()=>feedback.textContent=room.hint,tools);
}
function journal(){if(opening)return;const s=progress();modal(tag(),'단서 수첩',s.found.length?s.found.map(id=>{const c=room.clues.find(a=>a[0]===id);return c?'<article class="slip"><b>'+c[1]+'</b><p>'+c[2]+'</p>'+clueExtra(id)+'</article>':''}).join(''):'<p>아직 빈 수첩이에요. 방을 돌려 물건 위의 ＋ 표시를 눌러 보세요.</p>');if(s.tests.length)body.insertAdjacentHTML('beforeend','<p>'+s.tests.map(t=>t.pair+' → '+t.result).join('　·　')+'</p>')}
function directory(){if(opening)return;modal('학교  /  2층','학교 안내도','<div class="rooms"></div>',true);const g=body.querySelector('.rooms');for(const r of SCHOOL_ROOMS){const e=document.createElement('button');e.className='roomcard'+(r===room?' current':'');e.innerHTML='<img src="rooms/'+r.n+'.webp" alt=""><small>'+r.n+'호 · '+(progress(r.n).escaped?'탈출 완료':r===room?'현재 교실':'입장')+'</small><b>'+r.place+'</b><span>'+r.name+'</span>';e.onclick=()=>{closeSheet();enter(r.n)};g.append(e)}}
function help(){if(opening)return;modal('학교 탈출','놀이 방법','<p>교실을 돌아다니며 물건을 조사하고 그 방의 퍼즐을 풀어 보세요.</p><ul><li>화면을 좌우로 끌면 몸을 돌리고, 위아래로 끌면 천장과 바닥을 봅니다.</li><li>← → ↑ ↓ 키로도 자유롭게 시선을 돌릴 수 있어요. 아래의 ‹ › 는 옆 벽으로 90° 회전해요.</li><li>W A S D로 걷거나 ‘한 걸음 ↑’를 누르세요.</li><li>물건 이름을 누르면 자세히 살펴봅니다. 수집한 단서는 수첩에서 다시 읽을 수 있어요.</li><li>방마다 퍼즐이 하나예요. 정답을 맞히면 교실 문이 저절로 열려요.</li></ul>');btn('탐색 시작',closeSheet,row(),true)}
function interact(id){if(opening)return;if(id==='station')puzzle();else findClue(id)}
function mark(p,x,y,z,id){const anchor=group(p,x,y,z);const el=document.createElement('button');el.type='button';el.className='mark';const name=id==='station'?room.station:room.clues.find(c=>c[0]===id)[1];const icon=document.createElement('i');icon.setAttribute('aria-hidden','true');el.append(icon,document.createTextNode(name));el.onclick=()=>interact(id);$('marks').append(el);markers.push({anchor,id,el,pos:new THREE.Vector3()})}
function enter(n){
 const review=REVIEW_ROOMS.find(r=>r.n===n);
 if(review){book.room=n;save();location.assign(review.href);return}
 opening=null;document.body.classList.remove('opening');$('exitNotice').hidden=true;
 discardRoom(scene,root);markers=[];$('marks').replaceChildren();room=SCHOOL_ROOMS.find(r=>r.n===n)||SCHOOL_ROOMS[0];
 book.room=room.n;save();yaw=0;pitch=-.055;facingTarget=moving=null;keys.clear();
 camera.position.set(0,1.56,.44);root=buildRoom(scene,room,mark);
 hinge=root.getObjectByName('doorHinge');
 if(progress().escaped){
   hinge.rotation.y=doorway.angle;
   const view=doorView();yaw=view.yaw;pitch=view.pitch;showExit();
 }
 for(const m of markers)m.anchor.getWorldPosition(m.pos);
 renderer.shadowMap.needsUpdate=true;$('roomNo').textContent=room.n+'호';$('roomTitle').textContent=room.place;sync();
 clearTimeout(tipTimer);$('tip').classList.remove('on');
 if(!progress().escaped)tip(room.name+' · 교실의 물건을 살펴보세요.');
 focusGame();

}
function targetLook(y,p=pitch){facingTarget={y:yaw+wrap(y-yaw),p};dirty=true}
function turn(s){if(opening)return;const current=facingTarget?facingTarget.y:yaw;targetLook((Math.round(current/(Math.PI/2))+s)*Math.PI/2,-.045)}
function walk(dx,dz){const x=limit(camera.position.x+dx,-2.05,2.05),z=limit(camera.position.z+dz,-2.05,2.05);camera.position.set(x,1.56,z);dirty=true}
function step(){if(opening)return;const dx=Math.sin(yaw),dz=-Math.cos(yaw);moving={x:limit(camera.position.x+dx*.70,-2.05,2.05),z:limit(camera.position.z+dz*.70,-2.05,2.05)};dirty=true;focusGame()}
function place(){
 camera.rotation.order='YXZ';camera.rotation.set(pitch,-yaw,0,'YXZ');camera.updateMatrixWorld();const W=innerWidth,H=innerHeight;
 for(const m of markers){const v=m.pos.clone().project(camera);const visible=!(progress().solved&&m.id==='station')&&v.z>0&&v.z<1&&Math.abs(v.x)<.91&&Math.abs(v.y)<.79;m.el.hidden=!visible;if(visible){m.el.style.left=limit((v.x+1)*W/2,70,W-70)+'px';m.el.style.top=limit((1-v.y)*H/2,65,H-78)+'px'}}
 $('bearing').textContent=angles[((Math.round(yaw/(Math.PI/2))%4)+4)%4];
}
function tick(ms){
 requestAnimationFrame(tick);const dt=Math.min(.05,(ms-clockLast)/1000||0);clockLast=ms;
 if(opening){animateDoor(limit((ms-opening.start)/1500,0,1))}
 else if(!dlg.open){if(facingTarget){const f=1-Math.exp(-dt*13);yaw+=wrap(facingTarget.y-yaw)*f;pitch+=(facingTarget.p-pitch)*f;dirty=true;if(Math.abs(wrap(facingTarget.y-yaw))<.002&&Math.abs(facingTarget.p-pitch)<.002){yaw=facingTarget.y;pitch=facingTarget.p;facingTarget=null}}
 if(moving){const x=moving.x-camera.position.x,z=moving.z-camera.position.z;walk(x*(1-Math.exp(-dt*12)),z*(1-Math.exp(-dt*12)));if(Math.hypot(x,z)<.008)moving=null}
 if(keys.size){const h=Number(keys.has('arrowright'))-Number(keys.has('arrowleft')),v=Number(keys.has('arrowup'))-Number(keys.has('arrowdown'));yaw+=h*dt*1.65;pitch=limit(pitch+v*dt*1.4,-1.52,1.52);
 const d=Number(keys.has('w'))-Number(keys.has('s')),s=Number(keys.has('d'))-Number(keys.has('a'));walk((Math.sin(yaw)*d+Math.cos(yaw)*s)*dt*1.7,(-Math.cos(yaw)*d+Math.sin(yaw)*s)*dt*1.7);dirty=true}}
 if(dirty){place();renderer.render(scene,camera);dirty=false}
}
function resize(){renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.6));renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.fov=innerWidth/innerHeight<.85?77:64;camera.updateProjectionMatrix();dirty=true}
let drag=null;
canvas.onpointerdown=e=>{if(opening||e.button!==0)return;drag={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);facingTarget=null;focusGame()};
canvas.onpointermove=e=>{if(!drag)return;const k=1.65/Math.max(300,Math.min(innerWidth,innerHeight));yaw-=(e.clientX-drag.x)*k;pitch=limit(pitch+(e.clientY-drag.y)*k,-1.52,1.52);drag={x:e.clientX,y:e.clientY};dirty=true};
canvas.onlostpointercapture=canvas.onpointerup=canvas.onpointercancel=()=>{drag=null};
window.addEventListener('keydown',e=>{if(opening||dlg.open||!room||e.altKey||e.ctrlKey||e.metaKey)return;const k=e.key.toLowerCase();if(['w','a','s','d','arrowright','arrowleft','arrowup','arrowdown'].includes(k)){e.preventDefault();facingTarget=null;moving=null;keys.add(k)}});
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>{keys.clear();drag=null});
$('directory').onclick=directory;$('journal').onclick=journal;$('help').onclick=help;$('turnL').onclick=()=>turn(-1);$('turnR').onclick=()=>turn(1);$('step').onclick=step;
const requestedRoom=Number(new URLSearchParams(location.search).get('room'));
const firstRoom=SCHOOL_ROOMS.some(r=>r.n===requestedRoom)?requestedRoom:203;
const firstReview=REVIEW_ROOMS.find(r=>r.n===firstRoom);
if(firstReview){location.replace(firstReview.href)}
else try{
 renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;
 scene=new THREE.Scene();scene.background=new THREE.Color(0x46313c);camera=new THREE.PerspectiveCamera(64,1,.055,40);resize();window.addEventListener('resize',resize);enter(firstRoom);if(requestedRoom===firstRoom)history.replaceState(null,'',location.pathname);requestAnimationFrame(tick);
}catch(err){$('fatal').hidden=false;$('fatal').innerHTML='<b>3D 교실을 열 수 없어요.</b><p>WebGL을 지원하는 브라우저에서 하드웨어 가속을 켠 뒤 다시 열어 주세요.</p>';console.error(err)}
