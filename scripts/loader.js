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

      // TRADUCTOR DE MARKDOWN (Copiado de la lógica que te gustó del editor)
      // Esto convierte **texto** en negritas y \n en saltos de línea reales
      const contentFormatted = entry.content
        .replace(/\*\*(.*?)\*\*/gim, "<b>$1</b>")
        .replace(/\*(.*?)\*/gim, "<i>$1</i>")
        .replace(/\\n/g, "<br>"); 

      const card = document.createElement('div');
      card.className = 'entry-card';

      // Agregamos el avatar que el generador ya nos da listo
      card.innerHTML = `
        <div class="entry-header">
          <img src="${entry.avatar}" class="author-avatar" alt="${entry.author}">
          <div class="entry-meta">
            <h2>${entry.title}</h2>
            <h4>${entry.author} — <span class="date">${entry.date}</span></h4>
          </div>
        </div>
        <div class="content">${contentFormatted}</div>
        <div class="tags">${entry.tags.map(t => `<span class="tag">#${t}</span>`).join(' ')}</div>
      `;

      container.appendChild(card);
    }
  } catch (error) {
    console.error("Error cargando entradas:", error);
  }
}
