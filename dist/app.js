'use strict';
const feeds = [
  {name:'Steam News',url:'https://store.steampowered.com/feeds/news/collection/steam/',platform:'Steam'},
  {name:'Eurogamer',url:'https://www.eurogamer.net/feed',platform:'Gaming'},
  {name:'Push Square',url:'https://www.pushsquare.com/feeds/latest',platform:'PlayStation'},
  {name:'Xbox Wire',url:'https://news.xbox.com/en-us/feed/',platform:'Xbox'},
  {name:'Nintendo Life',url:'https://www.nintendolife.com/feeds/latest',platform:'Nintendo'},
  {name:'RockstarINTEL',url:'https://rockstarintel.com/feed/',platform:'Gaming',topic:'Rockstar'},
  {name:'RockstarINTEL Merch Watch',url:'https://rockstarintel.com/?s=merch&feed=rss2',platform:'Gaming',topic:'Rockstar',storeOnly:true},
  {name:'Eurogamer Reviews',url:'https://www.eurogamer.net/feed/reviews',platform:'Gaming'}
];
const {isRockstar, isStore, newsDate, mergeStories} = Allin1News;
const $ = selector => document.querySelector(selector);
let items = [], filter = 'All', saved = [], busy = false;
let rockstarFilter = 'All', rockstarExpanded = false;
let featureIndex = 0;
let rockstarStatus = 'Checking Rockstar headlines…';
try {
  saved = JSON.parse(localStorage.getItem('allin1-saved') || '[]');
  if (!Array.isArray(saved)) saved = [];
} catch {}
function safeUrl(value) {
  try { const u = new URL(value); return /^https?:$/.test(u.protocol) ? u.href : ''; } catch { return ''; }
}
function plain(value) {
  const doc = new DOMParser().parseFromString(String(value || ''), 'text/html');
  return doc.body.textContent.replace(/\s+/g, ' ').trim();
}
function platform(item, fallback) {
  if (fallback !== 'Gaming') return fallback;
  const text = (item.title + ' ' + (item.categories || []).join(' ')).toLowerCase();
  if (/\bsteam(?:deck|os)?\b|\bvalve\b/.test(text)) return 'Steam';
  if (/playstation|\bps5\b|\bps4\b/.test(text)) return 'PlayStation';
  if (/xbox|game pass/.test(text)) return 'Xbox';
  if (/nintendo|switch|pokémon|zelda|mario/.test(text)) return 'Nintendo';
  if (/\bpc\b|steam|valve|handheld/.test(text)) return 'PC';
  return 'Gaming';
}
function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = text;
  return node;
}
function link(url, cls) {
  const a = el('a', cls);
  a.href = safeUrl(url); a.target = '_blank'; a.rel = 'noopener noreferrer';
  return a;
}
function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(+date) ? 'Recent' : date.toLocaleDateString(undefined, {month:'short',day:'numeric',year:'numeric'});
}
function save(item) {
  saved = saved.some(x => x.link === item.link) ? saved.filter(x => x.link !== item.link) : [item,...saved];
  try { localStorage.setItem('allin1-saved', JSON.stringify(saved)); }
  catch { $('#status').textContent = 'Reading list works for this visit; browser storage is unavailable.'; }
  render();
}
function saveButton(item) {
  const exists = saved.some(x => x.link === item.link);
  const button = el('button', 'save', exists ? '✓ Saved' : '+ Save');
  button.setAttribute('aria-pressed', String(exists));
  button.setAttribute('aria-label', (exists ? 'Unsave story: ' : 'Save story: ') + item.title);
  button.addEventListener('click', () => save(item));
  return button;
}
function storyImage(item, cls, label) {
  const art = link(item.link, cls);
  art.setAttribute('aria-label', item.title);
  art.append(el('span', cls === 'story-art' ? 'art-label' : '', label));
  if (safeUrl(item.image)) {
    const img = el('img'); img.src = safeUrl(item.image); img.alt = '';
    img.loading = 'lazy'; img.referrerPolicy = 'no-referrer';
    img.addEventListener('error', () => img.remove());
    art.append(img);
  }
  return art;
}
function renderRockstar() {
  const rockstar = items.filter(isRockstar);
  const matching = rockstar.filter(item => rockstarFilter === 'All' || (rockstarFilter === 'Store' ? isStore(item) : !isStore(item)));
  $('#rockstarStories').replaceChildren();
  $('#rockstarStatus').textContent = rockstarStatus;
  $('#rockstarEmpty').hidden = matching.length > 0 || busy;
  const store = rockstarFilter === 'Store';
  $('#rockstarEmptyTitle').textContent = store ? 'No merch or store stories in the available feeds' : 'No Rockstar stories to show yet';
  $('#rockstarEmptyText').textContent = store ? 'Check the official Rockstar Store for the current range, or refresh later for reported announcements.' : 'Try refreshing, or visit the official Newswire for announcements.';
  $('#rockstarMore').hidden = matching.length <= 5;
  $('#rockstarMore').textContent = rockstarExpanded ? 'Show fewer updates ↑' : `Show all ${matching.length} updates ↓`;
  for (const item of (rockstarExpanded ? matching : matching.slice(0,5))) {
    const row = el('article', 'rockstar-row');
    const body = el('div', 'rockstar-row-body'), meta = el('div', 'rockstar-row-meta');
    const storeStory = isStore(item);
    meta.append(el('span','rockstar-row-tag' + (storeStory ? ' store-tag' : ''),storeStory ? 'Merch & store' : 'Game news'), el('span','',formatDate(item.date)));
    if (item.stale) meta.append(el('span','','Cached'));
    const h = el('h3'), a = link(item.link); a.textContent = item.title; h.append(a);
    const bottom = el('div', 'rockstar-row-source'), source = link(item.link); source.textContent = item.source + ' ↗';
    bottom.append(source,saveButton(item)); body.append(meta,h,bottom);
    row.append(storyImage(item,'rockstar-row-thumb',storeStory ? '✦' : 'R★'),body);
    $('#rockstarStories').append(row);
  }
}
function renderFeature() {
  const featured = items.filter(item => safeUrl(item.link)).slice(0,5);
  $('#topHeadlines').replaceChildren();
  if (!featured.length) {
    $('#topHeadlines').append(el('p','headlines-empty',busy ? 'Checking the latest gaming stories…' : 'Feeds unavailable. Try Refresh news below.'));
    $('#featureDescription').textContent = busy ? 'Loading the stories lighting up the gaming world.' : 'Explore your favourite platforms and the official news links below.';
    $('#featureControls').hidden = true;
    return;
  }
  featureIndex = (featureIndex + featured.length) % featured.length;
  const feature = featured[featureIndex];
  $('#featureTitle').textContent = feature.title;
  $('#featureDescription').textContent = feature.description ? feature.description.slice(0,170) : 'Read the latest story from ' + feature.source + '.';
  $('#featureByline').textContent = feature.source + ' · ' + formatDate(feature.date) + (feature.stale ? ' · Cached story' : '');
  $('#featureLink').href = safeUrl(feature.link);
  $('#featureLink').target = '_blank';
  $('#featureLink').rel = 'noopener noreferrer';
  $('#featureLink').textContent = 'Read story →';
  const image = $('#featureImage');
  image.hidden = true;
  if (safeUrl(feature.image)) {image.src = safeUrl(feature.image);image.hidden = false;}
  else {image.src = 'assets/neon-room.webp';image.hidden = false;}
  $('#featureControls').hidden = featured.length < 2;
  $('#featurePosition').textContent = (featureIndex + 1) + ' / ' + featured.length;
  featured.slice(0,3).forEach(item => {
    const row = el('article','top-headline');
    if (safeUrl(item.image)) {
      const img = el('img','top-headline-image');img.src = safeUrl(item.image);img.alt = '';img.loading = 'lazy';img.referrerPolicy = 'no-referrer';img.addEventListener('error',() => img.remove());row.append(img);
    }
    const body = el('div'), a = link(item.link);a.textContent = item.title;
    body.append(a,el('small','',item.source + ' · ' + formatDate(item.date)));row.append(body);$('#topHeadlines').append(row);
  });
}
function render() {
  const term = $('#search').value.trim().toLowerCase();
  const list = (filter === 'Saved' ? saved : items).filter(x => (filter === 'All' || filter === 'Saved' || (filter === 'Rockstar' ? isRockstar(x) : (x.platform === filter || (filter === 'PC' && x.platform === 'Steam')))) && (!term || (x.title+' '+x.description+' '+x.source).toLowerCase().includes(term)));
  $('#stories').replaceChildren();
  $('#savedCount').textContent = saved.length;
  $('#resultCount').textContent = list.length + ' ' + (list.length === 1 ? 'story' : 'stories');
  $('#empty').hidden = list.length > 0 || busy;
  $('#emptyTitle').textContent = filter === 'Saved' ? 'Your reading list starts here' : 'No stories found';
  $('#emptyText').textContent = filter === 'Saved' ? 'Tap “+ Save” on a story to keep it for later.' : 'Try another platform or search, or refresh the feed.';
  if (busy && !list.length) for(let i=0;i<4;i++) {const skeleton=el('div','story skeleton');skeleton.setAttribute('aria-hidden','true');$('#stories').append(skeleton);}
  for (const item of list) {
    const card = el('article', 'story'), art = storyImage(item,'story-art',isRockstar(item) ? 'R★' : item.platform === 'Gaming' ? 'PLAY' : item.platform.toUpperCase());
    const body = el('div','story-body'), tags = el('div','story-tags');
    tags.append(el('span','',isRockstar(item) ? (isStore(item) ? 'Rockstar · Merch & store' : 'Rockstar Games') : item.platform), el('span','',formatDate(item.date)));
    const h = el('h3'), a = link(item.link); a.textContent = item.title; h.append(a);
    const bottom = el('div','story-bottom'), source = link(item.link); source.textContent = item.source + (item.stale ? ' · Cached' : '') + ' ↗';
    bottom.append(source,saveButton(item)); body.append(tags,h,el('p','story-desc',item.description),bottom);card.append(art,body);$('#stories').append(card);
  }
  renderRockstar();
  renderFeature();
  window.dispatchEvent(new CustomEvent('allin1:news'));
}
function setFilter(value) {
  filter = value;
  document.querySelectorAll('[data-platform]').forEach(button=>{button.classList.toggle('active',button.dataset.platform===filter);button.setAttribute('aria-pressed',String(button.dataset.platform===filter));});
  document.querySelectorAll('[data-filter]').forEach(b => {b.classList.toggle('active',b.dataset.filter === filter);b.setAttribute('aria-pressed',String(b.dataset.filter === filter));});
  render();
}
function scrollToNews() {
  $('#newsTitle').scrollIntoView({behavior:document.body.classList.contains('motion-off') || matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',block:'start'});
}
function feedImage(item) {
  if(safeUrl(item.thumbnail || item.enclosure?.link)) return safeUrl(item.thumbnail || item.enclosure?.link);
  const doc = new DOMParser().parseFromString(String(item.content || item.description || ''),'text/html');
  const img = doc.querySelector('img');
  return safeUrl(img?.getAttribute('src') || img?.getAttribute('data-src'));
}
async function fetchFeed(feed) {
  const response = await fetch('https://api.rss2json.com/v1/api.json?rss_url='+encodeURIComponent(feed.url), {signal:AbortSignal.timeout(18000)});
  if (!response.ok) throw Error('Feed unavailable');
  const data = await response.json();
  if (data.status !== 'ok' || !Array.isArray(data.items)) throw Error('Invalid feed');
  return data.items.filter(x => safeUrl(x.link)).map(x => {
    const story = {title:plain(x.title),link:safeUrl(x.link),date:newsDate(x.pubDate),description:plain(x.description).slice(0,260),image:feedImage(x),platform:platform(x,feed.platform),source:feed.name,categories:Array.isArray(x.categories) ? x.categories.map(plain) : [],topic:feed.topic || ''};
    if (isRockstar(story)) story.topic = 'Rockstar';
    if (feed.kind === 'Store' || isStore(story)) story.kind = 'Store';
    return story;
  }).filter(story => !feed.storeOnly || isStore(story));
}
async function load() {
  if (busy) return;
  busy = true;
  for (const id of ['#refresh','#rockstarRefresh']) {$(id).disabled = true; $(id).textContent = '↻ Updating…';}
  $('#status').textContent = 'Checking gaming news sources…';
  rockstarStatus = 'Checking Rockstar news and store announcements…';
  render();
  const results = await Promise.allSettled(feeds.map(fetchFeed));
  const failed = feeds.filter((f,i) => results[i].status === 'rejected');
  const fresh = results.filter(x => x.status === 'fulfilled').flatMap(x => x.value);
  items = mergeStories(fresh,items,failed.map(f => f.name));
  const time = new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
  const rockstarFeeds = feeds.filter(f => f.topic === 'Rockstar');
  const rockstarFailures = failed.filter(f => f.topic === 'Rockstar');
  const cachedRockstar = items.some(item => isRockstar(item) && item.stale);
  rockstarStatus = rockstarFailures.length === rockstarFeeds.length ? (cachedRockstar ? 'Rockstar feeds unavailable · showing cached headlines. Try refreshing later.' : 'Rockstar feeds unavailable · try refreshing or use the official links.') : `Checked ${time} · ${rockstarFailures.length ? 'Some Rockstar feeds unavailable · ' : ''}Headlines via ${rockstarFeeds.filter(f => !rockstarFailures.includes(f)).map(f => f.name).filter((v,i,a) => a.indexOf(v)===i).join(' & ')}${cachedRockstar ? ' · Some headlines cached' : ''}`;
  if (fresh.length) {
    try {localStorage.setItem('allin1-feed',JSON.stringify({items,stamp:new Date().toISOString()}));} catch {}
    $('#status').textContent = `Checked ${time} · ${feeds.length-failed.length}/${feeds.length} sources available${failed.length ? ' · Some feeds unavailable' : ''}`;
  } else $('#status').textContent = items.length ? 'Feeds unavailable. Showing previously loaded stories; try refreshing later.' : 'News could not load. Try Refresh news, or use the official links below.';
  busy = false;
  $('#refresh').disabled = false; $('#refresh').textContent = '↻ Refresh news';
  $('#rockstarRefresh').disabled = false; $('#rockstarRefresh').textContent = '↻ Refresh Rockstar';
  render();
}
document.querySelectorAll('[data-filter]').forEach(b => b.addEventListener('click',() => setFilter(b.dataset.filter)));
document.querySelectorAll('[data-platform]').forEach(b => b.addEventListener('click',() => {setFilter(b.dataset.platform);scrollToNews();}));
document.querySelectorAll('[data-rockstar-filter]').forEach(b => b.addEventListener('click',() => {
  rockstarFilter = b.dataset.rockstarFilter; rockstarExpanded = false;
  document.querySelectorAll('[data-rockstar-filter]').forEach(tab => {tab.classList.toggle('active',tab === b);tab.setAttribute('aria-pressed',String(tab === b));});
  renderRockstar();
}));
$('#featureImage').addEventListener('error',() => {$('#featureImage').hidden = true;});
$('#featurePrev').addEventListener('click',() => {featureIndex -= 1;renderFeature();});
$('#featureNext').addEventListener('click',() => {featureIndex += 1;renderFeature();});
$('#rockstarMore').addEventListener('click',() => {rockstarExpanded = !rockstarExpanded;renderRockstar();});
$('#savedNav').addEventListener('click',() => {setFilter('Saved');scrollToNews();});
$('#search').addEventListener('input',render);
$('#refresh').addEventListener('click',load); $('#rockstarRefresh').addEventListener('click',load);
try {
  const cache = JSON.parse(localStorage.getItem('allin1-feed') || 'null');
  if (Array.isArray(cache?.items)) {items = cache.items.map(x => ({...x,stale:true}));$('#status').textContent = 'Previous headlines · checking for updates…';}
} catch {}
window.getAllin1News = () => ({items,busy});
render();load();setInterval(() => {if (!document.hidden) load();},15*60*1000);
