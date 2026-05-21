// js/views/conseil-dashboard.js — Vue tableau de bord du conseil (progression multi-exploitations)
import { chargerToutesExploitations, chargerReferentiel, chargerITK, getEtat } from '../app.js';
import { COLORS, applyFinancialDefaults } from '../chart-config.js';
import { calculerSituationComplete } from '../engine/simulation.js?v=8';
import { getProgression, getProgressionGlobale } from '../state.js';

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

let charts = [];

export async function render(container) {
  charts.forEach(c => c.destroy());
  charts = [];

  applyFinancialDefaults();

  const exploitations = await chargerToutesExploitations();
  const ref = await chargerReferentiel();
  const itk = await chargerITK();
  const state = getEtat();
  const annee = state.annee;

  // Calculate base results for each exploitation
  const baseResults = {};
  for (const e of exploitations) {
    try {
      baseResults[e.id] = calculerSituationComplete(e, annee, ref, itk);
    } catch (err) {
      baseResults[e.id] = null;
    }
  }

  // Determine conseil status for each exploitation
  const statuses = exploitations.map(e => {
    const prog = getProgression(e.id);
    return {
      expl: e,
      prog,
      status: getConseilStatus(e.id, prog, state),
      result: baseResults[e.id]
    };
  });

  const progGlobale = getProgressionGlobale();
  const advised = statuses.filter(s => s.status.key === 'dossier_genere').length;
  const inProgress = statuses.filter(s => s.status.key === 'leviers_selectionnes' || s.status.key === 'en_cours').length;
  const notStarted = statuses.filter(s => s.status.key === 'non_commence').length;

  container.innerHTML = `
    <style>
      .cd-header { margin-bottom: 24px; }
      .cd-header h1 { font-size: 20px; font-weight: 800; color: var(--gray-900); margin-bottom: 4px; }
      .cd-header p { font-size: 13px; color: var(--gray-500); }
      .cd-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 14px; margin-bottom: 24px; }
      .cd-stat-card { background: white; border: 1px solid var(--gray-100); border-radius: 14px; padding: 0; display: flex; overflow: hidden; }
      .cd-stat-accent { width: 6px; flex-shrink: 0; }
      .cd-stat-body { flex: 1; padding: 16px 18px; }
      .cd-stat-value { font-size: 28px; font-weight: 800; letter-spacing: -0.5px; line-height: 1.15; font-variant-numeric: tabular-nums; }
      .cd-stat-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: var(--gray-400); margin-top: 4px; }
      .cd-grid { display: grid; grid-template-columns: 280px 1fr; gap: 20px; }
      @media (max-width: 900px) { .cd-grid { grid-template-columns: 1fr; } }
      .cd-chart-card { background: white; border: 1px solid var(--gray-100); border-radius: 12px; padding: 20px; display: flex; flex-direction: column; align-items: center; }
      .cd-chart-title { font-size: 13px; font-weight: 600; color: var(--gray-700); margin-bottom: 12px; }
      .cd-table-card { background: white; border: 1px solid var(--gray-100); border-radius: 12px; overflow: hidden; }
      .cd-th { padding: 10px 16px; text-align: left; font-size: 11px; font-weight: 600; color: var(--gray-400); text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid var(--gray-200); background: var(--gray-50); white-space: nowrap; }
      .cd-th-right { text-align: right; }
      .cd-row { transition: background 0.1s; }
      .cd-row:hover { background: var(--gray-50); }
      .cd-row td { padding: 12px 16px; border-bottom: 1px solid var(--gray-100); vertical-align: middle; font-size: 13px; }
      .cd-row:last-child td { border-bottom: none; }
      .cd-badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 500; white-space: nowrap; }
      .cd-badge-done { background: #DCFCE7; color: #15803D; }
      .cd-badge-leviers { background: #DBEAFE; color: #1D4ED8; }
      .cd-badge-encours { background: #FEF3C7; color: #B45309; }
      .cd-badge-new { background: var(--gray-100); color: var(--gray-500); }
      .cd-action-btn { padding: 4px 12px; border-radius: 6px; font-size: 12px; font-weight: 500; border: 1px solid var(--gray-200); background: white; color: var(--gray-700); cursor: pointer; transition: all 0.1s; white-space: nowrap; }
      .cd-action-btn:hover { background: var(--gray-50); border-color: var(--gray-300); }
      .cd-action-btn.primary { background: var(--accent); color: white; border-color: var(--accent); }
      .cd-action-btn.primary:hover { opacity: 0.9; }
    </style>

    <div class="cd-header">
      <h1>Tableau de bord du conseil</h1>
      <p>${advised} exploitation${advised > 1 ? 's' : ''} conseillee${advised > 1 ? 's' : ''} sur 10</p>
    </div>

    <div class="cd-stats">
      <div class="cd-stat-card">
        <div class="cd-stat-accent" style="background: linear-gradient(180deg, #22C55E, #4ADE80);"></div>
        <div class="cd-stat-body">
          <div class="cd-stat-value" style="color: #15803D;">${advised}</div>
          <div class="cd-stat-label">Dossier${advised > 1 ? 's' : ''} généré${advised > 1 ? 's' : ''}</div>
        </div>
      </div>
      <div class="cd-stat-card">
        <div class="cd-stat-accent" style="background: linear-gradient(180deg, #3B82F6, #60A5FA);"></div>
        <div class="cd-stat-body">
          <div class="cd-stat-value" style="color: #1D4ED8;">${inProgress}</div>
          <div class="cd-stat-label">En cours</div>
        </div>
      </div>
      <div class="cd-stat-card">
        <div class="cd-stat-accent" style="background: var(--gray-200);"></div>
        <div class="cd-stat-body">
          <div class="cd-stat-value" style="color: var(--gray-400);">${notStarted}</div>
          <div class="cd-stat-label">Non commencée${notStarted > 1 ? 's' : ''}</div>
        </div>
      </div>
      <div class="cd-stat-card">
        <div class="cd-stat-accent" style="background: linear-gradient(180deg, var(--accent), var(--accent-200));"></div>
        <div class="cd-stat-body">
          <div class="cd-stat-value" style="color: var(--gray-900);">${Math.round(advised / 10 * 100)}%</div>
          <div class="cd-stat-label">Progression</div>
        </div>
      </div>
    </div>

    <div class="cd-grid">
      <div class="cd-chart-card">
        <div class="cd-chart-title">Avancement du conseil</div>
        <div style="width: 200px; height: 200px;">
          <canvas id="chart-conseil-donut"></canvas>
        </div>
        <div style="margin-top: 12px; font-size: 12px; color: var(--gray-500); text-align: center;">
          <div style="display: flex; align-items: center; gap: 6px; justify-content: center; margin-bottom: 4px;">
            <span style="width: 10px; height: 10px; border-radius: 50%; background: #22C55E; display: inline-block;"></span>
            Terminé (${advised})
          </div>
          <div style="display: flex; align-items: center; gap: 6px; justify-content: center; margin-bottom: 4px;">
            <span style="width: 10px; height: 10px; border-radius: 50%; background: #3B82F6; display: inline-block;"></span>
            En cours (${inProgress})
          </div>
          <div style="display: flex; align-items: center; gap: 6px; justify-content: center;">
            <span style="width: 10px; height: 10px; border-radius: 50%; background: #D1D5DB; display: inline-block;"></span>
            Non commencé (${notStarted})
          </div>
        </div>
      </div>

      <div class="cd-table-card">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th class="cd-th">Exploitation</th>
              <th class="cd-th">Region</th>
              <th class="cd-th">Étape</th>
              <th class="cd-th">Statut conseil</th>
              <th class="cd-th cd-th-right">EBE</th>
              <th class="cd-th cd-th-right">RCAI</th>
              <th class="cd-th">Action</th>
            </tr>
          </thead>
          <tbody>
            ${statuses.map(s => renderConseilRow(s)).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Render donut chart
  renderDonutChart(advised, inProgress, notStarted);
}

// ─── Conseil status determination ────────────────────────────────────────────

function getConseilStatus(exploitationId, prog, state) {
  // Check if this exploitation has a completed conseil dossier
  if (prog.complete) {
    return { key: 'dossier_genere', label: 'Dossier généré', cssClass: 'cd-badge-done' };
  }
  // Check if the current exploitation has leviers selected
  if (state.exploitationId === exploitationId && state.leviersSelectionnes && state.leviersSelectionnes.length > 0) {
    return { key: 'leviers_selectionnes', label: 'Leviers sélectionnés', cssClass: 'cd-badge-leviers' };
  }
  // Check if conseil step (6) has been reached
  if (prog.etape >= 6) {
    return { key: 'leviers_selectionnes', label: 'Leviers sélectionnés', cssClass: 'cd-badge-leviers' };
  }
  // Check if they have progressed at all
  if (prog.etape > 0) {
    return { key: 'en_cours', label: 'En cours (étape ' + prog.etape + '/6)', cssClass: 'cd-badge-encours' };
  }
  return { key: 'non_commence', label: 'Non commencé', cssClass: 'cd-badge-new' };
}

// ─── Row rendering ───────────────────────────────────────────────────────────

function renderConseilRow(s) {
  const { expl, prog, status, result } = s;
  const rk = expl.region.replace(/-/g, '_');
  const rc = REGION_COLORS[rk] || { bg: '#F3F4F6', text: '#4B5563' };
  const rl = REGION_LABELS[rk] || expl.region;

  const ebe = result?.sig?.ebe ?? 0;
  const rcai = result?.sig?.rcai ?? 0;

  const stepLabel = prog.etape > 0 ? `Étape ${prog.etape}/6` : '-';

  // Determine action button
  let actionBtn;
  if (status.key === 'dossier_genere') {
    actionBtn = `<button class="cd-action-btn" onclick="selectExploitationWithProgression('${expl.id}', 'rapport')">Voir le dossier</button>`;
  } else if (status.key === 'leviers_selectionnes' || status.key === 'en_cours') {
    actionBtn = `<button class="cd-action-btn primary" onclick="selectExploitationWithProgression('${expl.id}', 'conseil')">Continuer</button>`;
  } else {
    actionBtn = `<button class="cd-action-btn primary" onclick="selectExploitationWithProgression('${expl.id}', 'decouverte')">Commencer</button>`;
  }

  return `
    <tr class="cd-row">
      <td>
        <div style="font-weight: 600; color: var(--gray-900);">${expl.nom}</div>
        <div style="font-size: 12px; color: var(--gray-400); margin-top: 1px;">${expl.exploitant}</div>
      </td>
      <td><span class="cd-badge" style="background:${rc.bg};color:${rc.text};">${rl}</span></td>
      <td style="font-size: 12px; color: var(--gray-500);">${stepLabel}</td>
      <td><span class="cd-badge ${status.cssClass}">${status.label}</span></td>
      <td style="text-align: right; font-variant-numeric: tabular-nums; font-weight: 600; color: ${ebe >= 0 ? 'var(--gray-900)' : 'var(--red-500)'};">${fmtK(ebe)}</td>
      <td style="text-align: right; font-variant-numeric: tabular-nums; color: ${rcai >= 0 ? 'var(--gray-700)' : 'var(--red-500)'};">${fmtK(rcai)}</td>
      <td>${actionBtn}</td>
    </tr>
  `;
}

// ─── Chart ───────────────────────────────────────────────────────────────────

function renderDonutChart(advised, inProgress, notStarted) {
  const ctx = document.getElementById('chart-conseil-donut');
  if (!ctx) return;

  // Ensure at least one segment is visible when all are zero
  const hasData = advised > 0 || inProgress > 0 || notStarted > 0;
  const data = hasData ? [advised, inProgress, notStarted] : [0, 0, 10];

  const chart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Terminé', 'En cours', 'Non commencé'],
      datasets: [{
        data: data,
        backgroundColor: [COLORS.sage, COLORS.steel, '#D1D5DB'],
        borderWidth: 2,
        borderColor: '#FFFFFF',
        borderRadius: 3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      cutout: '70%',
      animation: { animateRotate: true, duration: 800 },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.label}: ${ctx.raw} exploitation${ctx.raw > 1 ? 's' : ''}`
          }
        }
      }
    }
  });

  charts.push(chart);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtK(n) {
  if (n === undefined || n === null) return '—';
  if (Math.abs(n) >= 1000) return Math.round(n / 1000) + 'k';
  return Math.round(n) + '';
}

// Ensure global navigation function is available even if accueil.js hasn't loaded
if (!window.selectExploitationWithProgression) {
  window.selectExploitationWithProgression = function(exploitationId, targetHash) {
    if (typeof window.selectExploitation === 'function') {
      window.selectExploitation(exploitationId, '#' + targetHash);
    }
  };
}
