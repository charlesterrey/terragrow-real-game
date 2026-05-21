// js/views/scenarios.js — Scenario management page with library + creation wizard
import { chargerScenarios, getEtat, sauvegarderEtat } from '../app.js';
import { getScenariosCustom, sauvegarderScenarioCustom, supprimerScenarioCustom } from '../state.js';

const CATEGORIES = [
  { id: 'geopolitique', label: 'Géopolitique', color: '#DC2626', bg: '#FEF2F2' },
  { id: 'climatique', label: 'Climatique', color: '#F59E0B', bg: '#FFFBEB' },
  { id: 'marche', label: 'Marché', color: '#7C3AED', bg: '#F5F3FF' },
  { id: 'sanitaire', label: 'Sanitaire', color: '#059669', bg: '#F0FDF4' },
  { id: 'reglementaire', label: 'Réglementaire', color: '#0891B2', bg: '#ECFEFF' },
  { id: 'composite', label: 'Composite', color: '#92400E', bg: '#FFFBEB' },
  { id: 'custom', label: 'Personnalisé', color: '#6B7280', bg: '#F9FAFB' }
];

// SVG icon system — lean line icons by category
const SCENARIO_ICONS = {
  geopolitique: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>`,
  climatique: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/><circle cx="12" cy="12" r="4"/></svg>`,
  marche: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
  sanitaire: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  reglementaire: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
  composite: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
  custom: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  default: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`
};

function getScenarioIcon(scenario) {
  // For custom scenarios with a stored category, use that category's icon
  const cat = scenario.categorie || 'default';
  return SCENARIO_ICONS[cat] || SCENARIO_ICONS.default;
}

const SLIDER_CONFIGS = {
  step2: [
    { key: 'prix_engrais_n', label: 'Prix engrais azotés', min: 0.5, max: 2.5, default: 1.0, step: 0.05, unit: 'x' },
    { key: 'prix_gnr', label: 'Prix GNR', min: 0.5, max: 2.0, default: 1.0, step: 0.05, unit: 'x' },
    { key: 'prix_phytos', label: 'Prix phytosanitaires', min: 0.7, max: 1.5, default: 1.0, step: 0.05, unit: 'x' },
    { key: 'prix_semences', label: 'Prix semences', min: 0.8, max: 1.3, default: 1.0, step: 0.05, unit: 'x' }
  ],
  step3_prix: [
    { key: 'pv_ble_tendre', label: 'Prix blé tendre', min: 0.5, max: 1.5, default: 1.0, step: 0.05, unit: 'x' },
    { key: 'pv_colza', label: 'Prix colza', min: 0.5, max: 1.5, default: 1.0, step: 0.05, unit: 'x' },
    { key: 'pv_mais_grain', label: 'Prix maïs grain', min: 0.5, max: 1.5, default: 1.0, step: 0.05, unit: 'x' }
  ],
  step3_rdt: [
    { key: 'rdt_global', label: 'Rendements (global)', min: 0.4, max: 1.2, default: 1.0, step: 0.05, unit: 'x' }
  ]
};

let wizardState = null;
let currentStep = 0; // 0 = not in wizard

function resetWizard() {
  wizardState = {
    nom: '',
    description: '',
    categorie: 'custom',
    // Multipliers
    prix_engrais_n: 1.0,
    prix_gnr: 1.0,
    prix_phytos: 1.0,
    prix_semences: 1.0,
    pv_ble_tendre: 1.0,
    pv_colza: 1.0,
    pv_mais_grain: 1.0,
    rdt_global: 1.0
  };
  currentStep = 1;
}

function getCategoryInfo(catId) {
  return CATEGORIES.find(c => c.id === catId) || CATEGORIES[CATEGORIES.length - 1];
}

function sliderColor(val) {
  if (val < 0.95) return 'var(--green-500)';
  if (val > 1.05) return 'var(--red-500)';
  return 'var(--gray-400)';
}

function sliderBg(val) {
  if (val < 0.95) return 'var(--green-50)';
  if (val > 1.05) return 'var(--red-50)';
  return 'var(--gray-50)';
}

function arrowIcon(val) {
  if (val < 0.98) return `<span style="color:var(--green-500);">&#9660; ${Math.round((1 - val) * 100)}%</span>`;
  if (val > 1.02) return `<span style="color:var(--red-500);">&#9650; +${Math.round((val - 1) * 100)}%</span>`;
  return `<span style="color:var(--gray-400);">&mdash; 0%</span>`;
}

