// js/views/simulateur.js — Vue simulateur de scénarios (VUE CENTRALE DU JEU)
import { chargerExploitation, chargerReferentiel, chargerITK, chargerScenarios, getEtat, sauvegarderEtat } from '../app.js';
import { simulerScenario, calculerSituationComplete } from '../engine/simulation.js?v=7';
import { renderStepper, renderStepObjective, renderStepNavigation } from '../components/stepper.js';
import { setProgression, getScenariosCustom, sauvegarderScenarioCustom, supprimerScenarioCustom } from '../state.js';
import { initCustomSelects } from '../components/custom-select.js';
import { COLORS, fmtEur, fmtK, applyFinancialDefaults, euroScale, categoryScale, legendTop, zeroLineGrid } from '../chart-config.js';

let charts = [];
let resultats = null;

export async function render(container) {
  charts.forEach(c => c.destroy());
  charts = [];
  applyFinancialDefaults();

  const state = getEtat();
  setProgression(state.exploitationId, 5);
  const expl = await chargerExploitation(state.exploitationId);
  const ref = await chargerReferentiel();
  const itk = await chargerITK();
  const scenarios = await chargerScenarios();
  const annee = state.annee;

  container.innerHTML = `
    ${renderStepper(5)}
    ${renderStepObjective(5)}
    <h2 style="font-size: 1.3rem; font-weight: 800; color: var(--accent); margin-bottom: 16px;">
      Simulateur de scénarios - ${expl.nom}
    </h2>

    <div class="card">
      <div class="card-header">Sélection du scénario</div>
      <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
        <select id="scenario-select" style="flex: 1; min-width: 240px;" data-custom>
          <option value="">-- Choisir un scénario --</option>
          ${scenarios.map(s => `<option value="${s.id}" ${state.scenarioActif === s.id ? 'selected' : ''}>${s.nom}</option>`).join('')}
          ${renderCustomScenarioOptions(state)}
        </select>
        <button class="btn btn-outline" id="btn-mode-libre">Mode libre</button>
        <button class="btn btn-outline" id="btn-sauvegarder-scenario" title="Sauvegarder les paramètres actuels comme scénario personnalisé">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: -2px; margin-right: 4px;"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
          Sauvegarder
        </button>
        <button class="btn btn-primary btn-lg" id="btn-lancer">LANCER LA SIMULATION</button>
      </div>
      <div id="scenario-desc" style="margin-top: 8px; font-size: 0.85rem; color: var(--text-light);"></div>
      <div id="custom-scenario-form" style="display: none; margin-top: 12px; padding: 12px; background: var(--gray-50); border-radius: 8px; border: 1px solid var(--gray-200);">
        <div style="font-size: 0.82rem; font-weight: 600; color: var(--gray-700); margin-bottom: 8px;">Sauvegarder ce scenario</div>
        <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: end;">
          <div style="flex: 1; min-width: 160px;">
            <label style="font-size: 0.75rem; color: var(--gray-500); display: block; margin-bottom: 2px;">Nom du scénario</label>
            <input type="text" id="custom-scenario-nom" placeholder="Ex: Crise engrais + sécheresse" style="width: 100%; padding: 6px 10px; border: 1px solid var(--gray-200); border-radius: 6px; font-size: 0.82rem;" />
          </div>
          <div style="flex: 1; min-width: 160px;">
            <label style="font-size: 0.75rem; color: var(--gray-500); display: block; margin-bottom: 2px;">Description courte</label>
            <input type="text" id="custom-scenario-desc" placeholder="Description..." style="width: 100%; padding: 6px 10px; border: 1px solid var(--gray-200); border-radius: 6px; font-size: 0.82rem;" />
          </div>
          <button class="btn btn-primary" id="btn-confirm-save" style="padding: 6px 14px; font-size: 0.82rem;">Enregistrer</button>
          <button class="btn btn-outline" id="btn-cancel-save" style="padding: 6px 10px; font-size: 0.82rem;">Annuler</button>
        </div>
      </div>
      <div id="custom-scenario-delete-info" style="display: none; margin-top: 8px; font-size: 0.8rem; color: var(--gray-500);">
        <span id="custom-scenario-delete-text"></span>
        <button id="btn-delete-custom" style="background: none; border: none; color: var(--red-500); cursor: pointer; font-size: 0.8rem; font-weight: 600; margin-left: 4px; text-decoration: underline;">Supprimer ce scenario</button>
      </div>
    </div>

    <div class="card mt-4">
      <div class="card-header">Paramètres</div>
      <div class="grid-2">
        <div>
          <h4 style="font-size: 0.85rem; font-weight: 700; color: var(--accent); margin-bottom: 8px;">Prix des intrants</h4>
          ${renderSlider('Prix engrais azotés', 'slider-engrais-n', 0.5, 2.0, 1.0, 0.05)}
          ${renderSlider('Prix GNR', 'slider-gnr', 0.5, 2.0, 1.0, 0.05)}
          ${renderSlider('Prix phytos', 'slider-phytos', 0.7, 1.5, 1.0, 0.05)}
          ${renderSlider('Prix semences', 'slider-semences', 0.8, 1.3, 1.0, 0.05)}
        </div>
        <div>
          <h4 style="font-size: 0.85rem; font-weight: 700; color: var(--accent); margin-bottom: 8px;">Prix de vente et rendements</h4>
          ${renderSlider('Prix blé tendre', 'slider-prix-ble', 0.5, 1.5, 1.0, 0.05)}
          ${renderSlider('Prix colza', 'slider-prix-colza', 0.5, 1.5, 1.0, 0.05)}
          ${renderSlider('Prix maïs', 'slider-prix-mais', 0.5, 1.5, 1.0, 0.05)}
          ${renderSlider('Rendements (global)', 'slider-rendements', 0.4, 1.2, 1.0, 0.05)}
        </div>
      </div>
    </div>

    <div id="resultats-container"></div>

    ${renderStepNavigation(5, state.exploitationId)}
  `;

  // Combine predefined + custom scenarios for lookup
  const customScenarios = getScenariosCustom();
  const allScenarios = [...scenarios, ...customScenarios];

  // Init custom selects
  initCustomSelects(container);

  // Scenario selection handler — auto-fills sliders from scenario multiplicateurs
  const selectEl = document.getElementById('scenario-select');
  const deleteInfo = document.getElementById('custom-scenario-delete-info');
  const deleteText = document.getElementById('custom-scenario-delete-text');

  selectEl.addEventListener('change', () => {
    const id = selectEl.value;
    // Hide delete info by default
    deleteInfo.style.display = 'none';
    if (!id) return;
    const sc = allScenarios.find(s => s.id === id);
    if (!sc) return;
    document.getElementById('scenario-desc').textContent = sc.description;
    setSlider('slider-engrais-n', sc.multiplicateurs.prix_engrais_n || 1);
    setSlider('slider-gnr', sc.multiplicateurs.prix_gnr || 1);
    setSlider('slider-phytos', sc.multiplicateurs.prix_phytos || 1);
    setSlider('slider-semences', sc.multiplicateurs.prix_semences || 1);
    const pv = sc.multiplicateurs.prix_vente || {};
    setSlider('slider-prix-ble', pv.ble_tendre || 1);
    setSlider('slider-prix-colza', pv.colza || 1);
    setSlider('slider-prix-mais', pv.mais_grain || 1);
    setSlider('slider-rendements', sc.multiplicateurs.rendements?.defaut || 1);
    // Show delete option for custom scenarios
    if (sc.custom) {
      deleteText.textContent = `Scénario personnalisé : "${sc.nom}"`;
      deleteInfo.style.display = 'block';
    }
  });

  // Restore previously selected scenario
  if (state.scenarioActif && state.scenarioActif !== 'libre') {
    selectEl.value = state.scenarioActif;
    selectEl.dispatchEvent(new Event('change'));
  }

  // Mode libre — clears scenario selection and allows manual slider control
  document.getElementById('btn-mode-libre').addEventListener('click', () => {
    selectEl.value = '';
    deleteInfo.style.display = 'none';
    document.getElementById('scenario-desc').textContent = 'Mode libre — ajustez les sliders manuellement';
  });

  // Save custom scenario — show form
  document.getElementById('btn-sauvegarder-scenario').addEventListener('click', () => {
    const form = document.getElementById('custom-scenario-form');
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
    if (form.style.display === 'block') {
      document.getElementById('custom-scenario-nom').focus();
    }
  });

  // Cancel save
  document.getElementById('btn-cancel-save').addEventListener('click', () => {
    document.getElementById('custom-scenario-form').style.display = 'none';
  });

  // Confirm save custom scenario
  document.getElementById('btn-confirm-save').addEventListener('click', () => {
    const nom = document.getElementById('custom-scenario-nom').value.trim();
    if (!nom) {
      document.getElementById('custom-scenario-nom').style.borderColor = 'var(--red-500)';
      document.getElementById('custom-scenario-nom').focus();
      return;
    }
    const desc = document.getElementById('custom-scenario-desc').value.trim() || 'Scénario personnalisé';

    const newScenario = {
      id: 'custom-' + Date.now(),
      nom: nom,
      description: desc,
      categorie: 'custom',
      custom: true,
      categorie: 'custom',
      multiplicateurs: buildMultiplicateursFromSliders()
    };

    sauvegarderScenarioCustom(newScenario);

    // Refresh dropdown with new scenario selected
    refreshCustomOptions(selectEl, scenarios);
    selectEl.value = newScenario.id;
    selectEl.dispatchEvent(new Event('change'));

    // Hide form
    document.getElementById('custom-scenario-form').style.display = 'none';
    document.getElementById('custom-scenario-nom').value = '';
    document.getElementById('custom-scenario-desc').value = '';
  });

  // Delete custom scenario
  document.getElementById('btn-delete-custom').addEventListener('click', () => {
    const id = selectEl.value;
    if (!id || !id.startsWith('custom-')) return;
    const sc = getScenariosCustom().find(s => s.id === id);
    if (!sc) return;
    if (!confirm(`Supprimer le scenario "${sc.nom}" ?`)) return;
    supprimerScenarioCustom(id);
    refreshCustomOptions(selectEl, scenarios);
    selectEl.value = '';
    deleteInfo.style.display = 'none';
    document.getElementById('scenario-desc').textContent = '';
  });

  // Main simulation trigger
  document.getElementById('btn-lancer').addEventListener('click', async () => {
    const scenarioId = selectEl.value;
    let scenario;

    if (scenarioId) {
      scenario = allScenarios.find(s => s.id === scenarioId);
    }

    // Build multiplicateurs from current slider values
    const customMult = {
      prix_engrais_n: getSliderVal('slider-engrais-n'),
      prix_engrais_pk: 1.0,
      prix_gnr: getSliderVal('slider-gnr'),
      prix_phytos: getSliderVal('slider-phytos'),
      prix_semences: getSliderVal('slider-semences'),
      prix_vente: {
        ble_tendre: getSliderVal('slider-prix-ble'),
        ble_dur: getSliderVal('slider-prix-ble'),
        orge_hiver: getSliderVal('slider-prix-ble') * 0.95,
        orge_printemps_brass: getSliderVal('slider-prix-ble'),
        colza: getSliderVal('slider-prix-colza'),
        mais_grain: getSliderVal('slider-prix-mais'),
        tournesol: getSliderVal('slider-prix-colza') * 0.92,
        pois: getSliderVal('slider-prix-ble'),
        feverole: getSliderVal('slider-prix-ble') * 0.95,
        betterave_dt16: 1.0,
        pomme_terre: 1.0,
        lin_paille_dt: 1.0,
        soja: getSliderVal('slider-prix-colza'),
        sorgho: getSliderVal('slider-prix-mais'),
        triticale: getSliderVal('slider-prix-ble') * 0.9,
        lentille_puy: 1.0,
        haricots_verts_dt: 1.0,
        petits_pois_dt: 1.0,
        prairie_foin_dt: 1.0
      },
      rendements: { defaut: getSliderVal('slider-rendements') },
      charges_structure: {}
    };

    // Build the scenario object to simulate
    const simScenario = scenario
      ? {
          ...scenario,
          multiplicateurs: {
            ...scenario.multiplicateurs,
            // Slider overrides take precedence over predefined values
            prix_engrais_n: getSliderVal('slider-engrais-n'),
            prix_gnr: getSliderVal('slider-gnr'),
            prix_phytos: getSliderVal('slider-phytos'),
            prix_semences: getSliderVal('slider-semences')
          }
        }
      : {
          id: 'libre',
          nom: 'Mode libre',
          description: 'Paramètres personnalisés',
          multiplicateurs: customMult
        };

    resultats = simulerScenario(expl, annee, ref, itk, simScenario);

    sauvegarderEtat({
      scenarioActif: scenarioId || 'libre',
      resultatsSimulation: resultats
    });

    renderResultats(resultats, expl);
  });

  // Restore cached results from previous session if available
  if (state.resultatsSimulation) {
    resultats = state.resultatsSimulation;
    renderResultats(resultats, expl);
  }
}

