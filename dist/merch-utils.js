'use strict';
(function(root){
 const categories=['Controllers','Collabs','Apparel','LEGO','Consoles','Collectibles'];
 function classify(item){
  const s=String(item.title||'');
  const physical=/\b(merch(?:andise)?|apparel|hoodie|shirts?|sneakers?|footwear|lego|collectibles?|figurines?|plush|vinyl|physical|clothing|jerseys?|jackets?|accessories|dualsense|joy-con|gamepads?|headsets?|keyboards?|mice)\b/i.test(s);
  if(/\b(leak(?:ed|s)?|rumou?rs?|concept|fan[ -]made|unofficial)\b/i.test(s))return [];
  if(/\b(in[ -]game|skins?|cosmetics?)\b/i.test(s)&&!/\b(merch(?:andise)?|physical|real[ -]world|sneakers?|footwear|building sets?)\b/i.test(s))return [];
  if(!physical&&/\b(controller support|controller settings|game pass|in[ -]game|skins?|cosmetics?|fortnite|pre[ -]install|pre[ -]download|system update|firmware|review)\b/i.test(s))return [];
  const tags=[];
  if(/\b(controllers?|dualsense|joy-con|gamepads?)\b/i.test(s))tags.push('Controllers');
  if(/\b(apparel|hoodies?|shirts?|sneakers?|footwear|clothing|jerseys?|jackets?|caps?)\b/i.test(s))tags.push('Apparel');
  if(/\blego\b/i.test(s))tags.push('LEGO');
  if(/\b(consoles?|hardware|handhelds?|steam deck|ps5 pro|playstation 5 pro)\b|\b(?:new|limited edition)\s+(?:ps5|xbox series [xs]|nintendo switch 2)\b/i.test(s))tags.push('Consoles');
  if(physical&&/\b(collab(?:oration)?s?|crossover|partnership|collection|limited edition)\b|\s[x×]\s/i.test(s))tags.push('Collabs');
  if(/\b(merch(?:andise)?|collectibles?|figurines?|plush|vinyl|replicas?|statues?|art book)\b/i.test(s))tags.push('Collectibles');
  return tags;
 }
 function productUrl(value){
  try{
   const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password||u.port)return '';
   const h=u.hostname.toLowerCase(),p=u.pathname;
   const valid=(h==='www.playstation.com'&&p==='/en-us/accessories/dualsense-wireless-controller/')||
    (h==='www.lego.com'&&/^\/[a-z]{2}-[a-z]{2}\/product\/.+/i.test(p))||
    (h==='direct.playstation.com'&&/^\/[a-z]{2}-[a-z]{2}\/buy-(?:accessories|consoles)\/.+/i.test(p))||
    (h==='www.xbox.com'&&/^\/[a-z]{2}-[a-z]{2}\/(?:accessories\/(?:controllers|headsets)\/|consoles\/).+/i.test(p))||
    (h==='gear.xbox.com'&&/^\/products\/.+/.test(p))||
    (h==='www.nintendo.com'&&/^\/us\/store\/products\/.+/.test(p))||
    (h==='www.pokemoncenter.com'&&/^\/product\/.+/.test(p))||
    (h==='www.minecraftshop.com'&&/^\/products\/.+/.test(p))||
    (h==='store.steampowered.com'&&/^\/steamdeck\/?$/.test(p))||
    (h==='store.rockstargames.com'&&/^\/(?:[a-z]{2}\/)?(?:merchandise|products)\/.+/.test(p));
   if(!valid)return '';u.hash='';for(const key of [...u.searchParams.keys()])if(/^(utm_|affiliate|aff_|ref$|ocid|cmp)/i.test(key))u.searchParams.delete(key);return u.href;
  }catch{return '';}
 }
 function matches(item,category,term){return (category==='All'||item.categories.includes(category))&&(!term||[item.title,item.brand||item.source||'',item.description||''].join(' ').toLowerCase().includes(term.toLowerCase()));}
 const api={categories,classify,productUrl,matches};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Allin1Merch=api;
})(globalThis);