function buildScenarioFromWizard() {
  const w = wizardState;
  return {
    id: 'custom_' + Date.now(),
    nom: w.nom || 'Scénario sans nom',
    categorie: w.categorie,
    couleur: getCategoryInfo(w.categorie).color,
    description: w.description || '',
    custom: true,
    multiplicateurs: {
      prix_engrais_n: w.prix_engrais_n,
      prix_engrais_pk: 1.0,
      prix_gnr: w.prix_gnr,
      prix_phytos: w.prix_phytos,
      prix_semences: w.prix_semences,
      prix_vente: {
        ble_tendre: w.pv_ble_tendre,
        colza: w.pv_colza,
        mais_grain: w.pv_mais_grain,
        defaut: 1.0
      },
      rendements: {
        defaut: w.rdt_global
      },
      charges_structure: {}
    }
  };
}

export async function render(container) {
  const predefined = await chargerScenarios();
  const state = getEtat();
  const activeId = state.scenarioActif;

  currentStep = 0;
  resetWizard();
  currentStep = 0;

  container.innerHTML = buildPage(predefined, activeId);
  bindEvents(container, predefined);
}

function buildPage(predefined, activeId) {
  const custom = getScenariosCustom();
  const allScenarios = [
    ...predefined.map(s => ({ ...s, custom: false })),
    ...custom.map(s => ({ ...s, custom: true }))
  ];

  return `
    <style>
      .sc-page { max-width: 1100px; }
      .sc-section-title { font-size: 18px; font-weight: 800; color: var(--gray-900); margin-bottom: 4px; }
      .sc-section-sub { font-size: 13px; color: var(--gray-500); margin-bottom: 20px; }
      .sc-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; margin-bottom: 32px; }
      .sc-card {
        background: white; border: 2px solid var(--gray-100); border-radius: 12px; padding: 20px;
        cursor: pointer; transition: all 0.15s; position: relative;
      }
      .sc-card:hover { border-color: var(--gray-300); box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
      .sc-card.active { border-color: var(--accent-400); background: var(--accent-50); }
      .sc-card-header { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
      .sc-card-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
      .sc-card-title { font-size: 15px; font-weight: 700; color: var(--gray-900); }
      .sc-card-desc { font-size: 12px; color: var(--gray-500); line-height: 1.4; margin-bottom: 12px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
      .sc-card-footer { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
      .sc-badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 600; }
      .sc-badge-predef { background: var(--blue-50); color: var(--blue-700); }
      .sc-badge-custom { background: var(--amber-50); color: var(--amber-700); }
      .sc-multipliers { display: flex; gap: 6px; flex-wrap: wrap; }
      .sc-mult-chip { padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600; font-variant-numeric: tabular-nums; }
      .sc-delete-btn {
        position: absolute; top: 10px; right: 10px; width: 28px; height: 28px; border-radius: 6px;
        border: 1px solid var(--gray-200); background: white; color: var(--gray-400); cursor: pointer;
        display: flex; align-items: center; justify-content: center; font-size: 14px; transition: all 0.1s;
      }
      .sc-delete-btn:hover { background: var(--red-50); border-color: var(--red-400); color: var(--red-500); }
      .sc-create-card {
        background: var(--gray-50); border: 2px dashed var(--gray-200); border-radius: 12px; padding: 20px;
        cursor: pointer; transition: all 0.15s; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 160px; gap: 8px;
      }
      .sc-create-card:hover { border-color: var(--accent-300); background: var(--accent-50); }
      .sc-create-icon { width: 48px; height: 48px; border-radius: 12px; background: var(--accent-100); display: flex; align-items: center; justify-content: center; }
      .sc-create-text { font-size: 14px; font-weight: 600; color: var(--gray-600); }

      /* Wizard */
      .wiz-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); backdrop-filter: blur(4px); z-index: 1000; display: flex; align-items: center; justify-content: center; }
      .wiz-modal { background: white; border-radius: 16px; width: 560px; max-width: 95vw; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
      .wiz-header { padding: 24px 24px 0; display: flex; justify-content: space-between; align-items: center; }
      .wiz-header h2 { font-size: 18px; font-weight: 800; color: var(--gray-900); }
      .wiz-close { width: 32px; height: 32px; border-radius: 8px; border: none; background: var(--gray-100); color: var(--gray-500); cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center; }
      .wiz-close:hover { background: var(--gray-200); }
      .wiz-steps { display: flex; gap: 4px; padding: 16px 24px; }
      .wiz-step-dot { height: 4px; flex: 1; border-radius: 2px; background: var(--gray-200); transition: background 0.2s; }
      .wiz-step-dot.done { background: var(--accent-400); }
      .wiz-step-dot.active { background: var(--accent); }
      .wiz-body { padding: 0 24px 24px; }
      .wiz-step-label { font-size: 12px; font-weight: 600; color: var(--gray-400); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px; }
      .wiz-field { margin-bottom: 16px; }
      .wiz-field label { display: block; font-size: 12px; font-weight: 600; color: var(--gray-600); margin-bottom: 6px; }
      .wiz-field input, .wiz-field textarea, .wiz-field select {
        width: 100%; padding: 10px 12px; border: 1px solid var(--gray-200); border-radius: 8px;
        font-size: 14px; font-family: inherit; outline: none; transition: border-color 0.15s; background: white; color: var(--gray-800);
      }
      .wiz-field input:focus, .wiz-field textarea:focus, .wiz-field select:focus { border-color: var(--accent-400); box-shadow: 0 0 0 3px rgba(2,17,48,0.06); }
      .wiz-field textarea { resize: vertical; min-height: 60px; }
      .wiz-icon-preview { width: 48px; height: 48px; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin: 8px 0; }
      .wiz-cat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
      .wiz-cat-btn { padding: 8px 10px; border: 2px solid var(--gray-100); border-radius: 8px; background: white; cursor: pointer; transition: all 0.1s; text-align: center; font-size: 12px; font-weight: 600; }
      .wiz-cat-btn:hover { border-color: var(--gray-300); }
      .wiz-cat-btn.selected { border-width: 2px; }

      /* Sliders */
      .wiz-slider-row { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--gray-50); }
      .wiz-slider-row:last-child { border-bottom: none; }
      .wiz-slider-label { flex: 0 0 160px; font-size: 13px; font-weight: 500; color: var(--gray-700); }
      .wiz-slider-track { flex: 1; }
      .wiz-slider-track input[type=range] { width: 100%; accent-color: var(--accent); }
      .wiz-slider-val { flex: 0 0 70px; text-align: right; font-size: 14px; font-weight: 700; font-variant-numeric: tabular-nums; padding: 4px 8px; border-radius: 6px; }

      /* Preview */
      .wiz-preview-card { background: var(--gray-50); border: 1px solid var(--gray-100); border-radius: 12px; padding: 20px; }
      .wiz-preview-params { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 16px; }
      .wiz-preview-param { display: flex; justify-content: space-between; align-items: center; padding: 6px 10px; background: white; border-radius: 6px; border: 1px solid var(--gray-100); font-size: 12px; }
      .wiz-preview-param-label { color: var(--gray-600); }

      .wiz-footer { display: flex; justify-content: space-between; padding: 16px 24px; border-top: 1px solid var(--gray-100); }
      .wiz-btn { padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; border: none; transition: all 0.1s; font-family: inherit; }
      .wiz-btn-secondary { background: var(--gray-100); color: var(--gray-600); }
      .wiz-btn-secondary:hover { background: var(--gray-200); }
      .wiz-btn-primary { background: var(--accent); color: white; }
      .wiz-btn-primary:hover { background: var(--accent-600); }
      .wiz-btn-save { background: var(--green-500); color: white; }
      .wiz-btn-save:hover { background: var(--green-700); }
    </style>

    <div class="sc-page">
      <div style="margin-bottom: 24px;">
        <h1 class="sc-section-title">Scénarios</h1>
        <p class="sc-section-sub">Gérez vos scénarios de crise : sélectionnez un scénario existant ou créez le vôtre.</p>
      </div>

      ${getEtat().scenarioActif ? buildActiveBanner(allScenarios) : ''}

      <div style="margin-bottom: 32px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h2 style="font-size: 15px; font-weight: 700; color: var(--gray-800);">Scénarios prédéfinis</h2>
          <span style="font-size: 12px; color: var(--gray-400);">${predefined.length} scénarios</span>
        </div>
        <div class="sc-grid" id="sc-predefined-grid">
          ${predefined.map(s => renderCard(s, false, activeId)).join('')}
        </div>
      </div>

      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h2 style="font-size: 15px; font-weight: 700; color: var(--gray-800);">Mes scénarios personnalisés</h2>
          <span style="font-size: 12px; color: var(--gray-400);">${custom.length} scénario(s)</span>
        </div>
        <div class="sc-grid" id="sc-custom-grid">
          ${custom.map(s => renderCard(s, true, activeId)).join('')}
          <div class="sc-create-card" id="sc-create-btn">
            <div class="sc-create-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent-400)" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </div>
            <div class="sc-create-text">Créer un scénario</div>
            <div style="font-size: 12px; color: var(--gray-400);">Personnalisez vos propres paramètres</div>
          </div>
        </div>
      </div>
    </div>

    <div id="wizard-container"></div>
  `;
}

