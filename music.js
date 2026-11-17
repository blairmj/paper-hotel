'use strict';
const byId=id=>document.getElementById(id);
const dialog=byId('inspect'),content=byId('panelBody'),closeButton=byId('dismiss');
const saveKey='paperhotel.explore.v1';
const examples=[
  {a:9,b:6,value:54,shape:'┐'},{a:12,b:3,value:36,shape:'└'},
  {a:3,b:6,value:18,shape:'┌'},{a:9,b:12,value:108,shape:'┘'}
];
function readBook(){
  try{const book=JSON.parse(localStorage.getItem(saveKey));if(book&&typeof book.visits==='object'&&book.visits)return book}catch{}
  return {room:203,visits:{}};
}
function newVisit(){return {paper:false,overlaid:false,solved:false,digits:[0,0]}}
let visit=newVisit();
const saved=readBook().visits[203]?.clockPuzzle;
if(saved && typeof saved==='object'){
  visit.paper=saved.paper===true;visit.overlaid=visit.paper&&saved.overlaid===true;visit.solved=saved.solved===true;
  if(Array.isArray(saved.digits)&&saved.digits.length===2&&saved.digits.every(n=>Number.isInteger(n)&&n>=0&&n<=9))visit.digits=saved.digits.slice();
}
let world,view='',opening=false,overlay=false,example=0,timer;
function storeVisit(restart=false){
  const book=readBook(),old=book.visits[203]||{};
  book.room=203;
  book.visits[203]={found:[],tests:[],...old,clockPuzzle:visit,
    solved:!!((!restart&&old.solved)||visit.solved),escaped:!!((!restart&&old.escaped)||visit.solved)};
  try{localStorage.setItem(saveKey,JSON.stringify(book))}catch{}
}
function toast(message){
  const el=byId('toast');el.textContent=message;el.classList.add('on');
  clearTimeout(timer);timer=setTimeout(()=>el.classList.remove('on'),3300);
}
function modal(id,tag,title,html,initial=false){
  if(opening)return;
  world?.clearKeys();view=id;dialog.classList.toggle('welcome',initial);
  byId('panelTag').textContent=tag;byId('panelTitle').textContent=title;
  content.innerHTML=html;closeButton.hidden=initial;
  if(!dialog.open)dialog.showModal();dialog.scrollTop=0;
}
function closePanel(){if(dialog.open)dialog.close();view='';byId('roomView').focus({preventScroll:true})}
function action(host,text,fn,primary=false){
  const b=document.createElement('button');b.type='button';b.textContent=text;if(primary)b.className='primary';b.onclick=fn;host.append(b);return b;
}
function row(){const div=document.createElement('div');div.className='actions';content.append(div);return div}
function guide(initial){
  modal(initial?'welcome':'help','203호 · 음악실',initial?'멈춘 벽시계':'음악실 둘러보기',
    '<p>음악실 문이 잠겨 있어요. 피아노 위에 누군가 악보 한 장을 펼쳐 두었네요.</p>'+
    '<div class="instructions"><div><strong>둘러보기</strong>화면을 끌거나 아래의 ‹ › 를 누르세요.</div><div><strong>조사하기</strong>물건이나 이름표를 누르면 가까이에서 볼 수 있어요.</div></div>'+
    '<p>방 안의 단서로 문 옆 다이얼을 맞히면 문이 저절로 열려요.</p>',initial);
  action(row(),initial?(visit.paper?'이어서 탐색하기':'음악실 둘러보기'):'탐색으로 돌아가기',closePanel,true);
}
function point(n,length,center=50){
  const angle=(n%12)*Math.PI/6;
  return [center+Math.sin(angle)*length,center-Math.cos(angle)*length];
}
function hand(a,b,center,radius,stroke,width){
  const [ax,ay]=point(a,radius,center),[bx,by]=point(b,radius,center);
  return '<path d="M'+ax+' '+ay+'L'+center+' '+center+'L'+bx+' '+by+'" fill="none" stroke="'+stroke+'" stroke-width="'+width+'" stroke-linecap="round" stroke-linejoin="round"/>';
}
function corner(pair,color='#9d4d36'){
  return '<svg viewBox="0 0 60 60" aria-hidden="true">'+hand(pair.a,pair.b,30,19,color,3.1)+'<circle cx="30" cy="30" r="3" fill="'+color+'"/></svg>';
}
function sheet(){
  return '<div class="clue-sheet" aria-label="투명 악보의 네 가지 기록"><div class="samples">'+
    examples.map(e=>'<div class="sample" aria-label="'+e.shape+' 모양은 '+e.value+'">'+corner(e)+'<span>= '+e.value+'</span></div>').join('')+'</div></div>';
}
function paper(){
  modal('paper','피아노','악보 사이의 투명한 종이','<p>악보를 들추자 네 개의 꺾은선과 숫자가 보입니다. 선이 꺾이는 곳마다 작은 점이 찍혀 있어요.</p>'+sheet());
  const a=row();
  if(!visit.paper){
    action(a,'투명 악보 챙기기',()=>{visit.paper=true;storeVisit();byId('bagCount').textContent='1';closePanel();toast('투명 악보를 챙겼어요. 방을 돌려 벽시계를 찾아보세요.')},true);
  }else action(a,'탐색으로 돌아가기',closePanel,true);
}
function inventory(){
  modal('bag','소지품',visit.paper?'투명 악보':'빈 악보 가방',visit.paper?sheet():'<p>아직 챙긴 물건이 없어요. 피아노 위를 살펴보세요.</p>');
  action(row(),'탐색으로 돌아가기',closePanel,true);
}
function clockDrawing(pair){
  let s='<svg class="clock-face" viewBox="0 0 200 200" role="img" aria-label="'+(pair?'악보 선의 두 끝이 가리키는 수: '+pair.a+', '+pair.b:'시곗바늘은 12와 6을 가리킵니다.')+'"><circle cx="100" cy="100" r="95" fill="#3f6051"/><circle cx="100" cy="100" r="88" fill="#fff2d8"/>';
  for(let n=1;n<=12;n++){
    const [x,y]=point(n,72,100),lit=pair&&(n===pair.a||n===pair.b);
    if(lit)s+='<circle cx="'+x+'" cy="'+y+'" r="12" fill="#b65e41"/>';
    s+='<text x="'+x+'" y="'+(y+5.4)+'" text-anchor="middle" font-family="Georgia,serif" font-size="16" fill="'+(lit?'#fff5de':'#35453a')+'">'+n+'</text>';
  }
  const opacity=pair?'.23':'1';
  s+='<g opacity="'+opacity+'"><path d="M100 100V44" stroke="#2e3a32" stroke-width="4" stroke-linecap="round"/><path d="M100 100v43" stroke="#2e3a32" stroke-width="6" stroke-linecap="round"/></g>';
  if(pair)s+='<g class="film"><rect x="21" y="21" width="158" height="158" rx="5" fill="#d1dfbd" fill-opacity=".13" stroke="#87947d" stroke-dasharray="3 3"/>'+hand(pair.a,pair.b,100,57,'#ab4b34',4)+'</g>';
  return s+'<circle cx="100" cy="100" r="4.5" fill="#774c35"/></svg>';
}
function clockPanel(){
  const pair=overlay?examples[example]:null;
  modal('clock','벽시계','멈춘 두 바늘','<div class="clock-area">'+clockDrawing(pair)+'</div>'+
    (pair?'<p class="readout">악보의 기록: '+pair.value+'　·　선의 두 끝: '+pair.a+', '+pair.b+'</p><div class="tabs" id="recordTabs" aria-label="겹쳐 볼 기록"></div>':
    '<p>시계가 멈춰 있습니다. 두 바늘이 만나는 곳에 작은 점이 있어요.</p>'));
  if(pair){
    examples.forEach((e,i)=>{
      const t=action(byId('recordTabs'),'',()=>{example=i;clockPanel();byId('recordTabs').children[i].focus()});
      t.innerHTML=corner(e,'currentColor')+e.value;t.setAttribute('aria-label',e.value+' 기록 겹치기');t.setAttribute('aria-pressed',String(i===example));
    });
  }
  const a=row();
  if(visit.paper){
    action(a,pair?'악보 걷고 시곗바늘 보기':'투명 악보 겹치기',()=>{overlay=!overlay;if(overlay){visit.overlaid=true;storeVisit()}clockPanel()},true);
  }else content.insertAdjacentHTML('beforeend','<p>피아노 위에 남은 악보가 떠오릅니다.</p>');
  action(a,'탐색으로 돌아가기',closePanel);
  if(pair)content.insertAdjacentHTML('beforeend','<details class="hint"><summary>단서가 더 필요해요</summary><p>첫 기록에서 9와 6을 어떻게 계산하면 54가 될까요? 다른 기록에도 같은 방법을 써 보세요.</p></details>');
}
function solve(){
  if(opening||visit.solved)return;
  visit.solved=true;storeVisit();closePanel();opening=true;
  byId('toast').classList.remove('on');byId('spots').inert=true;
  world.facingDoor(()=>{opening=false;byId('escape').hidden=false;byId('nextRoom').focus({preventScroll:true})});
}
function lock(){
  modal('lock','출입문','두 자리 다이얼','<p>숫자 바퀴 위에 작은 글씨가 새겨져 있어요. “멈춘 두 바늘의 모양을 숫자로 바꾸세요.”</p><div class="switches" id="wheels"></div><p class="readout" id="lockReadout" role="status">다이얼을 돌려 보세요.</p>');
  let digitsChanged=false;
  const outputs=[];
  function rotate(i,amount){
    visit.digits[i]=(visit.digits[i]+amount+10)%10;
    outputs[i].textContent=String(visit.digits[i]);
    world.setDigits(visit.digits);
    if(visit.digits.join('')===SCHOOL_ROOMS[0].answer){solve();return}
    storeVisit();
    if(!digitsChanged){byId('lockReadout').textContent='문이 잠겨 있어요.';digitsChanged=true}
  }
  for(let i=0;i<2;i++){
    const label=i?'일의 자리':'십의 자리',wheel=document.createElement('div');wheel.className='digit';
    const title=document.createElement('small');title.textContent=label;wheel.append(title);byId('wheels').append(wheel);
    action(wheel,'▲',()=>rotate(i,1)).setAttribute('aria-label',label+' 올리기');
    const out=document.createElement('output');out.setAttribute('aria-label',label);out.textContent=String(visit.digits[i]);outputs.push(out);wheel.append(out);
    action(wheel,'▼',()=>rotate(i,-1)).setAttribute('aria-label',label+' 내리기');
  }
  content.insertAdjacentHTML('beforeend','<details class="hint"><summary>힌트 보기</summary><p>'+(visit.overlaid?'악보를 걷었을 때 실제 시곗바늘 두 개가 가리킨 수에 같은 규칙을 적용하세요.':'피아노에서 챙긴 투명 악보의 점을 벽시계의 중심에 맞춰 보세요.')+'</p></details>');
  action(row(),'탐색으로 돌아가기',closePanel);
}
function directory(){
  modal('map','학교 안내도','2층 교실','<div class="map-list" id="classList"></div>');
  for(const r of SCHOOL_ROOMS){
    const el=document.createElement('a');el.textContent=r.n+'호 · '+r.place;
    el.href=r.n===203?'music.html':'index.html?room='+r.n;
    if(r.n===203)el.onclick=e=>{e.preventDefault();closePanel()};
    byId('classList').append(el);
  }
}
closeButton.onclick=closePanel;
dialog.addEventListener('cancel',e=>{if(view==='welcome'){e.preventDefault();return}view=''});
dialog.addEventListener('close',()=>{if(!dialog.open)view=''});
byId('guide').onclick=()=>guide(false);byId('bag').onclick=inventory;byId('map').onclick=directory;
byId('replay').onclick=()=>{visit=newVisit();overlay=false;example=0;opening=false;byId('escape').hidden=true;byId('spots').inert=false;byId('bagCount').textContent='0';world.reset();storeVisit(true);guide(true)};
function failed(){
  modal('error','음악실','교실을 불러오지 못했어요.','<p>연결을 확인한 뒤 다시 열어 주세요.</p>',true);
  action(row(),'다시 열기',()=>location.reload(),true);
}
createMusicWorld({
  onInspect:id=>{if(!opening&&!visit.solved){if(id==='paper')paper();if(id==='clock'){overlay=false;clockPanel()}if(id==='lock')lock()}},
  onReadyToMove:()=>!dialog.open&&!opening,
  onError:failed
}).then(w=>{
  if(!w)return;
  world=w;byId('bagCount').textContent=visit.paper?'1':'0';world.reset(visit.solved,visit.digits);storeVisit();
  const next=SCHOOL_ROOMS.slice(1).find(r=>!readBook().visits[r.n]?.escaped);
  if(next){byId('nextRoom').href='index.html?room='+next.n;byId('nextRoom').textContent=next.place+'로 이동'}
  else{byId('nextRoom').textContent='학교 안내도';byId('nextRoom').onclick=e=>{e.preventDefault();directory()}}
  if(visit.solved){byId('escape').hidden=false;byId('spots').inert=true}
  else guide(true);
}).catch(failed);
