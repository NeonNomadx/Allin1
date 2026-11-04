'use strict';
(() => {
  const $ = selector => document.querySelector(selector);
  const node = (tag, cls, text) => {const n = document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
  let editorial = {releases:[],trailers:[]};
  const now = new Date(); let calendarYear = now.getFullYear(), calendarMonth = now.getMonth();
  const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
  function updateMotion() { document.body.classList.toggle('motion-off',motionQuery.matches); }
  motionQuery.addEventListener('change',updateMotion);
  document.addEventListener('visibilitychange',() => document.body.classList.toggle('page-hidden',document.hidden));
  updateMotion();
  function sourceLink(url,text,cls) {const a=node('a',cls,text);a.href=/^https:\/\//.test(url||'')?url:'#';a.target='_blank';a.rel='noopener noreferrer';return a;}
  function daysUntil(date) {
    const [y,m,d] = date.split('-').map(Number), today = new Date();
    return Math.ceil((Date.UTC(y,m-1,d) - Date.UTC(today.getFullYear(),today.getMonth(),today.getDate()))/86400000);
  }
  function releaseDate(date) {return new Date(date+'T12:00:00').toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'});}
  function countdown(date) {if(!date)return 'Date to be announced';const days=daysUntil(date);return days>0?days+' '+(days===1?'day':'days')+' to scheduled date':days===0?'Scheduled for today':'Scheduled date has passed';}
  function renderReleases() {
    $('#releaseGrid').replaceChildren();
    for(const game of editorial.releases) {
      const card=node('article','release-card');card.append(node('h3','',game.title),node('span','release-date',game.date?releaseDate(game.date):'Date TBA'),node('p','',game.platforms.join(' · ')),node('span','release-countdown',countdown(game.date)),sourceLink(game.source,'Publisher announcement ↗','release-source'));
      $('#releaseGrid').append(card);
    }
    const next=editorial.releases.filter(g=>g.date&&daysUntil(g.date)>=0).sort((a,b)=>a.date.localeCompare(b.date))[0];
    $('#nextRelease').replaceChildren(node('h3','','Next release'));
    if(next) {
      $('#nextRelease').append(sourceLink(next.source,next.title,'next-release-title'),node('p','',releaseDate(next.date)),node('strong','next-release-count',countdown(next.date)),node('small','','Calendar date · regional unlock times may vary'));
    } else $('#nextRelease').append(node('p','','No future dates in the current verified selection.'));
  }
  function renderCalendar() {
    $('#calendarMonth').textContent=new Date(calendarYear,calendarMonth,1).toLocaleDateString(undefined,{month:'long',year:'numeric'});
    $('#calendarGrid').replaceChildren();
    const offset=new Date(calendarYear,calendarMonth,1).getDay(), total=new Date(calendarYear,calendarMonth+1,0).getDate();
    for(let i=0;i<offset;i++){const blank=node('div','calendar-day is-empty');blank.setAttribute('aria-hidden','true');$('#calendarGrid').append(blank);}
    for(let day=1;day<=total;day++) {
      const date=[calendarYear,String(calendarMonth+1).padStart(2,'0'),String(day).padStart(2,'0')].join('-');
      const games=editorial.releases.filter(game=>game.date===date);
      const cell=node(games.length?'button':'div','calendar-day'+(games.length?' has-release':'')+(date===new Date().toLocaleDateString('en-CA')?' is-today':''));cell.append(node('span','',day));
      if(games.length) {
        cell.append(node('span','calendar-star','★'));
        cell.setAttribute('aria-label',releaseDate(date)+': '+games.map(g=>g.title).join(', '));
        cell.addEventListener('click',()=>{
          $('#calendarSelection').replaceChildren(node('span','',releaseDate(date)+' — '));
          games.forEach((game,index)=>{if(index)$('#calendarSelection').append(document.createTextNode(' · '));$('#calendarSelection').append(sourceLink(game.source,game.title+' ↗'));});
          document.querySelectorAll('.calendar-day[aria-pressed]').forEach(b=>b.setAttribute('aria-pressed','false'));cell.setAttribute('aria-pressed','true');
        });
      }
      $('#calendarGrid').append(cell);
    }
  }
  $('#calendarPrev').addEventListener('click',()=>{if(--calendarMonth<0){calendarMonth=11;calendarYear--;}renderCalendar();});
  $('#calendarNext').addEventListener('click',()=>{if(++calendarMonth>11){calendarMonth=0;calendarYear++;}renderCalendar();});
  function renderReviews() {
    const {items=[],busy=false}=window.getAllin1News?.()||{};
    const reviews=items.filter(item=>/\breviews?\b/i.test([item.title,...(item.categories||[])].join(' '))).slice(0,4);
    $('#reviewGrid').replaceChildren();$('#reviewEmpty').hidden=reviews.length>0;
    $('#reviewEmpty').textContent=busy?'Checking review headlines…':'No reviews in the available feeds right now. Use More reviews to browse the publisher’s review section.';
    for(const item of reviews) {
      const card=node('article','story');
      if(/^https?:\/\//.test(item.image||'')){const art=sourceLink(item.link,'','story-art'),img=node('img');img.src=item.image;img.alt='';img.loading='lazy';img.addEventListener('error',()=>img.remove());art.append(img);card.append(art);}
      const body=node('div','story-body'),h=node('h3');h.append(sourceLink(item.link,item.title));body.append(node('p','eyebrow','REVIEW'),h,node('p','story-desc',item.description),sourceLink(item.link,item.source+' · '+new Date(item.date).toLocaleDateString()+' ↗','review-source'));card.append(body);$('#reviewGrid').append(card);
    }
  }
  function calendarDownload() {
    const esc=value=>String(value).replace(/\\/g,'\\\\').replace(/;/g,'\\;').replace(/,/g,'\\,').replace(/\n/g,'\\n');
    const entries=editorial.releases.filter(g=>g.date).map(g=>{
      const next=new Date(g.date+'T12:00:00Z');next.setUTCDate(next.getUTCDate()+1);
      return ['BEGIN:VEVENT','UID:'+g.date+'-'+g.title.toLowerCase().replace(/[^a-z0-9]/g,'')+'@allin1','DTSTAMP:20261102T000000Z','DTSTART;VALUE=DATE:'+g.date.replaceAll('-',''),'DTEND;VALUE=DATE:'+next.toISOString().slice(0,10).replaceAll('-',''),'SUMMARY:'+esc(g.title+' — scheduled release'),'DESCRIPTION:'+esc(g.note+' Source: '+g.source),'URL:'+g.source,'END:VEVENT'].join('\r\n');
    });
    const blob=new Blob([['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Allin1//Gaming Releases//EN',...entries,'END:VCALENDAR',''].join('\r\n')],{type:'text/calendar'});
    $('#downloadCalendar').href=URL.createObjectURL(blob);$('#downloadCalendar').download='neonnomad-releases.ics';
  }
  async function loadEditorial() {
    try {
      const response=await fetch('editorial.json');if(!response.ok)throw Error('Unavailable');
      const data=await response.json();if(!Array.isArray(data.releases))throw Error('Invalid data');
      editorial=data;renderReleases();renderCalendar();calendarDownload();
      $('#editorialStatus').textContent='Release dates verified '+data.verifiedAt+'. Dates are curated, not a live release feed.';
    } catch {
      $('#editorialStatus').textContent='Release dates could not load. Reload the page to try again.';
      $('#nextRelease').replaceChildren(node('p','','Release dates unavailable. Try reloading.'));
      $('#downloadCalendar').hidden=true;renderCalendar();
    }
  }
  window.addEventListener('allin1:news',renderReviews);
  setInterval(()=>{if(!document.hidden&&editorial.releases.length)renderReleases();},60000);
  renderReviews();renderCalendar();loadEditorial();
})();

