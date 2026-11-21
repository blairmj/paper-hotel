'use strict';

function roomInterior(kind){
  if(kind==='classroom')return ClassroomInterior;
  if(['art','music'].includes(kind))return SchoolInterior;
  if(['sports','computer'].includes(kind))return SportsComputerInteriors;
  return SpecialtyInteriors;
}

function schoolRoomDefinition(kind){return roomInterior(kind).definition(kind)}
function buildSchoolRoom(scene,room){return roomInterior(room.kind).build(scene,room)}

const RESET_GLYPHS={power:'⏻',link:'↔',check:'✓'};

function svgText(x,y,label,size=24,color='#34454d'){
  return '<text x="'+x+'" y="'+y+'" text-anchor="middle" font-size="'+size+'" fill="'+color+'">'+label+'</text>';
}

function resetDiagram(){
  return RESET_ORDER.map((key,i)=>{
    const x=100+i*200;
    return '<rect x="'+(x-62)+'" y="86" width="124" height="156" rx="9" fill="#e6efed" stroke="#9cb7af"/>'+
      svgText(x,165,RESET_GLYPHS[key],62,'#375e57')+svgText(x,218,RESET_KEYS[key])+
      (i<2?svgText(x+100,174,'→',38,'#738b85'):'');
  }).join('');
}

function musicExamplesDiagram(){
  return MUSIC_EXAMPLES.map((example,row)=>{
    const y=114+row*137, encoded=encodeMusic(example);
    return '<rect x="10" y="'+(y-59)+'" width="580" height="104" rx="7" fill="#f1f1e9" stroke="#d6d9d2"/>'+
      example.map((n,i)=>svgText(41+i*33,y,n,31)).join('')+svgText(253,y,'→',35)+
      [0,2,4].map(i=>{
        const x=294+i*46;
        return '<rect x="'+x+'" y="'+(y-46)+'" width="75" height="67" rx="5" fill="#e0ebea" stroke="#96b4b1"/>'+
          svgText(x+37,y,encoded.slice(i,i+2).join(' · '),27);
      }).join('');
  }).join('');
}

function printCard({label,frame,dots},x,y,w,h){
  const inset=10;
  const border=frame?'<rect x="'+(x+inset)+'" y="'+(y+inset)+'" width="'+(w-2*inset)+'" height="'+(h-2*inset)+'" rx="4" fill="none" stroke="#315e56" stroke-width="5"/>':'';
  const columns=dots>4?Math.ceil(dots/2):dots;
  const ink=Array.from({length:dots},(_,i)=>{
    const row=Math.floor(i/columns), rowSize=Math.min(columns,dots-row*columns);
    const cx=x+w/2+(i%columns-(rowSize-1)/2)*w*.153;
    const cy=y+h*(label ? .66 : .50)+(dots>4?(row-.5)*h*.206:0);
    return '<circle cx="'+cx+'" cy="'+cy+'" r="'+w*.058+'" fill="#4d8077"/>';
  }).join('');
  return '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="6" fill="#f0eee2"/>'+
    border+(label?svgText(x+w/2,y+h*.30,label,29):'')+ink;
}

function printSamplesDiagram(){
  return PRINT_SAMPLES.map((sample,i)=>printCard(sample,13+(i%3)*196,12+Math.floor(i/3)*175,182,159)).join('');
}

function printRecordsDiagram(){
  return [true,false].map((printed,row)=>{
    const y=25+row*164;
    return '<rect x="10" y="'+y+'" width="580" height="143" rx="7" fill="'+(printed?'#e2ede4':'#e9e9e3')+'"/>'+
      svgText(54,y+81,printed?'인쇄':'보관',24)+
      PRINT_RECORDS.filter(sample=>shouldPrint(sample)===printed)
        .map((sample,i)=>printCard(sample,105+i*158,y+13,138,116)).join('');
  }).join('');
}

function describePrintCard({label,frame,dots}){
  return (label?'도안 '+label+', ':'')+'테두리 '+(frame?'있음':'없음')+', 점 '+dots+'개';
}

function ballDiagram(order){
  const stride=order.length===6?86:132;
  return '<rect x="32" y="111" width="536" height="134" rx="8" fill="#dfe6e3" stroke="#a6b3b0"/>'+
    order.map((ball,i)=>{
      const x=300+(i-(order.length-1)/2)*stride, color=BALL_COLORS[BALLS.indexOf(ball)];
      return '<circle cx="'+x+'" cy="176" r="32" fill="'+color+'" stroke="#44575c" stroke-width="2"/>'+
        svgText(x,187,ball,32,'#fff')+(order.length===4&&i<3?svgText(x+stride/2,186,'→',28):'');
    }).join('');
}

