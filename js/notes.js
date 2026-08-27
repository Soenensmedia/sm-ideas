import { state } from './state.js';
import { escapeHtml, escapeAttr, fmtDateTime, daysAgo } from './util.js';
import { fetchNotes, createNote, updateNote, deleteNote } from './data.js';
import { openModal, closeModal } from './modal.js';
import { showToast } from './toast.js';

const STALE_DAYS = 3;

export async function renderNotes() {
  const container = document.getElementById('notes-container');
  container.innerHTML = '<div class="empty-note">Laden...</div>';
  try {
    state.notes = await fetchNotes();
  } catch (err) {
    container.innerHTML = `<div class="empty-note">Kon niet laden: ${escapeHtml(err.message)}</div>`;
    return;
  }
  renderAll();
}

function renderAll() {
  const container = document.getElementById('notes-container');
  const unreviewed = state.notes.filter((n) => !n.reviewed)
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  const todos = state.notes.filter((n) => n.reviewed && n.is_todo);
  const rest = state.notes.filter((n) => n.reviewed && !n.is_todo);

  const byTopic = new Map();
  rest.forEach((n) => {
    const topic = n.topic || 'Overig';
    if (!byTopic.has(topic)) byTopic.set(topic, []);
    byTopic.get(topic).push(n);
  });
  const topics = [...byTopic.keys()].sort((a, b) => a === 'Overig' ? 1 : b === 'Overig' ? -1 : a.localeCompare(b));

  todos.sort((a, b) => Number(a.done) - Number(b.done) || new Date(b.created_at) - new Date(a.created_at));

  container.innerHTML = `
    <div class="capture-card">
      <textarea id="capture-input" rows="3" placeholder="Schrijf zomaar iets op..."></textarea>
      <button type="button" class="btn btn-red" id="capture-save">Opslaan</button>
    </div>

    ${unreviewed.length ? `
      <div class="section">
        <div class="section-title">Aandacht nodig <span class="count">${unreviewed.length}</span></div>
        <div class="attention-panel">${unreviewed.map(attentionRowHtml).join('')}</div>
      </div>` : ''}

    ${todos.length ? `
      <div class="section">
        <div class="section-title">To-do's <span class="count">${todos.filter((t) => !t.done).length}</span></div>
        <div class="todo-list">${todos.map(todoRowHtml).join('')}</div>
      </div>` : ''}

    ${rest.length ? `
      <div class="section">
        <div class="section-title">Kladblok</div>
        ${treeHtml(topics, byTopic)}
      </div>` : ''}

    ${!state.notes.length ? '<div class="empty-note">Nog niets opgeschreven. Begin hierboven.</div>' : ''}
  `;

  document.getElementById('capture-save').addEventListener('click', handleCapture);
  const input = document.getElementById('capture-input');
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleCapture();
  });

  container.querySelectorAll('.attention-row').forEach((row) => {
    row.addEventListener('click', () => {
      const note = state.notes.find((n) => n.id === row.dataset.id);
      if (note) openNoteModal(note);
    });
  });
  container.querySelectorAll('.tree-idea-group').forEach((g) => {
    g.addEventListener('click', () => {
      const note = state.notes.find((n) => n.id === g.dataset.id);
      if (note) openNoteModal(note);
    });
  });
  container.querySelectorAll('.todo-check').forEach((box) => {
    box.addEventListener('click', async (e) => {
      e.stopPropagation();
      const note = state.notes.find((n) => n.id === box.dataset.id);
      if (!note) return;
      try {
        const updated = await updateNote(note.id, { done: !note.done });
        const idx = state.notes.findIndex((n) => n.id === note.id);
        state.notes[idx] = updated;
        renderAll();
      } catch (err) { showToast(err.message, true); }
    });
  });
  container.querySelectorAll('.todo-row').forEach((row) => {
    row.addEventListener('click', () => {
      const note = state.notes.find((n) => n.id === row.dataset.id);
      if (note) openNoteModal(note);
    });
  });
}

async function handleCapture() {
  const input = document.getElementById('capture-input');
  const content = input.value.trim();
  if (!content) return;
  try {
    const created = await createNote(content);
    state.notes.unshift(created);
    input.value = '';
    renderAll();
    showToast('Opgeslagen');
  } catch (err) {
    showToast(err.message, true);
  }
}

function attentionRowHtml(n) {
  const d = daysAgo(n.created_at);
  const stale = d >= STALE_DAYS;
  const reason = d === 0 ? 'vandaag geschreven' : d === 1 ? '1 dag niet verwerkt' : `${d} dagen niet verwerkt`;
  return `
    <div class="attention-row ${stale ? 'stale' : ''}" data-id="${n.id}">
      <div class="attention-content"><p>${escapeHtml(n.content)}</p></div>
      <span class="attention-reason ${stale ? '' : 'fresh'}">${reason}</span>
    </div>`;
}

function todoRowHtml(n) {
  return `
    <div class="todo-row ${n.done ? 'done' : ''}" data-id="${n.id}">
      <span class="todo-check ${n.done ? 'checked' : ''}" data-id="${n.id}"></span>
      <span class="todo-text">${escapeHtml(n.content)}</span>
      ${n.topic ? `<span class="todo-topic">${escapeHtml(n.topic)}</span>` : ''}
    </div>`;
}

