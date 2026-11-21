'use strict';

const RESET_KEYS = {power:'전원',link:'연결',check:'확인'};
const RESET_ORDER = ['power','link','check'];

const MUSIC_KEYS = ['1','1','1','1','2','2','2','1'];
const MUSIC_EXAMPLES = [['2','2','2','1','1','2'],['1','1','2','1']];
const MUSIC_GAPS = [0,2];
function encodeMusic(values) {
  const runs = [];
  for (const value of values) {
    const last = runs.at(-1);
    if (last?.value===value) last.count++;
    else runs.push({value,count:1});
  }
  return runs.flatMap(({count,value})=>[String(count),value]);
}
const MUSIC_CONVERTED = encodeMusic(MUSIC_KEYS);

const PRINT_RECORDS = [
  {frame:true,dots:2},
  {frame:true,dots:4},
  {frame:true,dots:6},
  {frame:true,dots:3},
  {frame:true,dots:5},
  {frame:false,dots:4}
];
const PRINT_SAMPLES = [
  {label:'A',frame:false,dots:6},
  {label:'B',frame:true,dots:3},
  {label:'C',frame:true,dots:4},
  {label:'D',frame:false,dots:2},
  {label:'E',frame:true,dots:8},
  {label:'F',frame:true,dots:5}
];
function shouldPrint({frame,dots}){return frame&&dots%2===0}

const BALLS = ['A','B','C','D','E','F'];
const BALL_COLORS = ['#b76744','#527e9d','#6d8c62','#a97a45','#86678f','#5c9b91'];
const BALL_PICKUP = ['D','B','A','E'];
function ballRowAfter(picked){
  const removed=BALL_PICKUP.slice(0,picked);
  return BALLS.filter(ball=>!removed.includes(ball));
}
function countBallMoves(first, removal) {
  const row = first.slice();
  return removal.map(ball=>{
    const index=row.indexOf(ball);
    const moves=row.length-index-1;
    row.splice(index,1);
    return String(moves);
  });
}

const ROUTE_NAMES = {send:'현관 전달',code:'코드 확인',link:'연결 점검',power:'전원 점검'};
const SIGNAL_FIELDS = {power:'전원',reply:'응답',code:'코드 일치'};
const SIGNAL_RULE = {
  field:'reply',
  yes:{field:'code',yes:'send',no:'code'},
  no:{field:'power',yes:'link',no:'power'}
};
const SAMPLE_SIGNALS = [
  {name:'A',power:true,reply:true,code:true},
  {name:'B',power:true,reply:false,code:false},
  {name:'C',power:false,reply:false,code:true}
];
const NEW_SIGNALS = [
  {name:'1',power:true,reply:false,code:true},
  {name:'2',power:true,reply:true,code:false},
  {name:'3',power:true,reply:true,code:true}
];
function routeSignal(input) {
  let rule=SIGNAL_RULE;
  while (typeof rule==='object') rule=input[rule.field]?rule.yes:rule.no;
  return rule;
}

const LOAN_NUMBER = 61;
const SHELF_LIMIT = 3;
const SHELF_BINDINGS = ['#3b6a95','#b67a32','#9f584e','#36587d','#517c72','#95694a','#746889'];
function makeLibraryShelf(random=Math.random){
  const size=SHELF_BINDINGS.length,slot=Math.floor(random()*size);
  const books=Array(size);
  books[slot]=LOAN_NUMBER;
  const gap=()=>2+Math.floor(random()*5);
  for(let i=slot-1;i>=0;i--)books[i]=books[i+1]-gap();
  for(let i=slot+1;i<size;i++)books[i]=books[i-1]+gap();
  return books;
}
function validLibraryShelf(books){
  return Array.isArray(books)&&books.length===SHELF_BINDINGS.length&&books.includes(LOAN_NUMBER)&&
    books.every((n,i)=>Number.isInteger(n)&&n>=10&&n<=99&&(i===0||n>books[i-1]));
}
function canOpenLibraryBook(books,opened,slot){
  return Number.isInteger(slot)&&slot>=0&&slot<books.length&&opened.length<SHELF_LIMIT&&
    !opened.includes(slot)&&!opened.some(index=>books[index]===LOAN_NUMBER);
}

const BALANCE_WEIGHTS = {black:11,white:8};
const BALANCE_SCALES = [
  {label:'첫째 저울',left:'1L',right:'1R',weight:6},
  {label:'둘째 저울',left:'2L',right:'2R',weight:30}
];
const BALANCE_BEADS = [
  {color:'black',pan:'1L'},{color:'black',pan:'1L'},
  {color:'white',pan:'1R'},{color:'white',pan:'1R'},
  {color:'black',pan:'2L'},{color:'black',pan:'2L'},{color:'black',pan:'2L'},{color:'white',pan:'2L'},
  {color:'black',pan:'2R'}
];
function initialBeadPlaces(){return BALANCE_BEADS.map(bead=>bead.pan)}
function validBeadPlaces(places){
  const holders=['tray',...BALANCE_SCALES.flatMap(scale=>[scale.left,scale.right])];
  return Array.isArray(places)&&places.length===BALANCE_BEADS.length&&
    BALANCE_BEADS.every((_,i)=>holders.includes(places[i]));
}
function readBalance(scale,places){
  let left=0,right=scale.weight;
  BALANCE_BEADS.forEach(({color},i)=>{
    if(places[i]===scale.left)left+=BALANCE_WEIGHTS[color];
    if(places[i]===scale.right)right+=BALANCE_WEIGHTS[color];
  });
  // The beam stops gradually near its travel limit. Positive angles lower the right pan.
  return {left,right,angle:Math.atan((right-left)/11)*.23};
}

