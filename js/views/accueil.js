// js/views/accueil.js — Portfolio view avec scenario impact + progression
import { chargerToutesExploitations, chargerReferentiel, chargerITK, chargerScenarios, getEtat, sauvegarderEtat } from '../app.js';
import { calculerSituationComplete, simulerScenario } from '../engine/simulation.js?v=7';
import { getProgression, getProgressionGlobale, getScenariosCustom } from '../state.js';

const STEPS = [
  { num: 1, label: 'Découverte', hash: 'decouverte' },
  { num: 2, label: 'Tableau de bord', hash: 'dashboard' },
  { num: 3, label: 'Coûts production', hash: 'couts-production' },
  { num: 4, label: 'Trésorerie', hash: 'tresorerie' },
  { num: 5, label: 'Simulateur', hash: 'simulateur' },
  { num: 6, label: 'Conseil', hash: 'conseil' }
];

function getProgressionBadge(prog) {
  if (prog.complete) {
    return `<span class="pf-badge pf-prog-done">Terminé</span>`;
  }
  if (prog.etape > 0) {
    const step = STEPS[prog.etape - 1] || STEPS[0];
    return `<span class="pf-badge pf-prog-encours">Étape ${prog.etape}/6</span>`;
  }
  return `<span class="pf-badge pf-prog-new">Non commencé</span>`;
}

function getProgressionTarget(prog) {
  if (prog.etape === 0) return 'decouverte';
  if (prog.complete) return 'dashboard';
  const step = STEPS[prog.etape - 1];
  return step ? step.hash : 'decouverte';
}

const REGION_LABELS = {
  beauce: 'Beauce', nord_picardie: 'Nord-Picardie',
  bretagne: 'Bretagne', sud_ouest: 'Sud-Ouest', rhone_alpes: 'Rhône-Alpes'
};
const REGION_COLORS = {
  beauce: { bg: '#DBEAFE', text: '#1D4ED8' },
  nord_picardie: { bg: '#DCFCE7', text: '#15803D' },
  bretagne: { bg: '#FEF3C7', text: '#B45309' },
  sud_ouest: { bg: '#FEE2E2', text: '#DC2626' },
  rhone_alpes: { bg: '#EDE9FE', text: '#7C3AED' }
};

let cachedResults = {};