// ─── Render results section ───────────────────────────────────────────────────

function renderResultats(res, expl) {
  const rc = document.getElementById('resultats-container');
  if (!rc) return;

  const d = res.delta;
  const v = d.verdict;

  rc.innerHTML = `
    <div class="verdict-box ${getVerdictClass(v.couleur)} mt-4">
      <div class="verdict-icon">${v.icone === 'alert' ? '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>' : v.icone === 'warning' ? '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>' : '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>'}</div>
      <div class="verdict-text" style="color: ${v.couleur || 'inherit'};">${v.texte || ''}</div>
    </div>

    <div class="kpi-grid mt-4">
      ${renderDeltaKPI('EBE', d.ebe)}
      ${renderDeltaKPI('RCAI', d.rcai)}
      ${renderDeltaKPI('Trésorerie min', d.tresorerieMin)}
      ${renderDeltaKPI('Résilience', d.resilience, true)}
    </div>

    <div class="grid-2 mt-4">
      <div class="card">
        <div class="card-header">Trésorerie mensuelle (avant vs après)</div>
        <div class="chart-container">
          <canvas id="chart-treso-sim"></canvas>
        </div>
      </div>
      <div class="card">
        <div class="card-header">Variation CdP par culture</div>
        <div class="table-container" style="max-height: 350px; overflow-y: auto;">
          <table>
            <thead>
              <tr>
                <th>Culture</th>
                <th class="text-right">CdP/t avant</th>
                <th class="text-right">CdP/t après</th>
                <th class="text-right">Variation</th>
              </tr>
            </thead>
            <tbody>
              ${(d.cdpParCulture || []).map(c => `
                <tr>
                  <td>${formatCultureName(c.culture)}</td>
                  <td class="text-right">${fmt(c.cdp_tonne_avant)}</td>
                  <td class="text-right">${fmt(c.cdp_tonne_apres)}</td>
                  <td class="text-right font-bold ${c.variation_euros > 0 ? 'text-danger' : 'text-success'}">
                    ${c.variation_euros > 0 ? '+' : ''}${fmt(c.variation_euros)}
                    (${c.variation_pct > 0 ? '+' : ''}${c.variation_pct}%)
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="card mt-4">
      <div class="card-header">Tableau comparatif AVANT / APRÈS scénario</div>
      <div class="table-container">
        <table class="comparison-table">
          <thead>
            <tr>
              <th>Indicateur</th>
              <th class="text-right">AVANT</th>
              <th class="text-right">APRÈS</th>
              <th class="text-right">Variation</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Produit brut</td>
              <td class="text-right avant">${fmtM(res.avant.sig.produitBrut)}</td>
              <td class="text-right apres">${fmtM(res.apres.sig.produitBrut)}</td>
              <td class="text-right">${fmtDelta(res.apres.sig.produitBrut - res.avant.sig.produitBrut)}</td>
            </tr>
            <tr>
              <td>Charges opérationnelles</td>
              <td class="text-right avant">${fmtM(res.avant.sig.chargesOpe)}</td>
              <td class="text-right apres">${fmtM(res.apres.sig.chargesOpe)}</td>
              <td class="text-right">${fmtDelta(res.apres.sig.chargesOpe - res.avant.sig.chargesOpe)}</td>
            </tr>
            <tr>
              <td class="font-bold">Marge brute</td>
              <td class="text-right avant font-bold">${fmtM(res.avant.sig.margeBrute)}</td>
              <td class="text-right apres font-bold">${fmtM(res.apres.sig.margeBrute)}</td>
              <td class="text-right">${fmtDelta(res.apres.sig.margeBrute - res.avant.sig.margeBrute)}</td>
            </tr>
            <tr>
              <td class="font-bold">EBE</td>
              <td class="text-right avant font-bold">${fmtM(res.avant.sig.ebe)}</td>
              <td class="text-right apres font-bold">${fmtM(res.apres.sig.ebe)}</td>
              <td class="text-right">${fmtDelta(d.ebe.delta)}</td>
            </tr>
            <tr>
              <td class="font-bold">RCAI</td>
              <td class="text-right avant font-bold">${fmtM(res.avant.sig.rcai)}</td>
              <td class="text-right apres font-bold">${fmtM(res.apres.sig.rcai)}</td>
              <td class="text-right">${fmtDelta(d.rcai.delta)}</td>
            </tr>
            <tr>
              <td>BFR max (besoin trésorerie)</td>
              <td class="text-right avant">${fmtM(res.avant.indicTreso?.bfr || 0)}</td>
              <td class="text-right apres">${fmtM(res.apres.indicTreso?.bfr || 0)}</td>
              <td class="text-right">${fmtDelta((res.apres.indicTreso?.bfr || 0) - (res.avant.indicTreso?.bfr || 0))}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  renderTresoChart(res.avant.planTreso, res.apres.planTreso);
}

