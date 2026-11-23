'use strict';

globalThis.SchoolRecords=(()=>{
  const endpoint='https://school-escape-student-intake.blair-mj.chatgpt.site/api/student/';
  const contextKey='school.escape.class.context',pendingPrefix='school.escape.submit.';
  const lesson=new URLSearchParams(location.search).get('lesson')==='1';
  const volatile=new Map();
  let busy=false,retryTimer=0,delay=1500,storageWarning=false;
  function context(){try{return JSON.parse(sessionStorage.getItem(contextKey))}catch{return null}}
  function setContext(value){sessionStorage.setItem(contextKey,JSON.stringify(value))}
  function validCode(raw){return String(raw).replace(/[\s-]/g,'').toUpperCase()}
  async function post(action,payload){
    let response;
    try{response=await fetch(endpoint+action,{method:'POST',body:JSON.stringify(payload),headers:{'Content-Type':'text/plain;charset=UTF-8'},credentials:'omit',cache:'no-store',keepalive:true,signal:AbortSignal.timeout(13000)})}
    catch{throw Error('기록 서버에 연결되지 않았어요. 인터넷 연결을 확인하고 다시 시도하세요.')}
    const value=await response.json().catch(()=>null);
    if(!response.ok||!value){const err=Error(value?.error??'기록 서버 응답을 확인할 수 없습니다.');err.status=response.status;throw err}
    return value;
  }
  async function join(raw,seat){
    const code=validCode(raw);
    if(!/^[A-HJ-NP-Z2-9]{12}$/.test(code))throw Error('참여 코드 12자리를 확인하세요.');
    if(!Number.isInteger(seat)||seat<1||seat>99)throw Error('출석번호를 1부터 99까지 입력하세요.');
    const {label}=await post('check',{code});
    try{setContext({code,seat,label,session:crypto.randomUUID()})}catch{throw Error('이 브라우저에서 수업을 저장할 수 없어요. 브라우저 저장소를 허용해 주세요.')}
  }
  function key(){return Array.from(crypto.getRandomValues(new Uint8Array(32)),n=>n.toString(16).padStart(2,'0')).join('')}
  async function reserve(stops){
    if(!lesson)return null;
    const c=context();if(!c)throw Error('학급 참여 링크에서 출석번호를 입력하세요.');
    const signature=stops.join(',');
    if(!c.pending||c.pending.route!==signature){
      c.pending={id:crypto.randomUUID(),key:key(),route:signature};setContext(c);
    }
    const {id,key:proof}=c.pending;
    await post('start',{id,key:proof,code:c.code,seat:c.seat,stops});return {id,key:proof};
  }
  function started(){const c=context();if(c?.pending){delete c.pending;setContext(c)}}
  function savedEntries(){
    const entries=new Map(volatile);
    for(const storage of ['sessionStorage','localStorage'])try{
      const db=window[storage];for(let i=0;i<db.length;i++){
        const k=db.key(i);if(k?.startsWith(pendingPrefix)){const v=JSON.parse(db.getItem(k));if(v)entries.set(k,v)}
      }
    }catch{}
    return entries;
  }
  function remove(k){
    volatile.delete(k);
    for(const storage of ['sessionStorage','localStorage'])try{window[storage].removeItem(k)}catch{}
  }
  function showSync(text){
    let badge=document.getElementById('recordSync');
    if(!badge&&lesson){const header=document.querySelector('.room-head nav');if(!header)return;
      badge=document.createElement('span');badge.id='recordSync';badge.setAttribute('role','status');header.prepend(badge)}
    if(badge){badge.textContent=text;badge.hidden=!text}
  }
  function schedule(ms){if(!retryTimer)retryTimer=setTimeout(()=>{retryTimer=0;flush()},ms)}
  async function sendEvents(batch){
    const first=batch[0][1];
    const result=await post('events',{id:first.id,key:first.key,events:batch.map(([,entry])=>entry.event)});
    if(result.accepted!==batch.length)throw Error('저장 확인 대기');
    batch.forEach(([k])=>remove(k));
  }
  async function submitSurvey(ref,answers){
    if(!lesson||!ref)throw Error('이 플레이의 학급을 확인할 수 없어요.');
    // The survey checks visited rooms on the server. Send this attempt's pending visits first.
    const pending=[...savedEntries()].filter(([,entry])=>entry.id===ref.id);
    for(let offset=0;offset<pending.length;offset+=24)await sendEvents(pending.slice(offset,offset+24));
    const result=await post('survey',{id:ref.id,key:ref.key,answers});
    if(result.accepted!==true)throw Error('설문을 보내지 못했어요. 다시 시도해 주세요.');
  }
  async function flush(){
    if(busy)return;
    const pending=savedEntries();
    if(!pending.size){showSync(storageWarning?'기록 저장소 확인 필요':'');return}
    const first=pending.values().next().value;
    const batch=[...pending.entries()].filter(([,r])=>r.id===first.id).slice(0,24);
    busy=true;
    try{
      await sendEvents(batch);delay=1500;showSync('');schedule(100);
    }catch(e){
      if(e.status===403){
        // A deleted class no longer accepts its former attempts.
        batch.forEach(([k])=>remove(k));showSync('이 수업의 기록 접수가 종료됐어요.');schedule(1500);
      }else{showSync('기록 전송 대기');delay=Math.min(delay*2,30000);schedule(delay)}
    }finally{busy=false}
  }
  function event(book,room,kind,detail=''){
    const ref=book?.lessonAttempt,start=book?.escapeTimer?.startedAt;
    if(!lesson||!ref||!Number.isFinite(start))return;
    const single=['enter','solve','timeout','clue'].includes(kind);
    const id=single?[room,kind,detail].join('-'):crypto.randomUUID();
    const k=pendingPrefix+ref.id+'.'+id;
    const v={id:ref.id,key:ref.key,event:{id,room,kind,detail,elapsed:Math.max(0,Math.min(600000,Date.now()-start))}};
    let stored=false;
    for(const storage of ['localStorage','sessionStorage'])try{
      const db=window[storage];if(!db.getItem(k))db.setItem(k,JSON.stringify(v));stored=true;break;
    }catch{}
    if(!stored){storageWarning=true;if(!volatile.has(k))volatile.set(k,v)}
    schedule(70);
  }
  // Queue items are written synchronously before a classroom navigation.
  window.addEventListener('online',flush);
  window.addEventListener('pageshow',()=>schedule(100));
  window.addEventListener('pagehide',flush);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)flush()});
  const active=context();
  return {lesson,context,join,reserve,started,event,flush,submitSurvey,storyKey:lesson&&active?'school.escape.lesson.'+active.session:null};
})();
