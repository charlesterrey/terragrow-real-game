// js/app.js — Routeur SPA, navigation, état global
import { chargerEtat, sauvegarderEtat, reinitialiserEtat, getEtat, onStateChange } from './state.js';

// Cache des données chargées
const cache = {
  referentiel: null,
  scenarios: null,
  leviers: null,
  itk: null,
  exploitations: {},
  grandsLivres: {}
};

// Liste des exploitations disponibles
const EXPLOITATION_IDS = [
  'beauce-01', 'beauce-02',
  'nord-picardie-01', 'nord-picardie-02',
  'bretagne-01', 'bretagne-02',
  'sud-ouest-01', 'sud-ouest-02',
  'rhone-alpes-01', 'rhone-alpes-02'
];

// --- Chargement des données ---

export async function chargerReferentiel() {
  if (!cache.referentiel) {
    const mod = await import('../data/referentiel-prix.js');
    cache.referentiel = mod.data;
  }
  return cache.referentiel;
}

export async function chargerScenarios() {
  if (!cache.scenarios) {
    const mod = await import('../data/scenarios.js');
    cache.scenarios = mod.data;
  }
  return cache.scenarios;
}

export async function chargerLeviers() {
  if (!cache.leviers) {
    const mod = await import('../data/leviers-conseil.js');
    cache.leviers = mod.data;
  }
  return cache.leviers;
}

export async function chargerITK() {
  if (!cache.itk) {
    const mod = await import('../data/itk-regionaux.js');
    cache.itk = mod.data;
  }
  return cache.itk;
}

export async function chargerExploitation(id) {
  if (!cache.exploitations[id]) {
    const mod = await import(`../data/exploitations/${id}.js`);
    cache.exploitations[id] = mod.data;
  }
  return cache.exploitations[id];
}

export async function chargerGrandLivre(id, annee) {
  const key = `${id}-${annee}`;
  if (!cache.grandsLivres[key]) {
    try {
      const mod = await import(`../data/grands-livres/${id}-${annee}.js`);
      cache.grandsLivres[key] = mod.data;
    } catch (e) {
      console.warn(`Grand livre ${key} non trouvé, utilisation de données vides`);
      cache.grandsLivres[key] = { ecritures: [] };
    }
  }
  return cache.grandsLivres[key];
}

export async function chargerToutesExploitations() {
  const results = [];
  for (const id of EXPLOITATION_IDS) {
    results.push(await chargerExploitation(id));
  }
  return results;
}

export function getExploitationIds() {
  return EXPLOITATION_IDS;
}

// --- Navigation ---

const ROUTES = {
  'accueil': () => import('./views/accueil.js?v=8'),
  'decouverte': () => import('./views/decouverte.js?v=8'),
  'dashboard': () => import('./views/tableau-bord.js?v=8'),
  'grand-livre': () => import('./views/grand-livre.js?v=8'),
  'sig': () => import('./views/sig.js?v=8'),
  'couts-production': () => import('./views/couts-production.js?v=8'),
  'tresorerie': () => import('./views/tresorerie.js?v=8'),
  'simulateur': () => import('./views/simulateur.js?v=8'),
  'conseil': () => import('./views/conseil.js?v=8'),
  'conseil-dashboard': () => import('./views/conseil-dashboard.js?v=8'),
  'scenarios': () => import('./views/scenarios.js?v=8'),
  'comparaison': () => import('./views/comparaison.js?v=8'),
  'rapport': () => import('./views/rapport.js?v=8'),
  'fiches-session1': () => import('./views/fiches-session1.js?v=8'),
};

let currentView = null;

async function navigateTo(hash) {
  const route = hash.replace('#', '') || 'accueil';
  const container = document.getElementById('view-container');

  // Check if exploitation is required
  const needsExpl = !['accueil', 'fiches-session1', 'comparaison', 'conseil-dashboard', 'scenarios'].includes(route);
  if (needsExpl && !getEtat().exploitationId) {
    window.location.hash = '#accueil';
    return;
  }

  // Update nav
  document.querySelectorAll('#sidebar-nav a').forEach(a => {
    a.classList.toggle('active', a.getAttribute('href') === '#' + route);
  });

  // Load view
  container.innerHTML = '<div class="loading"><div class="spinner"></div> Chargement...</div>';

  try {
    const loader = ROUTES[route];
    if (!loader) {
      container.innerHTML = '<p>Vue non trouvée</p>';
      return;
    }
    const mod = await loader();
    if (mod.render) {
      await mod.render(container);
    }
    currentView = route;
  } catch (e) {
    console.error('Erreur navigation:', e);
    container.innerHTML = `<div class="card"><p>Erreur de chargement: ${e.message}</p></div>`;
  }
}

// --- UI Updates ---

