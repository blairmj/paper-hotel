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

const SCHOOL_PUZZLES = {
  classroom:{control:'sequence',title:'교실 복구 단말기',keys:['check','power','link'],answer:RESET_ORDER,
    hint:'칠판에서 화살표가 이어지는 방향대로 버튼을 누르세요.'},
  music:{control:'dial',title:'문 다이얼',answer:MUSIC_GAPS.map(i=>MUSIC_CONVERTED[i]),
    hint:'악보에서 같은 번호가 연달아 나오는 곳만 한 묶음으로 세세요. 변환 결과에는 개수, 번호 순으로 적습니다.'},
  art:{control:'selection',title:'문 인쇄판',revision:3,
    answer:PRINT_SAMPLES.map(sample=>shouldPrint(sample)?'1':'0'),
    hint:'점 개수가 같은 두 기록을 비교해 테두리를 살펴보세요. 인쇄된 도안의 점을 두 개씩 짝지어 보세요.'},
  sports:{control:'dial',title:'문 다이얼',answer:countBallMoves(BALLS,BALL_PICKUP),
    hint:'뺀 공을 제외하고 이번에 한 칸씩 왼쪽으로 움직인 공의 개수를 세세요. 다음 공은 바뀐 배열에서 빼세요.'},
  computer:{control:'routing',title:'출입 신호판',answer:NEW_SIGNALS.map(routeSignal),
    hint:'응답이 없는 기록에서 전원이 켜져 있던 신호를 찾아 분기표의 빈칸을 확인하세요.'}
};