function buildActiveBanner(allScenarios) {
  const state = getEtat();
  const sc = allScenarios.find(s => s.id === state.scenarioActif);
  if (!sc) return '';
  const cat = getCategoryInfo(sc.categorie);
  return `
    <div style="display:flex;align-items:center;gap:12px;padding:14px 18px;background:${cat.bg};border:1px solid ${cat.color}22;border-radius:10px;margin-bottom:24px;">
      <span style="color:${cat.color};">${getScenarioIcon(sc)}</span>
      <div style="flex:1;">
        <div style="font-size:13px;font-weight:700;color:${cat.color};">Scénario actif</div>
        <div style="font-size:14px;font-weight:600;color:var(--gray-900);">${sc.nom}</div>
      </div>
      <button id="sc-deactivate-btn" style="padding:6px 14px;border:1px solid ${cat.color}33;border-radius:6px;background:white;color:${cat.color};font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;">Désactiver</button>
    </div>
  `;
}

function renderCard(s, isCustom, activeId) {
  const cat = getCategoryInfo(s.categorie);
  const isActive = s.id === activeId;
  const m = s.multiplicateurs || {};

  // Build key multiplier chips
  const chips = [];
  if (m.prix_engrais_n && m.prix_engrais_n !== 1) chips.push({ label: 'Engrais', val: m.prix_engrais_n });
  if (m.prix_gnr && m.prix_gnr !== 1) chips.push({ label: 'GNR', val: m.prix_gnr });
  if (m.prix_phytos && m.prix_phytos !== 1) chips.push({ label: 'Phytos', val: m.prix_phytos });
  const pvBle = m.prix_vente?.ble_tendre;
  if (pvBle && pvBle !== 1) chips.push({ label: 'Ble', val: pvBle });
  const rdtDef = m.rendements?.defaut ?? m.rendements?.ble_tendre;
  if (rdtDef && rdtDef !== 1) chips.push({ label: 'Rdt', val: rdtDef });

  return `
    <div class="sc-card ${isActive ? 'active' : ''}" data-scenario-id="${s.id}" data-custom="${isCustom}">
      ${isCustom ? `<button class="sc-delete-btn" data-delete-id="${s.id}" title="Supprimer">&times;</button>` : ''}
      <div class="sc-card-header">
        <div class="sc-card-icon" style="background:${cat.bg};">
          <span style="color:${cat.color};">${getScenarioIcon(s)}</span>
        </div>
        <div>
          <div class="sc-card-title">${s.nom}</div>
          <div style="display:flex;gap:4px;margin-top:4px;">
            <span class="sc-badge" style="background:${cat.bg};color:${cat.color};">${cat.label}</span>
            ${isCustom
              ? '<span class="sc-badge sc-badge-custom">Personnalisé</span>'
              : '<span class="sc-badge sc-badge-predef">Prédéfini</span>'
            }
          </div>
        </div>
      </div>
      <div class="sc-card-desc">${s.description || 'Aucune description.'}</div>
      <div class="sc-multipliers">
        ${chips.slice(0, 4).map(c => {
          const up = c.val > 1;
          const color = up ? 'var(--red-500)' : 'var(--green-500)';
          const bg = up ? 'var(--red-50)' : 'var(--green-50)';
          const sign = up ? '+' : '';
          return `<span class="sc-mult-chip" style="background:${bg};color:${color};">${c.label} ${sign}${Math.round((c.val - 1) * 100)}%</span>`;
        }).join('')}
      </div>
    </div>
  `;
}

