'use strict';
(()=>{
 const $=s=>document.querySelector(s);
 function trailers(){const videos=window.getAllin1Trailers?.()||[],v=videos[0];$('#cityPreviewPlay').disabled=!v;$('#cityTrailerTitle').textContent=v?v.title:'Fresh trailers are loading…';const img=$('#cityTrailerImage');if(v){img.src='https://i.ytimg.com/vi/'+v.videoId+'/hqdefault.jpg';img.hidden=false;$('#cityPreviewPlay').dataset.video=v.videoId;}else img.hidden=true;}
 function reviews(){const state=window.getAllin1News?.(),list=(state?.items||[]).filter(x=>/review/i.test(x.source+' '+x.title+' '+(x.categories||[]).join(' '))).slice(0,2),grid=$('#cityReviews');grid.replaceChildren();if(!list.length){grid.textContent=state?.busy?'Checking the latest reviews…':'Reviews will appear when available in the news feeds.';return;}for(const item of list){try{const u=new URL(item.link);if(!/^https?:$/.test(u.protocol))continue;const a=document.createElement('a');a.href=u.href;a.target='_blank';a.rel='noopener noreferrer';a.textContent=item.title;grid.append(a);}catch{}}}
 $('#cityTrailerImage').addEventListener('error',()=>{$('#cityTrailerImage').hidden=true;});
 $('#cityPreviewPlay').addEventListener('click',()=>{window.playAllin1Trailer?.($('#cityPreviewPlay').dataset.video);});
 document.addEventListener('visibilitychange',()=>document.body.classList.toggle('page-hidden',document.hidden));
 window.addEventListener('allin1:trailers',trailers);window.addEventListener('allin1:news',reviews);trailers();reviews();
})();
