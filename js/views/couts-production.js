// js/views/couts-production.js — Vue coûts de production (v3 — pro)
import { chargerExploitation, chargerReferentiel, chargerITK, chargerScenarios, getEtat } from '../app.js';
import { calculerCoutsProduction, calculerResumeCdP } from '../engine/couts-production.js?v=9';
import { simulerScenario } from '../engine/simulation.js?v=9';
import { renderStepper, renderStepObjective, renderStepNavigation } from '../components/stepper.js';
import { initCustomSelects } from '../components/custom-select.js';
import { setProgression } from '../state.js';
import { COLORS, fmtEur, fmtK, applyFinancialDefaults, euroScale, categoryScale, euroTooltip, euroTooltipWithTotal, legendTop, gridStyle, zeroLineGrid } from '../chart-config.js';

let charts = [];

export async function render(container) {
  charts.forEach(c => c.destroy()); charts = [];
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

  const totalCA = cdp.reduce((s, c) => s + c.produit_brut_total, 0);
  const totalCO = cdp.reduce((s, c) => s + c.charges_ope_totales, 0);
  const totalMB = cdp.reduce((s, c) => s + c.marge_brute_totale, 0);
  const cereales = cdp.filter(c => c.cdp_tonne > 0 && c.cdp_tonne < 1500);
  const avgCdpT = cereales.length ? cereales.reduce((s, c) => s + c.cdp_tonne, 0) / cereales.length : 0;
  const nbRentables = cdp.filter(c => c.marge_tonne >= 0).length;
  const nbDeficit = cdp.filter(c => c.marge_tonne < 0).length;

  container.innerHTML = `
    ${renderStepper(3)}
    ${renderStepObjective(3)}

    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;">
      <div>
        <h2 style="font-size:18px;font-weight:700;color:var(--gray-900);letter-spacing:-0.3px;">Coûts de production</h2>
        <p style="font-size:13px;color:var(--gray-500);margin-top:2px;">${expl.nom} — ${annee} — ${cdp.length} cultures — ${expl.sau_totale} ha</p>
      </div>
      <div style="display:flex;align-items:center;gap:10px;">
        <label style="font-size:12px;font-weight:500;color:var(--gray-500);">Appliquer un scénario :</label>
        <select id="cdp-scenario" data-custom style="min-width:220px;">
          <option value="">Situation réelle</option>
          ${scenarios.map(s => `<option value="${s.id}">${s.nom}</option>`).join('')}
        </select>
      </div>
    </div>

    <!-- KPI -->
    <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:10px;margin-bottom:24px;">
      ${kpi('Produit brut', fmtK(totalCA), fmtK(totalCA / expl.sau_totale) + '/ha', '')}
      ${kpi('Charges opé.', fmtK(totalCO), fmtK(totalCO / expl.sau_totale) + '/ha', '')}
      ${kpi('Marge brute', fmtK(totalMB), fmtK(totalMB / expl.sau_totale) + '/ha', totalMB >= 0 ? 'ok' : 'critique')}
      ${kpi('CdP moyen', Math.round(avgCdpT) + ' €/t', 'Céréales & oléo.', '')}
      ${kpi('Cultures rentables', nbRentables + ' / ' + cdp.length, nbDeficit > 0 ? nbDeficit + ' en déficit' : 'Toutes positives', nbDeficit > 0 ? 'attention' : 'ok')}
      ${kpi('MB / ha moyen', Math.round(resume.margeBruteHaMoyen) + ' €', 'Pondéré par surface', resume.margeBruteHaMoyen > 200 ? 'ok' : resume.margeBruteHaMoyen > 0 ? 'attention' : 'critique')}
    </div>

    <!-- Scenario impact -->
    <div id="cdp-scenario-impact"></div>

    <!-- Marge par culture (horizontal bar) + Décomposition CdP -->
    <div class="grid-2" style="margin-bottom:20px;">
      <div class="card">
        <div class="card-header">Marge brute par culture (€/ha)</div>
        <div class="chart-container" style="height:${Math.max(200, cdp.length * 36)}px;">
          <canvas id="chart-marge-culture"></canvas>
        </div>
      </div>
      <div class="card">
        <div class="card-header">Décomposition CdP (€/ha)</div>
        <div class="chart-container" style="height:${Math.max(200, cdp.length * 36)}px;">
          <canvas id="chart-cdp-stacked"></canvas>
        </div>
      </div>
    </div>

    <!-- CdP/t vs Prix + Marge sécu -->
    <div class="grid-2" style="margin-bottom:20px;">
      <div class="card">
        <div class="card-header">CdP/t vs Prix de vente</div>
        <div class="chart-container" style="max-height:300px;">
          <canvas id="chart-cdp-vs-prix"></canvas>
        </div>
      </div>
      <div class="card">
        <div class="card-header">Marge de sécurité</div>
        <p style="font-size:11px;color:var(--gray-400);margin-bottom:10px;">(Prix vente - Seuil) / Prix vente</p>
        <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(110px, 1fr));gap:6px;">
          ${cdp.map(c => margeSecuCard(c)).join('')}
        </div>
      </div>
    </div>

    <!-- Culture cards -->
    <div class="card">
      <div class="card-header">Détail par culture</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(340px, 1fr));gap:10px;">
        ${cdp.map((c, i) => cultureCard(c, i)).join('')}
      </div>
    </div>

    ${renderStepNavigation(3, state.exploitationId)}
  `;

  initCustomSelects(container);
  renderMargeChart(cdp);
  renderStackedBar(cdp);
  renderCdPvsPrix(cdp);

  // Scenario handler
  document.getElementById('cdp-scenario').addEventListener('change', (ev) => {
    const zone = document.getElementById('cdp-scenario-impact');
    const scenId = ev.target.value;
    if (!scenId) { zone.innerHTML = ''; return; }
    const sc = scenarios.find(s => s.id === scenId);
    if (!sc) return;

    const sim = simulerScenario(expl, annee, ref, itk, sc);
    const av = sim.avant.cdpParCulture, ap = sim.apres.cdpParCulture;
    const dMB = sim.delta.margeBrute.delta;

    zone.innerHTML = `
      <div class="card" style="margin-bottom:20px;border-left:3px solid ${sc.couleur || COLORS.coral};overflow:hidden;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <div>
            <div style="font-size:15px;font-weight:700;color:var(--gray-900);">Impact scénario : ${sc.nom}</div>
            <div style="font-size:12px;color:var(--gray-500);margin-top:2px;max-width:500px;">${sc.description}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:var(--gray-400);">Variation MB totale</div>
            <div style="font-size:24px;font-weight:800;color:${dMB >= 0 ? COLORS.positive : COLORS.negative};font-variant-numeric:tabular-nums;letter-spacing:-0.5px;">
              ${dMB >= 0 ? '+' : ''}${fmtK(dMB)}
            </div>
          </div>
        </div>

        <!-- Impact chart: grouped bar avant/après -->
        <div style="height:${Math.max(180, av.length * 32)}px;margin-bottom:16px;">
          <canvas id="chart-scenario-impact"></canvas>
        </div>

        <!-- Impact table -->
        <div style="overflow-x:auto;border:1px solid var(--gray-100);border-radius:8px;">
          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr>
                ${['Culture','Ch.opé avant','Ch.opé après','CdP/t avant','CdP/t après','Var.','Prix après','Marge/t après'].map(h =>
                  `<th style="padding:7px 10px;text-align:${h === 'Culture' ? 'left' : 'right'};font-size:10px;font-weight:600;color:var(--gray-400);text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid var(--gray-200);background:var(--gray-50);white-space:nowrap;">${h}</th>`
                ).join('')}
              </tr>
            </thead>
            <tbody>
              ${av.map(a => {
                const p = ap.find(c => c.culture === a.culture);
                if (!p) return '';
                const dC = p.cdp_tonne - a.cdp_tonne;
                const dP = a.cdp_tonne > 0 ? (dC / a.cdp_tonne * 100) : 0;
                const dOpe = p.charges_ope_ha - a.charges_ope_ha;
                return `<tr style="transition:background 0.1s;" onmouseover="this.style.background='var(--gray-50)'" onmouseout="this.style.background=''">
                  <td style="padding:7px 10px;border-bottom:1px solid var(--gray-100);font-weight:600;color:var(--gray-900);font-size:12px;">${fc(a.culture)}</td>
                  <td style="padding:7px 10px;border-bottom:1px solid var(--gray-100);text-align:right;font-size:12px;font-variant-numeric:tabular-nums;color:var(--gray-500);">${Math.round(a.charges_ope_ha)}</td>
                  <td style="padding:7px 10px;border-bottom:1px solid var(--gray-100);text-align:right;font-size:12px;font-weight:600;font-variant-numeric:tabular-nums;color:${dOpe > 0 ? COLORS.negative : COLORS.positive};">${Math.round(p.charges_ope_ha)}</td>
                  <td style="padding:7px 10px;border-bottom:1px solid var(--gray-100);text-align:right;font-size:12px;font-variant-numeric:tabular-nums;color:var(--gray-500);">${Math.round(a.cdp_tonne)}</td>
                  <td style="padding:7px 10px;border-bottom:1px solid var(--gray-100);text-align:right;font-size:12px;font-weight:600;font-variant-numeric:tabular-nums;">${Math.round(p.cdp_tonne)}</td>
                  <td style="padding:7px 10px;border-bottom:1px solid var(--gray-100);text-align:right;font-size:12px;font-weight:700;font-variant-numeric:tabular-nums;color:${dC > 0 ? COLORS.negative : COLORS.positive};">${dC > 0 ? '+' : ''}${Math.round(dC)} <span style="font-size:10px;font-weight:500;opacity:0.7;">(${dP > 0 ? '+' : ''}${dP.toFixed(1)}%)</span></td>
                  <td style="padding:7px 10px;border-bottom:1px solid var(--gray-100);text-align:right;font-size:12px;font-variant-numeric:tabular-nums;">${Math.round(p.prix_vente)}</td>
                  <td style="padding:7px 10px;border-bottom:1px solid var(--gray-100);text-align:right;font-size:12px;font-weight:700;font-variant-numeric:tabular-nums;color:${p.marge_tonne >= 0 ? COLORS.positive : COLORS.negative};">${p.marge_tonne >= 0 ? '+' : ''}${Math.round(p.marge_tonne)}</td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Grouped bar: CdP/t avant vs après
    const cImpact = document.getElementById('chart-scenario-impact');
    if (cImpact) {
      const labels = av.filter(a => a.cdp_tonne > 0 && a.cdp_tonne < 1500).map(a => fc(a.culture));
      const dataAv = av.filter(a => a.cdp_tonne > 0 && a.cdp_tonne < 1500).map(a => a.cdp_tonne);
      const dataAp = av.filter(a => a.cdp_tonne > 0 && a.cdp_tonne < 1500).map(a => {
        const p = ap.find(c => c.culture === a.culture);
        return p ? p.cdp_tonne : a.cdp_tonne;
      });
      const ch = new Chart(cImpact, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            { label: 'CdP/t avant', data: dataAv, backgroundColor: COLORS.steelBg, borderColor: COLORS.steel, borderWidth: 1, borderRadius: 3, barPercentage: 0.6, categoryPercentage: 0.8 },
            { label: 'CdP/t après scénario', data: dataAp, backgroundColor: COLORS.negativeBg, borderColor: COLORS.negative, borderWidth: 1, borderRadius: 3, barPercentage: 0.6, categoryPercentage: 0.8 }
          ]
        },
        options: {
          indexAxis: 'y',
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: legendTop, tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label} : ${Math.round(ctx.raw)} €/t` } } },
          scales: { x: { ...euroScale(), ticks: { callback: v => v + ' €/t' } }, y: categoryScale() }
        }
      });
      charts.push(ch);
    }
  });
}

// ─── Charts ──────────────────────────────────────────────────────────────

function renderMargeChart(cdp) {
  const ctx = document.getElementById('chart-marge-culture');
  if (!ctx) return;
  const sorted = [...cdp].sort((a, b) => b.marge_brute_ha - a.marge_brute_ha);
  const ch = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: sorted.map(c => fc(c.culture)),
      datasets: [{
        data: sorted.map(c => c.marge_brute_ha),
        backgroundColor: sorted.map(c => c.marge_brute_ha >= 0 ? COLORS.positiveBg : COLORS.negativeBg),
        borderColor: sorted.map(c => c.marge_brute_ha >= 0 ? COLORS.positive : COLORS.negative),
        borderWidth: 1, borderRadius: 3, barPercentage: 0.7
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` Marge brute : ${Math.round(ctx.raw)} €/ha` } } },
      scales: {
        x: { ...euroScale({ zeroLine: true }), ticks: { callback: v => v + ' €' } },
        y: categoryScale()
      }
    }
  });
  charts.push(ch);
}

function renderStackedBar(cdp) {
  const ctx = document.getElementById('chart-cdp-stacked');
  if (!ctx) return;
  const ch = new Chart(ctx, {
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
      indexAxis: 'y',
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: legendTop, tooltip: euroTooltipWithTotal },
      scales: { x: { ...euroScale(), stacked: true }, y: { ...categoryScale(), stacked: true } }
    }
  });
  charts.push(ch);
}

function renderCdPvsPrix(cdp) {
  const ctx = document.getElementById('chart-cdp-vs-prix');
  if (!ctx) return;
  const f = cdp.filter(c => c.cdp_tonne > 0 && c.cdp_tonne < 1500);
  const ch = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: f.map(c => fc(c.culture)),
      datasets: [
        { label: 'Seuil (CdP - Aides)', data: f.map(c => c.seuil_commercialisation), backgroundColor: 'rgba(194,101,74,0.15)', borderColor: COLORS.coral, borderWidth: 1.5, borderRadius: 3, barPercentage: 0.55, categoryPercentage: 0.8 },
        { label: 'Prix de vente', data: f.map(c => c.prix_vente), backgroundColor: 'rgba(91,140,90,0.15)', borderColor: COLORS.sage, borderWidth: 1.5, borderRadius: 3, barPercentage: 0.55, categoryPercentage: 0.8 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: true,
      plugins: { legend: legendTop, tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label} : ${Math.round(ctx.raw)} €/t` } } },
      scales: { x: categoryScale(), y: { ...euroScale(), ticks: { callback: v => v + ' €/t' } } }
    }
  });
  charts.push(ch);
}

