# Comparación de Archivos

- **Archivo Base:** `index.html`
- **Archivo Modificado:** `Escriba_S.html`

```diff
--- index.html
+++ Escriba_S.html
@@ -51,8 +51,8 @@
 
 /* ── DARK MODE ── */
 body.dark {
-  --bg-outer:      #131009;
-  --paper:         #211c16;
+  --bg-outer:      #1e1810;
+  --paper:         #2a2520;
   --ink:           #c9b99a;
   --gear:          #5a4f42;
   --faint:         #7a6a58;
@@ -650,52 +650,6 @@
 }
 .token-move:hover, .token-del:hover { color: var(--ink); }
 .token-del:hover { color: var(--err-color); }
-
-/* ── TOKEN MENU (disparador ".↵") ── */
-.token-menu {
-  display: none;
-  position: absolute;
-  left: 16px; right: 16px; bottom: 42px;
-  max-width: 420px;
-  margin: 0 auto;
-  background: var(--popover-bg);
-  border: 1px solid var(--popover-border);
-  border-radius: 6px;
-  box-shadow: 0 6px 24px rgba(0,0,0,0.3);
-  z-index: 300;
-  max-height: 46vh;
-  overflow-y: auto;
-  padding: 4px 0;
-}
-.token-menu.open { display: block; }
-.token-menu-head {
-  padding: 7px 14px 5px;
-  font-size: 9px;
-  color: var(--faint);
-  text-transform: uppercase;
-  letter-spacing: 2px;
-  border-bottom: 1px solid var(--menu-border);
-}
-.token-menu-item {
-  display: flex;
-  align-items: center;
-  gap: 10px;
-  width: 100%;
-  padding: 8px 14px;
-  background: none; border: none;
-  font-family: 'Special Elite', monospace;
-  font-size: 13px;
-  color: var(--ink);
-  cursor: pointer;
-  text-align: left;
-  border-bottom: 1px solid var(--menu-border);
-}
-.token-menu-item:last-child { border-bottom: none; }
-.token-menu-item:hover, .token-menu-item:active { background: var(--menu-hover); }
-.tm-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
-.tm-name { flex: 1; }
-.tm-pct  { font-size: 11px; color: var(--faint); }
-.token-menu-item.tm-close .tm-name { color: var(--faint); }
 
 /* ── SELLO 0 — verification verdict ── */
 .sello0-box {
@@ -993,6 +947,7 @@
 
     <div class="lib-actions" id="configTopActions">
       <button class="lib-btn primary" onclick="toggleCorpusMode()" id="corpusModeBtn">Modo Corpus AMI: OFF</button>
+      <button class="lib-btn" onclick="startCorpusFragmentHere()">Iniciar/retomar fragmento aquí</button>
     </div>
     <div style="font-size:12px;color:var(--faint);margin-top:6px;">
       Con el modo activo, Enter después de un punto abre el desplegable de tokens
@@ -1092,14 +1047,19 @@
   </div>
 </div>
 
-<!-- Menú de tokens: aparece al escribir ".↵" en Modo Corpus AMI.
-     Cada token coloreado según su expectativa de volumen sugerido. -->
-<div class="token-menu" id="tokenMenu">
-  <div class="token-menu-head">siguiente fragmento · color = expectativa de volumen</div>
-  <div id="tokenMenuList"></div>
+<div class="toast" id="toast"></div>
+
+<!-- CORPUS AMI — menú de "¿qué sigue?" tras el disparador <| -->
+<div class="panel-overlay" id="corpusTokenMenu">
+  <div class="panel-title">
+    ¿Qué token sigue?
+    <button class="panel-close" onclick="cancelCorpusToken()">✕</button>
+  </div>
+  <div id="corpusTokenMenuList" style="margin-top:10px;"></div>
+  <div class="lib-actions">
+    <button class="lib-btn" onclick="cancelCorpusToken()">Seguir sin tag</button>
+  </div>
 </div>
-
-<div class="toast" id="toast"></div>
 
 <!-- hidden file inputs -->
 <input type="file" class="hidden" id="loadTxtFile" accept=".txt,text/plain" onchange="loadTxt(event)">
@@ -1119,22 +1079,6 @@
 let library    = [];   // array of {id, title, tema, tags[], status, texto, fecha, metricas}
 
 // ── Corpus AMI: modo, tokens especiales, diccionario de vocabulario ──
-// El mapa canónico (consenso CMC): un marcador por estrato del corpus,
-// meta = % del volumen total sugerido por el SPEC-FUNDACION 5.1.
-// Andamio = 55% (incluye ~10% de puentes, que reusan su dominio).
-const DEFAULT_TOKEN_CONFIG = [
-  { id: 'magnitude', meta: 9 },   // orden y comparación
-  { id: 'arith',     meta: 10 },  // aritmética e inversas
-  { id: 'logic',     meta: 12 },  // booleana + puentes lógica↔lenguaje
-  { id: 'pattern',   meta: 8 },   // secuencias
-  { id: 'geometry',  meta: 8 },   // relaciones geométricas
-  { id: 'prime',     meta: 8 },   // Synthetic Prime multi-dominio
-  { id: 'lexicon',   meta: 15 },  // vocabulario + gramática (el lente)
-  { id: 'concept',   meta: 13 },  // conceptos + invariantes
-  { id: 'story',     meta: 8 },   // cuentos con moraleja
-  { id: 'core_rule', meta: 6 },   // constitución (compacta, peso alto)
-  { id: 'origin',    meta: 3 },   // cadena de derivación (mínima)
-];
 let corpusMode    = false;
 let tokenConfig   = []; // [{id, meta}] — orden = orden de prioridad configurada
 let corpusDict    = { lemas: {} }; // lema -> {formas:[], categoria, min, max}
@@ -1184,12 +1128,6 @@
   try { library   = JSON.parse(localStorage.getItem('escribaLib')) || []; } catch(e) { library = []; }
   try { corpusMode = localStorage.getItem('escribaCorpusMode') === 'true'; } catch(e) {}
   try { tokenConfig = JSON.parse(localStorage.getItem('escribaTokenConfig')) || []; } catch(e) { tokenConfig = []; }
-  // Sin config previa (nunca guardada) → sembrar el mapa canónico de
-  // marcadores del corpus fundacional (proporciones del SPEC-FUNDACION 5.1;
-  // los puentes lógica↔lenguaje viven dentro de su dominio, por eso logic
-  // pesa más). Si el autor vació la lista a propósito, se respeta.
-  if (!tokenConfig.length && localStorage.getItem('escribaTokenConfig') === null)
-    tokenConfig = DEFAULT_TOKEN_CONFIG.map(t => ({...t}));
   try { corpusDict = JSON.parse(localStorage.getItem('escribaCorpusDict')) || { lemas: {} }; } catch(e) { corpusDict = { lemas: {} }; }
   try { fragCharsPerToken = parseFloat(localStorage.getItem('escribaCharsPerToken')) || 4; } catch(e) {}
   try { fragIdeal = parseInt(localStorage.getItem('escribaFragIdeal'), 10) || 80; } catch(e) {}
@@ -2345,6 +2283,9 @@
   localStorage.setItem('escribaCorpusMode', corpusMode);
   renderConfigPanel();
   showToast('Modo Corpus AMI: ' + (corpusMode ? 'activado' : 'desactivado'));
+  if (corpusMode && corpusOpenBlockType(textarea.value) === null && tokenConfig.length) {
+    startCorpusFragmentHere();
+  }
 }
 
 function addToken() {
@@ -2375,59 +2316,26 @@
   renderConfigPanel();
 }
 
-// Escala divergente de expectativa (el Brujo): el color mide la relación
-// entre el volumen actual y el *volumen sugerido* del token, en AMBAS
-// direcciones — quedarse corto es deuda, pero pasarse también.
-//
-//   ratio < 1   →  verde pálido (casi) … amarillo (muy por debajo)
-//   ratio ≈ 1   →  verde pleno (proporcional al sugerido)
-//   ratio > 1   →  verde … café … rojo (sobre-representado)
-//
-// Determinista, interpolado en HSL. El modo oscuro sube la luminosidad.
+// Color de urgencia: qué tan cerca está el % actual del % meta configurado.
+// Rojo = muy por debajo (necesita atención), ámbar = cerca, verde = cumplido o por encima.
 function tokenUrgencyColor(actualPct, metaPct) {
   if (!metaPct || metaPct <= 0) return 'var(--faint)';
-  const r = actualPct / metaPct;
-  const dark = document.body.classList.contains('dark');
-  const L = dark ? 58 : 36;          // luminosidad base según modo
-  let h, s, l = L;
-  if (r < 1) {
-    // 0 → amarillo (h52), 1 → verde (h100). Pálido cerca de la meta.
-    const t = Math.max(0, r);        // 0..1
-    h = 52 + t * 48;
-    s = 55 + t * 15;                 // el amarillo lejano, menos saturado
-    l = L + (1 - t) * 8;             // más pálido cuanto más lejos
-  } else if (r <= 1.2) {
-    // zona proporcional: verde pleno (±20% de tolerancia)
-    h = 100; s = 55;
-  } else {
-    // 1.2 → verde (h100), 1.7 → café (h28), 2.2+ → rojo (h6)
-    const t = Math.min(1, (r - 1.2) / 1.0);   // 0..1 sobre el exceso
-    h = 100 - t * 94;
-    s = 55 + t * 20;
-    l = L - t * (dark ? 6 : 8);      // el rojo, más denso
-  }
-  return `hsl(${h.toFixed(0)}, ${s.toFixed(0)}%, ${l.toFixed(0)}%)`;
+  const ratio = actualPct / metaPct;
+  if (ratio >= 1)    return 'var(--ok-color)';
+  if (ratio >= 0.66) return 'var(--warn-color)';
+  return 'var(--err-color)';
 }
 
 // Cuenta palabras dentro de cada bloque <|tipo|>...<|endoftext|> del documento
 // completo — es la base tanto del % en vivo como de la localización de "última
 // zona de un tipo" que usa el disparador de inserción.
 function scanCorpusBlocks(text) {
-  const blocks = []; // [{tipo, start, end, words, abierto?}]
+  const blocks = []; // [{tipo, start, end, endTagEnd, words}]
   const re = /<\|([a-z0-9_-]+)\|>([\s\S]*?)<\|endoftext\|>/g;
-  let m, ultimoFin = 0;
+  let m;
   while ((m = re.exec(text))) {
     const words = (m[2].match(/[a-záéíóúüñA-ZÁÉÍÓÚÜÑ]+/g) || []).length;
     blocks.push({ tipo: m[1], start: m.index, end: m.index + m[0].length, words });
-    ultimoFin = m.index + m[0].length;
-  }
-  // El bloque final abierto (marcador sin <|endoftext|> todavía) también
-  // cuenta: el menú ".↵" debe colorear con lo que se acaba de escribir.
-  const cola = text.slice(ultimoFin);
-  const ma = cola.match(/<\|(?!endoftext)([a-z0-9_-]+)\|>([\s\S]*)$/);
-  if (ma) {
-    const words = (ma[2].match(/[a-záéíóúüñA-ZÁÉÍÓÚÜÑ]+/g) || []).length;
-    blocks.push({ tipo: ma[1], start: ultimoFin + ma.index, end: text.length, words, abierto: true });
   }
   return blocks;
 }
@@ -2442,74 +2350,6 @@
     const actual = total > 0 ? (words / total * 100) : 0;
     return { id: t.id, meta: t.meta || 0, actual, words };
   });
-}
-
-// ══════════════════════════════════════════════════
-// TOKEN MENU — el disparador ".↵"
-// Al cerrar una oración con punto + salto de línea, ESCRIBA ofrece el
-// siguiente marcador. El color de cada token responde a la expectativa:
-// verde = proporcional al volumen sugerido, pálido→amarillo = por debajo,
-// verde→café→rojo = sobre-representado. El autor elige guiado por la
-// deuda del corpus, no por inercia.
-// ══════════════════════════════════════════════════
-const tokenMenu     = document.getElementById('tokenMenu');
-const tokenMenuList = document.getElementById('tokenMenuList');
-
-// ¿Hay un bloque <|tipo|> abierto (sin su <|endoftext|>) antes de `pos`?
-function openBlockBefore(text, pos) {
-  const before = text.slice(0, pos);
-  const re = /<\|([a-z0-9_-]+)\|>/g;
-  let m, lastTipo = null, lastIdx = -1, lastEnd = -1;
-  while ((m = re.exec(before))) {
-    if (m[1] === 'endoftext') { lastEnd = m.index; }
-    else { lastTipo = m[1]; lastIdx = m.index; }
-  }
-  return (lastTipo !== null && lastIdx > lastEnd) ? lastTipo : null;
-}
-
-function showTokenMenu() {
-  if (!corpusMode || !tokenConfig.length) return;
-  const stats = tokenStats(textarea.value)
-    .slice()
-    .sort((a,b) => (b.meta - b.actual) - (a.meta - a.actual)); // más atrasado primero
-
-  const abierto = openBlockBefore(textarea.value, textarea.selectionStart);
-  let html = stats.map(s => {
-    const color = tokenUrgencyColor(s.actual, s.meta);
-    return `<button class="token-menu-item" onclick="insertToken('${s.id}')">
-      <span class="tm-dot" style="background:${color}"></span>
-      <span class="tm-name" style="color:${color}">&lt;|${escHtml(s.id)}|&gt;</span>
-      <span class="tm-pct">${s.actual.toFixed(0)}% / ${s.meta}%</span>
-    </button>`;
-  }).join('');
-  if (abierto) {
-    html = `<button class="token-menu-item tm-close" onclick="insertToken(null)">
-      <span class="tm-dot" style="background:var(--faint)"></span>
-      <span class="tm-name">&lt;|endoftext|&gt; · solo cerrar &lt;|${escHtml(abierto)}|&gt;</span>
-    </button>` + html;
-  }
-  tokenMenuList.innerHTML = html;
-  tokenMenu.classList.add('open');
-}
-
-function hideTokenMenu() { tokenMenu.classList.remove('open'); }
-
-// Inserta en el caret. Si hay un bloque abierto, primero lo cierra con
-// <|endoftext|>. tipo=null → solo cerrar. La inserción pasa por analyze()
-// para que mapa de calor, sello y estadísticas respiren al instante.
-function insertToken(tipo) {
-  const pos     = textarea.selectionStart;
-  const abierto = openBlockBefore(textarea.value, pos);
-  let ins = '';
-  if (abierto) ins += '<|endoftext|>\n\n';
-  if (tipo)    ins += `<|${tipo}|>\n`;
-  if (!ins) { hideTokenMenu(); return; }
-  textarea.value = textarea.value.slice(0, pos) + ins + textarea.value.slice(pos);
-  const nueva = pos + ins.length;
-  textarea.setSelectionRange(nueva, nueva);
-  hideTokenMenu();
-  analyze();
-  textarea.focus();
 }
 
 function renderConfigPanel() {
@@ -2914,22 +2754,156 @@
 }
 
 // ══════════════════════════════════════════════════
+// CORPUS AMI — disparador de tokens (Etapa 3)
+// ══════════════════════════════════════════════════
+let pendingCorpusState = null; // { text, cursor } mientras el menú está abierto
+
+// ¿Hay un bloque <|tipo|> abierto (sin su <|endoftext|> correspondiente)?
+// Excluye <|endoftext|> de la búsqueda de "abridores" — si no, se
+// confundiría a sí mismo con un tag de dominio.
+function corpusOpenBlockType(text) {
+  const opens  = [...text.matchAll(/<\|(?!endoftext\|>)([a-z0-9_-]+)\|>/g)];
+  if (!opens.length) return null;
+  const closes = [...text.matchAll(/<\|endoftext\|>/g)];
+  const lastOpen  = opens[opens.length - 1];
+  const lastClose = closes.length ? closes[closes.length - 1] : null;
+  if (lastClose && lastClose.index > lastOpen.index) return null;
+  return lastOpen[1];
+}
+
+// Escucha activa: punto final + Enter, con contenido real antes del punto.
+function handleCorpusTriggerKeydown(e) {
+  if (!corpusMode) return;
+  if (e.key !== 'Enter') return;
+
+  if (pendingCorpusState) { e.preventDefault(); return; } // menú ya abierto, ignora Enter
+
+  const cursor = textarea.selectionStart;
+  if (cursor !== textarea.selectionEnd) return; // hay selección activa, no dispara
+
+  const before = textarea.value.slice(0, cursor);
+  const currentLine = before.slice(before.lastIndexOf('\n') + 1);
+  if (!/\S.*\.\s*$/.test(currentLine)) return; // exige contenido real antes del punto
+
+  e.preventDefault();
+
+  const text = textarea.value;
+  const abrTipo = corpusOpenBlockType(text);
+
+  if (abrTipo) {
+    // Caso normal: cierra el fragmento que se acaba de terminar.
+    const closeTag = '\n<|endoftext|>\n';
+    const newText = text.slice(0, cursor) + closeTag + text.slice(cursor);
+    const insertCursor = cursor + closeTag.length;
+    textarea.value = newText;
+    textarea.selectionStart = textarea.selectionEnd = insertCursor;
+    analyze();
+    pendingCorpusState = { text: newText, cursor: insertCursor };
+  } else {
+    // Respaldo: no había nada abierto (no debería pasar en uso normal,
+    // ya que el primer fragmento se abre proactivamente al activar el
+    // modo). El contenido ya escrito queda como está, sin envolver.
+    pendingCorpusState = { text, cursor };
+  }
+
+  openCorpusTokenMenu();
+}
+
+// Abre el selector de tokens SIN cerrar nada — para arrancar el primer
+// fragmento del documento (o retomar manualmente tras cancelar). El tag
+// de apertura nace antes de que exista contenido, nunca después.
+function startCorpusFragmentHere() {
+  document.querySelectorAll('.panel-overlay').forEach(p => p.classList.remove('open'));
+  document.querySelectorAll('.bar-btn').forEach(b => b.classList.remove('active'));
+  pendingCorpusState = { text: textarea.value, cursor: textarea.selectionStart };
+  openCorpusTokenMenu();
+}
+
+function corpusTokenMenuRowsHtml() {
+  const source = pendingCorpusState ? pendingCorpusState.text : textarea.value;
+  const stats = tokenStats(source).slice().sort((a,b) => (b.meta - b.actual) - (a.meta - a.actual));
+  if (!stats.length) {
+    return '<div style="font-size:12px;color:var(--faint);">No hay tokens configurados todavía — agrégalos en el panel "corpus AMI".</div>';
+  }
+  return stats.map(s => {
+    const color = tokenUrgencyColor(s.actual, s.meta);
+    return `<div class="token-row" style="cursor:pointer;" onclick="selectCorpusToken('${escAttr(s.id)}')">
+      <span class="token-color-dot" style="background:${color}"></span>
+      <span class="token-name">&lt;|${escHtml(s.id)}|&gt;</span>
+      <span class="token-pct">${s.actual.toFixed(0)}% / meta ${s.meta}%</span>
+    </div>`;
+  }).join('');
+}
+
+function openCorpusTokenMenu() {
+  document.getElementById('corpusTokenMenuList').innerHTML = corpusTokenMenuRowsHtml();
+  document.getElementById('corpusTokenMenu').classList.add('open');
+}
+
+function closeCorpusTokenMenu() {
+  document.getElementById('corpusTokenMenu').classList.remove('open');
+  pendingCorpusState = null;
+}
+
+// Localiza la última zona cerrada de `tipo` en todo el documento y salta
+// ahí — siempre, sin importar si es el mismo tipo que se acaba de cerrar
+// o uno distinto. Si no existe zona previa, inserta donde está el cursor.
+// Decide dónde abrir el siguiente fragmento: salta a la última zona de ese
+// tipo si ya existe en el documento, o abre aquí mismo si es la primera vez.
+function selectCorpusToken(tipo) {
+  if (!pendingCorpusState) return;
+  const { text, cursor } = pendingCorpusState;
+
+  const blocks = scanCorpusBlocks(text).filter(b => b.tipo === tipo);
+  let target, insertion;
+  if (blocks.length) {
+    target = blocks[blocks.length - 1].end;
+    insertion = '<|' + tipo + '|>\n';
+    if (text.slice(0, target).trim() !== '') insertion = '\n\n' + insertion;
+  } else {
+    target = cursor;
+    insertion = '<|' + tipo + '|>\n';
+    if (text.slice(0, target).trim() !== '') insertion = '\n' + insertion;
+  }
+
+  const finalText   = text.slice(0, target) + insertion + text.slice(target);
+  const finalCursor = target + insertion.length;
+
+  textarea.value = finalText;
+  textarea.selectionStart = textarea.selectionEnd = finalCursor;
+  closeCorpusTokenMenu();
+  analyze();
+  textarea.focus();
+  scrollTextareaToCursor(finalCursor);
+}
+
+// El usuario decide no etiquetar: queda el cierre ya insertado (si lo
+// hubo), pero no se abre ningún tag nuevo.
+function cancelCorpusToken() {
+  const cursor = pendingCorpusState ? pendingCorpusState.cursor : null;
+  closeCorpusTokenMenu();
+  if (cursor != null) {
+    textarea.selectionStart = textarea.selectionEnd = cursor;
+    textarea.focus();
+  }
+}
+
+// Aproxima la línea del cursor y ajusta el scroll — el salto de "última
+// zona de un tipo" puede caer lejos de donde el usuario estaba escribiendo.
+function scrollTextareaToCursor(pos) {
+  const before = textarea.value.slice(0, pos);
+  const lineNum = before.split('\n').length;
+  const lineHeight = parseFloat(getComputedStyle(textarea).lineHeight) || 24;
+  const targetScroll = Math.max(0, (lineNum - 4) * lineHeight);
+  textarea.scrollTop = targetScroll;
+  render.scrollTop = targetScroll;
+}
+
+// ══════════════════════════════════════════════════
 // EVENTS
 // ══════════════════════════════════════════════════
-textarea.addEventListener('input', e => {
-  analyze();
-  // Disparador ".↵": el autor cerró oración con punto y saltó de línea →
-  // ofrecer el menú de tokens. Cualquier otra tecla lo oculta.
-  const pos = textarea.selectionStart;
-  const esSalto = e.inputType === 'insertLineBreak' ||
-                  (e.inputType === 'insertText' && e.data === null) ||
-                  e.data === '\n';
-  if (esSalto && pos >= 2 && textarea.value.slice(pos - 2, pos) === '.\n') {
-    showTokenMenu();
-  } else {
-    hideTokenMenu();
-  }
-});
+textarea.addEventListener('input',  analyze);
+textarea.addEventListener('keydown', handleCorpusTriggerKeydown);
 textarea.addEventListener('scroll', () => {
   render.scrollTop  = textarea.scrollTop;
   render.scrollLeft = textarea.scrollLeft;
@@ -2948,33 +2922,12 @@
     closePopover();
   if (!gearMenu.contains(e.target) && e.target !== gearBtn)
     gearMenu.classList.remove('open');
-  if (!tokenMenu.contains(e.target) && e.target !== textarea)
-    hideTokenMenu();
-});
-
-// Doble click en escritorio: la capa de spans tiene pointer-events:none
-// (el teclado debe llegar al textarea), así que el click directo jamás
-// alcanza las palabras. El dblclick nativo del textarea selecciona la
-// palabra — de ahí la leemos y abrimos su popover de contextos.
-textarea.addEventListener('dblclick', e => {
-  let raw = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
-  if (!raw) {
-    const text = textarea.value; let s = textarea.selectionStart, en = s;
-    while (s > 0 && /\S/.test(text[s-1])) s--;
-    while (en < text.length && /\S/.test(text[en])) en++;
-    raw = text.substring(s, en);
-  }
-  const clean = cleanWord(raw);
-  if (clean && wordContexts[clean]) {
-    popoverWord = clean;
-    popoverPage = 0;
-    renderPopover(e.clientX, e.clientY);
-  }
 });
 
 // Long-press on mobile for textarea (fallback for direct click on spans)
 let longPressTimer = null;
-textarea.addEventListener('touchstart', e => {  longPressTimer = setTimeout(() => {
+textarea.addEventListener('touchstart', e => {
+  longPressTimer = setTimeout(() => {
     const pos = textarea.selectionStart;
     const text = textarea.value;
     let start = pos, end = pos;
@@ -2999,9 +2952,9 @@
   }
   if (e.key === 'Escape') {
     closePopover();
-    hideTokenMenu();
     document.querySelectorAll('.panel-overlay').forEach(p => p.classList.remove('open'));
     document.querySelectorAll('.bar-btn').forEach(b => b.classList.remove('active'));
+    pendingCorpusState = null;
   }
 });
 
```
