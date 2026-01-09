async function loadAllEntries() {
  const entriesFolder = 'entries/';
  const indexFile = 'entries/index.json';

  try {
    const res = await fetch(indexFile);
    const files = await res.json();

    const container = document.getElementById('entries');
    container.innerHTML = '';

    for (let file of files) {
      const entryRes = await fetch(entriesFolder + file);
      const entry = await entryRes.json();

      const card = document.createElement('div');
      card.className = 'entry-card';

      card.innerHTML = `
        <h2>${entry.title}</h2>
        <h4>${entry.author} — <span class="date">${entry.date}</span></h4>
        <div class="content">${entry.content}</div>
      `;

      container.appendChild(card);
    }
  } catch (error) {
    console.error("Error cargando entradas:", error);
  }
}
