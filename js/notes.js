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
  const unreviewed = state.notes.filter((n) => !n.reviewed);
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
      <button type="button" class="btn btn-gold" id="capture-save">Opslaan</button>
    </div>

    ${unreviewed.length ? `
      <div class="section">
        <div class="section-title">Nog te verwerken <span class="count">${unreviewed.length}</span></div>
        <div class="note-grid">${unreviewed.map(rawCardHtml).join('')}</div>
      </div>` : ''}

    ${todos.length ? `
      <div class="section">
        <div class="section-title">To-do's <span class="count">${todos.filter((t) => !t.done).length}</span></div>
        <div class="todo-list">${todos.map(todoRowHtml).join('')}</div>
      </div>` : ''}

    ${topics.length ? `
      <div class="section">
        <div class="section-title">Kladblok</div>
        ${topics.map((topic) => `
          <div class="topic-block">
            <div class="topic-heading">${escapeHtml(topic)}</div>
            <div class="note-grid">${byTopic.get(topic).map(noteCardHtml).join('')}</div>
          </div>`).join('')}
      </div>` : ''}

    ${!state.notes.length ? '<div class="empty-note">Nog niets opgeschreven. Begin hierboven.</div>' : ''}
  `;

  document.getElementById('capture-save').addEventListener('click', handleCapture);
  const input = document.getElementById('capture-input');
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleCapture();
  });

  container.querySelectorAll('.note-card').forEach((card) => {
    card.addEventListener('click', () => {
      const note = state.notes.find((n) => n.id === card.dataset.id);
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

function rawCardHtml(n) {
  const stale = daysAgo(n.created_at) >= STALE_DAYS;
  return `
    <div class="note-card raw ${stale ? 'stale' : ''}" data-id="${n.id}">
      <p>${escapeHtml(n.content)}</p>
      <div class="note-meta">${fmtDateTime(new Date(n.created_at))}</div>
    </div>`;
}

function noteCardHtml(n) {
  return `
    <div class="note-card" data-id="${n.id}">
      <p>${escapeHtml(n.content)}</p>
      ${n.ai_note ? `<div class="ai-note">${escapeHtml(n.ai_note)}</div>` : ''}
      <div class="note-meta">${fmtDateTime(new Date(n.created_at))}</div>
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
        Verwerkt (verdwijnt uit "Nog te verwerken")
      </label>
      <div class="modal-actions">
        <button type="button" class="btn btn-danger" id="nf-delete">Verwijderen</button>
        <div class="modal-actions-right">
          <button type="button" class="btn btn-ghost" id="nf-cancel">Annuleren</button>
          <button type="submit" class="btn btn-gold">Opslaan</button>
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
