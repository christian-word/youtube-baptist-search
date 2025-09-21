// netlify/functions/youtube-proxy.js
const RSS_URL = 'https://www.youtube.com/feeds/videos.xml?search_query=';

exports.handler = async (event, context) => {
  // CORS-заголовки
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json; charset=utf-8'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // чистим запрос
  const raw = (event.queryStringParameters.q || 'проповедь')
              .trim()
              .replace(/ё/g, 'е')
              .replace(/\s+/g, ' ');
  const url = RSS_URL + encodeURIComponent(raw);

  // фильтрация по черному списку
  const bad = ['православ','патриарх','литург','иегов','свидетел',
               'адвентист','пятидесятн','харизмат','тбн','тв7'];

  try {
    const rss = await fetch(url, {
      // важно: нормальные заголовки
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/115.0',
        'Accept': 'application/atom+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });
    if (!rss.ok) throw new Error('YT RSS ' + rss.status);
    const xml = await rss.text();

    const entryRE = /<entry>(.*?)<\/entry>/gs;
    const idRE    = /<yt:videoId>(.*?)<\/yt:videoId>/;
    const titRE   = /<title>(.*?)<\/title>/;
    const descRE  = /<media:description>(.*?)<\/media:description>/;

    const out = [...xml.matchAll(entryRE)]
      .map(m => {
        const b = m[1];
        return {
          id:    b.match(idRE)?.[1],
          title: b.match(titRE)?.[1],
          desc:  b.match(descRE)?.[1] || ''
        };
      })
      .filter(v => v.id)
      .filter(v => {
        const t = (v.title + ' ' + v.desc).toLowerCase();
        return !bad.some(w => t.includes(w));
      })
      .slice(0, 6);                 // макс 6 штук

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(out)
    };
  } catch (e) {
    return {
      statusCode: 502,
      headers,
      body: JSON.stringify({ error: e.message })
    };
  }
};