// ─── Helpers ─────────────────────────────────────────────────────────────

function kpi(label, value, sub, status) {
  return `<div class="kpi-card ${status || ''}">
    <div class="kpi-label">${label}</div>
    <div class="kpi-value" style="font-size:18px;letter-spacing:-0.3px;">${value}</div>
    ${sub ? `<div class="kpi-variation neutral">${sub}</div>` : ''}
  </div>`;
}

function margeSecuCard(c) {
  const ms = c.prix_vente > 0 ? ((c.prix_vente - c.seuil_commercialisation) / c.prix_vente * 100) : 0;
  const col = ms > 15 ? COLORS.positive : ms > 5 ? COLORS.warning : COLORS.negative;
  const bg = ms > 15 ? COLORS.positiveBg : ms > 5 ? 'rgba(192,132,32,0.10)' : COLORS.negativeBg;
  return `<div style="background:${bg};border-radius:8px;padding:10px 8px;text-align:center;">
    <div style="font-size:18px;font-weight:700;color:${col};font-variant-numeric:tabular-nums;line-height:1;">${ms.toFixed(0)}%</div>
    <div style="font-size:10px;color:var(--gray-500);margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${fc(c.culture)}</div>
  </div>`;
}

function cultureCard(c, i) {
  const colors = [COLORS.navy, COLORS.steel, COLORS.sage, COLORS.gold, COLORS.coral, COLORS.plum, COLORS.teal, COLORS.slate];
  const col = colors[i % colors.length];
  const ms = c.prix_vente > 0 ? ((c.prix_vente - c.seuil_commercialisation) / c.prix_vente * 100) : 0;
  const msCol = ms > 15 ? COLORS.positive : ms > 5 ? COLORS.warning : COLORS.negative;

  // Mini stacked bar for CdP decomposition
  const total = c.charges_ope_ha + c.mecanisation_ha + c.structure_ha + c.remuneration_mo_ha;
  const pOpe = total > 0 ? (c.charges_ope_ha / total * 100) : 25;
  const pMeca = total > 0 ? (c.mecanisation_ha / total * 100) : 25;
  const pStruct = total > 0 ? ((c.structure_ha + c.amort_bat_ha) / total * 100) : 25;

  return `<div style="border:1px solid var(--gray-100);border-radius:10px;padding:14px;transition:all 0.15s;" onmouseover="this.style.borderColor='var(--gray-300)';this.style.boxShadow='0 2px 8px rgba(0,0,0,0.05)'" onmouseout="this.style.borderColor='var(--gray-100)';this.style.boxShadow='none'">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;">
      <div style="display:flex;align-items:center;gap:8px;">
        <div style="width:10px;height:10px;border-radius:3px;background:${col};flex-shrink:0;"></div>
        <div>
          <div style="font-size:14px;font-weight:600;color:var(--gray-900);">${fc(c.culture)}</div>
          <div style="font-size:11px;color:var(--gray-400);">${c.surface} ha — ${c.rendement_t_ha} t/ha</div>
        </div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:16px;font-weight:700;color:${c.marge_tonne >= 0 ? COLORS.positive : COLORS.negative};font-variant-numeric:tabular-nums;">${c.marge_tonne >= 0 ? '+' : ''}${Math.round(c.marge_tonne)} €/t</div>
        <div style="font-size:10px;color:var(--gray-400);">marge</div>
      </div>
    </div>

    <!-- Mini bar -->
    <div style="display:flex;height:4px;border-radius:2px;overflow:hidden;margin-bottom:10px;">
      <div style="width:${pOpe}%;background:${COLORS.coral};" title="Ch.opé ${Math.round(pOpe)}%"></div>
      <div style="width:${pMeca}%;background:${COLORS.gold};" title="Méca ${Math.round(pMeca)}%"></div>
      <div style="width:${pStruct}%;background:${COLORS.steel};" title="Struct ${Math.round(pStruct)}%"></div>
      <div style="flex:1;background:${COLORS.plum};" title="Rém.MO"></div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px;font-size:11px;">
      <div>
        <div style="color:var(--gray-400);">CdP/ha</div>
        <div style="font-weight:600;color:var(--gray-800);font-variant-numeric:tabular-nums;">${fmtEur(c.cdp_ha)}</div>
      </div>
      <div>
        <div style="color:var(--gray-400);">CdP/t</div>
        <div style="font-weight:700;color:#021130;font-variant-numeric:tabular-nums;">${Math.round(c.cdp_tonne)} €</div>
      </div>
      <div>
        <div style="color:var(--gray-400);">Sécu.</div>
        <div style="font-weight:600;color:${msCol};font-variant-numeric:tabular-nums;">${ms.toFixed(0)}%</div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;font-size:11px;margin-top:6px;padding-top:6px;border-top:1px solid var(--gray-100);">
      <div>
        <span style="color:var(--gray-400);">Prix vente</span>
        <span style="font-weight:600;color:var(--gray-700);margin-left:4px;">${Math.round(c.prix_vente)} €/t</span>
      </div>
      <div style="text-align:right;">
        <span style="color:var(--gray-400);">MB totale</span>
        <span style="font-weight:600;color:${c.marge_brute_totale >= 0 ? 'var(--gray-700)' : COLORS.negative};margin-left:4px;">${fmtK(c.marge_brute_totale)}</span>
      </div>
    </div>
  </div>`;
}

function fc(k) {
  return { ble_tendre:'Blé tendre', ble_dur:'Blé dur', orge_hiver:'Orge hiver', orge_printemps:'Orge print.', colza:'Colza', mais_grain:'Maïs', mais_grain_irrigue:'Maïs irr.', tournesol:'Tournesol', pois:'Pois', feverole:'Féverole', betterave_sucriere:'Betterave', pomme_terre:'Pdt', lin_fibre:'Lin', soja:'Soja', soja_irrigue:'Soja irr.', sorgho:'Sorgho', triticale:'Triticale', lentille_puy:'Lentille', haricots_verts:'Haricots v.', petits_pois:'Petits pois', prairie_foin:'Prairie' }[k] || k;
}
