// js/engine/simulation.js — Moteur de simulation de scénarios
import { calculerCoutsProduction, calculerResumeCdP } from './couts-production.js?v=9';
import { calculerSIGAgrege, calculerRatios } from './sig.js?v=9';
import { calculerTresorerieEstimee, calculerIndicateursTreso } from './tresorerie.js?v=9';
import { calculerResilience } from './resilience.js?v=9';

export function simulerScenario(exploitation, annee, referentiel, itk, scenario, resultatsAvant = null) {
  if (!resultatsAvant) resultatsAvant = calculerSituationComplete(exploitation, annee, referentiel, itk);
  const refMod = appliquerMult(referentiel, annee, scenario);
  const explMod = appliquerRendements(exploitation, annee, scenario);
  const resultatsApres = calculerSituationComplete(explMod, annee, refMod, itk);
  const delta = calcDelta(resultatsAvant, resultatsApres, exploitation);
  return { avant: resultatsAvant, apres: resultatsApres, delta, scenario: { id: scenario.id, nom: scenario.nom, description: scenario.description } };
}

export function calculerSituationComplete(exploitation, annee, referentiel, itk) {
  const cdp = calculerCoutsProduction(exploitation, annee, referentiel, itk);
  const resume = calculerResumeCdP(cdp);
  const cs = exploitation.charges_structure;
  const amort = (cs.amort_materiel||0) + (cs.amort_batiments||0) + (cs.amort_irrigation||0);
  const ff = cs.frais_financiers||0;
  const csHors = exploitation.charges_structure_total - amort - ff;
  const aides = calcAides(exploitation, annee, referentiel);
  const sig = calculerSIGAgrege({ ventesTotal: resume.totalProduitBrut - aides, aidesTotal: aides, chargesOpeTotal: resume.totalChargesOpe, chargesStructureTotal: csHors, amortissementsTotal: amort, fraisFinanciersTotal: ff });
  const ratios = calculerRatios(sig, exploitation.annuites_total||0);
  const planT = calculerTresorerieEstimee(exploitation, annee, referentiel, cdp);
  const indT = calculerIndicateursTreso(planT);
  const assol = exploitation.assolements[annee]||[];
  const resil = calculerResilience({ tresorerieMin: indT.tresorerieMin||0, annuites: exploitation.annuites_total||0, ebe: sig.ebe, assolement: assol, cdpParCulture: cdp, chargesFixesTotales: exploitation.charges_structure_total, chargesTotales: resume.totalChargesOpe + exploitation.charges_structure_total });
  return { cdpParCulture: cdp, resumeCdP: resume, sig, ratios, planTreso: planT, indicTreso: indT, resilience: resil };
}

function appliquerMult(ref, annee, scenario) {
  const m = scenario.multiplicateurs; const r = JSON.parse(JSON.stringify(ref));
  const pi = r.prix_intrants[annee];
  if (pi) {
    if (m.prix_engrais_n) { pi.ammonitrate_335 = Math.round(pi.ammonitrate_335 * m.prix_engrais_n); pi.solution_n39 = Math.round(pi.solution_n39 * m.prix_engrais_n); }
    if (m.prix_engrais_pk) pi.engrais_pk_0_25_25 = Math.round(pi.engrais_pk_0_25_25 * m.prix_engrais_pk);
    if (m.prix_gnr) pi.gnr = Math.round(pi.gnr * m.prix_gnr * 100) / 100;
    if (m.prix_phytos) pi.index_phytos = Math.round(pi.index_phytos * m.prix_phytos);
    if (m.prix_semences) pi.index_semences = Math.round(pi.index_semences * m.prix_semences);
  }
  if (m.prix_vente) { const pv = r.prix_vente[annee]; if (pv) for (const [k, f] of Object.entries(m.prix_vente)) if (pv[k] !== undefined) pv[k] = Math.round(pv[k] * f * 100) / 100; }
  return r;
}