// ── Node tree: verwerkte ideeën als een radiaal netwerk rond een centrum,
// per onderwerp vertakt. Puur SVG + CSS, geen library nodig.
function treeHtml(topics, byTopic) {
  if (!topics.length) return '<div class="tree-empty">Verwerkte ideeën verschijnen hier als een boom.</div>';

  const W = 720, H = 720, cx = W / 2, cy = H / 2;
  const R1 = 190;
  const IDEA_R = 88;
  const N = topics.length;

  let links = '';
  let nodes = '';

  topics.forEach((topic, i) => {
    const angle = (i / N) * Math.PI * 2 - Math.PI / 2;
    const tx = cx + R1 * Math.cos(angle);
    const ty = cy + R1 * Math.sin(angle);
    links += `<line class="tree-link to-topic" x1="${cx.toFixed(1)}" y1="${cy.toFixed(1)}" x2="${tx.toFixed(1)}" y2="${ty.toFixed(1)}"></line>`;

    const ideas = byTopic.get(topic);
    const M = ideas.length;
    const spread = Math.min(Math.PI / 2.6, 0.3 * M);
    ideas.forEach((n, j) => {
      const off = M > 1 ? (j / (M - 1) - 0.5) * spread : 0;
      const ia = angle + off;
      const ix = tx + IDEA_R * Math.cos(ia);
      const iy = ty + IDEA_R * Math.sin(ia);
      links += `<line class="tree-link" x1="${tx.toFixed(1)}" y1="${ty.toFixed(1)}" x2="${ix.toFixed(1)}" y2="${iy.toFixed(1)}"></line>`;
      const label = n.content.length > 26 ? n.content.slice(0, 26) + '…' : n.content;
      const anchor = Math.cos(ia) >= 0 ? 'start' : 'end';
      const dx = Math.cos(ia) >= 0 ? 10 : -10;
      nodes += `
        <g class="tree-idea-group" data-id="${n.id}">
          <circle class="tree-node-idea ${n.done ? 'done' : ''}" cx="${ix.toFixed(1)}" cy="${iy.toFixed(1)}" r="5"><title>${escapeHtml(n.content)}</title></circle>
          <text class="tree-idea-label" x="${(ix + dx).toFixed(1)}" y="${(iy + 3).toFixed(1)}" text-anchor="${anchor}">${escapeHtml(label)}</text>
        </g>`;
    });

    const tAnchor = Math.cos(angle) >= 0 ? 'start' : 'end';
    const tdx = Math.cos(angle) >= 0 ? 14 : -14;
    nodes += `
      <g class="tree-topic-group">
        <circle class="tree-node-topic" cx="${tx.toFixed(1)}" cy="${ty.toFixed(1)}" r="8"></circle>
        <text class="tree-topic-label" x="${(tx + tdx).toFixed(1)}" y="${(ty + 4.5).toFixed(1)}" text-anchor="${tAnchor}">${escapeHtml(topic)}</text>
      </g>`;
  });

  return `
    <div class="tree-panel">
      <svg class="tree-svg" viewBox="0 0 ${W} ${H}">
        <circle class="tree-ring" cx="${cx}" cy="${cy}" r="${R1}"></circle>
        ${links}
        ${nodes}
        <circle class="tree-center-glow" cx="${cx}" cy="${cy}" r="14"></circle>
        <circle class="tree-center-dot" cx="${cx}" cy="${cy}" r="5"></circle>
      </svg>
    </div>`;
}

function openNoteModal(note) {
  openModal(`
    <div class="modal-header"><h2>Idee bewerken</h2></div>
    <form id="note-form">
      <div class="field"><label>Tekst</label><textarea id="nf-content" rows="4">${escapeHtml(note.content)}</textarea></div>
      <div class="field-row">
        <div class="field"><label>Onderwerp</label><input type="text" id="nf-topic" value="${escapeAttr(note.topic || '')}" placeholder="Bv. Content-ideeën, Business, Persoonlijk..."></div>
        <div class="field">
          <label style="display:flex; align-items:center; gap:8px; margin-top:22px;">
            <input type="checkbox" id="nf-todo" style="width:auto;" ${note.is_todo ? 'checked' : ''}>
            Is een to-do
          </label>
        </div>
      </div>
      <div class="field"><label>Toelichting (optioneel)</label><textarea id="nf-ainote" rows="2" placeholder="Korte duiding of insteek...">${escapeHtml(note.ai_note || '')}</textarea></div>
      <label style="display:flex; align-items:center; gap:8px; font-size:13px; color:var(--text-dim); margin-bottom:14px;">
        <input type="checkbox" id="nf-reviewed" style="width:auto;" ${note.reviewed ? 'checked' : ''}>
        Verwerkt (verdwijnt uit "Aandacht nodig")
      </label>
      <div class="modal-actions">
        <button type="button" class="btn btn-danger" id="nf-delete">Verwijderen</button>
        <div class="modal-actions-right">
          <button type="button" class="btn btn-ghost" id="nf-cancel">Annuleren</button>
          <button type="submit" class="btn btn-red">Opslaan</button>
        </div>
      </div>
    </form>
  `);

  document.getElementById('nf-cancel').addEventListener('click', closeModal);
  document.getElementById('nf-delete').addEventListener('click', async () => {
    if (!confirm('Dit idee verwijderen?')) return;
    try {
      await deleteNote(note.id);
      state.notes = state.notes.filter((n) => n.id !== note.id);
      closeModal();
      renderAll();
      showToast('Verwijderd');
    } catch (err) { showToast(err.message, true); }
  });
  document.getElementById('note-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      content: document.getElementById('nf-content').value.trim(),
      topic: document.getElementById('nf-topic').value.trim() || null,
      is_todo: document.getElementById('nf-todo').checked,
      ai_note: document.getElementById('nf-ainote').value.trim() || null,
      reviewed: document.getElementById('nf-reviewed').checked,
    };
    try {
      const updated = await updateNote(note.id, payload);
      const idx = state.notes.findIndex((n) => n.id === note.id);
      state.notes[idx] = updated;
      closeModal();
      renderAll();
      showToast('Opgeslagen');
    } catch (err) { showToast(err.message, true); }
  });
}
