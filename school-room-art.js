'use strict';

function roomInterior(kind){
  if(kind==='classroom')return ClassroomInterior;
  if(['art','music'].includes(kind))return SchoolInterior;
  if(['sports','computer'].includes(kind))return SportsComputerInteriors;
  return SpecialtyInteriors;
}

function schoolRoomDefinition(kind){return roomInterior(kind).definition(kind)}
function buildSchoolRoom(scene,room){return roomInterior(room.kind).build(scene,room)}


function svgText(x,y,label,size=24,color='#34454d'){
  return '<text x="'+x+'" y="'+y+'" text-anchor="middle" font-size="'+size+'" fill="'+color+'">'+label+'</text>';
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

function schoolClueSvg(id){
  const clue=CT.clues[id];
  let art='';
  if(id==='ballLine'||id==='ballOrder')art=ballDiagram(id==='ballLine'?BALLS:BALL_PICKUP);
  else if(id==='printSamples'){
    CT.artRows.forEach((line,y)=>[...line].forEach((cell,x)=>{
      art+='<rect x="'+(200+x*50)+'" y="'+(23+y*50)+'" width="48" height="48" fill="'+(cell==='#'?'#316b99':'#fffaf0')+'" stroke="#8295a1"/>';
    }));
  }else if(id==='broadcastLog'){
    CT.signal.forEach((v,i)=>{const x=48+i*104,w=v==='길'?72:25;
      art+='<rect x="'+x+'" y="128" width="'+w+'" height="25" rx="10" fill="#38778d"/>'+svgText(x+w/2,212,v+'게',24);
    });
  }else if(clue){
    const lines=clue.slice(1).flatMap(text=>{
      const rows=[''];for(const word of text.split(' ')){
        if((rows.at(-1)+' '+word).length>21)rows.push(word);else rows[rows.length-1]=[rows.at(-1),word].filter(Boolean).join(' ');
      }return rows;
    });
    art=lines.map((line,i)=>svgText(300,177+(i-(lines.length-1)/2)*52,line,29)).join('');
  }
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 360" role="img" aria-label="'+(clue?.join(' ')??(id==='ballLine'?BALLS:BALL_PICKUP).join(' '))+'" font-family="Malgun Gothic,Arial,sans-serif">'+art+'</svg>';
}

async function clueBoardArt(clue){
  if(clue.lines){
    const canvas=document.createElement('canvas');
    canvas.width=1024;
    canvas.height=Math.round(canvas.width*clue.surface.height/clue.surface.width);
    const g=canvas.getContext('2d');
    g.fillStyle=clue.placement==='monitor'?'#edf5f2':'#fff8e8';
    g.fillRect(0,0,canvas.width,canvas.height);
    const font=' "Malgun Gothic","Apple SD Gothic Neo",sans-serif';
    g.font='600 100px'+font;
    const longest=Math.max(...clue.lines.map(line=>g.measureText(line).width));
    const size=Math.min(100*canvas.width*.90/longest,canvas.height/(clue.lines.length*1.8));
    g.font='600 '+size+'px'+font;
    g.fillStyle='#213c47';g.textAlign='center';g.textBaseline='middle';
    clue.lines.forEach((line,i)=>{
      const y=canvas.height/2+(i-(clue.lines.length-1)/2)*size*1.48;
      g.fillText(line,canvas.width/2,y);
    });
    return canvas;
  }
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

function schoolLockArt(room,values,reader){
  const canvas=document.createElement('canvas');canvas.width=420;canvas.height=236;
  const g=canvas.getContext('2d');
  const frame=g.createLinearGradient(0,0,420,236);
  frame.addColorStop(0,'#78838d');frame.addColorStop(.46,'#45515c');frame.addColorStop(1,'#343b41');
  g.fillStyle=frame;g.fillRect(0,0,420,236);
  g.strokeStyle='#9aa4a7';g.lineWidth=4;g.strokeRect(5,5,410,226);
  for(const x of [22,398])for(const y of [23,213]){
    g.fillStyle='#b2b9ba';g.beginPath();g.arc(x,y,5,0,Math.PI*2);g.fill();
  }
  g.fillStyle='#213944';g.fillRect(38,39,344,158);
  g.textAlign='center';g.textBaseline='middle';
  if(room.kind==='art'){
    const drops=values?.drops??[],paint=CT.paintCells(drops);
    CT.artRows.forEach((line,row)=>[...line].forEach((_,col)=>{
      const i=row*CT.artWidth+col,x=142+col*35,y=42+row*24;
      g.fillStyle=paint.has(i)?'#568fc2':'#f8f2e3';g.fillRect(x,y,33,22);
      if(drops.includes(i)){g.fillStyle='#163854';g.beginPath();g.arc(x+16,y+11,5,0,Math.PI*2);g.fill()}
    }));
  }else if(room.kind==='computer'){
    g.fillStyle=reader==='B'?'#eed19a':'#b7dcdf';g.fillRect(46,48,326,137);
    g.fillStyle='#213946';g.font='bold 43px sans-serif';
    g.fillText(reader?reader+' 판독기':'시험 카드함',210,88);
    g.font='bold 28px sans-serif';
    g.fillText(reader?(values?.seen?.includes(reader)?CT.readerOutput(values.test,reader,values.fault,values.repair):'카드 투입구'):(values?.test??'▲ ● ★'),210,143);
  }else if(room.kind==='print'){
    g.fillStyle='#b4d4c3';g.font='bold 22px Malgun Gothic,sans-serif';
    g.fillText('차례',100,63);g.fillText('스캔',210,63);g.fillText('인쇄',313,63);
    for(let row=0;row<3;row++){
      const y=96+row*40;
      g.fillText(String(row+1),100,y);
      for(let col=0;col<2;col++)g.fillText(values?.jobs?.[2*row+col]||'—',210+103*col,y);
    }
  }else{
    g.fillStyle='#a8d8c6';g.font='bold 40px Malgun Gothic,sans-serif';
    g.fillText(SCHOOL_PUZZLES[room.kind].title,210,91,310);
    g.font='bold 32px Malgun Gothic,sans-serif';
    const mark=(values?.program??[]).map(v=>v==='('?'×2 [':v===')'?']':v).join(' ')||'♩   ♫   ♩';
    g.fillText(mark,210,151,300);
  }
  return canvas;
}
