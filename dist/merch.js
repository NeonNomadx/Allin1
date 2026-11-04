'use strict';
(()=>{
 const $=s=>document.querySelector(s),{classify,productUrl,matches}=Allin1Merch;
 const feeds=[{name:'Xbox Wire',url:'https://news.xbox.com/en-us/feed/'},{name:'PlayStation Blog',url:'https://blog.playstation.com/feed/'},{name:'RockstarINTEL',url:'https://rockstarintel.com/?s=merch&feed=rss2'},{name:'Nintendo Life',url:'https://www.nintendolife.com/feeds/latest'}];
 let products=[],stories=[],category='All',view='news',busy=false,checkedAt='',catalogError=false;
 const node=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
 const plain=value=>new DOMParser().parseFromString(String(value||''),'text/html').body.textContent.replace(/\s+/g,' ').trim();
 const safe=value=>{try{const u=new URL(value);return u.protocol==='https:'?u.href:'';}catch{return '';}};
 const date=value=>{const d=new Date(/^\d{4}-\d{2}-\d{2}$/.test(value)?value+'T12:00:00Z':value);return Number.isNaN(+d)?'Date unavailable':d.toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'});};
 function link(url,label,cls){const a=node('a',cls,label);a.href=url;a.target='_blank';a.rel='noopener noreferrer';a.setAttribute('aria-label',label+' (opens in a new tab)');return a;}
 function art(item,icon){const a=node('div','merch-art');a.setAttribute('aria-hidden','true');a.append(node('span','merch-art-icon',icon));if(safe(item.image)){const img=node('img');img.src=safe(item.image);img.alt='';img.width=480;img.height=320;img.loading='lazy';img.addEventListener('error',()=>img.remove());a.append(img);}return a;}
 function productLinks(item){const links=(Array.isArray(item.productLinks)?item.productLinks:[]).filter(x=>productUrl(x));for(const p of products){if(p.match&&new RegExp(p.match,'i').test(item.title))links.push(p.url);}return [...new Set(links.map(productUrl).filter(Boolean))].slice(0,3);}
 function render(){
  const term=$('#merchSearch').value.trim(),list=(view==='news'?stories:products).filter(x=>matches(x,category,term));
  $('#merchNewsPanel').hidden=view!=='news';$('#merchProductsPanel').hidden=view!=='products';
  const grid=$(view==='news'?'#merchNewsGrid':'#merchProductGrid');grid.replaceChildren();
  $('#merchCount').textContent=list.length+' '+(view==='news'?'updates':'products');
  $('#merchEmpty').hidden=list.length>0||busy;
  $('#merchEmpty').textContent=view==='news'?'No matching merch announcements in the available feeds. Try another category or browse Official products.':'No products match. Try another category or search.';
  if(!list.length&&busy&&view==='news'){for(let i=0;i<3;i++)grid.append(node('div','merch-card skeleton'));}
  for(const item of list){
   const card=node('article','merch-card');card.append(art(item,view==='news'?'✧':item.icon||'◇'));
   const body=node('div','merch-card-body'),tags=node('div','merch-tags');for(const c of item.categories)tags.append(node('span','',c));body.append(tags);
   const h=node('h4');h.textContent=item.title;body.append(h,node('p','merch-byline',view==='news'?item.source+' · '+date(item.date)+(item.stale?' · Saved':''):item.brand+(item.region?' · '+item.region:'')));
   if(item.description)body.append(node('p','merch-description',item.description));
   const actions=node('div','merch-actions');
   if(view==='products'){const u=productUrl(item.url);if(u)actions.append(link(u,'View product ↗','merch-product-link'));}
   else{
    const links=productLinks(item);for(const [i,u] of links.entries())actions.append(link(u,(links.length>1?'Product '+(i+1):'View product')+' ↗','merch-product-link'));
    actions.append(link(item.link,'Read announcement ↗','merch-news-link'));
    if(!links.length)body.append(node('p','merch-link-note','No verified direct product link supplied in this feed.'));
   }
   body.append(actions);card.append(body);grid.append(card);
  }
  $('#merchCatalogNote').textContent=catalogError?'Product catalog unavailable. Reload to try again.':'Official product pages checked '+date(checkedAt)+'. This is a curated shelf, not a stock feed. Check each store for current prices, availability, and delivery regions.';
 }
 function merge(fresh,cached,failed){const map=new Map();for(const s of [...fresh,...cached.filter(x=>failed.includes(x.source)).map(x=>({...x,stale:true}))])if(!map.has(s.link))map.set(s.link,s);return [...map.values()].sort((a,b)=>(Date.parse(b.date)||0)-(Date.parse(a.date)||0)).slice(0,60);}
 async function getFeed(feed){
  const r=await fetch('https://api.rss2json.com/v1/api.json?rss_url='+encodeURIComponent(feed.url),{signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error('Source unavailable');
  const data=await r.json();if(data.status!=='ok'||!Array.isArray(data.items))throw Error('Invalid feed');
  return data.items.flatMap(item=>{
   const title=plain(item.title),categories=classify({title,categories:(item.categories||[]).map(plain)}),url=safe(item.link);if(!categories.length||!url)return [];
   const doc=new DOMParser().parseFromString(String(item.content||item.description||''),'text/html');
   const links=[...doc.querySelectorAll('a[href]')].map(a=>{try{return productUrl(new URL(a.getAttribute('href'),url).href);}catch{return '';}}).filter(Boolean);
   const raw=String(item.pubDate||'').trim(),d=new Date(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(raw)?raw.replace(' ','T')+'Z':raw);
   return [{title,categories,link:url,source:feed.name,date:Number.isNaN(+d)?'':d.toISOString(),description:plain(item.description).slice(0,200),image:safe(item.thumbnail||item.enclosure?.link||doc.querySelector('img')?.getAttribute('src')),productLinks:links}];
  });
 }
 async function refresh(){
  if(busy)return;busy=true;$('#merchRefresh').disabled=true;$('#merchStatus').textContent='Checking gaming merch announcements…';render();
  const results=await Promise.allSettled(feeds.map(getFeed)),failed=feeds.filter((_,i)=>results[i].status==='rejected').map(f=>f.name),fresh=results.filter(r=>r.status==='fulfilled').flatMap(r=>r.value);
  stories=merge(fresh,stories,failed);busy=false;$('#merchRefresh').disabled=false;
  $('#merchStatus').textContent=failed.length===feeds.length?'Live merch feeds unavailable. Showing saved updates where available. Try Refresh later.':'Checked '+new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})+' · '+(feeds.length-failed.length)+'/'+feeds.length+' sources available'+(failed.length?' · Some saved updates may appear.':' · Newest first.');
  try{localStorage.setItem('allin1-merch-v1',JSON.stringify(stories));}catch{}render();
 }
 document.querySelectorAll('[data-merch-view]').forEach(b=>b.addEventListener('click',()=>{view=b.dataset.merchView;document.querySelectorAll('[data-merch-view]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));render();}));
 document.querySelectorAll('[data-merch-category]').forEach(b=>b.addEventListener('click',()=>{category=b.dataset.merchCategory;document.querySelectorAll('[data-merch-category]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));render();}));
 $('#merchSearch').addEventListener('input',render);$('#merchRefresh').addEventListener('click',refresh);
 async function start(){
  try{const r=await fetch('merch-data.json');if(!r.ok)throw Error();const d=await r.json();products=(d.products||[]).filter(x=>productUrl(x.url));checkedAt=d.checkedAt||'';}catch{catalogError=true;}
  try{const cache=JSON.parse(localStorage.getItem('allin1-merch-v1')||'null');if(Array.isArray(cache))stories=cache.filter(s=>safe(s.link)&&Array.isArray(s.categories)).map(s=>({...s,stale:true}));}catch{}
  if(!stories.length)try{const r=await fetch('merch-news-cache.json');if(r.ok){const d=await r.json();stories=(d.items||[]).map(s=>({...s,stale:true}));}}catch{}
  render();refresh();
 }
 start();setInterval(()=>{if(!document.hidden)refresh();},15*60*1000);
})();
