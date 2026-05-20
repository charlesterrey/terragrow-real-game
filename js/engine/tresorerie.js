// js/engine/tresorerie.js — Plan de trésorerie mensuel (juil → juin)
const MOIS_LABELS = ['Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc', 'Janv', 'Fév', 'Mars', 'Avr', 'Mai', 'Juin'];

export function calculerTresorerieEstimee(exploitation, annee, referentiel, cdpResultats) {
  const assolement = exploitation.assolements[annee];
  if (!assolement) return [];
  const pv = referentiel.prix_vente[annee] || referentiel.prix_vente['N'];
  const ap = referentiel.aides_pac;
  const sau = exploitation.sau_totale;

  let caTotal = 0;
  for (const c of assolement) {
    const rdt = c.rendement_realise || c.rendement_vise || 0;
    const rdtT = rdt / (['betterave_sucriere','pomme_terre'].includes(c.culture) ? 1000 : 10);
    const pk = { mais_grain_irrigue:'mais_grain', soja_irrigue:'soja', orge_printemps:'orge_printemps_brass', betterave_sucriere:'betterave_dt16', lin_fibre:'lin_paille_dt', lentille_puy:'lentille_puy', haricots_verts:'haricots_verts_dt', petits_pois:'petits_pois_dt', prairie_foin:'prairie_foin_dt' }[c.culture] || c.culture;
    caTotal += c.surface * rdtT * (pv[pk] || 200);
  }

  const aidesTotal = sau * (ap.dpb_moyen + ap.eco_regime_sup) + Math.min(sau, 52) * ap.redistributif
    + assolement.filter(c => ['pois','feverole','lentille_puy'].includes(c.culture)).reduce((s,c) => s+c.surface, 0) * ap.aide_couplee_proteagineux
    + (exploitation.ichn_montant || 0);

  // Profils saisonniers réalistes
  const profVentes = [0.25, 0.15, 0.15, 0.10, 0.05, 0.10, 0.05, 0.05, 0.05, 0.00, 0.00, 0.05];
  const profAides  = [0, 0, 0, 0, 0, 0.50, 0, 0, 0.35, 0.15, 0, 0];
  const profIntr   = [0.02, 0.08, 0.08, 0.12, 0.10, 0.08, 0.08, 0.10, 0.12, 0.10, 0.08, 0.04];

  const totalCO = cdpResultats ? cdpResultats.reduce((s,c) => s + c.charges_ope_totales, 0) : caTotal * 0.4;
  const csTotal = exploitation.charges_structure_total || 0;
  const csMens = csTotal / 12;
  const annMens = (exploitation.annuites_total || 0) / 12;

  const debutAnnee = referentiel.annees[annee]?.exercice_debut || '2024-07-01';
  const dDate = new Date(debutAnnee);
  const plan = [];

  for (let i = 0; i < 12; i++) {
    const m = new Date(dDate); m.setMonth(m.getMonth() + i);
    const mk = `${m.getFullYear()}-${String(m.getMonth()+1).padStart(2,'0')}`;
    const eV = caTotal * profVentes[i], eA = aidesTotal * profAides[i], tE = eV + eA;
    const dI = totalCO * profIntr[i], tD = dI + csMens + annMens;
    plan.push({ mois: mk, label: MOIS_LABELS[i], encaissements: { ventes_cereales: r(eV), aides_pac: r(eA), autres: 0, total: r(tE) }, decaissements: { achats_intrants: r(dI), charges_structure: r(csMens), annuites_emprunt: r(annMens), msa: 0, salaires: 0, impots: 0, autres: 0, total: r(tD) }, solde_mensuel: r(tE - tD), tresorerie_cumulee: 0 });
  }
  let cum = 0;
  for (const m of plan) { cum += m.solde_mensuel; m.tresorerie_cumulee = r(cum); }
  return plan;
}

export function calculerIndicateursTreso(plan) {
  if (!plan || !plan.length) return {};
  const ts = plan.map(m => m.tresorerie_cumulee);
  const min = Math.min(...ts), max = Math.max(...ts);
  const mc = plan.find(m => m.tresorerie_cumulee === min);
  return { tresorerieMin: r(min), tresorerieMax: r(max), moisCritique: mc?.label || '', moisCritiqueKey: mc?.mois || '', bfr: r(min < 0 ? Math.abs(min) : 0), moisNegatifs: plan.filter(m => m.tresorerie_cumulee < 0).length, totalEncaissements: r(plan.reduce((s,m) => s+m.encaissements.total, 0)), totalDecaissements: r(plan.reduce((s,m) => s+m.decaissements.total, 0)) };
}

function r(n) { return Math.round(n * 100) / 100; }
