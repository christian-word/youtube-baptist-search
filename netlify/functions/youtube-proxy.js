const fetch = require('node-fetch');
const xml2js = require('xml2js');

exports.handler = async (event) => {
    const query = event.queryStringParameters.query;
    if (!query) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Query parameter is required' }) };
    }

    try {
        // Шаг 1: Запрос к YouTube RSS
        const rssUrl = `https://www.youtube.com/feeds/videos.xml?search_query=${encodeURIComponent(query)}`;
        const response = await fetch(rssUrl);
        const xml = await response.text();

        // Шаг 2: Парсинг XML
        const parser = new xml2js.Parser();
        const result = await parser.parseStringPromise(xml);
        const entries = result.feed.entry || [];

        // Blacklist для фильтрации (расширь по необходимости)
        const blacklist = [
            'православие', 'православный', 'orthodox',
            'иеговы', 'jehovah', 'свидетели иеговы',
            'пятидесятники', 'pentecostal', 'харизматы', 'charismatic',
            'тбн', 'tbn', 'московская церковь', // Добавь больше: адвентисты, мормоны и т.д.
            'католик', 'catholic', 'лютеран', 'lutheran'
        ];

        // Шаг 3: Фильтрация
        const filteredVideos = entries.filter(entry => {
            const title = entry.title[0].toLowerCase();
            const description = entry['media:group'][0]['media:description'][0].toLowerCase();
            const combined = `${title} ${description}`;

            // Проверяем на наличие слов из blacklist (регистронезависимо)
            return !blacklist.some(word => combined.includes(word.toLowerCase()));
        });

        // Формируем JSON: id, title
        const videos = filteredVideos.map(entry => ({
            id: entry['yt:videoId'][0],
            title: entry.title[0]
        }));

        return {
            statusCode: 200,
            body: JSON.stringify(videos)
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Server error: ' + error.message })
        };
    }
};