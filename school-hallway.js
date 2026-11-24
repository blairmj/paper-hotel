'use strict';

const progress=readSchoolBook(SCHOOL_STORY_KEY);
const plan=schoolEscapeTimer(progress)&&schoolRoute(progress);
location.replace(plan?recoveryRoomLink(schoolRoomToPlay(progress,plan),true):schoolStartLink());