// ─── Chart.js trésorerie mensuelle ───────────────────────────────────────────

/**
 * Renders a line chart comparing monthly cumulative treasury before and after
 * the simulated scenario. Negative values are visually highlighted.
 */
function renderTresoChart(planAvant, planApres) {
  const ctx = document.getElementById('chart-treso-sim');
  if (!ctx) return;

  // Destroy any existing charts before creating a new one
  charts.forEach(c => c.destroy());
  charts = [];

  const labels = (planAvant || []).map(m => m.label);
  const dataAvant = (planAvant || []).map(m => m.tresorerie_cumulee);
  const dataApres = (planApres || []).map(m => m.tresorerie_cumulee);

  const chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Avant scénario',
          data: dataAvant,
          borderColor: COLORS.steel,
          backgroundColor: COLORS.steelBg,
          fill: true,
          tension: 0.35,
          borderWidth: 2.5,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointBackgroundColor: COLORS.steel
        },
        {
          label: 'Après scénario',
          data: dataApres,
          borderColor: COLORS.negative,
          backgroundColor: COLORS.negativeBg,
          fill: true,
          tension: 0.35,
          borderWidth: 2.5,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointBackgroundColor: COLORS.negative
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      animation: { duration: 800, easing: 'easeOutQuart' },
      plugins: {
        legend: legendTop,
        tooltip: {
          callbacks: {
            label: ctx => ` ${ctx.dataset.label} : ${fmtEur(ctx.parsed.y)}`
          }
        }
      },
      scales: {
        y: euroScale({ zeroLine: true }),
        x: categoryScale()
      }
    }
  });

  charts.push(chart);
}