function signalValue(signal,field){
  const labels={power:['꺼짐','켜짐'],reply:['없음','있음'],code:['불일치','일치']};
  return labels[field][Number(signal[field])];
}

function signalsDiagram(){
  const centers=[47,138,249,369,511];
  const headings=['','전원','응답','코드','결과'];
  return '<rect x="12" y="28" width="576" height="284" rx="6" fill="#edf2f2" stroke="#b8c9c9"/>'+
    headings.map((label,i)=>svgText(centers[i],76,label,23,'#47636e')).join('')+
    SAMPLE_SIGNALS.map((signal,i)=>{
      const y=132+i*62;
      return '<path d="M25 '+(y-33)+'H575" stroke="#c3d5d3"/>'+
        [signal.name,...Object.keys(SIGNAL_FIELDS).map(field=>signalValue(signal,field)),ROUTE_NAMES[routeSignal(signal)]]
          .map((value,index)=>svgText(centers[index],y,value)).join('');
    }).join('');
}

function branchingDiagram(){
  const yes=SIGNAL_RULE.yes, no=SIGNAL_RULE.no;
  const box=(x,y,w,label,fill)=>'<rect x="'+(x-w/2)+'" y="'+y+'" width="'+w+'" height="50" rx="6" fill="'+fill+'" stroke="#9cb0b2"/>'+svgText(x,y+32,label,23);
  const branches='<path d="M300 88V105H155V137M300 105H445V137M155 187V208H83V254M155 208H227V254M445 187V208H373V254M445 208H517V254" fill="none" stroke="#637d86" stroke-width="3"/>';
  const captions=[[198,128,'예'],[400,128,'아니요'],[91,240,'예'],[228,240,'아니요'],[370,240,'예'],[516,240,'아니요']]
    .map(([x,y,label])=>svgText(x,y,label,18)).join('');
  return branches+captions+box(300,38,186,'응답 있음?','#dfecef')+
    box(155,137,172,SIGNAL_FIELDS[yes.field]+'?','#e1eee9')+box(445,137,172,'전원 켜짐?','#e1eee9')+
    box(83,254,132,ROUTE_NAMES[yes.yes],'#eef3ee')+box(227,254,132,ROUTE_NAMES[yes.no],'#f1f2ec')+
    box(373,254,132,'□','#faf9f1')+box(517,254,132,ROUTE_NAMES[no.no],'#f1f2ec');
}

function libraryGuideDiagram(){
  const spines=SHELF_BINDINGS.map((color,i)=>{
    const x=72+i*68;
    return '<rect x="'+x+'" y="103" width="45" height="110" rx="4" fill="'+color+'"/>'+
      '<path d="M'+(x+8)+' 122h29m-29 71h29" fill="none" stroke="#e9d6ab" stroke-width="3"/>';
  }).join('');
  return svgText(300,59,'책은 왼쪽부터 번호순',31)+spines+
    '<path d="M60 219h482" stroke="#8a6d4d" stroke-width="9"/>'+
    svgText(157,275,'← 작은 번호',25)+svgText(448,275,'큰 번호 →',25)+
    svgText(300,323,'책을 펼치면 번호가 보여요.',21);
}

function broadcastRulesDiagram(){
  return Object.values(BROADCAST_COMMANDS).map(({label,before},i)=>{
    const y=30+i*78;
    return '<rect x="21" y="'+y+'" width="558" height="63" rx="6" fill="#ebf0fb"/>'+
      svgText(161,y+40,before,24)+svgText(300,y+40,'→',26)+svgText(433,y+40,label,26);
  }).join('');
}

function broadcastLogDiagram(){
  const {trace,state}=broadcastTrace(BROADCAST_DRAFT);
  return svgText(300,67,'마지막 방송 시험',29)+
    trace.map((step,i)=>svgText(300,130+i*49,(i+1)+'  ·  '+step,25,'#346c70')).join('')+
    svgText(300,247,(trace.length+1)+'단계에서 멈춤',31,'#af403c')+
    svgText(300,304,'멈췄을 때 상태  '+state,22);
}

