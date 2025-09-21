const axios = require('axios');
const xml2js = require('xml2js');

const blacklist = [
  'православ','иегов','пятидесятн','харизмат','тбн','спас','енисейск',
  'адвентист','мormon','catholic','папа римск','мария богомат','икона',
  'молитва о здравии','чтение никона','крещение младенц','епископ',' патриарх'
];

exports.handler = async (event) => {
  const q = (event.queryStringParameters.q || '').trim();
  if (!q) return { statusCode: 400, body: '[]' };

  try {
    const rss = await axios.get(
      `https://www.youtube.com/feeds/videos.xml?search_query=${encodeURIComponent(q)}`,
      { timeout: 4000 }
    );

    const parsed = await xml2js.parseStringPromise(rss.data, { mergeAttrs: true });
    const entries = parsed.feed.entry || [];

    const filtered = entries
      .map(e => ({
        id: e['yt:videoId'][0],
        title: e.title[0],
        desc: e['media:group'][0]['media:description']?.[0] || ''
      }))
      .filter(item => {
        const txt = (item.title + ' ' + item.desc).toLowerCase();
        return !blacklist.some(word => txt.includes(word.toLowerCase()));
      })
      .slice(0, 6);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(filtered)
    };
  } catch (e) {
    console.error(e.message);
    return { statusCode: 500, body: '[]' };
  }
};