// ─── Slider helpers ───────────────────────────────────────────────────────────

/**
 * Builds HTML for a labelled range slider with a live percentage display.
 * The displayed value is the multiplicateur expressed as a signed percentage
 * (e.g. 1.20 → "+20%", 0.80 → "-20%").
 */
function renderSlider(label, id, min, max, value, step) {
  return `
    <div class="slider-group">
      <label style="display: flex; justify-content: space-between; font-size: 0.82rem; margin-bottom: 4px;">
        <span>${label}</span>
        <span class="slider-value" id="${id}-val">${formatPct(value)}</span>
      </label>
      <input type="range" id="${id}"
             min="${min}" max="${max}" value="${value}" step="${step}"
             style="width: 100%;"
             oninput="document.getElementById('${id}-val').textContent =
               ((parseFloat(this.value) * 100 - 100) >= 0 ? '+' : '') +
               (parseFloat(this.value) * 100 - 100).toFixed(0) + '%'" />
    </div>
  `;
}

/** Programmatically set a slider to a given multiplicateur value */
function setSlider(id, val) {
  const el = document.getElementById(id);
  if (!el) return;
  el.value = val;
  const valEl = document.getElementById(id + '-val');
  if (valEl) valEl.textContent = formatPct(val);
}

/** Read the current numeric value of a slider (defaults to 1.0 if missing) */
function getSliderVal(id) {
  const el = document.getElementById(id);
  return el ? parseFloat(el.value) : 1.0;
}