export async function render(container) {
  const exploitations = await chargerToutesExploitations();
  const ref = await chargerReferentiel();
  const itk = await chargerITK();
  const scenarios = await chargerScenarios();
  const state = getEtat();
  const annee = state.annee;

  // Pre-calculate base situation for all exploitations
  const baseResults = {};
  for (const e of exploitations) {
    try {
      baseResults[e.id] = calculerSituationComplete(e, annee, ref, itk);
    } catch(err) {
      baseResults[e.id] = null;
    }
  }
  cachedResults = baseResults;

  const progGlobale = getProgressionGlobale();
  const progPct = Math.round(progGlobale.complete / progGlobale.total * 100);

  container.innerHTML = `
    <style>
      .pf-tabs { display: flex; gap: 2px; background: var(--gray-100); padding: 3px; border-radius: 8px; width: fit-content; }
      .pf-tab { padding: 5px 12px; border: none; border-radius: 6px; font-size: 12px; font-weight: 500; color: var(--gray-500); background: transparent; cursor: pointer; transition: all 0.1s; white-space: nowrap; }
      .pf-tab:hover { color: var(--gray-700); background: rgba(255,255,255,0.6); }
      .pf-tab.active { color: var(--gray-900); background: white; font-weight: 600; box-shadow: 0 1px 2px rgba(0,0,0,0.06); }
      .pf-row { cursor: pointer; transition: background 0.1s; }
      .pf-row:hover { background: var(--gray-50); }
      .pf-row td { padding: 12px 16px; border-bottom: 1px solid var(--gray-100); vertical-align: middle; font-size: 13px; }
      .pf-row:last-child td { border-bottom: none; }
      .pf-badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 500; white-space: nowrap; }
      .pf-th { padding: 10px 16px; text-align: left; font-size: 11px; font-weight: 600; color: var(--gray-400); text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid var(--gray-200); background: var(--gray-50); white-space: nowrap; }
      .pf-th-right { text-align: right; }
      .pf-num { font-variant-numeric: tabular-nums; }
      .scenario-select { min-width: 240px; }
      .scenario-banner { display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: var(--red-50); border: 1px solid rgba(239,68,68,0.12); border-radius: 8px; margin-bottom: 16px; font-size: 13px; color: var(--red-600); }
      .delta-pos { color: var(--green-500); font-weight: 600; }
      .delta-neg { color: var(--red-500); font-weight: 600; }
      .pf-prog-done { background: #DCFCE7; color: #15803D; }
      .pf-prog-encours { background: #DBEAFE; color: #1D4ED8; }
      .pf-prog-new { background: var(--gray-100); color: var(--gray-500); }
      .pf-progress-bar { height: 6px; background: var(--gray-100); border-radius: 3px; overflow: hidden; }
      .pf-progress-bar-fill { height: 100%; background: #15803D; border-radius: 3px; transition: width 0.3s ease; }
      .pf-prog-step { font-size: 11px; color: var(--gray-400); margin-top: 2px; }
    </style>

    <div style="margin-bottom: 24px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <h1 style="font-size: 20px; font-weight: 800; color: var(--gray-900);">Votre portefeuille</h1>
        <span style="font-size: 13px; color: var(--gray-500);">${progGlobale.complete}/10 exploitations traitées</span>
      </div>
      <div class="pf-progress-bar"><div class="pf-progress-bar-fill" style="width: ${progPct}%;"></div></div>
      <div style="display: flex; gap: 16px; margin-top: 6px; font-size: 12px; color: var(--gray-400);">
        <span>${progGlobale.complete} terminées</span>
        <span>${progGlobale.enCours} en cours</span>
        <span>${progGlobale.nonCommence} non commencées</span>
      </div>
    </div>

    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
      <div>
        <p style="font-size: 13px; color: var(--gray-500);">10 exploitations &middot; ${annee} (${ref.annees[annee]?.label || ''})</p>
      </div>
      <div style="display: flex; align-items: center; gap: 10px;">
        <label style="font-size: 12px; font-weight: 500; color: var(--gray-500);">Scénario :</label>
        <select class="scenario-select" id="portfolio-scenario">
          <option value="">Aucun (situation réelle)</option>
          ${scenarios.map(s => `<option value="${s.id}">${s.nom}</option>`).join('')}
          ${getScenariosCustom().length > 0 ? `<optgroup label="Mes scénarios">
            ${getScenariosCustom().map(s => `<option value="custom_${s.id}">${s.nom}</option>`).join('')}
          </optgroup>` : ''}
        </select>
      </div>
    </div>

    <div id="scenario-banner-container"></div>

    <div class="pf-tabs" id="region-filters" style="margin-bottom: 16px;">
      <button class="pf-tab active" data-filter="all" onclick="filterPf('all')">Toutes <span style="color:var(--gray-400);font-size:11px;">${exploitations.length}</span></button>
      ${Object.entries(REGION_LABELS).map(([k, v]) => {
        const count = exploitations.filter(e => e.region.replace(/-/g,'_') === k).length;
        return `<button class="pf-tab" data-filter="${k}" onclick="filterPf('${k}')">${v} <span style="color:var(--gray-400);font-size:11px;">${count}</span></button>`;
      }).join('')}
    </div>

    <div style="background: white; border: 1px solid var(--gray-100); border-radius: 12px; overflow: hidden;">
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr>
            <th class="pf-th">Exploitation</th>
            <th class="pf-th">Progression</th>
            <th class="pf-th">Region</th>
            <th class="pf-th pf-th-right">SAU</th>
            <th class="pf-th pf-th-right">EBE</th>
            <th class="pf-th pf-th-right">RCAI</th>
            <th class="pf-th pf-th-right">Ann./EBE</th>
            <th class="pf-th pf-th-right">Résilience</th>
            <th class="pf-th" id="th-delta" style="display:none;">Impact scénario</th>
          </tr>
        </thead>
        <tbody id="pf-tbody">
          ${exploitations.map(e => renderRow(e, baseResults[e.id])).join('')}
        </tbody>
      </table>
    </div>

    ${renderScenariosSection()}
  `;

  // Scenario change handler
  document.getElementById('portfolio-scenario').addEventListener('change', async (ev) => {
    const scenId = ev.target.value;
    const banner = document.getElementById('scenario-banner-container');
    const tbody = document.getElementById('pf-tbody');
    const thDelta = document.getElementById('th-delta');

    if (!scenId) {
      banner.innerHTML = '';
      thDelta.style.display = 'none';
      tbody.innerHTML = exploitations.map(e => renderRow(e, baseResults[e.id])).join('');
      return;
    }

    let scenario;
    if (scenId.startsWith('custom_')) {
      const customId = scenId.replace('custom_', '');
      const customScens = getScenariosCustom();
      const cs = customScens.find(s => s.id === customId);
      if (cs) {
        // Convert custom scenario format to engine-compatible format
        scenario = {
          id: cs.id,
          nom: cs.nom,
          description: cs.description || 'Scénario personnalisé',
          categorie: cs.categorie || 'custom',
          multiplicateurs: {
            prix_engrais_n: cs.multiplicateurs?.prix_engrais_n ?? 1,
            prix_gnr: cs.multiplicateurs?.prix_gnr ?? 1,
            prix_phytos: cs.multiplicateurs?.prix_phytos ?? 1,
            prix_semences: cs.multiplicateurs?.prix_semences ?? 1,
            prix_vente: {
              ble_tendre: cs.multiplicateurs?.pv_ble_tendre ?? 1,
              colza: cs.multiplicateurs?.pv_colza ?? 1,
              mais_grain: cs.multiplicateurs?.pv_mais_grain ?? 1
            },
            rendements: { defaut: cs.multiplicateurs?.rdt_global ?? 1 }
          }
        };
      }
    } else {
      scenario = scenarios.find(s => s.id === scenId);
    }
    if (!scenario) return;

    banner.innerHTML = `<div class="scenario-banner">
      <div><strong>${scenario.nom}</strong> &mdash; ${scenario.description}</div>
    </div>`;

    thDelta.style.display = '';

    // Simulate for all exploitations
    const rows = [];
    for (const e of exploitations) {
      try {
        const sim = simulerScenario(e, annee, ref, itk, scenario, baseResults[e.id]);
        rows.push(renderRowWithScenario(e, sim));
      } catch(err) {
        rows.push(renderRow(e, baseResults[e.id], true));
      }
    }
    tbody.innerHTML = rows.join('');
  });
}

