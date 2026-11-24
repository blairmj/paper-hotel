'use strict';

const entry=schoolEntryProgress(readSchoolBook(SCHOOL_STORY_KEY));
location.replace(entry.status==='active'||entry.status==='complete'?recoveryRoomLink(entry.room,true):schoolStartLink());
