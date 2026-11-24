'use strict';

const CT = (() => {
  const lights=['1100','0110','0111','1001'];
  const artRows=['#.#.','###.','.##.','###.','####','#.##'];
  const artWidth=artRows[0].length, inkLimit=7;
  const signal=['길','짧','짧','길','길'];
  const tickets=[
    {name:'윤서',class:'5-2',id:'A17',time:'14:10'},
    {name:'민준',class:'5-2',id:'B24',time:'14:25'}
  ];
  const fields={name:'이름',class:'반',id:'접수번호',time:'입장 시각'};
  const cards=['★●★','●★●','★★●'];
  const padLog=[
    ['넣은 카드','패드에 뜬 기호'],
    ...['▲●★','★▲●'].map(card=>[card,readCard(card)].map(signs=>[...signs].join(' ')))
  ];
  const posters=['별','달'];
  const cups=['왼쪽','가운데','오른쪽'];
  const clues={
    powerNote:['모둠 책상의 점검 쪽지','출입 패드에서 불 하나가 반대로 표시되고 있어요.'],
    printSamples:['작업대의 완성 견본','파란 칸을 견본과 똑같이 칠하세요. 흰 칸은 그대로 두세요.'],
    printRule:['물감 번짐 견본','물감 한 방울은 떨어뜨린 칸과 바로 위·아래 한 칸씩을 칠해요.'],
    railNote:['실험 순서','흰 구슬 → 흰 구슬 → 파란 구슬','구슬이 지나간 갈림판만 반대쪽으로 돌아갑니다.'],
    broadcastRules:['방송 암호표','짧은 빛 하나 · 급식 안내','긴 빛 + 짧은 빛 · 날씨','긴 빛 + 긴 빛 · 신청곡'],
    broadcastLog:['신호등 수신 기록','긴 빛 · 짧은 빛 · 짧은 빛 · 긴 빛 · 긴 빛'],
    recordA:['출입 패드 점검 기록',...padLog.map(row=>row.join('　→　'))],
    recordB:['카드 보관 메모','카드는 이 책상의 옆 서랍에 있어요.'],
    printJobs:['오늘의 주문서','별 포스터 한 장, 달 포스터 한 장.','세 번째 차례가 끝날 때 두 장 모두 인쇄되어야 합니다.'],
    printManual:['기계 안내','한 기계는 한 차례에 한 장을 처리합니다.','스캔이 끝난 포스터는 다음 차례부터 인쇄할 수 있습니다.'],
    councilTickets:['나눠 준 접수증','윤서 · 5-2 · A17','민준 · 5-2 · B24'],
    councilNotice:['전광판 운영 약속','복도에는 이름을 공개하지 않습니다.','각자 접수증을 보고 자기 입장 시각을 찾을 수 있어야 합니다.']
  };

  function fresh(kind,random=Math.random){
    switch(kind){
      case 'classroom':return {cell:null};
      case 'music':return {digits:[0,0],overlay:false};
      case 'art':return {drops:[]};
      case 'science':return {lower:random()<.5?'left':'right',cup:''};
      case 'broadcast':return {channels:[]};
      case 'computer':return {card:null,wasRead:false};
      case 'print':return {jobs:Array(6).fill('')};
      case 'council':return {columns:[]};
    }
  }
  function parity(cell){
    if(!Number.isInteger(cell)||cell<0||cell>=16)return false;
    const bits=Array.from(lights.join(''),Number);
    bits[cell]=1-bits[cell];
    return lights.every((_,i)=>[bits.slice(i*4,i*4+4),bits.filter((v,k)=>k%4===i)].every(line=>line.reduce((a,b)=>a+b,0)%2===0));
  }
  function paintCells(drops){
    const cells=new Set();
    for(const cell of drops){
      for(const i of [cell-artWidth,cell,cell+artWidth])if(i>=0&&i<artWidth*artRows.length)cells.add(i);
    }
    return cells;
  }
  function artSolved(drops){
    if(drops.length!==inkLimit)return false;
    const paint=paintCells(drops);
    return [...artRows.join('')].every((v,i)=>paint.has(i)===(v==='#'));
  }
  function marblePath(top,lower){
    if(top==='right')return {cup:cups[2],nextTop:'left',nextLower:lower,lowerVisited:false};
    return {cup:cups[lower==='left'?0:1],nextTop:'right',nextLower:lower==='left'?'right':'left',lowerVisited:true};
  }
  function experiment(lower){
    let top='left';return [0,1,2].map(()=>{const step=marblePath(top,lower);top=step.nextTop;lower=step.nextLower;return step});
  }
  function readCard(card){
    return Array.from(card).reverse().join('');
  }
  function schedule(jobs){
    const scanned=new Set(),printed=new Set();
    for(let t=0;t<3;t++){
      const scan=jobs[2*t],print=jobs[2*t+1];
      if(print&&!scanned.has(print))return (t+1)+'차례에는 '+print+' 포스터의 스캔이 아직 끝나지 않았어요.';
      if(print&&printed.has(print))return print+' 포스터를 두 번 인쇄했어요.';
      if(scan&&scanned.has(scan))return scan+' 포스터를 두 번 스캔했어요.';
      if(print)printed.add(print);
      if(scan)scanned.add(scan);
    }
    return printed.size===2?'':'세 차례 안에 별과 달을 한 장씩 인쇄하세요.';
  }
  function validList(list,allowed,max){
    return Array.isArray(list)&&list.length<=max&&list.every(x=>allowed.includes(x));
  }
  function restore(kind,s,base){
    if(!s||typeof s!=='object')return base;
    switch(kind){
      case 'classroom': if(Number.isInteger(s.cell)&&s.cell>=0&&s.cell<16)base.cell=s.cell;break;
      case 'music':
        if(Array.isArray(s.digits)&&s.digits.length===2&&s.digits.every(n=>Number.isInteger(n)&&n>=0&&n<=9))base.digits=s.digits.slice();
        base.overlay=s.overlay===true;break;
      case 'art':
        if(Array.isArray(s.drops)&&s.drops.length<=inkLimit&&new Set(s.drops).size===s.drops.length&&s.drops.every(n=>Number.isInteger(n)&&n>=0&&n<artRows.length*artWidth))base.drops=s.drops.slice();
        break;
      case 'science':
        if(['left','right'].includes(s.lower))base.lower=s.lower;
        if(cups.includes(s.cup))base.cup=s.cup;break;
      case 'broadcast':if(validList(s.channels,Object.keys(BROADCAST_COMMANDS),3))base.channels=s.channels.slice();break;
      case 'computer':
        if(cards.includes(s.card)){
          base.card=s.card;
          base.wasRead=s.wasRead===true;
        }
        break;
      case 'print':if(validList(s.jobs,['',...posters],6)&&s.jobs.length===6)base.jobs=s.jobs.slice();break;
      case 'council':if(validList(s.columns,Object.keys(fields),2)&&new Set(s.columns).size===s.columns.length)base.columns=s.columns.slice();break;
    }
    return base;
  }
  return {lights,artRows,artWidth,inkLimit,paintCells,artSolved,signal,tickets,fields,cards,padLog,posters,cups,clues,fresh,restore,parity,experiment,marblePath,readCard,schedule};
})();
