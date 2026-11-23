'use strict';

const CTDeviceUI=(()=>{
  let audio;
  const paints=['#e99539','#6398cf','#70ad85'];
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
  function note(text){return text==='북'?113:text==='짝'?440:880}
  function listen(notes,tick,alive){
    try{audio??=new (window.AudioContext||window.webkitAudioContext)();audio.resume().catch(()=>{})}catch{}
    notes.forEach((n,i)=>setTimeout(()=>{
      if(!alive())return;
      tick(i);
      if(!audio||audio.state!=='running')return;
      const osc=audio.createOscillator(),gain=audio.createGain(),now=audio.currentTime;
      osc.type=n==='짝'?'triangle':'sine';osc.frequency.value=note(n);
      if(n==='북')osc.frequency.exponentialRampToValueAtTime(55,now+.16);
      gain.gain.setValueAtTime(.14,now);gain.gain.exponentialRampToValueAtTime(.001,now+.20);
      osc.connect(gain);gain.connect(audio.destination);osc.start(now);osc.stop(now+.21);
    },i*340));
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
  function mural(host,drops,fn){
    const grid=element(host,'div',undefined,'ct-mural');
    const regions=CT.pigments(drops);
    Array.from(CT.wall.join('')).forEach((tile,i)=>{
      const color=regions.findIndex(part=>part.includes(i));
      const label=(Math.floor(i/5)+1)+'행 '+(i%5+1)+'열';
      if(tile==='#'){const wall=element(grid,'span','', 'ct-wall');wall.setAttribute('aria-label',label+' 벽');return}
      const cell=fn?button(grid,drops.includes(i)?'●':'',()=>fn(i),{label:label+(color>=0?' 칠한 칸':' 흰 칸'),disabled:color>=0||drops.length>=3}):element(grid,'span','');
      if(color>=0)cell.style.background=paints[color];
    });
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
    if(id==='paper'){
      const row=seq(host,CT.motif);let count=0;
      button(host,'악보 들어 보기',()=>{const play=++count;
        listen(CT.motif,i=>{Array.from(row.children).forEach((n,j)=>n.classList.toggle('active',j===i))},()=>row.isConnected&&play===count)});
    }else if(id==='printSamples'){mural(host,[],null);element(host,'p',lines[1])}
    else if(id==='broadcastLog')lamps(host);
    else if(id==='broadcastRules'){
      const list=element(host,'div',undefined,'ct-codebook');
      for(const {label,code} of Object.values(BROADCAST_COMMANDS)){element(list,'b',code.split(' ').map(v=>v==='길'?'━':'•').join(' '));element(list,'span',label+' ('+code+')')}
    }else for(const text of lines.slice(1))element(host,'p',text);
  }
  function railSvg(top,lower,practice,ball,cup){
    const defs='<defs><pattern id="railGrid" width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.2" fill="#a7c6de"/></pattern></defs>';
    const paths=practice?'M150 14V46 M150 46L60 123 M150 46L240 123':'M150 14V44 M150 44L100 83 M150 44L241 142 M100 83L38 142 M100 83L137 142';
    const gate=(x,y,side)=>'<path d="M'+(x+(side==='left'?-17:17))+' '+(y+15)+' L'+x+' '+y+'" stroke="#c66b20" stroke-width="7" stroke-linecap="round"/><circle cx="'+x+'" cy="'+y+'" r="4" fill="#4e3c32"/>';
    const cups=practice?[[60,125,'왼쪽'],[240,125,'오른쪽']]:[[38,145,'별'],[137,145,'달'],[241,145,'해']];
    function outlet([x,y,name]){
      const selected=practice||name===cup;
      const marker=selected?'<path d="M'+(x-17)+' '+(y-4)+' l4 12 h26 l4 -12" fill="'+(practice?'#42728c':'#d07225')+'" stroke="#674a37" stroke-width="1.4"/>':'<path d="M'+(x-12)+' '+(y+6)+'h24" fill="none" stroke="#7899ae" stroke-dasharray="3 3"/>';
      return marker+'<text x="'+x+'" y="'+(y+27)+'" text-anchor="middle" fill="#193a53" font-size="13" font-weight="bold">'+name+'</text>';
    }
    const trail=practice?'M150 14V46 L'+(top==='left'?60:240)+' 121':'M150 14V44 '+(top==='right'?'L241 140':'L100 83 L'+(lower==='left'?38:137)+' 140');
    return '<svg class="ct-rail" aria-label="위 갈림판 '+(top==='left'?'왼쪽':'오른쪽')+(practice?'':', 아래 갈림판 '+(lower==='left'?'왼쪽':'오른쪽'))+'" viewBox="0 0 300 '+(practice?160:181)+'" role="img">'+defs+'<rect width="300" height="181" rx="9" fill="#e4eff6"/><rect width="300" height="181" fill="url(#railGrid)"/><path d="'+paths+'" fill="none" stroke="#a5b5c3" stroke-width="11" stroke-linejoin="round"/><path d="'+paths+'" fill="none" stroke="white" stroke-width="5"/>'+gate(150,practice?46:44,top)+(practice?'':gate(100,83,lower))+cups.map(outlet).join('')+(ball?'<circle r="7" fill="'+(ball==='blue'?'#2367d9':'#fff')+'" stroke="#416183" stroke-width="2"><animateMotion dur=".55s" fill="freeze" path="'+trail+'"/></circle>':'')+'</svg>';
  }
  function open(kind,state,host,{save,solve,active,update},command){
    const controls=element(host,'div',undefined,'ct-controls');
    const status=element(host,'p','', 'ct-feedback');
    status.setAttribute('role','status');
    const alive=()=>host.isConnected&&active();
    const message=s=>{status.textContent=s};
    const change=()=>{save();update()};
    const group=()=>element(controls,'div',undefined,'ct-buttons');
    const confirm=(label,fn)=>button(group(),label,()=>{if(alive())fn()},{cls:'primary'});
    const again=(label,fn)=>button(group(),label,()=>{if(alive()){fn();message('');change();draw()}});
    let busy=false,play=0;
    function draw(){
      controls.replaceChildren();
      if(kind==='classroom'){
        const bits=Array.from(CT.lights.join(''),Number);
        board(controls,bits,i=>{
          if(!alive())return;
          state.cell=i;change();
          if(CT.parity(i)){const btn=controls.querySelectorAll('button')[i];btn.textContent=bits[i]?'○':'●';btn.setAttribute('aria-pressed',String(!bits[i]));solve(300)}
          else message('이 불을 바꾸어도 모든 줄이 짝수가 되지 않아요. 점검 기록을 다시 보세요.');
        });
      }else if(kind==='music'){
        const labels={'(':'×2 [',')':']'};
        seq(controls,state.program.length?state.program.map(x=>labels[x]||x):['·']);
        const keys=group();
        for(const t of ['북','짝','딩','(',')']){
          const count=t==='('||t===')'?2:1;
          button(keys,labels[t]||t,()=>{
            if(!alive())return;
            state.program.push(t);change();message('');draw();
          },{label:t==='('?'반복 시작':t===')'?'반복 끝':t,disabled:state.program.filter(v=>v===t).length>=count});
        }
        again('마지막 카드 빼기',()=>state.program.pop());
        confirm('연주하기',()=>{
          const notes=CT.music(state.program);
          if(!notes){message('반복 띠의 시작과 끝을 짝지어 주세요.');return}
          if(!notes.length){message('먼저 소리 카드를 놓으세요.');return}
          const correct=state.program.length===7&&notes.join(' ')===CT.motif.join(' ');
          const id=++play;const playback=seq(controls,notes);
          listen(notes,i=>Array.from(playback.children).forEach((n,j)=>n.classList.toggle('active',j===i)),()=>id===play&&alive()&&playback.isConnected);
          if(correct){message('악보와 같은 리듬이에요.');solve(340*notes.length)}
          else message('연주한 리듬과 피아노 악보를 비교해 보세요.');
        });
      }else if(kind==='art'){
        element(controls,'p','남은 물감 '+(3-state.drops.length)+'방울');
        mural(controls,state.drops,i=>{
          if(!alive()||state.drops.length>=3)return;
          state.drops.push(i);change();draw();
          const used=new Set(CT.pigments(state.drops).flat()).size;
          if(used===CT.blankCount)solve(480);
        });
        again('새 도안으로 다시 칠하기',()=>{state.drops=[]});
      }else if(kind==='practiceRail'||kind==='science'){
        const practice=kind==='practiceRail';
        let top=practice&&state.practice%2?'right':'left',lower=state.lower;
        const view=element(controls,'div');view.innerHTML=railSvg(top,lower,practice,null,state.cup);
        if(practice){confirm('흰 구슬 굴리기',()=>{
          if(busy)return;busy=true;const old=top;
          view.innerHTML=railSvg(top,lower,true,'white');
          setTimeout(()=>{if(!alive())return;state.practice++;busy=false;change();draw();message('구슬이 '+(old==='left'?'왼쪽':'오른쪽')+' 컵에 떨어졌어요.');},600);
        });return}
        seq(controls,['① 흰 구슬','② 흰 구슬','③ 파란 구슬']);
        const choices=group();
        for(const cup of CT.cups)button(choices,cup+' 컵',()=>{if(!busy&&alive()){state.cup=cup;change();message('');draw()}},{pressed:state.cup===cup});
        confirm('세 구슬 굴리기',async()=>{
          if(busy)return;
          if(!state.cup){message('먼저 파란 구슬을 받을 컵을 고르세요.');return}
          busy=true;controls.querySelectorAll('button').forEach(b=>b.disabled=true);
          const steps=CT.experiment(lower);
          for(const [i,step] of steps.entries()){
            if(!alive())return;
            view.innerHTML=railSvg(top,lower,false,i===2?'blue':'white',state.cup);
            message((i+1)+'번째 '+(i===2?'파란':'흰')+' 구슬');
            await new Promise(done=>setTimeout(done,610));if(!alive())return;
            top=step.nextTop;lower=step.nextLower;
            view.innerHTML=railSvg(top,lower,false,null,state.cup);message((i+1)+'번째 구슬 → '+step.cup+' 컵');
            await new Promise(done=>setTimeout(done,270));
          }
          if(!alive())return;
          busy=false;
          if(steps[2].cup===state.cup)solve(350);
          else{draw();message('파란 구슬은 '+steps[2].cup+' 컵에 도착했어요. 갈림판을 처음 위치로 돌렸어요. 다시 예측해 보세요.')}
        });
      }else if(kind==='broadcast'){
        seq(controls,[0,1,2].map(i=>BROADCAST_COMMANDS[state.channels[i]]?.label??'―'));
        const keys=group();
        for(const [id,{label}] of Object.entries(BROADCAST_COMMANDS))button(keys,label,()=>addChannel(id),{disabled:state.channels.length>=3});
        again('마지막 방송 빼기',()=>state.channels.pop());
        confirm('방송 송출',()=>{
          const decoded=state.channels.map(id=>BROADCAST_COMMANDS[id].code).join(' ');
          if(state.channels.length===3&&decoded===CT.signal.join(' '))solve();
          else message('수신한 빛의 순서와 입력한 방송의 암호를 비교하세요.');
        });
      }else if(kind==='computer'){
        const keys=group();for(const card of CT.cards)button(keys,card,()=>{
          if(!alive())return;state.test=card;state.repair=null;change();message('');draw();
        },{label:'시험 카드 '+card,pressed:state.test===card});
        if(!state.test)return;
        const result=element(controls,'div',undefined,'ct-readers');
        for(const id of ['A','B']){
          const reader=element(result,'div');element(reader,'small','판독기 '+id);
          element(reader,'strong',CT.readerOutput(state.test,id,state.fault,state.repair));
          button(reader,id+' 방향 전환',()=>{
            if(!alive())return;
            if(CT.readerOutput(state.test,'A',state.fault,null)===CT.readerOutput(state.test,'B',state.fault,null)){
              message('두 판독기의 결과가 같아요. 결과가 달라지는 시험 카드를 먼저 찾아보세요.');return;
            }
            state.repair=state.repair===id?null:id;change();message('');draw();
          },{pressed:state.repair===id});
        }
        confirm('새 출입증 ▲●★ 재검사',()=>{
          if(!state.repair){message('검사 결과를 보고 고칠 판독기를 하나 고르세요.');return}
          const outputs=['A','B'].map(id=>CT.readerOutput('▲●★',id,state.fault,state.repair));
          message('새 출입증 ▲●★  ·  A '+outputs[0]+'  ·  B '+outputs[1]);
          if(outputs.every(x=>x==='▲●★'))solve(850);
          else message(status.textContent+'  방향을 다시 비교하세요.');
        });
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
        confirm('작업표 실행',()=>{const error=CT.schedule(state.jobs);if(error)message(error);else{message('별 한 장, 달 한 장 인쇄 완료');solve(480)}});
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
          if(state.columns.includes('name'))message('복도에서 누구나 이름을 볼 수 있어요. 운영 약속을 확인하세요.');
          else if(!state.columns.includes('time'))message('입장할 시각이 보이지 않아요.');
          else if(!state.columns.includes('id'))message('두 학생은 같은 반이에요. 각자 자기 줄을 찾을 수 있을까요?');
          else solve(450);
        });
      }
    }
    function addChannel(id){if(alive()&&state.channels.length<3){state.channels.push(id);change();message('');draw()}}
    draw();if(kind==='broadcast'&&BROADCAST_COMMANDS[command])addChannel(command);
  }
  return {open,clue,railSvg};
})();
