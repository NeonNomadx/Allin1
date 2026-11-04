'use strict';
(() => {
 const $=s=>document.querySelector(s);
 const feeds=[['PlayStation','UC-2Y8dQb0S6DtpxNgAKoJKA'],['Xbox','UCjBp_7RuDBUYbd1LegWEJ8g'],['Nintendo','UCGIY_O-8vW4rfX98KlMkvRg'],['Steam','UChmZ6QbxgHlmX3ISIHxIpQQ']];
 let videos=[],filter='All',busy=false,player=null,selected=null,request=0;
 const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
 const text=value=>new DOMParser().parseFromString(String(value||''),'text/html').body.textContent.trim();
 function date(value){const d=new Date(value);return Number.isNaN(+d)?'Date unavailable':d.toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'});}
 function merge(list){const counts={};return [...new Map(list.filter(x=>/^[\w-]{11}$/.test(x.videoId)).map(x=>[x.videoId,x])).values()].sort((a,b)=>(Date.parse(b.date)||0)-(Date.parse(a.date)||0)).filter(x=>(counts[x.channel]=(counts[x.channel]||0)+1)<=6).slice(0,24);}
 function stop(){request++;if(player){try{player.destroy();}catch{}player=null;}$('#trailerPlayer').replaceChildren();$('#trailerPlayerShell').hidden=true;selected=null;}
 let apiPromise;
 function youtubeAPI(){
  if(window.YT?.Player)return Promise.resolve(window.YT);
  if(apiPromise)return apiPromise;
  apiPromise=new Promise((resolve,reject)=>{
   const previous=window.onYouTubeIframeAPIReady;
   const timer=setTimeout(()=>reject(Error('Player API unavailable')),12000);
   window.onYouTubeIframeAPIReady=()=>{clearTimeout(timer);if(previous)previous();resolve(window.YT);};
   const script=document.createElement('script');script.src='https://www.youtube.com/iframe_api';script.onerror=()=>{clearTimeout(timer);reject(Error('Player unavailable'));};document.head.append(script);
  }).catch(error=>{apiPromise=null;throw error;});
  return apiPromise;
 }
 async function play(video){
  stop();selected=video;const token=request;
  $('#trailerPlayerShell').hidden=false;$('#trailerNowTitle').textContent=video.title;
  $('#trailerNowSource').textContent=video.channel+' · '+date(video.date);
  $('#trailerPlayerStatus').textContent='Loading trailer. If autoplay is blocked, tap Play inside the video.';
  const iframe=el('iframe');iframe.id='activeTrailerFrame';iframe.title=video.title;
  const url=new URL('https://www.youtube-nocookie.com/embed/'+video.videoId);
  url.search=new URLSearchParams({autoplay:'1',playsinline:'1',rel:'0',enablejsapi:'1',...(location.protocol==='https:'?{origin:location.origin,widget_referrer:location.origin+location.pathname}:{})});
  iframe.src=url.href;iframe.allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen';iframe.allowFullscreen=true;iframe.referrerPolicy='strict-origin-when-cross-origin';
  $('#trailerPlayer').append(iframe);
  $('#trailerPlayerShell').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches||document.body.classList.contains('motion-off')?'instant':'smooth',block:'nearest'});
  try{
   const YT=await youtubeAPI();if(token!==request)return;
   player=new YT.Player(iframe,{events:{
    onReady:()=>{if(token===request)$('#trailerPlayerStatus').textContent='Play, pause, and use fullscreen here on the site.';},
    onStateChange:event=>{if(token===request&&event.data===1)$('#trailerPlayerStatus').textContent='Playing here · '+video.channel;},
    onError:event=>{if(token!==request)return;$('#trailerPlayerStatus').textContent=[101,150].includes(event.data)?'The publisher disabled embedding for this video. Choose another trailer below.':event.data===153?'YouTube could not verify this embedded player. Try reloading in Safari or choosing another trailer.':'This video is unavailable or restricted. Choose another trailer below.';}
   }});
  }catch{if(token===request)$('#trailerPlayerStatus').textContent='The embedded player controls may be blocked by your browser or network. Try Play inside the video or choose another trailer.';}
 }
 function render(){
  const list=videos.filter(v=>filter==='All'||v.channel===filter);$('#trailerGrid').replaceChildren();
  if(!list.length){$('#trailerGrid').append(el('p','section-note',busy?'Checking recent trailer uploads…':'No trailers available for this platform. Refresh or choose another platform.'));return;}
  for(const video of list){
   const card=el('article','trailer-card'),poster=el('button','video-facade');poster.type='button';poster.setAttribute('aria-label','Play '+video.title+' on this page');
   const img=el('img');img.src='https://i.ytimg.com/vi/'+video.videoId+'/hqdefault.jpg';img.alt='';img.loading='lazy';img.width=480;img.height=270;img.onerror=()=>img.remove();
   poster.append(img,el('span','video-play','▶'));poster.addEventListener('click',()=>play(video));
   const h=el('h3'),title=el('button','trailer-title',video.title);title.type='button';title.addEventListener('click',()=>play(video));h.append(title);
   card.append(poster,h,el('p','',video.channel+' · '+date(video.date)));$('#trailerGrid').append(card);
  }
 }
 async function getFeed([channel,id]){
  const rss='https://www.youtube.com/feeds/videos.xml?channel_id='+id;
  const r=await fetch('https://api.rss2json.com/v1/api.json?rss_url='+encodeURIComponent(rss),{signal:AbortSignal.timeout(15000)});
  if(!r.ok)throw Error('Feed unavailable');const data=await r.json();if(data.status!=='ok'||!Array.isArray(data.items))throw Error('Invalid feed');
  return data.items.filter(x=>/trailer|gameplay reveal|announcement/i.test(text(x.title))).flatMap(x=>{
   let id;try{const u=new URL(x.link);if(!['www.youtube.com','youtube.com','youtu.be'].includes(u.hostname))return [];id=u.hostname==='youtu.be'?u.pathname.slice(1):u.searchParams.get('v');}catch{return [];}
   if(!/^[\w-]{11}$/.test(id||''))return [];
   return [{title:text(x.title),videoId:id,channel,date:x.pubDate?.replace(' ','T')+'Z'}];
  });
 }
 async function refresh(){
  if(busy)return;busy=true;$('#trailerRefresh').disabled=true;$('#trailerFeedStatus').textContent='Checking recent publisher trailers…';render();
  const results=await Promise.allSettled(feeds.map(getFeed));const failed=feeds.filter((_,i)=>results[i].status==='rejected').map(x=>x[0]);
  const fresh=results.filter(x=>x.status==='fulfilled').flatMap(x=>x.value);
  videos=merge([...fresh,...videos.filter(v=>failed.includes(v.channel))]);
  if(fresh.length){try{localStorage.setItem('neonnomad-trailers-v1',JSON.stringify({checkedAt:new Date().toISOString(),items:videos}));}catch{}$('#trailerFeedStatus').textContent='Checked '+new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})+' · Newest first · '+(failed.length?'Some feeds unavailable; saved items may appear.':'Publisher feeds may cache recent uploads.');}
  else $('#trailerFeedStatus').textContent=videos.length?'Live feeds unavailable. Showing saved trailers with their original publish dates; try Refresh later.':'Trailer feeds could not load. Please try Refresh again.';
  busy=false;$('#trailerRefresh').disabled=false;render();
 }
 document.querySelectorAll('[data-trailer-filter]').forEach(b=>b.addEventListener('click',()=>{filter=b.dataset.trailerFilter;document.querySelectorAll('[data-trailer-filter]').forEach(t=>t.setAttribute('aria-pressed',String(t===b)));render();}));
 $('#trailerClose').addEventListener('click',stop);$('#trailerRetry').addEventListener('click',()=>{if(selected)play(selected);});$('#trailerRefresh').addEventListener('click',refresh);
 async function start(){
  try{const cache=JSON.parse(localStorage.getItem('neonnomad-trailers-v1')||'null');if(Array.isArray(cache?.items))videos=merge(cache.items);}catch{}
  if(!videos.length){try{const r=await fetch('trailers-cache.json');if(r.ok){const d=await r.json();videos=merge(d.items||[]);}}catch{}}
  render();refresh();
 }
 start();setInterval(()=>{if(!document.hidden)refresh();},15*60*1000);
})();
