/**
 * loader.js
 * Sistema de carga dinámica para El Faro
 */

async function loadAllEntries() {
  const entriesFolder = 'entries/';
  const indexFile = 'entries/index.json';
  const container = document.getElementById('entries');

  if (!container) return;

  try {
    const res = await fetch(indexFile);
    if (!res.ok) throw new Error("No se pudo cargar el index.json");
    const files = await res.json();

    // Limpieza de contenedor para evitar duplicados
    container.innerHTML = '';

    for (let file of files) {
      try {
        const entryRes = await fetch(entriesFolder + file);
        if (!entryRes.ok) continue;

        const entry = await entryRes.json();

        // Validación de campos obligatorios
        if (!entry.content || !entry.tags) {
            console.warn(`Archivo incompleto: ${file}`);
            continue;
        }

        // Corrección de ruta de imagen para la raíz
        const cleanAvatarPath = entry.avatar.replace(/^\.\.\//, "");

        // TRADUCTOR DE MARKDOWN COMPLETO (Ahora incluye H2)
        const contentFormatted = entry.content
          .replace(/^## (.*$)/gim, "<h2>$1</h2>") // Conversión de títulos ##
          .replace(/\*\*(.*?)\*\*/gim, "<b>$1</b>")
          .replace(/\*(.*?)\*/gim, "<i>$1</i>")
          .replace(/\\n/g, "<br>")
          .replace(/\n/g, "<br>"); 

        const card = document.createElement('div');
        card.className = 'entry-card';

        card.innerHTML = `
          <div class="entry-header">
            <img src="${cleanAvatarPath}" class="author-avatar" alt="${entry.author}">
            <div class="entry-meta">
              <h2>${entry.title || "Sin Título"}</h2>
              <h4>${entry.author} [${entry.category || 'General'}] — <span class="date">${entry.date}</span></h4>
            </div>
          </div>
          <div class="content">${contentFormatted}</div>
          <div class="tags">
            ${entry.tags.map(t => `<span class="tag">#${t}</span>`).join(' ')}
          </div>
        `;

        container.appendChild(card);
      } catch (fileErr) {
        console.error(`Error en JSON ${file}:`, fileErr);
      }
    }
  } catch (error) {
    console.error("Error crítico en loader:", error);
  }
}

// Ejecución única
// Ejecutamos la función. 
// Nota: Si tienes un <script onload="loadAllEntries()"> en el HTML, 
// borra esta línea para que no se llame dos veces.
loadAllEntries();
