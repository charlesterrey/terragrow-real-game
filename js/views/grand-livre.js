// js/views/grand-livre.js — Grand livre interactif filtrable
import { chargerGrandLivre, getEtat, chargerExploitation } from '../app.js';

let sortColumn = 'date';
let sortAsc = true;

export async function render(container) {
  const state = getEtat();
  const expl = await chargerExploitation(state.exploitationId);
  const annee = state.annee;

  let gl;
  try {
    gl = await chargerGrandLivre(state.exploitationId, annee);
  } catch (e) {
    gl = { ecritures: [] };
  }

  const ecritures = gl.ecritures || [];

  if (ecritures.length === 0) {
    container.innerHTML = `
      <h2 style="font-size: 1.3rem; font-weight: 800; color: var(--accent); margin-bottom: 16px;">
        Grand Livre - ${expl.nom} - ${annee}
      </h2>
      <div class="card">
        <p style="padding: 20px; text-align: center; color: var(--text-light);">
          Les écritures comptables pour cette exploitation et cette année ne sont pas encore générées.<br>
          Les grands livres seront disponibles prochainement.
        </p>
        <p style="text-align: center; font-size: 0.85rem; color: var(--text-muted); margin-top: 8px;">
          En attendant, les calculs (CdP, SIG, trésorerie) sont effectués à partir des données agrégées du profil exploitation.
        </p>
      </div>
    `;
    return;
  }

  // Get unique values for filters
  const journaux = [...new Set(ecritures.map(e => e.journal).filter(Boolean))].sort();
  const analytiques = [...new Set(ecritures.map(e => e.analytique).filter(Boolean))].sort();
  const comptes = [...new Set([
    ...ecritures.map(e => e.compte_debit),
    ...ecritures.map(e => e.compte_credit)
  ].filter(Boolean))].sort();

  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
      <h2 style="font-size: 1.3rem; font-weight: 800; color: var(--accent);">
        Grand Livre - ${expl.nom} - ${annee}
      </h2>
      <div>
        <span style="color: var(--text-muted); font-size: 0.85rem; margin-right: 12px;">${ecritures.length} écritures</span>
        <button class="btn btn-outline" id="btn-export-csv">Exporter CSV</button>
      </div>
    </div>

    <div class="filters-bar" id="filters-bar">
      <div class="filter-group">
        <label>Compte</label>
        <select id="filter-compte">
          <option value="">Tous</option>
          ${comptes.map(c => `<option value="${c}">${c}</option>`).join('')}
        </select>
      </div>
      <div class="filter-group">
        <label>Journal</label>
        <select id="filter-journal">
          <option value="">Tous</option>
          ${journaux.map(j => `<option value="${j}">${j}</option>`).join('')}
        </select>
      </div>
      <div class="filter-group">
        <label>Du</label>
        <input type="date" id="filter-date-debut" />
      </div>
      <div class="filter-group">
        <label>Au</label>
        <input type="date" id="filter-date-fin" />
      </div>
      <div class="filter-group">
        <label>Analytique</label>
        <select id="filter-analytique">
          <option value="">Tous</option>
          ${analytiques.map(a => `<option value="${a}">${a}</option>`).join('')}
        </select>
      </div>
      <div class="filter-group">
        <label>Recherche</label>
        <input type="text" id="filter-texte" placeholder="Libellé..." />
      </div>
    </div>

    <div class="table-container">
      <table id="gl-table">
        <thead>
          <tr>
            <th data-col="date" onclick="sortGL('date')">Date</th>
            <th data-col="journal" onclick="sortGL('journal')">Journal</th>
            <th data-col="piece" onclick="sortGL('piece')">Pièce</th>
            <th data-col="libelle" onclick="sortGL('libelle')">Libellé</th>
            <th data-col="compte_debit" onclick="sortGL('compte_debit')">Débit</th>
            <th data-col="compte_credit" onclick="sortGL('compte_credit')">Crédit</th>
            <th data-col="montant_ht" onclick="sortGL('montant_ht')">Montant HT</th>
            <th data-col="analytique" onclick="sortGL('analytique')">Analytique</th>
          </tr>
        </thead>
        <tbody id="gl-tbody"></tbody>
        <tfoot id="gl-tfoot"></tfoot>
      </table>
    </div>
    <div id="gl-count" style="margin-top: 8px; font-size: 0.8rem; color: var(--text-muted);"></div>
  `;

  // Store ecritures for filtering
  window._glEcritures = ecritures;
  window._glFiltered = ecritures;

  // Bind filters
  ['filter-compte', 'filter-journal', 'filter-date-debut', 'filter-date-fin', 'filter-analytique', 'filter-texte'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', () => filterAndRender());
  });

  // CSV export
  document.getElementById('btn-export-csv')?.addEventListener('click', () => exportCSV());

  // Initial render
  filterAndRender();
}

function filterAndRender() {
  const ecritures = window._glEcritures || [];
  const compte = document.getElementById('filter-compte')?.value || '';
  const journal = document.getElementById('filter-journal')?.value || '';
  const dateDebut = document.getElementById('filter-date-debut')?.value || '';
  const dateFin = document.getElementById('filter-date-fin')?.value || '';
  const analytique = document.getElementById('filter-analytique')?.value || '';
  const texte = (document.getElementById('filter-texte')?.value || '').toLowerCase();

  let filtered = ecritures.filter(e => {
    if (compte && e.compte_debit !== compte && e.compte_credit !== compte) return false;
    if (journal && e.journal !== journal) return false;
    if (dateDebut && e.date < dateDebut) return false;
    if (dateFin && e.date > dateFin) return false;
    if (analytique && e.analytique !== analytique) return false;
    if (texte && !(e.libelle || '').toLowerCase().includes(texte)) return false;
    return true;
  });

  // Sort
  filtered.sort((a, b) => {
    let va = a[sortColumn] || '';
    let vb = b[sortColumn] || '';
    if (sortColumn === 'montant_ht') { va = Number(va) || 0; vb = Number(vb) || 0; }
    if (va < vb) return sortAsc ? -1 : 1;
    if (va > vb) return sortAsc ? 1 : -1;
    return 0;
  });

  window._glFiltered = filtered;

  // Render rows
  const tbody = document.getElementById('gl-tbody');
  tbody.innerHTML = filtered.map(e => `
    <tr>
      <td>${e.date || ''}</td>
      <td>${e.journal || ''}</td>
      <td style="font-size: 0.75rem;">${e.piece || ''}</td>
      <td style="max-width: 300px; overflow: hidden; text-overflow: ellipsis;">${e.libelle || ''}</td>
      <td class="text-right">${e.compte_debit || ''}</td>
      <td class="text-right">${e.compte_credit || ''}</td>
      <td class="text-right font-bold">${formatNum(e.montant_ht)}</td>
      <td class="text-center">${e.analytique || ''}</td>
    </tr>
  `).join('');

  // Totals footer
  // totalDebit sums montant_ht for entries that have a debit account
  // totalCredit sums montant_ht for entries that have a credit account
  const totalDebit = filtered.reduce((s, e) => s + (e.compte_debit ? (Number(e.montant_ht) || 0) : 0), 0);
  const totalCredit = filtered.reduce((s, e) => s + (e.compte_credit ? (Number(e.montant_ht) || 0) : 0), 0);
  const solde = totalDebit - totalCredit;

  const tfoot = document.getElementById('gl-tfoot');
  tfoot.innerHTML = `
    <tr>
      <td colspan="4" class="font-bold">${filtered.length} écriture${filtered.length > 1 ? 's' : ''}</td>
      <td class="text-right font-bold">${formatNum(totalDebit)}</td>
      <td class="text-right font-bold">${formatNum(totalCredit)}</td>
      <td class="text-right font-bold" style="color: ${solde >= 0 ? 'var(--success, #22c55e)' : 'var(--danger, #ef4444)'};">
        ${solde >= 0 ? '+' : ''}${formatNum(solde)}
      </td>
      <td></td>
    </tr>
    <tr>
      <td colspan="4" style="font-size: 0.75rem; color: var(--text-muted);">Solde = Débits - Crédits</td>
      <td colspan="4"></td>
    </tr>
  `;

  document.getElementById('gl-count').textContent =
    `${filtered.length} / ${ecritures.length} écritures affichées`;

  // Update sort indicators in headers
  document.querySelectorAll('#gl-table thead th').forEach(th => {
    const col = th.getAttribute('data-col');
    th.style.cursor = 'pointer';
    // Remove existing indicator
    th.textContent = th.textContent.replace(/ [▲▼]$/, '');
    if (col === sortColumn) {
      th.textContent += sortAsc ? ' ▲' : ' ▼';
    }
  });
}

function exportCSV() {
  const ecritures = window._glFiltered || [];
  const headers = [
    'Date', 'Journal', 'Pièce', 'Libellé',
    'Compte Débit', 'Compte Crédit',
    'Montant HT', 'TVA Taux', 'TVA', 'Montant TTC',
    'Analytique'
  ];
  const rows = ecritures.map(e => [
    e.date || '',
    e.journal || '',
    e.piece || '',
    `"${(e.libelle || '').replace(/"/g, '""')}"`,
    e.compte_debit || '',
    e.compte_credit || '',
    (e.montant_ht !== undefined && e.montant_ht !== null) ? String(e.montant_ht).replace('.', ',') : '',
    (e.tva_taux !== undefined && e.tva_taux !== null) ? String(e.tva_taux).replace('.', ',') : '',
    (e.tva !== undefined && e.tva !== null) ? String(e.tva).replace('.', ',') : '',
    (e.montant_ttc !== undefined && e.montant_ttc !== null) ? String(e.montant_ttc).replace('.', ',') : '',
    e.analytique || ''
  ]);

  const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
  // BOM for Excel compatibility with UTF-8
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `grand-livre-${getEtat().exploitationId}-${getEtat().annee}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function formatNum(n) {
  if (n === undefined || n === null || n === '') return '';
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(n));
}

// Global sort function called from inline onclick handlers in thead
window.sortGL = function(col) {
  if (sortColumn === col) {
    sortAsc = !sortAsc;
  } else {
    sortColumn = col;
    sortAsc = true;
  }
  filterAndRender();
};
