'use strict';
const form=document.getElementById('joinForm'),code=document.getElementById('classCode'),seat=document.getElementById('seatNumber'),err=document.getElementById('joinError');
const supplied=location.hash.slice(1);
if(/^[a-z2-9 -]{12,16}$/i.test(supplied)){code.value=supplied.match(/.{1,4}/g).join(' ');seat.focus()}
form.onsubmit=async e=>{
  e.preventDefault();if(!form.reportValidity())return;
  const button=form.querySelector('button');button.disabled=true;button.textContent='학급 확인 중';err.hidden=true;
  try{await SchoolRecords.join(code.value,seat.valueAsNumber);location.assign('./?lesson=1')}
  catch(error){err.textContent=error.message;err.hidden=false;button.disabled=false;button.textContent='수업에 참여'}
};