function bindEvents(container, predefined) {
  // Card clicks (activate scenario)
  container.querySelectorAll('.sc-card').forEach(card => {
    card.addEventListener('click', (e) => {
      // Ignore if clicking delete button
      if (e.target.closest('.sc-delete-btn')) return;

      const id = card.dataset.scenarioId;
      const isCustom = card.dataset.custom === 'true';
      const state = getEtat();

      // Toggle: if already active, deactivate
      if (state.scenarioActif === id) {
        sauvegarderEtat({ scenarioActif: null, resultatsSimulation: null });
      } else {
        sauvegarderEtat({ scenarioActif: id, resultatsSimulation: null });
      }

      // Re-render
      render(container);
    });
  });

  // Delete buttons
  container.querySelectorAll('.sc-delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.deleteId;
      if (confirm('Supprimer ce scénario personnalisé ?')) {
        supprimerScenarioCustom(id);
        render(container);
      }
    });
  });

  // Create button
  const createBtn = document.getElementById('sc-create-btn');
  if (createBtn) {
    createBtn.addEventListener('click', () => {
      resetWizard();
      renderWizard(container, predefined);
    });
  }

  // Deactivate button
  const deactivateBtn = document.getElementById('sc-deactivate-btn');
  if (deactivateBtn) {
    deactivateBtn.addEventListener('click', () => {
      sauvegarderEtat({ scenarioActif: null, resultatsSimulation: null });
      render(container);
    });
  }
}

