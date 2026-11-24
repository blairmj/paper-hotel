'use strict';

const CT = (() => {
  const lights=['1100','0110','0111','1001'];
  const wall=['..#..','.#..#','#..#.','..#..'];
  const motif=['북','짝','북','짝','딩','북','짝','북','짝','딩'];
  const signal=['길','짧','짧','길','길'];
  const tickets=[
    {name:'윤서',class:'5-2',id:'A17',time:'14:10'},
    {name:'민준',class:'5-2',id:'B24',time:'14:25'}
  ];
  const fields={name:'이름',class:'반',id:'접수번호',time:'입장 시각'};
  const cards=['★●★','●★●','★★●'];
  const posters=['별','달'];
  const cups=['별','달','해'];
  const blankCount=wall.join('').split('').filter(tile=>tile==='.').length;
  const clues={
    resetOrder:['칠판의 점검 기록','출입 패드에서 각 가로줄과 세로줄에 켜진 불이 짝수 개여야 합니다.'],
    powerNote:['모둠 책상의 점검 쪽지','출입 패드의 불 하나만 켜짐과 꺼짐이 뒤바뀌었습니다.'],
    paper:['피아노의 리듬 악보','북 짝 북 짝 딩','북 짝 북 짝 딩'],
    musicSample:['반복 띠 사용법','띠 안의 소리는 두 번 연주합니다.','띠 안에 다른 띠를 넣을 수 있습니다.'],
    printSamples:['벽화 밑그림','검은 칸은 물감을 막는 벽입니다.'],
    printRule:['물감 번짐 견본','물감은 상하좌우로 이어진 흰 칸에 번집니다.','모서리만 닿은 칸에는 번지지 않습니다.'],
    practiceRail:['연습대의 갈림판','흰 구슬을 여러 번 굴려 어느 쪽으로 가는지 살펴보세요.'],
    railNote:['실험 순서','흰 구슬 → 흰 구슬 → 파란 구슬','구슬이 지나간 갈림판만 반대쪽으로 돌아갑니다.'],
    broadcastRules:['방송 암호표','짧은 빛 하나 · 급식 안내','긴 빛 + 짧은 빛 · 날씨','긴 빛 + 긴 빛 · 신청곡'],
    broadcastLog:['신호등 수신 기록','긴 빛 · 짧은 빛 · 짧은 빛 · 긴 빛 · 긴 빛'],
    recordA:['판독기 점검 기록','두 판독기 중 한 대가 기호를 거꾸로 읽습니다.','정상 판독기는 카드의 기호를 왼쪽부터 읽습니다.'],
    recordB:['수리 순서','시험 카드 비교 → 한 대의 방향 전환 → 새 출입증 재검사'],
    printJobs:['오늘의 주문서','별 포스터 한 장, 달 포스터 한 장.','세 번째 차례가 끝날 때 두 장 모두 인쇄되어야 합니다.'],
    printManual:['기계 안내','한 기계는 한 차례에 한 장을 처리합니다.','스캔이 끝난 포스터는 다음 차례부터 인쇄할 수 있습니다.'],
    councilTickets:['나눠 준 접수증','윤서 · 5-2 · A17','민준 · 5-2 · B24'],
    councilNotice:['전광판 운영 약속','복도에는 이름을 공개하지 않습니다.','각자 접수증을 보고 자기 입장 시각을 찾을 수 있어야 합니다.']
  };

  function fresh(kind,random=Math.random){
    switch(kind){
      case 'classroom':return {cell:null};
      case 'music':return {program:[]};
      case 'art':return {drops:[],applied:false};
      case 'science':return {lower:random()<.5?'left':'right',practice:0,cup:''};
      case 'broadcast':return {channels:[]};
      case 'computer':return {fault:random()<.5?'A':'B',test:null,repair:null};
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
  function music(program){
    const stack=[[]];
    for(const token of program){
      if(token==='('){stack.push([]);continue}
      if(token===')'){
        if(stack.length===1||!stack.at(-1).length)return null;
        const notes=stack.pop();stack.at(-1).push(...notes,...notes);
      }else if(['북','짝','딩'].includes(token))stack.at(-1).push(token);
      else return null;
    }
    return stack.length===1?stack[0]:null;
  }
  function colorRegion(start){
    if(!Number.isInteger(start)||start<0||start>=20||wall[Math.floor(start/5)][start%5]!=='.')return [];
    const cells=[start],seen=new Set(cells);
    for(let i=0;i<cells.length;i++){
      const row=Math.floor(cells[i]/5),col=cells[i]%5;
      for(const [r,c] of [[row+1,col],[row-1,col],[row,col+1],[row,col-1]]){
        const n=r*5+c;
        if(wall[r]?.[c]==='.'&&!seen.has(n)){seen.add(n);cells.push(n)}
      }
    }
    return cells;
  }
  function pigments(drops){return drops.map(colorRegion)}
  function marblePath(top,lower){
    if(top==='right')return {cup:'해',nextTop:'left',nextLower:lower,lowerVisited:false};
    return {cup:lower==='left'?'별':'달',nextTop:'right',nextLower:lower==='left'?'right':'left',lowerVisited:true};
  }
  function experiment(lower){
    let top='left';return [0,1,2].map(()=>{const step=marblePath(top,lower);top=step.nextTop;lower=step.nextLower;return step});
  }
  function readerOutput(input,reader,fault,repair){
    return (reader===fault)!==(reader===repair)?Array.from(input).reverse().join(''):input;
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
  function validProgram(program){
    if(!validList(program,['북','짝','딩','(',')'],7))return false;
    return ['북','짝','딩','(',')'].every((v,i)=>program.filter(t=>t===v).length<=(i<3?1:2));
  }
  function restore(kind,s,base){
    if(!s||typeof s!=='object')return base;
    switch(kind){
      case 'classroom': if(Number.isInteger(s.cell)&&s.cell>=0&&s.cell<16)base.cell=s.cell;break;
      case 'music':if(validProgram(s.program))base.program=s.program.slice();break;
      case 'art':
        if(Array.isArray(s.drops)&&s.drops.length<=3&&new Set(s.drops).size===s.drops.length&&s.drops.every(n=>colorRegion(n).length)){
          base.drops=s.drops.slice();
          base.applied=s.applied===true&&base.drops.length===3;
        }
        break;
      case 'science':
        if(['left','right'].includes(s.lower))base.lower=s.lower;
        if(Number.isSafeInteger(s.practice)&&s.practice>=0)base.practice=s.practice;
        if(cups.includes(s.cup))base.cup=s.cup;break;
      case 'broadcast':if(validList(s.channels,Object.keys(BROADCAST_COMMANDS),3))base.channels=s.channels.slice();break;
      case 'computer':
        if(['A','B'].includes(s.fault))base.fault=s.fault;
        if(cards.includes(s.test)){base.test=s.test;if(['A','B'].includes(s.repair))base.repair=s.repair}
        break;
      case 'print':if(validList(s.jobs,['',...posters],6)&&s.jobs.length===6)base.jobs=s.jobs.slice();break;
      case 'council':if(validList(s.columns,Object.keys(fields),2)&&new Set(s.columns).size===s.columns.length)base.columns=s.columns.slice();break;
    }
    return base;
  }
  return {lights,wall,motif,signal,tickets,fields,cards,posters,cups,blankCount,clues,fresh,restore,parity,music,colorRegion,pigments,experiment,marblePath,readerOutput,schedule,validProgram};
})();
