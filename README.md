# 학교 탈출

[학생용 게임 시작](https://blairmj.github.io/paper-hotel/)

하교 종이 울린 직후 학교 출입 시스템의 연결이 끊깁니다. 5학년 2반에서 출발해 교실마다 단서를 읽고 문 옆 장치에 필요한 입력을 맞춥니다. 입력이 맞으면 문이 열리며 다음 교실로 이동할 수 있습니다. 마지막 컴퓨터실에서 출입 신호를 맞추면 현관이 열리고 하교가 완료됩니다.

| 교실 | 풀이 과정 |
| --- | --- |
| 우리 교실 | 칠판의 점검 순서를 보고 복구 단말기에서 명령을 실행합니다. |
| 음악실 | 보면대의 변환 기록을 악보에 적용해 같은 건반 번호가 이어지는 구간을 세어 봅니다. |
| 미술실 | 게시판의 인쇄·보관 기록에서 선별 규칙을 찾아 오른쪽 공동 작업대의 새 판화 도안에 적용합니다. |
| 체육 준비실 | 서로 다른 라커에서 공의 배열과 회수 순서를 확인하고, 공을 뺀 뒤의 배열을 추적합니다. |
| 컴퓨터실 | 앞쪽의 신호 기록과 뒷줄의 분기표를 읽고 새로운 신호를 보낼 경로를 맞춥니다. |

화면을 끌어 둘러보고 바닥을 클릭해 이동합니다. **↑ / ↓** 또는 W·A·S·D로도 걸을 수 있습니다. 살펴본 단서는 **찾은 단서**에서 다시 확인할 수 있습니다.

각 교실의 제한 시간은 **2분**입니다. 힌트 사용을 확인하면 10초가 차감됩니다. 마지막 10초에는 타이머가 빨갛게 점멸합니다. 시간이 끝나면 **다시 도전**을 누릅니다. 진행 상황과 남은 시간은 현재 브라우저에 저장됩니다.

## 교실 검토

[우리 교실 검토](https://blairmj.github.io/paper-hotel/index.html?review=1)에서 **바로가기**를 열어 어느 교실이든 연습할 수 있습니다. 개별 교실 주소도 검토 화면으로 열립니다. 검토 진행과 학생용 진행은 서로 다른 기록에 저장됩니다.

- [음악실](https://blairmj.github.io/paper-hotel/music.html)
- [미술실](https://blairmj.github.io/paper-hotel/art.html)
- [체육 준비실](https://blairmj.github.io/paper-hotel/sports.html)
- [컴퓨터실](https://blairmj.github.io/paper-hotel/computer.html)

## 수정과 배포

이 저장소의 main 브랜치 루트가 GitHub Pages의 게시 폴더입니다. 로컬에서는 이 폴더에서 `python -m http.server 8000`을 실행합니다. 3D 렌더링에는 [Three.js](./three-LICENSE.txt)를 사용합니다.

`school-puzzles.js`는 퍼즐 자료와 풀이 규칙을 정의합니다. `school-room.js`는 퍼즐 조작과 교실 이동을 처리합니다. `review-rooms.js`는 교실 순서, 진행 기록과 타이머를 관리합니다. 출발 교실과 현관은 `classroom-interior.js`, 음악실과 미술실은 `school-interiors.js`, 체육 준비실과 컴퓨터실은 `sports-computer-interiors.js`에서 구성합니다. 이동과 충돌, 문 애니메이션은 `music-world.js`를 사용합니다.

교실 동선, 퍼즐과 진행 기록, 제한 시간은 `node --test tests/interiors.test.cjs`로 검사합니다.