function renderRow(e, res, showDeltaCol = false) {
  const rk = e.region.replace(/-/g, '_');
  const rc = REGION_COLORS[rk] || { bg: '#F3F4F6', text: '#4B5563' };
  const rl = REGION_LABELS[rk] || e.region;

  const ebe = res?.sig?.ebe ?? 0;
  const rcai = res?.sig?.rcai ?? 0;
  const annEbe = res?.sig?.ebe > 0 ? Math.round((e.annuites_total || 0) / res.sig.ebe * 100) : 999;
  const resil = res?.resilience?.score ?? 0;
  const resilColor = res?.resilience?.couleur || 'var(--gray-400)';

  const annEbeColor = annEbe > 80 ? 'var(--red-500)' : annEbe > 50 ? 'var(--amber-500)' : 'var(--green-500)';

  const prog = getProgression(e.id);
  const target = getProgressionTarget(prog);
  const stepLabel = prog.etape > 0 && !prog.complete ? STEPS[prog.etape - 1]?.label || '' : '';

  return `
    <tr class="pf-row" data-region="${rk}" onclick="selectExploitationWithProgression('${e.id}', '${target}')">
      <td>
        <div style="font-weight: 600; color: var(--gray-900);">${e.nom}</div>
        <div style="font-size: 12px; color: var(--gray-400); margin-top: 1px;">${e.exploitant} &middot; ${e.commune}</div>
      </td>
      <td>
        ${getProgressionBadge(prog)}
        ${stepLabel ? `<div class="pf-prog-step">${stepLabel}</div>` : ''}
      </td>
      <td><span class="pf-badge" style="background:${rc.bg};color:${rc.text};">${rl}</span></td>
      <td class="pf-num" style="text-align:right;"><strong>${e.sau_totale}</strong> <span style="color:var(--gray-400);">ha</span></td>
      <td class="pf-num" style="text-align:right; color: ${ebe >= 0 ? 'var(--gray-900)' : 'var(--red-500)'}; font-weight: 600;">${fmtK(ebe)}</td>
      <td class="pf-num" style="text-align:right; color: ${rcai >= 0 ? 'var(--gray-700)' : 'var(--red-500)'};">${fmtK(rcai)}</td>
      <td class="pf-num" style="text-align:right; color: ${annEbeColor}; font-weight: 500;">${annEbe < 999 ? annEbe + '%' : '—'}</td>
      <td class="pf-num" style="text-align:right;">
        <span style="display:inline-flex;align-items:center;gap:4px;">
          <span style="width:8px;height:8px;border-radius:50%;background:${resilColor};display:inline-block;"></span>
          <span style="font-weight:600;">${resil}</span>
        </span>
      </td>
      ${showDeltaCol ? '<td style="text-align:center; color:var(--gray-300);">—</td>' : ''}
    </tr>
  `;
}