function appliquerRendements(expl, annee, scenario) {
  const m = scenario.multiplicateurs; if (!m.rendements) return expl;
  const e = JSON.parse(JSON.stringify(expl));
  const a = e.assolements[annee]; if (!a) return e;
  for (const c of a) {
    const f = m.rendements[c.culture] || m.rendements[mapRdt(c.culture)] || m.rendements.defaut || 1.0;
    if (c.rendement_realise) c.rendement_realise = Math.round(c.rendement_realise * f * 100) / 100;
    if (c.rendement_vise) c.rendement_vise = Math.round(c.rendement_vise * f * 100) / 100;
  }
  if (scenario.impact_regional && scenario.impact_regional[expl.region]) {
    const adj = scenario.impact_regional[expl.region].rendements_ajustement;
    if (adj && adj !== 1.0) for (const c of a) { if (c.rendement_realise) c.rendement_realise = Math.round(c.rendement_realise * adj * 100) / 100; if (c.rendement_vise) c.rendement_vise = Math.round(c.rendement_vise * adj * 100) / 100; }
  }
  return e;
}

function calcDelta(av, ap, expl) {
  const dE = ap.sig.ebe - av.sig.ebe, dR = ap.sig.rcai - av.sig.rcai;
  const dCdP = [];
  for (const ac of av.cdpParCulture) { const pc = ap.cdpParCulture.find(c => c.culture === ac.culture); if (pc) dCdP.push({ culture: ac.culture, cdp_tonne_avant: ac.cdp_tonne, cdp_tonne_apres: pc.cdp_tonne, variation_euros: Math.round((pc.cdp_tonne - ac.cdp_tonne)*100)/100, variation_pct: ac.cdp_tonne > 0 ? Math.round((pc.cdp_tonne - ac.cdp_tonne)/ac.cdp_tonne*10000)/100 : 0 }); }
  const v = getVerdict(ap);
  return {
    ebe: { avant: av.sig.ebe, apres: ap.sig.ebe, delta: Math.round(dE*100)/100, pct: av.sig.ebe !== 0 ? Math.round(dE/Math.abs(av.sig.ebe)*10000)/100 : 0 },
    rcai: { avant: av.sig.rcai, apres: ap.sig.rcai, delta: Math.round(dR*100)/100, pct: av.sig.rcai !== 0 ? Math.round(dR/Math.abs(av.sig.rcai)*10000)/100 : 0 },
    margeBrute: { avant: av.sig.margeBrute, apres: ap.sig.margeBrute, delta: Math.round((ap.sig.margeBrute-av.sig.margeBrute)*100)/100 },
    tresorerieMin: { avant: av.indicTreso.tresorerieMin||0, apres: ap.indicTreso.tresorerieMin||0, delta: Math.round(((ap.indicTreso.tresorerieMin||0)-(av.indicTreso.tresorerieMin||0))*100)/100 },
    bfr: { avant: av.indicTreso.bfr||0, apres: ap.indicTreso.bfr||0 },
    resilience: { avant: av.resilience.score, apres: ap.resilience.score, delta: ap.resilience.score - av.resilience.score },
    cdpParCulture: dCdP, verdict: v
  };
}

function getVerdict(r) {
  const t = r.indicTreso.tresorerieMin||0, rc = r.sig.rcai;
  if (t < -50000 || (rc < -30000 && r.ratios.alerteAnnuites === 'critique')) return { texte: "Cessation de paiement", couleur: "#EF4444", icone: "alert" };
  if (t < 0 || rc < 0) return { texte: "Trésorerie critique", couleur: "#F59E0B", icone: "warning" };
  return { texte: "L'exploitation survit", couleur: "#22C55E", icone: "check" };
}

function calcAides(expl, annee, ref) {
  const a = ref.aides_pac, sau = expl.sau_totale, as = expl.assolements[annee]||[];
  let t = sau * (a.dpb_moyen + (expl.eco_regime === 'superieur' ? a.eco_regime_sup : a.eco_regime_inf));
  t += Math.min(sau, a.redistributif_plafond_ha) * a.redistributif;
  t += as.filter(c => ['pois','feverole','lentille_puy'].includes(c.culture)).reduce((s,c) => s+c.surface, 0) * a.aide_couplee_proteagineux;
  if (expl.ichn_montant) t += expl.ichn_montant;
  return Math.round(t * 100) / 100;
}

function mapRdt(k) { return { mais_grain_irrigue:'mais_grain', soja_irrigue:'soja', orge_printemps:'orge_printemps_brass', betterave_sucriere:'betterave_dt16' }[k] || k; }
