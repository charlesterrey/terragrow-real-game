// js/views/couts-production.js — Vue analyse CdP par culture
import { chargerExploitation, chargerReferentiel, chargerITK, getEtat } from '../app.js';
import { calculerCoutsProduction, calculerResumeCdP } from '../engine/couts-production.js?v=2';
import { renderStepper, renderStepObjective, renderStepNavigation } from '../components/stepper.js';
import { setProgression } from '../state.js';
import { COLORS, fmtEur, fmtK, applyFinancialDefaults, euroScale, categoryScale, euroTooltip, euroTooltipWithTotal, legendTop, gridStyle } from '../chart-config.js';

let charts = [];

export async function render(container) {
  charts.forEach(c => c.destroy());
  charts = [];
  applyFinancialDefaults();

  const state = getEtat();
  setProgression(state.exploitationId, 3);
  const expl = await chargerExploitation(state.exploitationId);
  const ref = await chargerReferentiel();
  const itk = await chargerITK();
  const annee = state.annee;

  const cdp = calculerCoutsProduction(expl, annee, ref, itk);
  const resume = calculerResumeCdP(cdp);

  container.innerHTML = `
    ${renderStepper(3)}
    ${renderStepObjective(3)}
    <h2 style="font-size: 1.3rem; font-weight: 800; color: var(--accent); margin-bottom: 16px;">
      Couts de production - ${expl.nom} - ${annee}
    </h2>

    <div class="card">
      <div class="card-header">Detail par culture</div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Culture</th><th>Surface</th><th>Rdt (t/ha)</th>
              <th>Ch. ope</th><th>Mecanisation</th><th>Structure</th><th>Rem. MO</th>
              <th>Coproduits</th><th>CdP/ha</th><th>CdP/t</th>
              <th>Seuil</th><th>Prix vente</th><th>Marge/t</th>
            </tr>
          </thead>
          <tbody>
            ${cdp.map(c => `
              <tr>
                <td class="font-bold">${fmtCulture(c.culture)}</td>
                <td class="text-right">${c.surface} ha</td>
                <td class="text-right">${c.rendement_t_ha}</td>
                <td class="text-right">${fmt(c.charges_ope_ha)}</td>
                <td class="text-right">${fmt(c.mecanisation_ha)}</td>
                <td class="text-right">${fmt(c.structure_ha)}</td>
                <td class="text-right">${fmt(c.remuneration_mo_ha)}</td>
                <td class="text-right">${c.coproduits_ha > 0 ? '-'+fmt(c.coproduits_ha) : '-'}</td>
                <td class="text-right font-bold">${fmt(c.cdp_ha)}</td>
                <td class="text-right font-bold">${fmt(c.cdp_tonne)}</td>
                <td class="text-right">${fmt(c.seuil_commercialisation)}</td>
                <td class="text-right">${fmt(c.prix_vente)}</td>
                <td class="text-right font-bold ${c.marge_tonne >= 0 ? 'text-success' : 'text-danger'}">${fmt(c.marge_tonne)}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr>
              <td class="font-bold">TOTAL / MOYENNE</td>
              <td class="text-right font-bold">${expl.sau_totale} ha</td>
              <td colspan="6"></td>
              <td class="text-right font-bold">${fmt(resume.margeBruteHaMoyen)} MB/ha</td>
              <td colspan="4"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>

    <div class="grid-2 mt-4">
      <div class="card">
        <div class="card-header">Decomposition du cout de production (EUR/ha)</div>
        <div class="chart-container">
          <canvas id="chart-cdp-stacked"></canvas>
        </div>
      </div>
      <div class="card">
        <div class="card-header">CdP/t vs Prix de vente</div>
        <div class="chart-container">
          <canvas id="chart-cdp-vs-prix"></canvas>
        </div>
      </div>
    </div>

    <div class="card mt-4">
      <div class="card-header">Marge de securite par culture</div>
      <p style="font-size: 0.8rem; color: var(--text-light); margin-bottom: 8px;">
        Marge securite = (Prix vente - Seuil commercialisation) / Prix vente. Si &lt; 10%, la culture est a risque.
      </p>
      <div style="display: flex; flex-wrap: wrap; gap: 8px;">
        ${cdp.map(c => {
          const margeSecu = c.prix_vente > 0 ? ((c.prix_vente - c.seuil_commercialisation) / c.prix_vente * 100) : 0;
          const color = margeSecu > 15 ? 'var(--success)' : margeSecu > 5 ? 'var(--warning)' : 'var(--danger)';
          return `<div style="background: ${color}22; border: 1px solid ${color}; border-radius: 8px; padding: 8px 12px; text-align: center; min-width: 100px;">
            <div style="font-size: 0.75rem; color: var(--text-light);">${fmtCulture(c.culture)}</div>
            <div style="font-size: 1.2rem; font-weight: 800; color: ${color};">${margeSecu.toFixed(0)}%</div>
          </div>`;
        }).join('')}
      </div>
    </div>

    ${renderStepNavigation(3, state.exploitationId)}
  `;

  renderStackedBar(cdp);
  renderCdPvsPrix(cdp);
}

function renderStackedBar(cdp) {
  const ctx = document.getElementById('chart-cdp-stacked');
  if (!ctx) return;
  const labels = cdp.map(c => fmtCulture(c.culture));
  const chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'Ch. operationnelles', data: cdp.map(c => c.charges_ope_ha), backgroundColor: COLORS.coral, borderRadius: 3, barPercentage: 0.7 },
        { label: 'Mecanisation', data: cdp.map(c => c.mecanisation_ha), backgroundColor: COLORS.gold, borderRadius: 3, barPercentage: 0.7 },
        { label: 'Structure', data: cdp.map(c => c.structure_ha + c.amort_bat_ha), backgroundColor: COLORS.steel, borderRadius: 3, barPercentage: 0.7 },
        { label: 'Remuneration MO', data: cdp.map(c => c.remuneration_mo_ha), backgroundColor: COLORS.plum, borderRadius: 3, barPercentage: 0.7 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: true,
      plugins: { legend: legendTop, tooltip: euroTooltipWithTotal },
      scales: { x: { ...categoryScale(), stacked: true }, y: { ...euroScale(), stacked: true } }
    }
  });
  charts.push(chart);
}

function renderCdPvsPrix(cdp) {
  const ctx = document.getElementById('chart-cdp-vs-prix');
  if (!ctx) return;
  // Filter cultures with meaningful CdP/t (exclude betterave/pdt with very different units)
  const filtered = cdp.filter(c => c.cdp_tonne > 0 && c.cdp_tonne < 2000);
  const labels = filtered.map(c => fmtCulture(c.culture));
  const chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'CdP / tonne', data: filtered.map(c => c.cdp_tonne), backgroundColor: COLORS.navy, borderRadius: 3, barPercentage: 0.65, categoryPercentage: 0.75 },
        { label: 'Seuil commercialisation', data: filtered.map(c => c.seuil_commercialisation), backgroundColor: COLORS.gold, borderRadius: 3, barPercentage: 0.65, categoryPercentage: 0.75 },
        { label: 'Prix de vente', data: filtered.map(c => c.prix_vente), backgroundColor: COLORS.sage, borderRadius: 3, barPercentage: 0.65, categoryPercentage: 0.75 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: true,
      plugins: { legend: legendTop, tooltip: euroTooltip },
      scales: { x: categoryScale(), y: { ...euroScale(), ticks: { ...euroScale().ticks, callback: v => v + ' €/t' } } }
    }
  });
  charts.push(chart);
}

function fmtCulture(key) {
  const n = { ble_tendre:'Ble tendre', ble_dur:'Ble dur', orge_hiver:'Orge hiver', orge_printemps:'Orge print.', colza:'Colza', mais_grain:'Mais', mais_grain_irrigue:'Mais irr.', tournesol:'Tournesol', pois:'Pois', feverole:'Feverole', betterave_sucriere:'Betterave', pomme_terre:'Pdt', lin_fibre:'Lin', soja:'Soja', soja_irrigue:'Soja irr.', sorgho:'Sorgho', triticale:'Triticale', lentille_puy:'Lentille', haricots_verts:'H. verts', petits_pois:'P. pois', prairie_foin:'Prairie' };
  return n[key] || key;
}
function fmt(n) { return n != null ? Math.round(n).toLocaleString('fr-FR') + ' EUR' : '-'; }