function renderRowWithScenario(e, sim) {
  const rk = e.region.replace(/-/g, '_');
  const rc = REGION_COLORS[rk] || { bg: '#F3F4F6', text: '#4B5563' };
  const rl = REGION_LABELS[rk] || e.region;

  const ebeAv = sim.avant.sig.ebe;
  const ebeAp = sim.apres.sig.ebe;
  const rcaiAp = sim.apres.sig.rcai;
  const annEbe = sim.apres.sig.ebe > 0 ? Math.round((e.annuites_total || 0) / sim.apres.sig.ebe * 100) : 999;
  const resilAp = sim.apres.resilience.score;
  const resilColor = sim.apres.resilience.couleur;
  const annEbeColor = annEbe > 80 ? 'var(--red-500)' : annEbe > 50 ? 'var(--amber-500)' : 'var(--green-500)';

  const deltaEbe = sim.delta.ebe.delta;
  const deltaResil = sim.delta.resilience.delta;
  const verdict = sim.delta.verdict;

  const prog = getProgression(e.id);
  const target = getProgressionTarget(prog);
  const stepLabel = prog.etape > 0 && !prog.complete ? STEPS[prog.etape - 1]?.label || '' : '';

  return `
    <tr class="pf-row" data-region="${rk}" onclick="selectExploitationWithProgression('${e.id}', '${target}')" style="${rcaiAp < 0 ? 'background: rgba(239,68,68,0.03);' : ''}">
      <td>
        <div style="font-weight: 600; color: var(--gray-900);">${e.nom}</div>
        <div style="font-size: 12px; color: var(--gray-400); margin-top: 1px;">${e.exploitant}</div>
      </td>
      <td>
        ${getProgressionBadge(prog)}
        ${stepLabel ? `<div class="pf-prog-step">${stepLabel}</div>` : ''}
      </td>
      <td><span class="pf-badge" style="background:${rc.bg};color:${rc.text};">${rl}</span></td>
      <td class="pf-num" style="text-align:right;"><strong>${e.sau_totale}</strong> <span style="color:var(--gray-400);">ha</span></td>
      <td class="pf-num" style="text-align:right; color: ${ebeAp >= 0 ? 'var(--gray-900)' : 'var(--red-500)'}; font-weight: 600;">${fmtK(ebeAp)}</td>
      <td class="pf-num" style="text-align:right; color: ${rcaiAp >= 0 ? 'var(--gray-700)' : 'var(--red-500)'};">${fmtK(rcaiAp)}</td>
      <td class="pf-num" style="text-align:right; color: ${annEbeColor}; font-weight: 500;">${annEbe < 999 ? annEbe + '%' : '—'}</td>
      <td class="pf-num" style="text-align:right;">
        <span style="display:inline-flex;align-items:center;gap:4px;">
          <span style="width:8px;height:8px;border-radius:50%;background:${resilColor};display:inline-block;"></span>
          <span style="font-weight:600;">${resilAp}</span>
        </span>
      </td>
      <td style="text-align:left;">
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="width:8px;height:8px;border-radius:50%;background:${verdict.couleur};display:inline-block;flex-shrink:0;"></span>
          <div>
            <div style="font-size: 12px; font-weight: 600; color: ${verdict.couleur};">${verdict.texte}</div>
            <div style="font-size: 11px; color: var(--gray-400); margin-top: 1px;">
              EBE <span class="${deltaEbe >= 0 ? 'delta-pos' : 'delta-neg'}">${deltaEbe >= 0 ? '+' : ''}${fmtK(deltaEbe)}</span>
              &middot; Résil. <span class="${deltaResil >= 0 ? 'delta-pos' : 'delta-neg'}">${deltaResil >= 0 ? '+' : ''}${deltaResil}</span>
            </div>
          </div>
        </div>
      </td>
    </tr>
  `;
}

