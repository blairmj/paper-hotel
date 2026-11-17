const MUSIC_CLOCK = Object.freeze({hour:4, minuteMark:12});
const MUSIC_SCORE = [[9,6],[12,3],[2,4],[7,11]].map(([a,b])=>{
  const steps=(b-a+12)%12;
  return {a,b,value:a*b,degrees:30*Math.min(steps,12-steps),clockwise:steps<=6};
});
const SCHOOL_ROOMS = [
 {n:203,place:'음악실',name:'멈춘 벽시계',wall:0x995766,trim:0x743d50,floor:0x936457,wood:0x915447,clues:[['paper','피아노 위 투명 악보','악보에는 꺾은선과 숫자가 적혀 있다.'],['clock','멈춘 벽시계','악보의 중심점을 시곗바늘이 만나는 곳에 겹친다.']],station:'문 옆 다이얼',answer:String(MUSIC_CLOCK.hour*MUSIC_CLOCK.minuteMark),hint:'선의 두 끝이 가리키는 수와 악보의 기록을 비교하세요.'},
 {n:204,place:'학교신문 편집실',name:'뒤섞인 활자',wall:0x99915c,trim:0x656849,floor:0xa28162,wood:0x825a44,clues:[['type','활자 서랍','빠진 활자를 위에서 아래로 읽는다. 첫째 줄 ㅅ·ㅏ·ㅁ, 둘째 줄 ㅍ·ㅏ·ㄹ, 셋째 줄 ㅇ·ㅣ.'],['proof','학급 신문 인쇄 견본','ㅇ·ㅣ·ㄹ → 일 → 1 / ㅇ·ㅗ → 오 → 5. 한 줄의 활자가 수의 이름 하나가 된다.']],station:'조판 다이얼',answer:'382',hint:'견본처럼 한 줄씩 소리 내어 읽고, 세 줄을 위에서부터 숫자로 바꿔 보세요.'},
 {n:205,place:'5학년 교실',name:'찢어진 학교 지도',wall:0xad735b,trim:0x676e61,floor:0xb48665,wood:0x926448,clues:[['tube','학교 지도가 든 지통','지통에서 학교 미로 지도의 오른쪽 아래 조각을 찾았다. 굽은 가장자리가 벽 지도의 찢긴 곳과 맞는다.'],['compass','지도 범례','▲에서 출발해 길을 따라 ●까지. 갈림길에서 막히면 돌아간다. 도착까지 이어진 길에서만, 지나간 글자를 순서대로 읽는다.']],station:'찢어진 벽 지도',answer:'중간칸',hint:'도착점 ●까지 연결된 길에 있는 세 글자는 어느 서랍을 가리킬까요?'},
 {n:206,place:'도서실',name:'사라진 대출 카드',wall:0x818b9c,trim:0x556374,floor:0xb19a79,wood:0x5b5a61,clues:[['shelf','대출 카드 봉투','한 줄 도장은 첫 기록, 두 줄 도장은 두 번째 기록이다. 오른쪽 아래 귀퉁이의 금색 홈을 맞춰 카드를 똑바로 놓는다.'],['sort','반납대 밑 봉투','세 줄 도장의 세 번째 카드. 앞선 두 장에서 찾은 이동 규칙이 이 카드의 여섯 칸에도 맞는지 확인한다. 각 수는 자리를 하나씩 옮긴다.']],station:'여섯 칸 보관함',answer:'654321',hint:'왼쪽 위 수가 오른쪽 위로 간 다음, 테두리를 따라 어느 칸으로 이동할까요?'},
 {n:207,place:'미술실',name:'겹쳐 찍은 글자',wall:0xb56e60,trim:0x80484d,floor:0xae816d,wood:0x96654b,clues:[['letterI','견본함의 작은 I','작은 I 뒷면에는 인쇄 자국이 하나 있다.'],['letterP','선반의 중간 P','중간 P 뒷면에는 인쇄 자국이 둘 있다.'],['letterE','벽에 기댄 큰 E','큰 E 뒷면에는 인쇄 자국이 셋 있다. 가장자리에는 작은 글자부터 찍으라는 그림이 있다.']],station:'여섯 글자 잠금판',answer:'IPPEEE',hint:'작은 글자부터 차례로, 뒤에 있는 자국 수만큼 인쇄하세요.'},
 {n:208,place:'체육 준비실',name:'잠긴 장비함',wall:0xc69a64,trim:0x707650,floor:0xb78662,wood:0x9e704d,clues:[['photo','벤치의 운동회 사진','운동회 사진에 찍힌 공들을 종류별로 살펴보자.'],['flag','접힌 우승 깃발','깃발 뒷면의 네 그림은 왼쪽부터 배구공, 미식축구공, 테니스공, 농구공이다. 장비함의 다이얼은 이 순서로 읽는다.']],station:'초록색 장비함',answer:'3425',hint:'운동회 사진에 찍힌 공만 세고, 깃발 뒷면의 순서로 배열하세요.'},
 {n:209,place:'컴퓨터실',name:'아홉 칸의 픽셀',wall:0x577d75,trim:0x496962,floor:0xa28a6d,wood:0x8d6c50,clues:[['bag','키보드 옆 출력 예시','입력한 숫자와 화면에 켜진 픽셀을 비교한다. 1이 있는 칸은 켜지고 0인 칸은 꺼졌다.'],['apron','게시판의 픽셀 점검표','새 기록도 같은 T 모양이다. 1 외에 어떤 수에서 켜졌는지 비교한다. 여백에 적힌 시험 결과는 5에서 켜짐, 4에서 꺼짐이다.']],station:'픽셀 모니터',answer:'101111101',hint:'홀수인 칸만 켜세요. 픽셀의 위치는 입력표와 같아요.'},
 {n:210,place:'과학실',name:'별빛 영사기',wall:0x716387,trim:0x514766,floor:0x987c83,wood:0x826173,clues:[['stencil','관측대 위 별판','별판은 영사기의 옆 홈에 꼭 맞는다. 네 구역의 별은 순서대로 3개, 4개, 2개, 5개다.'],['trace','선반의 투사지','초승달 표시를 맞추면 별이 둘씩 짝을 이룬다. 별이 하나 남은 구역만 금색 스위치를 켜라는 그림이 나타난다.']],station:'별빛 영사기',answer:'1001',hint:'둘씩 짝을 지은 후 하나가 남는 구역을 모두 고르세요.'}
];
// A clockwise path around a two-column card. Display order is row by row.
const cardCycle = [0,1,3,5,4,2];
function archiveCard(step) {
 const fourth=[6,5,4,3,2,1],card=Array(6);
 cardCycle.forEach((at,i)=>{card[at]=fourth[cardCycle[(i+3-step+6)%6]];});
 return card;
}
const sportsBalls=['🏀','🎾','🏐','🏈','🏀','🏈','🏐','🏀','🎾','🏈','🏀','🏐','🏈','🏀'];
// Roads form a tree; every apparent alternate route is a dead end.
const mazeRoads=[[0,1],[1,6],[6,7],[7,12],[12,13],[13,18],[18,19],[19,24],[1,2],[2,3],[3,8],[6,5],[5,10],[12,11],[11,16],[16,15],[13,14],[14,9],[18,17],[17,22],[22,21],[21,20],[18,23]];
