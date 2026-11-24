'use strict';

const CTDeviceUI=(()=>{
  function element(host,tag,text,cls){
    const el=document.createElement(tag);
    if(cls)el.className=cls;
    if(text!==undefined)el.textContent=text;
    host.append(el);return el;
  }
  function button(host,text,fn,options={}){
    const el=element(host,'button',text,options.cls);
    el.type='button';el.onclick=fn;
    if(options.label)el.setAttribute('aria-label',options.label);
    if(options.pressed!=null)el.setAttribute('aria-pressed',String(options.pressed));
    el.disabled=!!options.disabled;return el;
  }
  function seq(host,values){
    const row=element(host,'div',undefined,'ct-seq');
    values.forEach(value=>element(row,'span',value));
    return row;
  }
  function board(host,bits,onClick){
    const grid=element(host,'div',undefined,'ct-led');
    bits.forEach((bit,i)=>button(grid,bit?'●':'○',()=>onClick(i),{
      label:(Math.floor(i/4)+1)+'행 '+(i%4+1)+'열 '+(bit?'켜짐':'꺼짐'),pressed:!!bit
    }));return grid;
  }
  function mural(host,paint,drops,onPick){
    const grid=element(host,'div',undefined,'ct-stamp-grid');
    CT.artRows.forEach((row,r)=>[...row].forEach((_,c)=>{
      const i=r*CT.artWidth+c,label=(r+1)+'행 '+(c+1)+'열',ink=paint.has(i),drop=drops.includes(i);
      const cell=onPick?button(grid,drop?'●':'',()=>onPick(i),{label:label+(drop?' 물감 방울':ink?' 칠한 칸':' 빈 칸'),pressed:drop}):element(grid,'span');
      cell.dataset.ink=String(ink);cell.dataset.tile=i;
      if(!onPick)cell.setAttribute('aria-label',label+(ink?' 파랑':' 흰색'));
    }));
    return grid;
  }
  function targetMural(host){
    const painted=new Set([...CT.artRows.join('')].flatMap((tile,i)=>tile==='#'?[i]:[]));
    return mural(host,painted,[],null);
  }
  function lamps(host){
    const row=element(host,'div',undefined,'ct-signal');
    row.setAttribute('aria-label','수신 순서');
    const nodes=CT.signal.map(length=>element(row,'span',length==='길'?'길게':'짧게',length==='길'?'long':'short'));
    let play=0;
    button(host,'신호 재생',()=>{
      const id=++play;let time=0;
      nodes.forEach((el,i)=>{
        const duration=CT.signal[i]==='길'?650:260;
        setTimeout(()=>{if(id===play&&el.isConnected)el.classList.add('active')},time);
        setTimeout(()=>{if(id===play)el.classList.remove('active')},time+duration);
        time+=duration+180;
      });
      nodes.forEach(el=>el.classList.remove('active'));
    });
  }
  function clue(id,host){
    const lines=CT.clues[id];
    if(!lines)return;
    if(id==='printSamples')targetMural(host);
    else if(id==='printRule'){
      element(host,'p',lines[1]);
      const demo=element(host,'div',undefined,'ink-demo');
      for(let i=0;i<3;i++)element(demo,'span',i===1?'●':'');
    }else if(id==='broadcastLog')lamps(host);
    else if(id==='broadcastRules'){
      const list=element(host,'div',undefined,'ct-codebook');
      for(const {label,code} of Object.values(BROADCAST_COMMANDS)){element(list,'b',code.split(' ').map(v=>v==='길'?'━':'•').join(' '));element(list,'span',label+' ('+code+')')}
    }else for(const text of lines.slice(1))element(host,'p',text);
  }
  const rollTime=2100,restTime=950;
  function railSvg(top,lower,ball,cup){
    const towards=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
    const above=[150,43],below=[98,87],ends=[[36,151],[145,151],[254,151]];
    const line=(a,b,color,width,extra='')=>'<path d="M'+a.join(' ')+' L'+b.join(' ')+'" fill="none" stroke="'+color+'" stroke-width="'+width+'" stroke-linecap="round" '+extra+'/>';
    function fork(at,left,right,side){
      const go=side==='left'?left:right,stop=side==='left'?right:left;
      const arrow=towards(at,go,.48),bar=towards(at,stop,.32);
      const rot=Math.atan2(go[1]-at[1],go[0]-at[0])*180/Math.PI;
      const blockAngle=Math.atan2(stop[1]-at[1],stop[0]-at[0])*180/Math.PI;
      return line(at,left,'#a2b1c1',10)+line(at,right,'#a2b1c1',10)+line(at,go,'#126e72',7)+
        '<path d="M-7 -6 L4 0 L-7 6" fill="none" stroke="white" stroke-width="3" transform="translate('+arrow+') rotate('+rot+')"/>'+
        '<g transform="translate('+bar+') rotate('+blockAngle+')"><path d="M0 -8V8" stroke="#fff" stroke-width="8"/><path d="M0 -8V8" stroke="#b63438" stroke-width="5"/></g>'+
        '<circle cx="'+at[0]+'" cy="'+at[1]+'" r="4" fill="#244251"/>';
    }
    const chute=ends.map(([x,y],i)=>'<path d="M'+(x-16)+' '+(y-3)+'l3 12h26l3-12" fill="'+(cup===CT.cups[i]?'#f9ca65':'#e8ecee')+'" stroke="#44596b" stroke-width="2"/><text x="'+x+'" y="177" text-anchor="middle" font-family="sans-serif" font-size="13" fill="#21384a">'+CT.cups[i]+'</text>').join('');
    const travel='M150 9 L'+above.join(' ')+' '+(top==='right'?'L'+ends[2].join(' '):'L'+below.join(' ')+' L'+ends[lower==='left'?0:1].join(' '));
    const moving=ball?'<circle r="7.5" fill="'+(ball==='blue'?'#215edf':'#fff')+'" stroke="#1f3557" stroke-width="2.2"><animateMotion dur="'+rollTime+'ms" fill="freeze" path="'+travel+'"/></circle>':'';
    return '<svg xmlns="http://www.w3.org/2000/svg" class="ct-rail" viewBox="0 0 300 187" role="img" aria-label="위 갈림길 '+(top==='left'?'왼쪽':'오른쪽')+' 열림, 아래 갈림길 '+(lower==='left'?'왼쪽':'오른쪽')+' 열림"><rect width="300" height="187" rx="8" fill="#edf4f8"/>'+line([150,9],above,'#52697c',7)+fork(above,below,ends[2],top)+fork(below,ends[0],ends[1],lower)+chute+moving+'</svg>';
  }
  function open(kind,state,host,{save,solve,active,update,record,hasSample,visitReader},command){
    const controls=element(host,'div',undefined,'ct-controls');
    const status=element(host,'p','', 'ct-feedback');
    status.setAttribute('role','status');
    const alive=()=>host.isConnected&&active();
    const message=s=>{status.textContent=s};
    const incorrect=text=>{record('wrong');message(text)};
    const change=()=>{save();update()};
    const group=()=>element(controls,'div',undefined,'ct-buttons');
    const confirm=(label,fn)=>button(group(),label,()=>{if(alive())fn()},{cls:'primary'});
    const again=(label,fn)=>button(group(),label,()=>{if(alive()){fn();message('');change();draw()}});
    let busy=false;
    function draw(){
      controls.replaceChildren();
      if(kind==='classroom'){
        const bits=Array.from(CT.lights.join(''),Number);
        board(controls,bits,i=>{
          if(!alive())return;
          state.cell=i;change();
          if(CT.parity(i)){const btn=controls.querySelectorAll('button')[i];btn.textContent=bits[i]?'○':'●';btn.setAttribute('aria-pressed',String(!bits[i]));solve(300)}
          else incorrect('이 불을 바꾸어도 모든 줄이 짝수가 되지 않아요. 점검 기록을 다시 보세요.');
        });
      }else if(kind==='art'){
        const paint=CT.paintCells(state.drops);
        const pair=element(controls,'div',undefined,'ink-pair');
        if(hasSample){
          const sample=element(pair,'figure');element(sample,'figcaption','작업대 견본');targetMural(sample);
        }
        const work=element(pair,'figure');element(work,'figcaption','내 물감판');
        mural(work,paint,state.drops,i=>{
          if(!alive())return;
          const at=state.drops.indexOf(i);
          if(at>=0)state.drops.splice(at,1);
          else if(state.drops.length<CT.inkLimit)state.drops.push(i);
          else{message('놓은 방울을 한 번 더 누르면 거둘 수 있어요.');return}
          change();message('');draw();
          if(CT.artSolved(state.drops)){message('견본과 같은 무늬예요.');solve(750);return}
          if(state.drops.length===CT.inkLimit)incorrect('견본과 다른 칸을 찾아 방울을 옮겨 보세요.');
        });
        element(controls,'p','남은 물감 '+(CT.inkLimit-state.drops.length)+'방울');
        if(!hasSample)element(controls,'p','작업대에서 완성 견본을 찾아보세요.');
        if(state.drops.length)again('마지막 방울 거두기',()=>state.drops.pop());
      }else if(kind==='science'){
        let top='left',lower=state.lower;
        const view=element(controls,'div');view.innerHTML=railSvg(top,lower,null,state.cup);
        element(controls,'p','화살표는 열린 길, 빨간 가로막대는 막힌 길이에요.','rail-legend');
        const choices=group();
        for(const cup of CT.cups)button(choices,cup+' 컵',()=>{if(!busy&&alive()){state.cup=cup;change();message('');draw()}},{pressed:state.cup===cup});
        confirm('세 구슬 굴리기',async()=>{
          if(busy)return;
          if(!state.cup){message('파란 구슬이 떨어질 컵을 먼저 골라 보세요.');return}
          busy=true;controls.querySelectorAll('button').forEach(b=>{b.disabled=true});record('prediction',state.cup);
          const steps=CT.experiment(lower);
          for(const [i,step] of steps.entries()){
            if(!alive())return;
            view.innerHTML=railSvg(top,lower,i===2?'blue':'white',state.cup);
            message(['첫 번째 흰 구슬','두 번째 흰 구슬','마지막 파란 구슬'][i]);
            await new Promise(done=>setTimeout(done,rollTime+90));if(!alive())return;
            top=step.nextTop;lower=step.nextLower;view.innerHTML=railSvg(top,lower,null,state.cup);
            message((i===2?'파란 구슬':'흰 구슬')+'이 '+step.cup+' 컵에 도착했어요.');
            await new Promise(done=>setTimeout(done,restTime));
          }
          if(!alive())return;
          busy=false;
          if(steps[2].cup===state.cup)solve(350);
          else{draw();incorrect('파란 구슬은 '+steps[2].cup+' 컵에 도착했어요. 처음 위치에서 다시 살펴보세요.')}
        });
      }else if(kind==='broadcast'){
        const order=element(controls,'ol',undefined,'ct-seq ct-broadcast-order');
        order.setAttribute('aria-label','방송 순서');
        ['첫 방송','두 번째','세 번째'].forEach((label,i)=>{
          const slot=element(order,'li');
          element(slot,'small',label);element(slot,'strong',BROADCAST_COMMANDS[state.channels[i]]?.label??'―');
        });
        const keys=group();
        for(const [id,{label}] of Object.entries(BROADCAST_COMMANDS))button(keys,label,()=>addChannel(id),{disabled:state.channels.length>=3});
        again('마지막 방송 빼기',()=>state.channels.pop());
        confirm('방송 시작',()=>{
          const decoded=state.channels.map(id=>BROADCAST_COMMANDS[id].code).join(' ');
          if(state.channels.length===3&&decoded===CT.signal.join(' '))solve();
          else if(state.channels.length<3)message('아직 빈 방송 자리가 있어요.');
          else incorrect('고른 방송을 불빛으로 바꾸면, 신호등에서 본 순서와 같을까요?');
        });
      }else if(kind==='computer'){
        const keys=group();
        for(const card of CT.cards)button(keys,card,()=>{
          if(!alive()||state.test===card)return;
          state.test=card;state.seen=[];state.repair=null;record('test',card);change();message('');draw();
        },{label:'시험 카드 '+card,pressed:state.test===card});
        if(!state.test)return;
        const stations=group();
        for(const id of ['A','B'])button(stations,id+' 판독기로 가기',()=>visitReader('reader'+id));
        element(controls,'p','확인한 판독기 '+(state.seen.join(' · ')||'없음'));
        if(state.seen.length===2&&!state.repair&&state.test===[...state.test].reverse().join(''))message('앞뒤가 똑같은 카드예요. 다른 카드도 시험해 보세요.');
        confirm('새 출입증 ▲●★ 검사',()=>{
          if(!state.repair){message('두 판독기에서 시험한 뒤 거꾸로 읽는 쪽의 방향을 바꿔 보세요.');return}
          if(['A','B'].every(id=>CT.readerOutput('▲●★',id,state.fault,state.repair)==='▲●★')){message('새 출입증을 바르게 읽었어요.');solve(550)}
          else incorrect('새 출입증도 거꾸로 읽는 곳이 있어요. 방향을 다시 확인해 보세요.');
        });
      }else if(kind==='readerA'||kind==='readerB'){
        const id=kind.slice(-1);
        if(!state.test){element(controls,'p','문 옆 카드함에서 시험 카드를 가져오세요.');button(group(),'카드함으로 가기',()=>visitReader('lock'));return}
        element(controls,'p','가져온 카드  '+state.test);
        confirm('시험 카드 읽기',()=>{
          if(!state.seen.includes(id))state.seen.push(id);
          change();message('');draw();
        });
        if(state.seen.includes(id)){
          const result=element(controls,'output',CT.readerOutput(state.test,id,state.fault,state.repair),'reader-result');
          result.setAttribute('aria-label',id+' 판독 결과');
          button(group(),id+' 방향 바꾸기',()=>{
            if(!alive())return;
            if(state.seen.length<2){message('같은 카드를 다른 판독기에도 넣어 보세요.');return}
            if(state.test===[...state.test].reverse().join('')){message('앞뒤가 똑같은 카드예요. 다른 시험 카드를 가져오세요.');return}
            state.repair=state.repair===id?null:id;change();draw();message(state.repair?'방향을 바꿨어요. 카드함에서 새 출입증으로 확인하세요.':'처음 방향으로 돌렸어요.');
          },{pressed:state.repair===id});
        }
        const travel=group(),other=id==='A'?'B':'A';
        button(travel,other+' 판독기로 가기',()=>visitReader('reader'+other));
        button(travel,'카드함으로 가기',()=>visitReader('lock'));
      }else if(kind==='print'){
        const grid=element(controls,'div',undefined,'ct-jobs');
        for(const t of ['차례','스캐너','프린터'])element(grid,'strong',t);
        for(let i=0;i<3;i++){
          element(grid,'span',(i+1)+'차례');
          for(let k=0;k<2;k++){
            const index=2*i+k,select=element(grid,'select');select.setAttribute('aria-label',(i+1)+'차례 '+(k?'프린터':'스캐너'));
            for(const value of ['',...CT.posters]){const o=element(select,'option',value?value+' 포스터':'쉬기');o.value=value}
            select.value=state.jobs[index];select.onchange=()=>{if(alive()){state.jobs[index]=select.value;message('');change()}};
          }
        }
        confirm('작업표 실행',()=>{const error=CT.schedule(state.jobs);if(error)incorrect(error);else{message('별 한 장, 달 한 장 인쇄 완료');solve(480)}});
      }else if(kind==='council'){
        const keys=group();
        for(const [id,label] of Object.entries(CT.fields))button(keys,label,()=>{
          if(!alive())return;const i=state.columns.indexOf(id);
          if(i>=0)state.columns.splice(i,1);
          else if(state.columns.length<2)state.columns.push(id);
          else{message('선택한 항목을 하나 눌러 빼고 바꾸세요.');return}
          change();message('');draw();
        },{pressed:state.columns.includes(id)});
        const preview=element(controls,'table',undefined,'ct-display');
        const header=preview.createTHead().insertRow(),body=preview.createTBody();
        const cols=[0,1].map(i=>state.columns[i]);
        for(const id of cols)element(header,'th',CT.fields[id]??'―');
        for(const ticket of CT.tickets){const row=body.insertRow();for(const id of cols)element(row,'td',ticket[id]??'―')}
        confirm('전광판 게시',()=>{
          if(state.columns.includes('name'))incorrect('복도에서 누구나 이름을 볼 수 있어요. 운영 약속을 확인하세요.');
          else if(!state.columns.includes('time'))incorrect('입장할 시각이 보이지 않아요.');
          else if(!state.columns.includes('id'))incorrect('두 학생은 같은 반이에요. 각자 자기 줄을 찾을 수 있을까요?');
          else solve(450);
        });
      }
    }
    function addChannel(id){if(alive()&&state.channels.length<3){state.channels.push(id);change();message('');draw()}}
    draw();if(kind==='broadcast'&&BROADCAST_COMMANDS[command])addChannel(command);
  }
  return {open,clue,railSvg};
})();
