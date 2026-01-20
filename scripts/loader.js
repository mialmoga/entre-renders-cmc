/**
 * loader.js
 * Sistema de carga dinámica para El Faro
 */

async function loadAllEntries() {
  const entriesFolder = 'entries/';
  const indexFile = 'entries/index.json';
  const container = document.getElementById('entries');

  // Si el contenedor no existe en el DOM, detenemos la ejecución
  if (!container) return;

  try {
    const res = await fetch(indexFile);
    if (!res.ok) throw new Error("No se pudo cargar el index.json");
    
    const files = await res.json();
    
    // Limpiamos el contenedor antes de iniciar el bucle para evitar duplicados
    container.innerHTML = '';

    for (let file of files) {
      try {
        const entryRes = await fetch(entriesFolder + file);
        if (!entryRes.ok) {
          console.warn(`Archivo no encontrado en el servidor: ${file}`);
          continue; 
        }
        
        const entry = await entryRes.json();

        // CORRECCIÓN DE RUTA DE IMAGEN:
        // Aseguramos que apunte a assets/img/ (ruta raíz) eliminando ../ si existe
        const cleanAvatarPath = entry.avatar.replace(/^\.\.\//, "");

        // TRADUCTOR DE MARKDOWN
        // Convierte la sintaxis del editor a HTML visible
        const contentFormatted = entry.content
          .replace(/\*\*(.*?)\*\*/gim, "<b>$1</b>")
          .replace(/\*(.*?)\*/gim, "<i>$1</i>")
          .replace(/\\n/g, "<br>")
          .replace(/\n/g, "<br>"); 

        const card = document.createElement('div');
        card.className = 'entry-card';
        
        // Estructura de la tarjeta
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
        console.error("Error procesando el archivo individual:", file, e); 
      }
    }
  } catch (error) { 
    console.error("Error crítico en el cargador:", error); 
  }
}

// Ejecutamos la función. 
// Nota: Si tienes un <script onload="loadAllEntries()"> en el HTML, 
// borra esta línea para que no se llame dos veces.
loadAllEntries();
