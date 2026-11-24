'use strict';

const MusicClock=(()=>{
function hand(a,b,center,radius,stroke,width){
  const [ax,ay]=clockPoint(a,radius,center),[bx,by]=clockPoint(b,radius*.74,center);
  return '<g fill="none" stroke="'+stroke+'" stroke-linecap="round">'+
    '<path d="M'+center+' '+center+'L'+ax+' '+ay+'" stroke-width="'+width*.65+'"/>'+
    '<path d="M'+center+' '+center+'L'+bx+' '+by+'" stroke-width="'+width+'"/></g>';
}
function scoreHands(pair,color='#3a657e'){
  return '<svg viewBox="3 3 54 54" aria-hidden="true">'+hand(pair.a,pair.b,30,21,color,3.2)+'<circle cx="30" cy="30" r="3" fill="'+color+'"/></svg>';
}
function sheet(){
  return '<div class="clue-sheet" role="list" aria-label="투명 악보 기록"><div class="samples">'+
    MUSIC_SCORE.map(e=>'<div class="sample" role="listitem" aria-label="'+e.a+'시와 '+e.b+'시 방향의 두 바늘, 기록 '+e.value+'"><span class="notation">'+scoreHands(e)+'</span><span>= '+e.value+'</span></div>').join('')+'</div></div>';
}
function clockDrawing(pair){
  let s='<svg class="clock-face" viewBox="0 0 200 200" role="img" aria-label="'+(pair?'악보 선의 두 끝이 가리키는 수: '+pair.a+', '+pair.b:'긴 바늘은 '+MUSIC_CLOCK.minuteMark+', 짧은 바늘은 '+MUSIC_CLOCK.hour+'를 가리킵니다.')+'"><circle cx="100" cy="100" r="95" fill="#3b4750"/><circle cx="100" cy="100" r="88" fill="#fbfcfc"/>';
  for(let n=1;n<=12;n++){
    const [x,y]=clockPoint(n,72,100),lit=pair&&(n===pair.a||n===pair.b);
    if(lit)s+='<circle cx="'+x+'" cy="'+y+'" r="12" fill="#497593"/>';
    s+='<text x="'+x+'" y="'+(y+5.4)+'" text-anchor="middle" font-family="Georgia,serif" font-size="16" fill="'+(lit?'#ffffff':'#2f3740')+'">'+n+'</text>';
  }
  const opacity=pair?'.23':'1';
  for(const [mark,length,width] of [[MUSIC_CLOCK.minuteMark,56,4],[MUSIC_CLOCK.hour,43,6]]){
    const [x,y]=clockPoint(mark,length,100);
    s+='<path opacity="'+opacity+'" d="M100 100L'+x+' '+y+'" stroke="#25323b" stroke-width="'+width+'" stroke-linecap="round"/>';
  }
  if(pair)s+='<g class="film"><rect x="21" y="21" width="158" height="158" rx="5" fill="#cfe1ef" fill-opacity=".13" stroke="#819dac" stroke-dasharray="3 3"/>'+hand(pair.a,pair.b,100,57,'#436f8c',4)+'</g>';
  return s+'<circle cx="100" cy="100" r="4.5" fill="#293941"/></svg>';
}

  function showPaper(){
    const collected=run.found.includes('paper');
    modal(collected?'내 악보':'피아노의 투명 악보',sheet(),'paper');
    if(!collected)action(actions(),'악보 얻기',()=>{collectClue('paper');close()},true);
  }

  function paidOverlay(host,open){
    if(run.device.overlay){
      action(host,'악보 겹치기',open);
      return;
    }
    const hint=action(host,'힌트 보기',()=>confirmRoomHint(countdown,()=>{
      run.device.overlay=true;save();open();
    }));
    hint.setAttribute('aria-haspopup','dialog');
  }

  function showClock(example=null){
    const pair=example===null?null:MUSIC_SCORE[example];
    modal('멈춘 벽시계','<div class="clock-area">'+clockDrawing(pair)+'</div>','clock');
    if(!run.found.includes('paper'))return;
    if(pair){
      const tabs=document.createElement('div');tabs.className='tabs';tabs.id='recordTabs';content.append(tabs);
      MUSIC_SCORE.forEach((record,i)=>{
        const button=action(tabs,'',()=>{showClock(i);byId('recordTabs').children[i].focus()});
        button.innerHTML=scoreHands(record,'currentColor')+record.value;
        button.setAttribute('aria-label',record.value+' 기록 겹치기');
        button.setAttribute('aria-pressed',String(i===example));
      });
      action(actions(),'악보 걷기',()=>showClock());
    }else paidOverlay(actions(),()=>showClock(0));
    const ref=document.createElement('details');ref.className='clock-score';
    ref.innerHTML='<summary>내 악보 보기</summary>'+sheet();content.append(ref);
  }

  function dial(){
    modal(puzzle.title,deviceInstructions()+'<div class="switches" id="wheels"></div>','lock');
    const digits=run.device.digits;
    const outputs=[];
    function turn(i,delta){
      if(opening||countdown.check())return;
      digits[i]=(digits[i]+delta+10)%10;outputs[i].textContent=digits[i];
      world.setDigits(run.device);save();
      if(Number(digits.join(''))===MUSIC_CLOCK.hour*MUSIC_CLOCK.minuteMark)solve(280);
    }
    ['십의 자리','일의 자리'].forEach((label,i)=>{
      const wheel=document.createElement('div');wheel.className='digit';byId('wheels').append(wheel);
      const up=action(wheel,'▲',()=>turn(i,1));up.setAttribute('aria-label',label+' 올리기');
      const n=document.createElement('output');n.textContent=digits[i];n.setAttribute('aria-label',label);wheel.append(n);outputs.push(n);
      const down=action(wheel,'▼',()=>turn(i,-1));down.setAttribute('aria-label',label+' 내리기');
    });
    paidOverlay(actions(),()=>{
      if(run.found.includes('paper')){close();world.inspectTarget('clock','overlay')}
      else modal('힌트','피아노 보면대에서 투명 악보를 챙기세요. 멈춘 벽시계에 겹쳐 볼 수 있어요.');
    });
  }
  return {showPaper,showClock,dial};
})();