// ========== WIZARD ==========

function renderWizard(pageContainer, predefined) {
  const wizContainer = document.getElementById('wizard-container');

  wizContainer.innerHTML = `
    <div class="wiz-overlay" id="wiz-overlay">
      <div class="wiz-modal">
        <div class="wiz-header">
          <h2>Créer un scénario</h2>
          <button class="wiz-close" id="wiz-close-btn">&times;</button>
        </div>
        <div class="wiz-steps">
          ${[1,2,3,4].map(i => `<div class="wiz-step-dot ${i < currentStep ? 'done' : ''} ${i === currentStep ? 'active' : ''}"></div>`).join('')}
        </div>
        <div class="wiz-body" id="wiz-body">
          ${renderWizardStep()}
        </div>
        <div class="wiz-footer">
          <div>
            ${currentStep > 1 ? '<button class="wiz-btn wiz-btn-secondary" id="wiz-prev">Précédent</button>' : '<span></span>'}
          </div>
          <div>
            ${currentStep < 4
              ? '<button class="wiz-btn wiz-btn-primary" id="wiz-next">Suivant</button>'
              : '<button class="wiz-btn wiz-btn-save" id="wiz-save">Sauvegarder le scenario</button>'
            }
          </div>
        </div>
      </div>
    </div>
  `;

  // Bind wizard events
  document.getElementById('wiz-close-btn')?.addEventListener('click', () => {
    wizContainer.innerHTML = '';
    currentStep = 0;
  });

  document.getElementById('wiz-overlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'wiz-overlay') {
      wizContainer.innerHTML = '';
      currentStep = 0;
    }
  });

  document.getElementById('wiz-prev')?.addEventListener('click', () => {
    collectWizardData();
    currentStep--;
    renderWizard(pageContainer, predefined);
  });

  document.getElementById('wiz-next')?.addEventListener('click', () => {
    if (!validateWizardStep()) return;
    collectWizardData();
    currentStep++;
    renderWizard(pageContainer, predefined);
  });

  document.getElementById('wiz-save')?.addEventListener('click', () => {
    collectWizardData();
    const scenario = buildScenarioFromWizard();
    sauvegarderScenarioCustom(scenario);
    wizContainer.innerHTML = '';
    currentStep = 0;
    render(pageContainer);
  });

  // Bind step-specific events
  bindWizardStepEvents(pageContainer, predefined);
}