function fmtK(n) {
  if (n === undefined || n === null) return '—';
  if (Math.abs(n) >= 1000) return Math.round(n / 1000) + 'k';
  return Math.round(n) + '';
}

window.filterPf = function(region) {
  document.querySelectorAll('.pf-tab').forEach(t => t.classList.toggle('active', t.dataset.filter === region));
  document.querySelectorAll('.pf-row').forEach(row => {
    row.style.display = (region === 'all' || row.dataset.region === region) ? '' : 'none';
  });
};

function renderScenariosSection() {
  const custom = getScenariosCustom();
  const CATS = {
    geopolitique: { color: '#DC2626', bg: '#FEF2F2' },
    climatique: { color: '#F59E0B', bg: '#FFFBEB' },
    marche: { color: '#7C3AED', bg: '#F5F3FF' },
    sanitaire: { color: '#059669', bg: '#F0FDF4' },
    reglementaire: { color: '#0891B2', bg: '#ECFEFF' },
    composite: { color: '#92400E', bg: '#FFFBEB' },
    custom: { color: '#6B7280', bg: '#F9FAFB' }
  };

  if (custom.length === 0) {
    return `
      <div style="margin-top: 32px;">
        <h2 style="font-size: 15px; font-weight: 700; color: var(--gray-800); margin-bottom: 12px;">Mes scénarios</h2>
        <a href="#scenarios" style="display:flex;align-items:center;gap:12px;padding:16px 20px;background:var(--gray-50);border:2px dashed var(--gray-200);border-radius:12px;text-decoration:none;transition:all 0.15s;cursor:pointer;" onmouseover="this.style.borderColor='var(--accent-300)';this.style.background='var(--accent-50)'" onmouseout="this.style.borderColor='var(--gray-200)';this.style.background='var(--gray-50)'">
          <div style="width:40px;height:40px;border-radius:10px;background:var(--accent-100);display:flex;align-items:center;justify-content:center;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-400)" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          </div>
          <div>
            <div style="font-size:14px;font-weight:600;color:var(--gray-700);">Créer votre premier scénario &rarr;</div>
            <div style="font-size:12px;color:var(--gray-400);">Personnalisez vos propres paramètres de crise</div>
          </div>
        </a>
      </div>
    `;
  }

  return `
    <div style="margin-top: 32px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <h2 style="font-size: 15px; font-weight: 700; color: var(--gray-800);">Mes scénarios personnalisés</h2>
        <a href="#scenarios" style="font-size:12px;color:var(--accent-400);text-decoration:none;font-weight:600;">Voir tout &rarr;</a>
      </div>
      <div style="display:flex;gap:12px;flex-wrap:wrap;">
        ${custom.map(s => {
          const cat = CATS[s.categorie] || CATS.custom;
          return `
            <a href="#scenarios" style="display:flex;align-items:center;gap:10px;padding:12px 16px;background:white;border:1px solid var(--gray-100);border-radius:10px;text-decoration:none;cursor:pointer;transition:all 0.1s;min-width:200px;" onmouseover="this.style.borderColor='var(--gray-300)';this.style.boxShadow='0 2px 8px rgba(0,0,0,0.06)'" onmouseout="this.style.borderColor='var(--gray-100)';this.style.boxShadow='none'">
              <div style="width:32px;height:32px;border-radius:8px;background:${cat.bg};display:flex;align-items:center;justify-content:center;color:${cat.color};flex-shrink:0;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg></div>
              <div>
                <div style="font-size:13px;font-weight:600;color:var(--gray-900);">${s.nom}</div>
                <span style="display:inline-block;padding:1px 6px;border-radius:9999px;font-size:10px;font-weight:600;background:${cat.bg};color:${cat.color};">${s.categorie}</span>
              </div>
            </a>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

window.selectExploitationWithProgression = function(exploitationId, targetHash) {
  if (typeof window.selectExploitation === 'function') {
    window.selectExploitation(exploitationId, '#' + targetHash);
  }
};
