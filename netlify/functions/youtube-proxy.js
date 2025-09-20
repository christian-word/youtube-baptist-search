const RSS_URL = 'https://www.youtube.com/feeds/videos.xml?search_query=';

exports.handler = async (event, context) => {
  // разрешаем CORS для любого домена
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json; charset=utf-8'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const q = (event.queryStringParameters.q || 'проповедь').trim();
  const url = RSS_URL + encodeURIComponent(q);

  try {
    const rss = await fetch(url);
    if (!rss.ok) throw new Error('YT RSS ' + rss.status);
    const xml = await rss.text();

    // парсим нужные поля регулярками (быстро и без deps)
    const entryRE = /<entry>(.*?)<\/entry>/gs;
    const idRE    = /<yt:videoId>(.*?)<\/yt:videoId>/;
    const titRE   = /<title>(.*?)<\/title>/;
    const descRE  = /<media:description>(.*?)<\/media:description>/;

    const bad = ['православ','патриарх','литург','иегов','свидетел',
                 'адвентист','пятидесятн','харизмат','тбн','тв7'];

    const out = [...xml.matchAll(entryRE)]
      .map(m => {
        const block = m[1];
        return {
          id:    block.match(idRE)?.[1],
          title: block.match(titRE)?.[1],
          desc:  block.match(descRE)?.[1] || ''
        };
      })
      .filter(v => v.id)
      .filter(v => {
        const t = (v.title + ' ' + v.desc).toLowerCase();
        return !bad.some(word => t.includes(word));
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