function renderWizardStep() {
  switch (currentStep) {
    case 1: return renderStep1();
    case 2: return renderStep2();
    case 3: return renderStep3();
    case 4: return renderStep4();
    default: return '';
  }
}

function renderStep1() {
  const w = wizardState;
  return `
    <div class="wiz-step-label">Étape 1/4 &mdash; Identité du scénario</div>
    <div class="wiz-field">
      <label>Nom du scénario *</label>
      <input type="text" id="wiz-nom" value="${escHtml(w.nom)}" placeholder="Ex: Crise énergétique 2025" maxlength="60" />
    </div>
    <div class="wiz-field">
      <label>Description</label>
      <textarea id="wiz-desc" placeholder="Décrivez le contexte et les hypothèses..." maxlength="200">${escHtml(w.description)}</textarea>
    </div>
    <div class="wiz-field">
      <label>Catégorie</label>
      <p style="font-size:11px;color:var(--gray-400);margin-bottom:8px;">L'icône s'adapte automatiquement à la catégorie choisie.</p>
      <div class="wiz-cat-grid">
        ${CATEGORIES.map(c => `
          <button class="wiz-cat-btn ${w.categorie === c.id ? 'selected' : ''}" data-cat="${c.id}" style="${w.categorie === c.id ? `border-color:${c.color};background:${c.bg};color:${c.color};` : ''}">
            ${c.label}
          </button>
        `).join('')}
      </div>
    </div>
    <div id="wiz-step1-error" style="font-size:12px;color:var(--red-500);display:none;margin-top:8px;"></div>
  `;
}

function renderStep2() {
  return `
    <div class="wiz-step-label">Étape 2/4 &mdash; Prix des intrants</div>
    <p style="font-size:12px;color:var(--gray-500);margin-bottom:16px;">Ajustez les multiplicateurs de prix. 1.0 = pas de changement.</p>
    ${SLIDER_CONFIGS.step2.map(s => renderSlider(s)).join('')}
  `;
}

function renderStep3() {
  return `
    <div class="wiz-step-label">Étape 3/4 &mdash; Prix de vente & Rendements</div>
    <p style="font-size:12px;color:var(--gray-500);margin-bottom:12px;">Prix de vente des principales cultures :</p>
    ${SLIDER_CONFIGS.step3_prix.map(s => renderSlider(s)).join('')}
    <div style="height:16px;"></div>
    <p style="font-size:12px;color:var(--gray-500);margin-bottom:12px;">Rendements :</p>
    ${SLIDER_CONFIGS.step3_rdt.map(s => renderSlider(s)).join('')}
  `;
}

