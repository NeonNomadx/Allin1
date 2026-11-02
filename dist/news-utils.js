'use strict';
(function (root) {
  function text(item) {
    return [item.title, ...(Array.isArray(item.categories) ? item.categories : [])].filter(Boolean).join(' ');
  }
  function isRockstar(item) {
    return item.topic === 'Rockstar' || /rockstarintel/i.test(item.source || '') || /\b(rockstar|grand theft auto|gta|red dead|bully|max payne|l\.?a\.? noire|midnight club)\b/i.test(text(item));
  }
  function isStore(item) {
    if (item.kind === 'Store') return true;
    const title = text(item);
    const physicalContext = /\b(merch(?:andise)?|physical|shipping|collect[ai]bles?|vinyl|sneakers?|footwear|air force 1s?|rockstar(?: games)? (?:store|warehouse)|restocks?)\b/i.test(title);
    const inGameContext = /\bin[ -]game\b|\b(gta online|red dead online)\b/i.test(title);
    if (inGameContext && !physicalContext) return false;
    return physicalContext || /\b(apparel|t[ -]?shirts?|hoodies?)\b/i.test(title);
  }
  function newsDate(value) {
    if (!value) return '';
    const raw = String(value).trim();
    const iso = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(raw) ? raw.replace(' ', 'T') + 'Z' : raw;
    const date = new Date(iso);
    return Number.isNaN(+date) ? '' : date.toISOString();
  }
  function mergeStories(fresh, cached, failedSources) {
    const entries = [...fresh, ...cached.filter(item => failedSources.includes(item.source)).map(item => ({...item, stale: true}))];
    const unique = new Map();
    for (const item of entries) {
      if (!unique.has(item.link)) unique.set(item.link, item);
    }
    return [...unique.values()].sort((a, b) => (Date.parse(b.date) || 0) - (Date.parse(a.date) || 0));
  }
  const api = {isRockstar, isStore, newsDate, mergeStories};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Allin1News = api;
})(globalThis);
