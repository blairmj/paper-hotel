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

const STAMPS = {
  circle:{label:'원',color:'#499694',glyph:'●'},
  triangle:{label:'삼각형',color:'#cf8c3e',glyph:'▲'},
  square:{label:'사각형',color:'#ac5f7c',glyph:'■'}
};
const PRINT_ORDER = ['circle','triangle','square'];

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
  art:{control:'sequence',title:'문 인쇄판',keys:['triangle','square','circle'],answer:PRINT_ORDER,
    hint:'두 모양이 겹친 곳에서는 나중에 찍은 도장 자국이 위에 보입니다.'},
  sports:{control:'dial',title:'문 다이얼',answer:countBallMoves(BALLS,BALL_PICKUP),
    hint:'공을 하나 뺀 뒤 빈자리를 채우세요. 그 배열을 기준으로 다음 공을 빼야 합니다.'},
  computer:{control:'routing',title:'출입 신호판',answer:NEW_SIGNALS.map(routeSignal),
    hint:'응답이 없는 기록에서 전원이 켜져 있던 신호를 찾아 분기표의 빈칸을 확인하세요.'}
};