function renderSlider(cfg) {
  const val = wizardState[cfg.key] ?? cfg.default;
  const pct = Math.round((val - cfg.min) / (cfg.max - cfg.min) * 100);
  return `
    <div class="wiz-slider-row">
      <div class="wiz-slider-label">${cfg.label}</div>
      <div class="wiz-slider-track">
        <input type="range" class="wiz-range" data-key="${cfg.key}"
          min="${cfg.min}" max="${cfg.max}" step="${cfg.step}" value="${val}" />
      </div>
      <div class="wiz-slider-val" id="val-${cfg.key}" style="background:${sliderBg(val)};color:${sliderColor(val)};">
        ${val.toFixed(2)}${cfg.unit}
      </div>
    </div>
  `;
}

function renderStep4() {
  const w = wizardState;
  const cat = getCategoryInfo(w.categorie);
  const allParams = [
    ...SLIDER_CONFIGS.step2,
    ...SLIDER_CONFIGS.step3_prix,
    ...SLIDER_CONFIGS.step3_rdt
  ];

  return `
    <div class="wiz-step-label">Étape 4/4 &mdash; Aperçu & Sauvegarde</div>
    <div class="wiz-preview-card">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
        <div style="width:44px;height:44px;border-radius:10px;background:${cat.bg};display:flex;align-items:center;justify-content:center;color:${cat.color};">${SCENARIO_ICONS[w.categorie] || SCENARIO_ICONS.default}</div>
        <div>
          <div style="font-size:16px;font-weight:700;color:var(--gray-900);">${escHtml(w.nom) || 'Scénario sans nom'}</div>
          <span class="sc-badge" style="background:${cat.bg};color:${cat.color};">${cat.label}</span>
        </div>
      </div>
      ${w.description ? `<p style="font-size:13px;color:var(--gray-600);margin-bottom:12px;">${escHtml(w.description)}</p>` : ''}
      <div class="wiz-preview-params">
        ${allParams.map(p => {
          const val = w[p.key] ?? p.default;
          return `
            <div class="wiz-preview-param">
              <span class="wiz-preview-param-label">${p.label}</span>
              ${arrowIcon(val)}
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function validateWizardStep() {
  if (currentStep === 1) {
    collectWizardData();
    if (!wizardState.nom.trim()) {
      const errEl = document.getElementById('wiz-step1-error');
      if (errEl) { errEl.textContent = 'Veuillez saisir un nom pour le scénario.'; errEl.style.display = 'block'; }
      return false;
    }
  }
  return true;
}

function collectWizardData() {
  // Step 1
  const nomEl = document.getElementById('wiz-nom');
  if (nomEl) wizardState.nom = nomEl.value;
  const descEl = document.getElementById('wiz-desc');
  if (descEl) wizardState.description = descEl.value;

  // Sliders (step 2 & 3)
  document.querySelectorAll('.wiz-range').forEach(input => {
    wizardState[input.dataset.key] = parseFloat(input.value);
  });
}

function bindWizardStepEvents(pageContainer, predefined) {
  // Category buttons
  document.querySelectorAll('.wiz-cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const catId = btn.dataset.cat;
      wizardState.categorie = catId;
      const cat = getCategoryInfo(catId);
      document.querySelectorAll('.wiz-cat-btn').forEach(b => {
        b.classList.remove('selected');
        b.style.borderColor = '';
        b.style.background = '';
        b.style.color = '';
      });
      btn.classList.add('selected');
      btn.style.borderColor = cat.color;
      btn.style.background = cat.bg;
      btn.style.color = cat.color;
    });
  });

  // Slider live feedback
  document.querySelectorAll('.wiz-range').forEach(input => {
    input.addEventListener('input', () => {
      const val = parseFloat(input.value);
      const valEl = document.getElementById(`val-${input.dataset.key}`);
      if (valEl) {
        valEl.textContent = val.toFixed(2) + 'x';
        valEl.style.background = sliderBg(val);
        valEl.style.color = sliderColor(val);
      }
    });
  });
}

function escHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
