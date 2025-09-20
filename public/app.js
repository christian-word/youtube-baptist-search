const API = '/.netlify/functions/youtube-proxy?q=';  // относительный путь

async function load() {
  const query = encodeURIComponent(q.value.trim() || 'проповедь');
  list.innerHTML = 'Загрузка…';
  stat.textContent = '';

  try {
    const res = await fetch(API + query);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Unknown');

    if (!data.length) {
      list.innerHTML = '<p>После фильтрации ничего не найдено</p>';
      return;
    }

    list.innerHTML = data.map(v => `
      <div class="video">
        <p>${v.title}</p>
        <iframe src="https://www.youtube.com/embed/${v.id}" allowfullscreen></iframe>
      </div>`).join('');

    stat.textContent = `Выведено роликов: ${data.length}`;
  } catch (e) {
    list.innerHTML = `<p>Ошибка: ${e.message}</p>`;
  }
}
// загрузить сразу
load();