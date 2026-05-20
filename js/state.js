// js/state.js — Gestion d'état + persistance localStorage
const STATE_KEY = 'real-game-state';

const defaultState = {
  nomEtudiant: '', exploitationId: null, annee: 'N',
  nomEquipe: '',
  etudiant1: '',
  etudiant2: '',
  scenarioActif: null, parametresLibres: {},
  leviersSelectionnes: [], assolementModifie: null,
  resultatsSimulation: null, resultatsConseil: null,
  derniereSauvegarde: null,
  // Progression multi-exploitations
  progression: {},  // { "beauce-01": { etape: 3, complete: false, dateDebut: "...", scenarioId: null, leviersIds: [] }, ... }
  etapeActive: 1,   // Current step in the guided flow (1-6)
  // Commentaires du conseiller (textareas conseil view)
  commentairesConseil: { analyse: '', justification: '', conclusion: '' },
  // Custom scenarios created by students
  scenariosCustom: []
};

let _state = null;
let _listeners = [];

export function chargerEtat() {
  try {
    const saved = localStorage.getItem(STATE_KEY);
    _state = saved ? { ...defaultState, ...JSON.parse(saved) } : { ...defaultState };
  } catch { _state = { ...defaultState }; }
  return _state;
}

export function getEtat() {
  if (!_state) chargerEtat();
  return _state;
}

export function sauvegarderEtat(updates) {
  if (!_state) chargerEtat();
  Object.assign(_state, updates);
  _state.derniereSauvegarde = new Date().toISOString();
  localStorage.setItem(STATE_KEY, JSON.stringify(_state));
  _listeners.forEach(l => { try { l(_state); } catch(e) { console.error(e); } });
  return _state;
}

export function reinitialiserEtat() {
  localStorage.removeItem(STATE_KEY);
  _state = { ...defaultState };
  _listeners.forEach(l => { try { l(_state); } catch(e) { console.error(e); } });
  return _state;
}

export function onStateChange(listener) {
  _listeners.push(listener);
  return () => { _listeners = _listeners.filter(l => l !== listener); };
}

export function hasExploitation() { return !!getEtat().exploitationId; }
export function hasScenario() { return !!getEtat().scenarioActif; }
export function hasLeviers() { return getEtat().leviersSelectionnes.length > 0; }

// --- Progression multi-exploitations ---

export function getProgression(exploitationId) {
  const state = getEtat();
  return state.progression[exploitationId] || { etape: 0, complete: false, dateDebut: null };
}

export function setProgression(exploitationId, etape) {
  const state = getEtat();
  if (!state.progression[exploitationId]) {
    state.progression[exploitationId] = { etape: 1, complete: false, dateDebut: new Date().toISOString() };
  }
  const prog = state.progression[exploitationId];
  // Only advance, never go back
  if (etape > prog.etape) {
    prog.etape = etape;
  }
  if (etape >= 6) {
    prog.complete = true;
    prog.dateFin = new Date().toISOString();
  }
  sauvegarderEtat(state);
}

export function getProgressionGlobale() {
  const state = getEtat();
  const total = 10; // 10 exploitations
  const complete = Object.values(state.progression).filter(p => p.complete).length;
  const enCours = Object.values(state.progression).filter(p => !p.complete && p.etape > 0).length;
  return { total, complete, enCours, nonCommence: total - complete - enCours };
}

export function setEtapeActive(etape) {
  const state = getEtat();
  state.etapeActive = etape;
  sauvegarderEtat(state);
}

// --- Custom scenarios ---

export function getScenariosCustom() {
  const state = getEtat();
  return state.scenariosCustom || [];
}

export function sauvegarderScenarioCustom(scenario) {
  const state = getEtat();
  if (!state.scenariosCustom) state.scenariosCustom = [];
  state.scenariosCustom.push(scenario);
  sauvegarderEtat({ scenariosCustom: state.scenariosCustom });
}

export function supprimerScenarioCustom(id) {
  const state = getEtat();
  if (!state.scenariosCustom) return;
  state.scenariosCustom = state.scenariosCustom.filter(s => s.id !== id);
  sauvegarderEtat({ scenariosCustom: state.scenariosCustom });
  // If active scenario was deleted, clear it
  if (state.scenarioActif === id) {
    sauvegarderEtat({ scenarioActif: null, resultatsSimulation: null });
  }
}
