'use strict';

const MUSIC_CLOCK = Object.freeze({hour:4,minuteMark:12});
const MUSIC_SCORE = [[9,6],[12,3],[2,4],[7,11]].map(([a,b])=>({a,b,value:a*b}));
const PAD_RECOVERY_CODE = '●★★';

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

const LOAN_NUMBER = 61;
const SHELF_LIMIT = 3;
const LIBRARY_NOTICES = {
  shelfGuide:['책의 번호는 오른쪽으로 갈 수록 커집니다.', '3번 내로 필요한 책을 찾으세요.'],
  loanSlip:['대출하려는 책의 번호는', LOAN_NUMBER+'번입니다.']
};
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

const BROADCAST_COMMANDS = {
  meal:{label:'급식 안내',display:'MEAL',code:'짧'},
  weather:{label:'날씨',display:'WX',code:'길 짧'},
  song:{label:'신청곡',display:'SONG',code:'길 길'}
};
const SCHOOL_PUZZLES = {
  sports:{control:'pin',revision:2,title:'문 옆 번호판',keys:Array.from('1234567890'),answer:countBallMoves(BALLS,BALL_PICKUP),
    instructions:'회수표대로 공을 하나 뺄 때마다, 남은 공 중 몇 개가 자리를 옮길까요? 네 번 센 수를 차례로 이어 쓰면 비밀번호예요.',
    hint:'공을 빼면 그 오른쪽에 있던 공들이 한 칸씩 왼쪽으로 움직여요. 다음 공을 빼기 전, 이번에 움직인 공이 몇 개인지 기억하세요.'},
  library:{control:'shelf',revision:2,title:'곡선 서가',doorTitle:'도서실 탈출',
    instructions:'대출하려는 책은 어디에 있는지 찾아보세요.',
    hint:'남은 책의 가운데를 펼쳐 보세요. 찾는 번호가 더 크면 오른쪽에, 더 작으면 왼쪽에 있어요.'},
  classroom:{control:'device',revision:4,title:'교실 출입 패드',
    instructions:'어느 불을 한 번 누르면 가로줄마다, 세로줄마다 켜진 불이 짝수 개가 될까요?',
    hint:'켜진 불이 홀수 개인 가로줄과 세로줄을 각각 찾고, 두 줄이 만나는 칸을 살펴보세요.'},
  music:{control:'device',revision:5,title:'문 옆 다이얼',
    instructions:'악보에 적힌 네 개의 기록을 보고, 멈춘 시계의 두 바늘이 나타내는 수를 찾아보세요.',
    hint:'악보에 그린 두 바늘을 시계판에 겹쳐 보세요.'},
  art:{control:'device',revision:5,title:'벽화 물감판',
    instructions:'물감 일곱 방울로 견본과 똑같은 무늬를 만들려면 어느 칸에 떨어뜨려야 할까요?',
    hint:'한 방울은 같은 세로줄만 칠해요. 가장자리에서는 두 칸만 칠해지고, 이미 칠한 칸에 겹칠 수도 있어요.'},
  science:{control:'device',revision:5,title:'실험대의 구슬 레일',
    instructions:'흰 구슬 두 개가 지나간 뒤, 마지막 파란 구슬은 어느 컵에 떨어질까요?',
    hint:'첫째 구슬이 지난 두 갈림길은 방향이 바뀌어요. 둘째 구슬도 아래쪽 갈림길을 지날까요?'},
  broadcast:{control:'device',revision:4,title:'방송 믹서',
    instructions:'방송 순서가 불빛으로 도착했어요. 세 방송을 어떤 순서로 틀라는 뜻일까요?',
    hint:'짧은 빛으로 시작하면 한 번에 한 방송이에요. 긴 빛으로 시작하면 다음 빛까지 함께 읽으세요.'},
  computer:{control:'device',revision:6,title:'출입 패드',
    instructions:'출입 패드가 고장 났어요. 어떤 카드를 꽂으면 복구 신호 '+[...PAD_RECOVERY_CODE].join(' ')+'가 뜰까요?',
    hint:'점검 기록을 보세요. 카드의 마지막 기호가 화면에서는 맨 앞에 나와요.'},
  print:{control:'device',revision:1,title:'인쇄 작업표',
    instructions:'별 포스터와 달 포스터가 한 장씩 필요해요. 세 차례 안에 모두 인쇄하려면 두 기계에 언제 어떤 포스터를 맡겨야 할까요?',
    hint:'첫 포스터를 인쇄하는 동안 비어 있는 스캐너는 두 번째 포스터를 읽을 수 있어요.'},
  council:{control:'device',revision:1,title:'공개 전광판',
    instructions:'이름을 숨겨도 친구들이 자기 입장 시간을 찾으려면, 전광판에 어떤 두 가지를 띄워야 할까요?',
    hint:'같은 반인 두 학생을 구별할 수 있고, 각자의 접수증에도 적혀 있는 항목이 무엇인가요?'}
};
