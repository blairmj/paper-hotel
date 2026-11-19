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

const SHELF_NUMBERS = [12,24,37,49,61,74,86];
const LOAN_NUMBER = 61;
const SEARCH_EXAMPLE = 24;
function bookSearch(numbers, wanted) {
  const probes=[];
  let low=0,high=numbers.length-1;
  while(low<=high){
    const middle=Math.floor((low+high)/2),found=numbers[middle];
    probes.push(String(found));
    if(found===wanted)break;
    if(found<wanted)low=middle+1;
    else high=middle-1;
  }
  return probes;
}

const WATER_CYCLE = {initial:1, fill:3, drain:5, cycles:4};
const WATER_HEIGHTS = Array.from({length:WATER_CYCLE.drain+1},(_,i)=>String(i));
function waterLevels({initial,fill,drain,cycles}) {
  let water=initial;
  return Array.from({length:cycles},()=>{
    water+=fill;
    if(water>=drain)water-=drain;
    return String(water);
  });
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
    hint:'칠판에서 화살표가 이어지는 방향대로 버튼을 누르세요.'},
  music:{control:'dial',title:'문 다이얼',answer:MUSIC_GAPS.map(i=>MUSIC_CONVERTED[i]),
    hint:'악보에서 같은 번호가 연달아 나오는 곳만 한 묶음으로 세세요. 변환 결과에는 개수, 번호 순으로 적습니다.'},
  art:{control:'selection',title:'문 인쇄판',revision:3,
    answer:PRINT_SAMPLES.map(sample=>shouldPrint(sample)?'1':'0'),
    hint:'점 개수가 같은 두 기록을 비교해 테두리를 살펴보세요. 인쇄된 도안의 점을 두 개씩 짝지어 보세요.'},
  sports:{control:'balls',title:'공 라커',keys:BALLS.map((_,i)=>String(i)),answer:countBallMoves(BALLS,BALL_PICKUP),
    instructions:'단서 순서대로 공을 빼고, 남은 공 중 자리가 바뀐 개수를 입력하세요.',
    hint:'뺀 공을 제외하고 이번에 한 칸씩 왼쪽으로 움직인 공의 개수를 세세요. 다음 공은 바뀐 배열에서 빼세요.'},
  library:{control:'sequence',title:'곡선 서가',keys:SHELF_NUMBERS.map(String),answer:bookSearch(SHELF_NUMBERS,LOAN_NUMBER),
    instructions:'찾기 표지와 대출 메모를 보고, 확인할 책을 차례로 누르세요.',
    hint:'49번부터 확인하세요. 찾는 번호가 더 크면 오른쪽 세 권만 남겨 보세요.'},
  science:{control:'water',title:'실험 물통',keys:WATER_HEIGHTS,answer:waterLevels(WATER_CYCLE),
    instructions:'급수와 배출을 마친 뒤 남은 물 높이를 맞추세요.',
    hint:'물을 채운 다음 5칸 이상이면 5칸을 빼세요. 그때 남은 높이에서 다음 회차를 시작합니다.'},
  broadcast:{control:'debug',title:'방송 믹서',answer:Object.keys(BROADCAST_COMMANDS),
    hint:'멈춘 단계의 상태를 확인하세요. 녹음이 끝나야 파일을 저장할 수 있습니다.'},
  computer:{control:'routing',title:'출입 신호판',answer:NEW_SIGNALS.map(routeSignal),
    hint:'응답이 없는 기록에서 전원이 켜져 있던 신호를 찾아 분기표의 빈칸을 확인하세요.'}
};