// ─── Formatting helpers ───────────────────────────────────────────────────────

/** Multiplicateur → signed percentage string (e.g. 1.2 → "+20%") */
function formatPct(v) {
  const pct = v * 100 - 100;
  return (pct >= 0 ? '+' : '') + pct.toFixed(0) + '%';
}

/** Map a verdict colour code to a CSS class for the verdict banner */
function getVerdictClass(couleur) {
  if (couleur === '#22C55E') return 'survit';
  if (couleur === '#F59E0B') return 'critique';
  return 'cessation';
}

/**
 * KPI card with AVANT / APRES value and a coloured variation indicator.
 * @param {boolean} isScore - if true, display as a score (no currency symbol)
 */
function renderDeltaKPI(label, delta, isScore = false) {
  const valApres = isScore ? delta.apres : fmtM(delta.apres);
  const change = isScore
    ? (delta.delta > 0 ? '+' : '') + delta.delta + ' pts'
    : fmtDelta(delta.delta);
  const isPositive = delta.delta >= 0;

  return `
    <div class="kpi-card ${isPositive ? 'ok' : 'critique'}">
      <div class="kpi-card-accent"></div>
      <div class="kpi-card-body">
        <div class="kpi-card-top"><div class="kpi-label">${label}</div></div>
        <div class="kpi-value">${valApres}</div>
        <div class="kpi-sub"><span class="kpi-variation ${isPositive ? 'positive' : 'negative'}">${isPositive ? '&#9650;' : '&#9660;'} ${change}</span></div>
      </div>
    </div>
  `;
}

