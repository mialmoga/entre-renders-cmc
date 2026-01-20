async function loadAllEntries() {
  const entriesFolder = 'entries/';
  const indexFile = 'entries/index.json';

  try {
    const res = await fetch(indexFile);
    if (!res.ok) throw new Error("No se pudo cargar el index.json");
    
    const files = await res.json();
    const container = document.getElementById('entries');
    
    // Limpiamos el contenedor antes de cargar
    container.innerHTML = '';

    for (let file of files) {
      try {
        const entryRes = await fetch(entriesFolder + file);
        if (!entryRes.ok) {
          console.warn(`Archivo no encontrado: ${file}`);
          continue; 
        }
        
        const entry = await entryRes.json();

        // CORRECCIÓN DE RUTA DE IMAGEN:
        // Asegura que los avatares apunten a assets/img/ desde la raíz
        const cleanAvatarPath = entry.avatar.replace(/^\.\.\//, "");

        // TRADUCTOR DE MARKDOWN
        // Convierte sintaxis básica a HTML para la visualización
        const contentFormatted = entry.content
          .replace(/\*\*(.*?)\*\*/gim, "<b>$1</b>")
          .replace(/\*(.*?)\*/gim, "<i>$1</i>")
          .replace(/\\n/g, "<br>")
          .replace(/\n/g, "<br>"); 

        const card = document.createElement('div');
        card.className = 'entry-card';
        
        // Renderizado de la tarjeta
        card.innerHTML = `
          <div class="entry-header">
            <img src="${cleanAvatarPath}" class="author-avatar" alt="${entry.author}">
            <div class="entry-meta">
              <h2>${entry.title}</h2>
              <h4>${entry.author} [${entry.category || 'General'}] — <span class="date">${entry.date}</span></h4>
            </div>
          </div>
          <div class="content">${contentFormatted}</div>
          <div class="tags">
            ${entry.tags.map(t => `<span class="tag">#${t}</span>`).join(' ')}
          </div>
        `;
        
        container.appendChild(card);
      } catch (e) { 
        console.error("Error procesando la entrada:", file, e); 
      }
    }
  } catch (error) { 
    console.error("Error crítico en el cargador:", error); 
  }
}

// Ejecución inmediata
loadAllEntries();
