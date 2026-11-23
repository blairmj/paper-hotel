'use strict';

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
  sports:{control:'pin',revision:1,title:'문 옆 번호판',keys:Array.from('1234567890'),answer:countBallMoves(BALLS,BALL_PICKUP),
    instructions:'회수 순서대로 공을 하나씩 빼세요. 매번 뺀 공을 제외하고 자리가 바뀐 공의 수를 세어, 네 자리 비밀번호로 차례대로 누르세요.',
    hint:'공을 빼면 그 오른쪽에 있던 공들이 한 칸씩 왼쪽으로 움직여요. 다음 공을 빼기 전, 이번에 움직인 공이 몇 개인지 기억하세요.'},
  library:{control:'shelf',revision:1,title:'곡선 서가',doorTitle:'도서실 탈출',
    instructions:'대출하려는 책은 어디에 있는지 찾아보세요.',
    hint:'남은 책의 가운데를 펼쳐 보세요. 찾는 번호가 더 크면 오른쪽에, 더 작으면 왼쪽에 있어요.'},
  classroom:{control:'device',revision:4,title:'교실 불빛 점검판',
    instructions:'불빛 하나가 뒤바뀌었어요. 칠판과 책상의 점검 기록을 보고 그 불빛을 한 번 눌러 고치세요.',
    hint:'켜진 불이 홀수 개인 가로줄과 세로줄을 각각 찾고, 두 줄이 만나는 칸을 살펴보세요.'},
  music:{control:'device',revision:4,title:'리듬 재생기',
    instructions:'피아노 악보와 같은 리듬이 들리도록 소리 카드 세 장과 두 번 반복 띠 두 개를 배치하세요.',
    hint:'북·짝 한 쌍을 두 번 연주한 뒤 딩을 붙이세요. 이 묶음도 두 번 들립니다.'},
  art:{control:'device',revision:4,title:'벽화 물감판',
    instructions:'물감을 세 번만 떨어뜨려 흰 칸을 모두 칠하세요. 작업대와 게시판에 벽화 도안과 번짐 견본이 있어요.',
    hint:'붙어 있는 흰 칸을 손가락으로 따라가 보세요. 이미 이어진 곳에는 한 방울이면 충분해요.'},
  science:{control:'device',revision:4,title:'실험대의 구슬 레일',
    instructions:'연습대에서 갈림판이 움직이는 원리를 알아보세요. 본 실험대에서 세 번째 파란 구슬을 받을 컵을 고르세요.',
    hint:'구슬이 지나간 갈림판만 돌아갑니다. 두 번째 구슬이 아래 갈림판을 지나가는지 살펴보세요.'},
  broadcast:{control:'device',revision:4,title:'방송 믹서',
    instructions:'신호등의 긴 빛과 짧은 빛을 방송 암호표로 읽고, 믹서에 세 방송을 차례로 넣으세요.',
    hint:'짧은 빛으로 시작하면 한 번에 한 방송이에요. 긴 빛으로 시작하면 다음 빛까지 함께 읽으세요.'},
  computer:{control:'device',revision:4,title:'출입증 판독기',
    instructions:'시험 카드로 기호를 거꾸로 읽는 판독기를 찾아 고치세요. 새 출입증으로 두 판독기를 검사하면 현관이 열려요.',
    hint:'앞뒤로 읽어도 똑같은 카드는 두 판독기를 구별할 수 없어요. 첫 기호와 끝 기호가 다른 카드를 골라 보세요.'},
  print:{control:'device',revision:1,title:'인쇄 작업표',
    instructions:'별과 달 포스터를 세 차례 안에 한 장씩 복사하세요. 매 차례 스캐너와 프린터에 맡길 포스터를 정하세요.',
    hint:'첫 포스터를 인쇄하는 동안 비어 있는 스캐너는 두 번째 포스터를 읽을 수 있어요.'},
  council:{control:'device',revision:1,title:'공개 전광판',
    instructions:'이름을 공개하지 않고 각자 입장 시각을 찾을 수 있도록 전광판에 띄울 두 항목을 고르세요.',
    hint:'같은 반인 두 학생을 구별할 수 있고, 각자의 접수증에도 적혀 있는 항목이 무엇인가요?'}
};