function schoolClueSvg(id){
  const diagrams={
    resetOrder:[resetDiagram,'전원, 연결, 확인을 차례로 잇는 화살표'],
    musicSample:[musicExamplesDiagram,MUSIC_EXAMPLES.map(values=>values.join(' ')+' → '+encodeMusic(values).join(' ')).join('. ')],
    printSamples:[printSamplesDiagram,PRINT_SAMPLES.map(describePrintCard).join('. ')],
    printRule:[printRecordsDiagram,[true,false].map(printed=>(printed?'인쇄. ':'보관. ')+
      PRINT_RECORDS.filter(sample=>shouldPrint(sample)===printed).map(describePrintCard).join('. ')).join('. ')],
    ballLine:[()=>ballDiagram(BALLS),BALLS.join(' ')+' 순서로 놓인 공'],
    ballOrder:[()=>ballDiagram(BALL_PICKUP),BALL_PICKUP.join(', ')+' 순으로 회수'],
    loanSlip:[()=>svgText(300,121,'찾을 책의 대출 번호',32)+svgText(300,256,LOAN_NUMBER,102,'#3459a4'),'찾을 책 번호 '+LOAN_NUMBER],
    shelfGuide:[libraryGuideDiagram,'책은 왼쪽부터 작은 번호순입니다. 책을 펼치면 번호를 알 수 있습니다.'],
    broadcastRules:[broadcastRulesDiagram,Object.values(BROADCAST_COMMANDS).map(({label,before})=>before+'에서 '+label).join('. ')],
    broadcastLog:[broadcastLogDiagram,'녹음 중 상태에서 3단계가 멈췄습니다.'],
    recordA:[signalsDiagram,'출입 신호 기록'],
    recordB:[branchingDiagram,'응답이 있으면 코드가 일치할 때 현관 전달, 불일치할 때 코드 확인입니다. 응답이 없으면 전원을 확인합니다. 전원이 켜진 쪽 결과는 빈칸이고, 꺼진 쪽은 전원 점검입니다.']
  };
  const [draw,label]=diagrams[id];
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 360" role="img" aria-label="'+label+'" font-family="Malgun Gothic,Arial,sans-serif">'+draw()+'</svg>';
}

async function clueBoardArt(clue){
  const canvas=document.createElement('canvas');canvas.width=720;canvas.height=420;
  const g=canvas.getContext('2d');
  g.fillStyle='#aaaead';g.fillRect(0,0,720,420);
  g.fillStyle='#f1f1e9';g.fillRect(5,5,710,410);
  g.fillStyle='#39474c';g.fillRect(30,31,660,3);
  g.font='600 30px Malgun Gothic,Arial,sans-serif';g.fillStyle='#33444c';
  g.fillText(clue.name,34,70);
  const image=new Image();
  image.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(schoolClueSvg(clue.id));
  await image.decode();
  g.drawImage(image,77,69,566,340);
  return canvas;
}

function schoolLockArt(room,values){
  const canvas=document.createElement('canvas');canvas.width=420;canvas.height=236;
  const g=canvas.getContext('2d');
  const frame=g.createLinearGradient(0,0,420,236);
  frame.addColorStop(0,'#78838d');frame.addColorStop(.46,'#45515c');frame.addColorStop(1,'#343b41');
  g.fillStyle=frame;g.fillRect(0,0,420,236);
  g.strokeStyle='#9aa4a7';g.lineWidth=4;g.strokeRect(5,5,410,226);
  for(const x of [22,398])for(const y of [23,213]){
    g.fillStyle='#b2b9ba';g.beginPath();g.arc(x,y,5,0,Math.PI*2);g.fill();
  }
  const puzzle=SCHOOL_PUZZLES[room.kind], count=puzzle.answer.length, stride=334/count;
  g.textAlign='center';g.textBaseline='middle';
  for(let i=0;i<count;i++){
    const value=values[i], x=43+i*stride;
    const selected=puzzle.control==='selection';
    const lit=selected?value==='1':puzzle.control==='routing'&&!!value;
    g.fillStyle=lit?'#749e91':'#e2e4df';
    g.fillRect(x,54,stride-6,128);
    g.fillStyle='#30414a';
    g.font=puzzle.control==='dial'?'88px Georgia':(selected?'600 34px Arial':'600 53px Malgun Gothic,Arial,sans-serif');
    let mark='·';
    if(selected)mark=PRINT_SAMPLES[i].label;
    else if(puzzle.control==='dial')mark=value??'0';
    else if(puzzle.control==='debug')mark=String(i+1);
    else if(puzzle.control==='sequence')mark=RESET_GLYPHS[value]??value??'·';
    else if(value)mark='✓';
    g.fillText(mark,x+(stride-6)/2,122);
  }
  return canvas;
}
