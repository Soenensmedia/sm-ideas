import { state } from './state.js';
import { escapeHtml, escapeAttr, fmtDate } from './util.js';
import { fetchLeads, createLead, updateLead, deleteLead } from './data.js';
import { openModal, closeModal } from './modal.js';
import { showToast } from './toast.js';

const STATUS_ORDER = ['potentieel', 'geweigerd', 'samengewerkt'];
const STATUS_LABELS = { potentieel: 'Potentieel', geweigerd: 'Geweigerd', samengewerkt: 'Samengewerkt' };
const BRON_LABELS = {
  cold_call: 'Cold call',
  cold_walkin: 'Cold walk-in',
  ads: 'Via ads',
  mond_tot_mond: 'Mond-tot-mond',
  social: 'Social media',
  aanbeveling: 'Aanbeveling',
  anders: 'Anders',
};

export async function renderLeads() {
  const container = document.getElementById('leads-container');
  container.innerHTML = '<div class="empty-note">Laden...</div>';
  try {
    state.leads = await fetchLeads();
  } catch (err) {
    container.innerHTML = `<div class="empty-note">Kon niet laden: ${escapeHtml(err.message)}</div>`;
    return;
  }
  renderBoard();
}

function renderBoard() {
  const container = document.getElementById('leads-container');
  container.innerHTML = `
    <div class="leads-header">
      <div></div>
      <button type="button" class="btn btn-red btn-small" id="lead-add-btn">+ Klant toevoegen</button>
    </div>
    <div class="lead-board">
      ${STATUS_ORDER.map((status) => {
        const items = state.leads.filter((l) => l.status === status);
        return `
          <div class="lead-col">
            <div class="lead-col-title">${STATUS_LABELS[status]} <span class="count">${items.length}</span></div>
            ${items.length ? items.map(leadCardHtml).join('') : '<div class="empty-note">Nog niemand hier.</div>'}
          </div>`;
      }).join('')}
    </div>
  `;

  document.getElementById('lead-add-btn').addEventListener('click', () => openLeadModal(null));
  container.querySelectorAll('.lead-card').forEach((card) => {
    card.addEventListener('click', () => {
      const lead = state.leads.find((l) => l.id === card.dataset.id);
      if (lead) openLeadModal(lead);
    });
  });
}

function leadCardHtml(l) {
  const bron = l.bron === 'anders' && l.bron_detail ? l.bron_detail : BRON_LABELS[l.bron];
  return `
    <div class="lead-card" data-id="${l.id}">
      <div class="lead-name">${escapeHtml(l.naam)}</div>
      ${bron ? `<span class="lead-bron">${escapeHtml(bron)}</span>` : ''}
      ${l.notities ? `<p class="lead-notes">${escapeHtml(l.notities)}</p>` : ''}
      <div class="note-meta">${fmtDate(new Date(l.created_at))}</div>
    </div>`;
}

function openLeadModal(lead) {
  openModal(`
    <div class="modal-header"><h2>${lead ? 'Klant bewerken' : 'Klant toevoegen'}</h2></div>
    <form id="lead-form">
      <div class="field"><label>Naam</label><input type="text" id="lf-naam" value="${escapeAttr(lead?.naam || '')}" required></div>
      <div class="field-row">
        <div class="field"><label>Status</label>
          <select id="lf-status">
            ${STATUS_ORDER.map((s) => `<option value="${s}" ${lead?.status === s ? 'selected' : ''}>${STATUS_LABELS[s]}</option>`).join('')}
          </select>
        </div>
        <div class="field"><label>Hoe gevonden</label>
          <select id="lf-bron">
            <option value="">—</option>
            ${Object.entries(BRON_LABELS).map(([k, v]) => `<option value="${k}" ${lead?.bron === k ? 'selected' : ''}>${v}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="field" id="lf-bron-detail-wrap" style="${lead?.bron === 'anders' ? '' : 'display:none;'}">
        <label>Welke manier precies?</label>
        <input type="text" id="lf-bron-detail" value="${escapeAttr(lead?.bron_detail || '')}" placeholder="Bv. via beurs, oud-collega, ...">
      </div>
      <div class="field"><label>Contact (optioneel)</label><input type="text" id="lf-contact" value="${escapeAttr(lead?.contact || '')}" placeholder="E-mail, telefoon, ..."></div>
      <div class="field"><label>Notities</label><textarea id="lf-notities" rows="3">${escapeHtml(lead?.notities || '')}</textarea></div>
      <div class="modal-actions">
        ${lead ? '<button type="button" class="btn btn-danger" id="lf-delete">Verwijderen</button>' : '<div></div>'}
        <div class="modal-actions-right">
          <button type="button" class="btn btn-ghost" id="lf-cancel">Annuleren</button>
          <button type="submit" class="btn btn-red">Opslaan</button>
        </div>
      </div>
    </form>
  `);

  document.getElementById('lf-bron').addEventListener('change', (e) => {
    document.getElementById('lf-bron-detail-wrap').style.display = e.target.value === 'anders' ? '' : 'none';
  });
  document.getElementById('lf-cancel').addEventListener('click', closeModal);
  document.getElementById('lf-delete')?.addEventListener('click', async () => {
    if (!confirm(`"${lead.naam}" verwijderen?`)) return;
    try {
      await deleteLead(lead.id);
      state.leads = state.leads.filter((l) => l.id !== lead.id);
      closeModal();
      renderBoard();
      showToast('Verwijderd');
    } catch (err) { showToast(err.message, true); }
  });
  document.getElementById('lead-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      naam: document.getElementById('lf-naam').value.trim(),
      status: document.getElementById('lf-status').value,
      bron: document.getElementById('lf-bron').value || null,
      bron_detail: document.getElementById('lf-bron-detail').value.trim() || null,
      contact: document.getElementById('lf-contact').value.trim() || null,
      notities: document.getElementById('lf-notities').value.trim() || null,
    };
    try {
      if (lead) {
        const updated = await updateLead(lead.id, payload);
        const idx = state.leads.findIndex((l) => l.id === lead.id);
        state.leads[idx] = updated;
        showToast('Opgeslagen');
      } else {
        const created = await createLead(payload);
        state.leads.unshift(created);
        showToast('Toegevoegd');
      }
      closeModal();
      renderBoard();
    } catch (err) { showToast(err.message, true); }
  });
}