/** Format an amount in euros (rounded, no decimals) */
function fmt(n) {
  return n != null ? Math.round(n).toLocaleString('fr-FR') + ' €' : '-';
}

/** Format an amount using the Intl currency formatter */
function fmtM(n) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0
  }).format(n || 0);
}

/**
 * Format a signed delta amount with colour.
 * Positive deltas on charges are bad (red), positive on revenue are good (green).
 * Convention here: positive = good (green), negative = bad (red).
 */
function fmtDelta(n) {
  const formatted = (n >= 0 ? '+' : '') +
    new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0
    }).format(n || 0);
  return `<span class="${n >= 0 ? 'text-success' : 'text-danger'}">${formatted}</span>`;
}

/** Translate internal culture keys to human-readable French labels */
function formatCultureName(key) {
  const names = {
    ble_tendre: 'Blé tendre',
    ble_dur: 'Blé dur',
    orge_hiver: 'Orge hiver',
    orge_printemps: 'Orge print.',
    orge_printemps_brass: 'Orge brass.',
    colza: 'Colza',
    mais_grain: 'Maïs grain',
    mais_grain_irrigue: 'Maïs irrigué',
    tournesol: 'Tournesol',
    pois: 'Pois',
    feverole: 'Féverole',
    betterave_sucriere: 'Betterave',
    pomme_terre: 'Pomme de terre',
    lin_fibre: 'Lin fibre',
    soja: 'Soja',
    soja_irrigue: 'Soja irrigué',
    sorgho: 'Sorgho',
    triticale: 'Triticale',
    lentille_puy: 'Lentille Puy',
    haricots_verts: 'Haricots verts',
    petits_pois: 'Petits pois',
    prairie_foin: 'Prairie foin'
  };
  return names[key] || key;
}

