/**
 * loader.js
 * Sistema de carga dinámica para El Faro
 * Soporte completo: H2, Negritas, Cursivas y Separadores (---)
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
        if (!entryRes.ok) {
          console.warn(`Archivo no encontrado: ${file}`);
          continue; 
        }
        
        const entry = await entryRes.json();

        // VALIDACIÓN DE CAMPOS: Saltamos archivos incompletos
        if (!entry.content || !entry.tags) {
          console.error(`Formato incompleto en: ${file}`);
          continue;
        }

        // CORRECCIÓN DE RUTA DE IMAGEN:
        const cleanAvatarPath = entry.avatar.replace(/^\.\.\//, "");

        // TRADUCTOR DE MARKDOWN
        // Se añade el reemplazo de --- por <hr>
        const contentFormatted = entry.content
          .replace(/^## (.*$)/gim, "<h2>$1</h2>")    // Títulos secundarios
          .replace(/^---$/gim, "<hr>")               // SEPARADOR HORIZONTAL (Nuevo)
          .replace(/\*\*(.*?)\*\*/gim, "<b>$1</b>")  // Negritas
          .replace(/\*(.*?)\*/gim, "<i>$1</i>")      // Cursivas
          .replace(/\\n/g, "<br>")                   // Saltos de línea escapados
          .replace(/\n/g, "<br>");                   // Saltos de línea reales

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
        console.error(`Error procesando el archivo individual: ${file}`, fileErr); 
      }
    }
  } catch (error) { 
    console.error("Error crítico en el cargador:", error); 
  }
}

// Ejecución automática al cargar el script
// Nota: Si tienes un <script onload="loadAllEntries()"> en el HTML, 
// borra esta línea para que no se llame dos veces.
loadAllEntries();
