async function loadAllEntries() {
  const entriesFolder = 'entries/';
  const indexFile = 'entries/index.json';

  try {
    const res = await fetch(indexFile);
    if (!res.ok) throw new Error("No se pudo cargar el index.json");
    const files = await res.json();

    const container = document.getElementById('entries');
    container.innerHTML = '';

    for (let file of files) {
      try {
        const entryRes = await fetch(entriesFolder + file);
        if (!entryRes.ok) {
            console.warn(`No se encontró el archivo: ${file}`);
            continue;
        }
        const entry = await entryRes.json();

        // TRADUCTOR DE MARKDOWN
        const contentFormatted = entry.content
          .replace(/\*\*(.*?)\*\*/gim, "<b>$1</b>")
          .replace(/\*(.*?)\*/gim, "<i>$1</i>")
          .replace(/\\n/g, "<br>")
          .replace(/\n/g, "<br>"); 

        const card = document.createElement('div');
        card.className = 'entry-card';

        // Estructura de tarjeta con categoría y tags
        card.innerHTML = `
          <div class="entry-header">
            <img src="${entry.avatar}" class="author-avatar" alt="${entry.author}">
            <div class="entry-meta">
              <h2>${entry.title}</h2>
              <h4>${entry.author} [${entry.category || 'Sin Cat.'}] — <span class="date">${entry.date}</span></h4>
            </div>
          </div>
          <div class="content">${contentFormatted}</div>
          <div class="tags">
            ${entry.tags.map(t => `<span class="tag">#${t}</span>`).join(' ')}
          </div>
        `;

        container.appendChild(card);
      } catch (fileErr) {
        console.error(`Error procesando ${file}:`, fileErr);
      }
    }
  } catch (error) {
    console.error("Error crítico cargando entradas:", error);
  }
}

// Ejecutar carga al iniciar
loadAllEntries();