function updateSidebar() {
  const state = getEtat();

  // Team info display
  const teamDisplay = document.getElementById('sidebar-team-display');
  if (teamDisplay) {
    if (state.nomEquipe) {
      const students = state.etudiant2
        ? `${state.etudiant1 || ''} & ${state.etudiant2}`
        : (state.etudiant1 || '');
      teamDisplay.innerHTML = `
        <div style="font-weight:600;color:var(--gray-800);font-size:13px;">${state.nomEquipe}</div>
        ${students ? `<div style="font-size:11px;color:var(--gray-500);margin-top:1px;">${students}</div>` : ''}
      `;
    } else {
      teamDisplay.innerHTML = `<div style="font-size:12px;color:var(--gray-400);cursor:pointer;" onclick="showOnboarding()">Configurer l'équipe...</div>`;
    }
  }

  // Backward compat: keep nomEtudiant in sync
  const inputNom = document.getElementById('nom-etudiant');
  if (inputNom && inputNom.value !== state.nomEtudiant) {
    inputNom.value = state.nomEtudiant || '';
  }

  // Exploitation
  const explNom = document.getElementById('sidebar-expl-nom');
  const explDetail = document.getElementById('sidebar-expl-detail');
  if (state.exploitationId && cache.exploitations[state.exploitationId]) {
    const expl = cache.exploitations[state.exploitationId];
    explNom.textContent = expl.nom;
    explDetail.textContent = `${expl.sau_totale} ha - ${expl.commune}`;
  } else {
    explNom.textContent = 'Aucune';
    explDetail.textContent = '';
  }

  // Année
  document.querySelectorAll('.year-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.annee === state.annee);
  });

  // Badges
  const badges = document.getElementById('sidebar-badges');
  let html = '';
  if (state.scenarioActif) {
    const sc = cache.scenarios?.find(s => s.id === state.scenarioActif);
    html += `<span class="sidebar-badge scenario">${sc?.nom || state.scenarioActif}</span>`;
  }
  if (state.leviersSelectionnes?.length > 0) {
    html += `<span class="sidebar-badge leviers">${state.leviersSelectionnes.length} levier(s)</span>`;
  }
  badges.innerHTML = html;

  // Session banner
  const banner = document.getElementById('session-banner');
  if (state.derniereSauvegarde && state.exploitationId) {
    const date = new Date(state.derniereSauvegarde).toLocaleString('fr-FR');
    const expl = cache.exploitations[state.exploitationId];
    banner.innerHTML = `
      <div class="session-banner">
        <span>Session restaurée - ${expl?.nom || state.exploitationId} - ${date}</span>
        <button onclick="resetApp()">X</button>
      </div>`;
  } else {
    banner.innerHTML = '';
  }
}

// --- Global functions ---

window.selectExploitation = async function(id, targetHash) {
  await chargerExploitation(id);
  sauvegarderEtat({ exploitationId: id });
  updateSidebar();
  window.location.hash = targetHash || '#decouverte';
};

// Switch exploitation without navigating away (for prev/next buttons)
window.switchExploitation = async function(id) {
  await chargerExploitation(id);
  sauvegarderEtat({ exploitationId: id });
  updateSidebar();
  // Re-render current view in place
  const hash = window.location.hash || '#dashboard';
  navigateTo(hash);
};

window.setAnnee = function(annee) {
  sauvegarderEtat({ annee });
  updateSidebar();
  // Re-render current view
  navigateTo(window.location.hash || '#accueil');
};

window.resetApp = function() {
  if (confirm('Réinitialiser toute la session ? Toutes les données seront perdues.')) {
    reinitialiserEtat();
    updateSidebar();
    window.location.hash = '#accueil';
  }
};

window.toggleSidebar = function() {
  const sidebar = document.getElementById('sidebar');
  sidebar.classList.toggle('open');
  sidebar.classList.toggle('collapsed');
};

// --- Onboarding modal ---