const BROADCAST_COMMANDS = {
  mic:{label:'마이크 켜기',display:'MIC',before:'대기',after:'마이크 켜짐'},
  record:{label:'녹음 시작',display:'REC',before:'마이크 켜짐',after:'녹음 중'},
  stop:{label:'녹음 끝내기',display:'STOP',before:'녹음 중',after:'녹음 종료'},
  save:{label:'파일 저장',display:'SAVE',before:'녹음 종료',after:'저장 완료'}
};
const BROADCAST_DRAFT = ['mic','record','save','save'];
function broadcastTrace(program) {
  let state='대기';
  const trace=[];
  for(const key of program){
    const command=BROADCAST_COMMANDS[key];
    if(command?.before!==state)return {passed:false,state,trace};
    state=command.after;
    trace.push(state);
  }
  return {passed:state==='저장 완료',state,trace};
}

const SCHOOL_PUZZLES = {
  classroom:{control:'sequence',title:'교실 복구 단말기',keys:['check','power','link'],answer:RESET_ORDER,
    instructions:'문을 열려면 세 버튼을 어떤 순서로 눌러야 할까요? 교실의 단서를 보고 문 옆 단말기에 차례로 입력하세요.',
    hint:'칠판에서 화살표가 이어지는 방향대로 버튼을 누르세요.'},
  music:{control:'dial',title:'문 다이얼',answer:MUSIC_GAPS.map(i=>MUSIC_CONVERTED[i]),
    instructions:'피아노 악보를 보면대의 규칙대로 바꾸면 두 빈칸에 어떤 숫자가 들어갈까요? 문 다이얼에 차례로 맞추세요.',
    hint:'악보에서 같은 번호가 연달아 나오는 곳만 한 묶음으로 세세요. 변환 결과에는 개수, 번호 순으로 적습니다.'},
  art:{control:'selection',title:'문 인쇄판',revision:3,
    answer:PRINT_SAMPLES.map(sample=>shouldPrint(sample)?'1':'0'),
    instructions:'작업대의 도안 중 어떤 것이 인쇄될까요? 게시판의 인쇄 기록에서 규칙을 찾아 문 옆 인쇄판에서 해당 도안의 스위치만 켜세요.',
    hint:'점 개수가 같은 두 기록을 비교해 테두리를 살펴보세요. 인쇄된 도안의 점을 두 개씩 짝지어 보세요.'},
  sports:{control:'balls',title:'공 라커',keys:BALLS.map((_,i)=>String(i)),answer:countBallMoves(BALLS,BALL_PICKUP),
    instructions:'공 라커에서 회수 순서대로 공을 하나씩 빼세요. 매번 뺀 공을 제외하고 자리가 바뀐 공은 몇 개인가요?',
    hint:'뺀 공을 제외하고 이번에 한 칸씩 왼쪽으로 움직인 공의 개수를 세세요. 다음 공은 바뀐 배열에서 빼세요.'},
  library:{control:'shelf',revision:1,title:'곡선 서가',
    instructions:'대출 메모에 적힌 번호의 책은 어느 칸에 있을까요? 번호순으로 꽂힌 곡선 서가에서 책을 세 번 안에 찾아보세요.',
    hint:'남은 책의 가운데를 펼쳐 보세요. 찾는 번호가 더 크면 오른쪽에, 더 작으면 왼쪽에 있어요.'},
  science:{control:'dial',revision:2,title:'문 다이얼',answer:Array.from(String(6*BALANCE_WEIGHTS.black+3*BALANCE_WEIGHTS.white)),
    instructions:'비밀번호는 검은 구슬 6개와 흰 구슬 3개를 모두 합한 그램 수입니다.',
    hint:'처음 배치에서 둘째 저울의 양쪽에 있는 검은 구슬을 하나씩 내려 보세요. 30g 추와 균형을 이루는 구슬은 몇 개인가요?'},
  broadcast:{control:'debug',title:'방송 믹서',answer:Object.keys(BROADCAST_COMMANDS),
    instructions:'방송을 끝까지 녹음하고 저장하려면 네 명령을 어떤 순서로 실행해야 할까요? 방송 시험 기록을 보고 믹서의 네 칸을 맞추세요.',
    hint:'멈춘 단계의 상태를 확인하세요. 녹음이 끝나야 파일을 저장할 수 있습니다.'},
  computer:{control:'routing',title:'출입 신호판',answer:NEW_SIGNALS.map(routeSignal),
    instructions:'세 출입 신호는 각각 어디로 보내야 할까요? 신호 기록과 분기표를 보고 문 옆 신호판에서 각 신호가 갈 곳을 고르세요.',
    hint:'응답이 없는 기록에서 전원이 켜져 있던 신호를 찾아 분기표의 빈칸을 확인하세요.'}
};
