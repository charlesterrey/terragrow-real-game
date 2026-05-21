// js/views/couts-production.js — Vue analyse coûts de production (refonte complète)
import { chargerExploitation, chargerReferentiel, chargerITK, chargerScenarios, getEtat, sauvegarderEtat } from '../app.js';
import { calculerCoutsProduction, calculerResumeCdP } from '../engine/couts-production.js?v=8';
import { simulerScenario } from '../engine/simulation.js?v=8';
import { renderStepper, renderStepObjective, renderStepNavigation } from '../components/stepper.js';
import { initCustomSelects } from '../components/custom-select.js';
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
  const scenarios = await chargerScenarios();
  const annee = state.annee;

  const cdp = calculerCoutsProduction(expl, annee, ref, itk);
  const resume = calculerResumeCdP(cdp);

  // Aggregate KPIs
  const totalCA = cdp.reduce((s, c) => s + c.produit_brut_total, 0);
  const totalCO = cdp.reduce((s, c) => s + c.charges_ope_totales, 0);
  const totalMB = cdp.reduce((s, c) => s + c.marge_brute_totale, 0);
  const avgCdpT = cdp.filter(c => c.cdp_tonne > 0 && c.cdp_tonne < 2000).reduce((s, c) => s + c.cdp_tonne, 0) / Math.max(1, cdp.filter(c => c.cdp_tonne > 0 && c.cdp_tonne < 2000).length);
  const culturesRentables = cdp.filter(c => c.marge_tonne >= 0).length;
  const culturesDeficit = cdp.filter(c => c.marge_tonne < 0).length;

  container.innerHTML = `
    ${renderStepper(3)}
    ${renderStepObjective(3)}

    <!-- Header -->
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;">
      <div>
        <h2 style="font-size:18px;font-weight:700;color:var(--gray-900);letter-spacing:-0.3px;">Coûts de production</h2>
        <p style="font-size:13px;color:var(--gray-500);margin-top:2px;">${expl.nom} — ${annee} — ${cdp.length} cultures</p>
      </div>
      <div style="display:flex;align-items:center;gap:10px;">
        <label style="font-size:12px;font-weight:500;color:var(--gray-500);">Scénario :</label>
        <select id="cdp-scenario" data-custom style="min-width:220px;">
          <option value="">Situation réelle</option>
          ${scenarios.map(s => `<option value="${s.id}">${s.nom}</option>`).join('')}
        </select>
      </div>
    </div>

    <!-- KPI Row -->
    <div class="kpi-grid" style="grid-template-columns: repeat(6, 1fr); margin-bottom: 24px;">
      ${renderKpi('Produit brut', fmtK(totalCA), '', fmtK(totalCA / expl.sau_totale) + '/ha')}
      ${renderKpi('Charges opé.', fmtK(totalCO), '', fmtK(totalCO / expl.sau_totale) + '/ha')}
      ${renderKpi('Marge brute', fmtK(totalMB), totalMB >= 0 ? 'ok' : 'critique', fmtK(totalMB / expl.sau_totale) + '/ha')}
      ${renderKpi('CdP moyen', Math.round(avgCdpT) + ' €/t', '', 'Céréales & oléo.')}
      ${renderKpi('Rentables', culturesRentables + '/' + cdp.length, culturesDeficit === 0 ? 'ok' : 'attention', culturesDeficit > 0 ? culturesDeficit + ' en déficit' : 'Toutes positives')}
      ${renderKpi('MB / ha', Math.round(resume.margeBruteHaMoyen) + ' €', resume.margeBruteHaMoyen > 200 ? 'ok' : resume.margeBruteHaMoyen > 0 ? 'attention' : 'critique', 'Moyenne pondérée')}
    </div>

    <!-- Scenario impact zone (hidden by default) -->
    <div id="cdp-scenario-impact" style="display:none;"></div>

    <!-- Charts row -->
    <div class="grid-2" style="margin-bottom:20px;">
      <div class="card">
        <div class="card-header">Décomposition CdP par culture (€/ha)</div>
        <div class="chart-container" style="max-height:320px;">
          <canvas id="chart-cdp-stacked"></canvas>
        </div>
      </div>
      <div class="card">
        <div class="card-header">CdP/t vs Prix de vente</div>
        <div class="chart-container" style="max-height:320px;">
          <canvas id="chart-cdp-vs-prix"></canvas>
        </div>
      </div>
    </div>

    <!-- Marge de sécurité -->
    <div class="card" style="margin-bottom:20px;">
      <div class="card-header">Marge de sécurité par culture</div>
      <p style="font-size:12px;color:var(--gray-400);margin-bottom:12px;">
        (Prix vente - Seuil) / Prix vente. En dessous de 10%, la culture est vulnérable.
      </p>
      <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(130px, 1fr));gap:8px;">
        ${cdp.map(c => renderMargeSecu(c)).join('')}
      </div>
    </div>

    <!-- Detail table -->
    <div class="card">
      <div class="card-header">Détail complet par culture</div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th style="padding:9px 14px;text-align:left;font-size:11px;font-weight:600;color:var(--gray-400);text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid var(--gray-200);background:var(--gray-50);">Culture</th>
              <th style="padding:9px 10px;text-align:right;font-size:11px;font-weight:600;color:var(--gray-400);text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid var(--gray-200);background:var(--gray-50);">Surface</th>
              <th style="padding:9px 10px;text-align:right;font-size:11px;font-weight:600;color:var(--gray-400);text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid var(--gray-200);background:var(--gray-50);">Rdt</th>
              <th style="padding:9px 10px;text-align:right;font-size:11px;font-weight:600;color:var(--gray-400);text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid var(--gray-200);background:var(--gray-50);">Ch.opé</th>
              <th style="padding:9px 10px;text-align:right;font-size:11px;font-weight:600;color:var(--gray-400);text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid var(--gray-200);background:var(--gray-50);">Méca.</th>
              <th style="padding:9px 10px;text-align:right;font-size:11px;font-weight:600;color:var(--gray-400);text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid var(--gray-200);background:var(--gray-50);">Struct.</th>
              <th style="padding:9px 10px;text-align:right;font-size:11px;font-weight:600;color:#021130;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #021130;background:var(--gray-50);">CdP/t</th>
              <th style="padding:9px 10px;text-align:right;font-size:11px;font-weight:600;color:var(--gray-400);text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid var(--gray-200);background:var(--gray-50);">Prix</th>
              <th style="padding:9px 10px;text-align:right;font-size:11px;font-weight:600;color:var(--gray-400);text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid var(--gray-200);background:var(--gray-50);">Marge/t</th>
              <th style="padding:9px 10px;text-align:right;font-size:11px;font-weight:600;color:var(--gray-400);text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid var(--gray-200);background:var(--gray-50);">MB totale</th>
            </tr>
          </thead>
          <tbody>
            ${cdp.map(c => `
              <tr style="transition:background 0.1s;" onmouseover="this.style.background='var(--gray-50)'" onmouseout="this.style.background=''">
                <td style="padding:10px 14px;border-bottom:1px solid var(--gray-100);font-weight:600;color:var(--gray-900);font-size:13px;">${fc(c.culture)}</td>
                <td style="padding:10px 10px;border-bottom:1px solid var(--gray-100);text-align:right;font-size:13px;font-variant-numeric:tabular-nums;color:var(--gray-500);">${c.surface} ha</td>
                <td style="padding:10px 10px;border-bottom:1px solid var(--gray-100);text-align:right;font-size:13px;font-variant-numeric:tabular-nums;color:var(--gray-500);">${c.rendement_t_ha} t</td>
                <td style="padding:10px 10px;border-bottom:1px solid var(--gray-100);text-align:right;font-size:13px;font-variant-numeric:tabular-nums;">${Math.round(c.charges_ope_ha)}</td>
                <td style="padding:10px 10px;border-bottom:1px solid var(--gray-100);text-align:right;font-size:13px;font-variant-numeric:tabular-nums;">${Math.round(c.mecanisation_ha)}</td>
                <td style="padding:10px 10px;border-bottom:1px solid var(--gray-100);text-align:right;font-size:13px;font-variant-numeric:tabular-nums;">${Math.round(c.structure_ha)}</td>
                <td style="padding:10px 10px;border-bottom:1px solid var(--gray-100);text-align:right;font-size:14px;font-weight:700;font-variant-numeric:tabular-nums;color:#021130;">${Math.round(c.cdp_tonne)}</td>
                <td style="padding:10px 10px;border-bottom:1px solid var(--gray-100);text-align:right;font-size:13px;font-variant-numeric:tabular-nums;color:var(--gray-500);">${Math.round(c.prix_vente)}</td>
                <td style="padding:10px 10px;border-bottom:1px solid var(--gray-100);text-align:right;font-size:13px;font-weight:600;font-variant-numeric:tabular-nums;color:${c.marge_tonne >= 0 ? '#2D7A4F' : '#B33D3D'};">${c.marge_tonne >= 0 ? '+' : ''}${Math.round(c.marge_tonne)}</td>
                <td style="padding:10px 10px;border-bottom:1px solid var(--gray-100);text-align:right;font-size:13px;font-variant-numeric:tabular-nums;color:${c.marge_brute_totale >= 0 ? 'var(--gray-700)' : '#B33D3D'};">${fmtK(c.marge_brute_totale)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>

    ${renderStepNavigation(3, state.exploitationId)}
  `;

  // Init custom selects
  initCustomSelects(container);

  // Render charts
  renderStackedBar(cdp);
  renderCdPvsPrix(cdp);

  // Scenario handler
  document.getElementById('cdp-scenario').addEventListener('change', (ev) => {
    const scenId = ev.target.value;
    const impactZone = document.getElementById('cdp-scenario-impact');
    if (!scenId) { impactZone.style.display = 'none'; impactZone.innerHTML = ''; return; }
    const scenario = scenarios.find(s => s.id === scenId);
    if (!scenario) return;

    // Simulate
    const sim = simulerScenario(expl, annee, ref, itk, scenario);
    const cdpAv = sim.avant.cdpParCulture;
    const cdpAp = sim.apres.cdpParCulture;

    impactZone.style.display = '';
    impactZone.innerHTML = `
      <div class="card" style="margin-bottom:20px;border-left:3px solid ${scenario.couleur || '#EF4444'};">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <div>
            <div style="font-size:14px;font-weight:700;color:var(--gray-900);">Impact : ${scenario.nom}</div>
            <div style="font-size:12px;color:var(--gray-500);margin-top:2px;">${scenario.description}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:var(--gray-400);margin-bottom:2px;">Variation MB totale</div>
            <div style="font-size:20px;font-weight:700;color:${sim.delta.margeBrute.delta >= 0 ? '#2D7A4F' : '#B33D3D'};font-variant-numeric:tabular-nums;">
              ${sim.delta.margeBrute.delta >= 0 ? '+' : ''}${fmtK(sim.delta.margeBrute.delta)}
            </div>
          </div>
        </div>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;color:var(--gray-400);text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid var(--gray-200);background:var(--gray-50);">Culture</th>
                <th style="padding:8px 10px;text-align:right;font-size:11px;font-weight:600;color:var(--gray-400);text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid var(--gray-200);background:var(--gray-50);">CdP/t avant</th>
                <th style="padding:8px 10px;text-align:right;font-size:11px;font-weight:600;color:var(--gray-400);text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid var(--gray-200);background:var(--gray-50);">CdP/t après</th>
                <th style="padding:8px 10px;text-align:right;font-size:11px;font-weight:600;color:var(--gray-400);text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid var(--gray-200);background:var(--gray-50);">Variation</th>
                <th style="padding:8px 10px;text-align:right;font-size:11px;font-weight:600;color:var(--gray-400);text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid var(--gray-200);background:var(--gray-50);">Prix après</th>
                <th style="padding:8px 10px;text-align:right;font-size:11px;font-weight:600;color:var(--gray-400);text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid var(--gray-200);background:var(--gray-50);">Marge/t après</th>
              </tr>
            </thead>
            <tbody>
              ${cdpAv.map(av => {
                const ap = cdpAp.find(c => c.culture === av.culture);
                if (!ap) return '';
                const dCdp = ap.cdp_tonne - av.cdp_tonne;
                const dPct = av.cdp_tonne > 0 ? (dCdp / av.cdp_tonne * 100) : 0;
                return `<tr style="transition:background 0.1s;" onmouseover="this.style.background='var(--gray-50)'" onmouseout="this.style.background=''">
                  <td style="padding:8px 12px;border-bottom:1px solid var(--gray-100);font-weight:600;color:var(--gray-900);font-size:13px;">${fc(av.culture)}</td>
                  <td style="padding:8px 10px;border-bottom:1px solid var(--gray-100);text-align:right;font-size:13px;font-variant-numeric:tabular-nums;color:var(--gray-500);">${Math.round(av.cdp_tonne)} €</td>
                  <td style="padding:8px 10px;border-bottom:1px solid var(--gray-100);text-align:right;font-size:13px;font-weight:600;font-variant-numeric:tabular-nums;">${Math.round(ap.cdp_tonne)} €</td>
                  <td style="padding:8px 10px;border-bottom:1px solid var(--gray-100);text-align:right;font-size:13px;font-weight:600;font-variant-numeric:tabular-nums;color:${dCdp > 0 ? '#B33D3D' : '#2D7A4F'};">
                    ${dCdp > 0 ? '+' : ''}${Math.round(dCdp)} € <span style="font-size:11px;font-weight:500;opacity:0.7;">(${dPct > 0 ? '+' : ''}${dPct.toFixed(1)}%)</span>
                  </td>
                  <td style="padding:8px 10px;border-bottom:1px solid var(--gray-100);text-align:right;font-size:13px;font-variant-numeric:tabular-nums;color:var(--gray-500);">${Math.round(ap.prix_vente)} €</td>
                  <td style="padding:8px 10px;border-bottom:1px solid var(--gray-100);text-align:right;font-size:13px;font-weight:600;font-variant-numeric:tabular-nums;color:${ap.marge_tonne >= 0 ? '#2D7A4F' : '#B33D3D'};">${ap.marge_tonne >= 0 ? '+' : ''}${Math.round(ap.marge_tonne)} €</td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  });
}

// --- Charts ---

function renderStackedBar(cdp) {
  const ctx = document.getElementById('chart-cdp-stacked');
  if (!ctx) return;
  const chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: cdp.map(c => fc(c.culture)),
      datasets: [
        { label: 'Charges opé.', data: cdp.map(c => c.charges_ope_ha), backgroundColor: COLORS.coral, borderRadius: 2, barPercentage: 0.7 },
        { label: 'Mécanisation', data: cdp.map(c => c.mecanisation_ha), backgroundColor: COLORS.gold, borderRadius: 2, barPercentage: 0.7 },
        { label: 'Structure', data: cdp.map(c => c.structure_ha + c.amort_bat_ha), backgroundColor: COLORS.steel, borderRadius: 2, barPercentage: 0.7 },
        { label: 'Rém. MO', data: cdp.map(c => c.remuneration_mo_ha), backgroundColor: COLORS.plum, borderRadius: 2, barPercentage: 0.7 }
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
  const filtered = cdp.filter(c => c.cdp_tonne > 0 && c.cdp_tonne < 2000);
  const chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: filtered.map(c => fc(c.culture)),
      datasets: [
        { label: 'Seuil (CdP - Aides)', data: filtered.map(c => c.seuil_commercialisation), backgroundColor: COLORS.coralBg, borderColor: COLORS.coral, borderWidth: 1, borderRadius: 2, barPercentage: 0.6, categoryPercentage: 0.8 },
        { label: 'Prix de vente', data: filtered.map(c => c.prix_vente), backgroundColor: COLORS.sageBg, borderColor: COLORS.sage, borderWidth: 1, borderRadius: 2, barPercentage: 0.6, categoryPercentage: 0.8 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: true,
      plugins: {
        legend: legendTop,
        tooltip: {
          callbacks: {
            label: ctx => ` ${ctx.dataset.label} : ${Math.round(ctx.raw)} €/t`,
            afterBody: (items) => {
              if (items.length < 2) return '';
              const idx = items[0].dataIndex;
              const f = filtered[idx];
              return f ? `  Marge : ${Math.round(f.marge_tonne)} €/t` : '';
            }
          }
        }
      },
      scales: {
        x: categoryScale(),
        y: { ...euroScale(), ticks: { ...euroScale().ticks, callback: v => v + ' €/t' } }
      }
    }
  });
  charts.push(chart);
}

// --- Helpers ---

function renderKpi(label, value, status, sub) {
  return `<div class="kpi-card ${status || ''}">
    <div class="kpi-label">${label}</div>
    <div class="kpi-value" style="font-size:18px;">${value}</div>
    ${sub ? `<div class="kpi-variation neutral">${sub}</div>` : ''}
  </div>`;
}

function renderMargeSecu(c) {
  const ms = c.prix_vente > 0 ? ((c.prix_vente - c.seuil_commercialisation) / c.prix_vente * 100) : 0;
  const color = ms > 15 ? '#2D7A4F' : ms > 5 ? '#C08420' : '#B33D3D';
  const bg = ms > 15 ? 'rgba(45,122,79,0.08)' : ms > 5 ? 'rgba(192,132,32,0.08)' : 'rgba(179,61,61,0.08)';
  return `<div style="background:${bg};border:1px solid ${color}22;border-radius:8px;padding:10px;text-align:center;">
    <div style="font-size:20px;font-weight:700;color:${color};font-variant-numeric:tabular-nums;line-height:1.2;">${ms.toFixed(0)}%</div>
    <div style="font-size:11px;color:var(--gray-500);margin-top:3px;">${fc(c.culture)}</div>
  </div>`;
}

function fc(k) {
  return { ble_tendre:'Blé tendre', ble_dur:'Blé dur', orge_hiver:'Orge hiver', orge_printemps:'Orge print.', colza:'Colza', mais_grain:'Maïs', mais_grain_irrigue:'Maïs irr.', tournesol:'Tournesol', pois:'Pois', feverole:'Féverole', betterave_sucriere:'Betterave', pomme_terre:'Pomme de terre', lin_fibre:'Lin', soja:'Soja', soja_irrigue:'Soja irr.', sorgho:'Sorgho', triticale:'Triticale', lentille_puy:'Lentille', haricots_verts:'Haricots v.', petits_pois:'Petits pois', prairie_foin:'Prairie' }[k] || k;
}