function showOnboardingModal() {
  // Remove existing modal if any
  const existing = document.getElementById('onboarding-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'onboarding-modal';
  modal.innerHTML = `
    <div style="position:fixed;inset:0;background:rgba(0,0,0,0.4);backdrop-filter:blur(4px);z-index:9999;display:flex;align-items:center;justify-content:center;">
      <div style="background:white;border-radius:16px;padding:40px;max-width:420px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,0.15);">
        <div style="text-align:center;margin-bottom:24px;">
          <div style="width:48px;height:48px;background:var(--accent-100);border-radius:12px;display:flex;align-items:center;justify-content:center;margin:0 auto 12px;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent-500)" stroke-width="1.5"><path d="M3 21h18M12 3v18M5 14l7-7 7 7"/></svg>
          </div>
          <h2 style="font-size:20px;font-weight:800;color:var(--gray-900);margin-bottom:4px;">Bienvenue dans TerraGrow</h2>
          <p style="font-size:13px;color:var(--gray-500);">Identifiez votre équipe pour commencer</p>
        </div>
        <div style="display:flex;flex-direction:column;gap:12px;">
          <div>
            <label style="display:block;font-size:12px;font-weight:600;color:var(--gray-600);margin-bottom:4px;">Nom d'équipe *</label>
            <input type="text" id="onb-equipe" placeholder="Ex: Équipe Alpha" style="width:100%;padding:10px 12px;border:1px solid var(--gray-200);border-radius:8px;font-size:14px;font-family:inherit;outline:none;transition:border-color 0.15s;" onfocus="this.style.borderColor='var(--accent-500)'" onblur="this.style.borderColor='var(--gray-200)'" />
          </div>
          <div>
            <label style="display:block;font-size:12px;font-weight:600;color:var(--gray-600);margin-bottom:4px;">Étudiant 1 *</label>
            <input type="text" id="onb-etudiant1" placeholder="Prénom Nom" style="width:100%;padding:10px 12px;border:1px solid var(--gray-200);border-radius:8px;font-size:14px;font-family:inherit;outline:none;transition:border-color 0.15s;" onfocus="this.style.borderColor='var(--accent-500)'" onblur="this.style.borderColor='var(--gray-200)'" />
          </div>
          <div>
            <label style="display:block;font-size:12px;font-weight:600;color:var(--gray-600);margin-bottom:4px;">Étudiant 2 <span style="color:var(--gray-400);font-weight:400;">(optionnel)</span></label>
            <input type="text" id="onb-etudiant2" placeholder="Prénom Nom" style="width:100%;padding:10px 12px;border:1px solid var(--gray-200);border-radius:8px;font-size:14px;font-family:inherit;outline:none;transition:border-color 0.15s;" onfocus="this.style.borderColor='var(--accent-500)'" onblur="this.style.borderColor='var(--gray-200)'" />
          </div>
          <div id="onb-error" style="font-size:12px;color:var(--red-500);display:none;"></div>
          <button id="onb-submit" style="margin-top:8px;width:100%;padding:12px;background:var(--accent-500);color:white;border:none;border-radius:8px;font-size:14px;font-weight:600;font-family:inherit;cursor:pointer;transition:background 0.15s;" onmouseover="this.style.background='var(--accent-600)'" onmouseout="this.style.background='var(--accent-500)'">Commencer</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Focus first input
  setTimeout(() => document.getElementById('onb-equipe')?.focus(), 100);

  // Handle submit
  document.getElementById('onb-submit').addEventListener('click', () => {
    const equipe = document.getElementById('onb-equipe').value.trim();
    const etudiant1 = document.getElementById('onb-etudiant1').value.trim();
    const etudiant2 = document.getElementById('onb-etudiant2').value.trim();
    const errorEl = document.getElementById('onb-error');

    if (!equipe || !etudiant1) {
      errorEl.textContent = 'Veuillez renseigner le nom d\'équipe et le nom de l\'étudiant 1.';
      errorEl.style.display = 'block';
      return;
    }

    const nomEtudiant = etudiant2 ? `${etudiant1} & ${etudiant2}` : etudiant1;
    sauvegarderEtat({ nomEquipe: equipe, etudiant1, etudiant2, nomEtudiant });
    modal.remove();
    updateSidebar();
  });

  // Also handle Enter key
  modal.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      document.getElementById('onb-submit').click();
    }
  });
}

window.showOnboarding = function() {
  showOnboardingModal();
};

// --- Initialization ---

async function init() {
  // Apply professional Chart.js defaults globally
  try {
    const { applyFinancialDefaults } = await import('./chart-config.js');
    applyFinancialDefaults();
  } catch(e) { console.warn('Chart config not loaded:', e); }

  // Load state
  chargerEtat();

  // Bind nom étudiant input (backward compat — hidden if team display is used)
  const inputNom = document.getElementById('nom-etudiant');
  if (inputNom) {
    inputNom.addEventListener('change', () => {
      sauvegarderEtat({ nomEtudiant: inputNom.value });
    });
  }

  // Pre-load common data
  try {
    await Promise.all([
      chargerReferentiel(),
      chargerScenarios(),
      chargerLeviers(),
      chargerITK()
    ]);
  } catch (e) {
    console.warn('Certaines données non chargées:', e.message);
  }

  // Load exploitation if previously selected
  const state = getEtat();
  if (state.exploitationId) {
    try {
      await chargerExploitation(state.exploitationId);
    } catch (e) {
      console.warn('Exploitation non chargée:', e);
    }
  }

  updateSidebar();

  // Listen for state changes
  onStateChange(() => updateSidebar());

  // Show onboarding modal if first time (no team name set)
  if (!state.nomEquipe) {
    showOnboardingModal();
  }

  // Hash routing
  window.addEventListener('hashchange', () => {
    navigateTo(window.location.hash);
  });

  // Initial route
  navigateTo(window.location.hash || '#accueil');
}

// Export for views
export { cache, getEtat, sauvegarderEtat };

// Start
init();