// ─── Custom scenario helpers ─────────────────────────────────────────────────

/** Render <option> elements for custom scenarios with separator */
function renderCustomScenarioOptions(state) {
  const custom = getScenariosCustom();
  if (custom.length === 0) return '';
  let html = '<option disabled>--- Mes scénarios ---</option>';
  html += custom.map(s =>
    `<option value="${s.id}" ${state.scenarioActif === s.id ? 'selected' : ''}>${s.nom} [Custom]</option>`
  ).join('');
  return html;
}

/** Refresh custom scenario options in the dropdown without touching predefined ones */
function refreshCustomOptions(selectEl, predefinedScenarios) {
  const state = getEtat();
  let html = '<option value="">-- Choisir un scénario --</option>';
  html += predefinedScenarios.map(s =>
    `<option value="${s.id}" ${state.scenarioActif === s.id ? 'selected' : ''}>${s.nom}</option>`
  ).join('');
  html += renderCustomScenarioOptions(state);
  selectEl.innerHTML = html;
}

/** Build a multiplicateurs object from the current slider values */
function buildMultiplicateursFromSliders() {
  return {
    prix_engrais_n: getSliderVal('slider-engrais-n'),
    prix_engrais_pk: 1.0,
    prix_gnr: getSliderVal('slider-gnr'),
    prix_phytos: getSliderVal('slider-phytos'),
    prix_semences: getSliderVal('slider-semences'),
    prix_vente: {
      ble_tendre: getSliderVal('slider-prix-ble'),
      ble_dur: getSliderVal('slider-prix-ble'),
      orge_hiver: getSliderVal('slider-prix-ble') * 0.95,
      orge_printemps_brass: getSliderVal('slider-prix-ble'),
      colza: getSliderVal('slider-prix-colza'),
      mais_grain: getSliderVal('slider-prix-mais'),
      tournesol: getSliderVal('slider-prix-colza') * 0.92,
      pois: getSliderVal('slider-prix-ble'),
      feverole: getSliderVal('slider-prix-ble') * 0.95,
      betterave_dt16: 1.0,
      pomme_terre: 1.0,
      lin_paille_dt: 1.0,
      soja: getSliderVal('slider-prix-colza'),
      sorgho: getSliderVal('slider-prix-mais'),
      triticale: getSliderVal('slider-prix-ble') * 0.9,
      lentille_puy: 1.0,
      haricots_verts_dt: 1.0,
      petits_pois_dt: 1.0,
      prairie_foin_dt: 1.0
    },
    rendements: { defaut: getSliderVal('slider-rendements') },
    charges_structure: {}
  };
}
