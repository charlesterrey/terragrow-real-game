// js/engine/conseil.js — Moteur de recommandation (leviers d'action)
import { calculerSituationComplete } from './simulation.js?v=10';

export function filtrerLeviers(tousLeviers, exploitation) {
  return tousLeviers.filter(l => {
    const regions = l.applicable.regions;
    if (!regions.includes('toutes') && !regions.includes(exploitation.region)) return false;
    const cond = l.applicable.condition;
    if (cond) {
      switch (cond) {
        case 'a_ble_tendre': return hasCulture(exploitation, 'ble_tendre');
        case 'possede_moissonneuse': return exploitation.possede_moissonneuse === true;
        case 'a_emprunts': return exploitation.emprunts && exploitation.emprunts.length > 0;
        case 'a_fermage': return exploitation.sau_fermage > 0;
        case 'a_mais_irrigue': return hasCulture(exploitation, 'mais_grain_irrigue');
        case 'a_mais': return hasCulture(exploitation, 'mais_grain') || hasCulture(exploitation, 'mais_grain_irrigue');
        case 'a_irrigation': return exploitation.a_irrigation === true;
        case 'a_materiel_elevage': return exploitation.a_materiel_elevage === true;
        default: return true;
      }
    }
    return true;
  });
}

export function appliquerConseil(exploitation, annee, referentiel, itk, leviersIds, tousLeviers, assolementModifie = null, resultatsAvant = null) {
  if (!resultatsAvant) resultatsAvant = calculerSituationComplete(exploitation, annee, referentiel, itk);
  const expl = JSON.parse(JSON.stringify(exploitation));
  if (assolementModifie) expl.assolements[annee] = assolementModifie;
  const leviers = tousLeviers.filter(l => leviersIds.includes(l.id));
  const ref = JSON.parse(JSON.stringify(referentiel));
  for (const l of leviers) appliquerLevier(expl, ref, annee, l);
  const resultatsApres = calculerSituationComplete(expl, annee, ref, itk);
  const d = {
    ebe: { avant: resultatsAvant.sig.ebe, apres: resultatsApres.sig.ebe, delta: Math.round((resultatsApres.sig.ebe - resultatsAvant.sig.ebe)*100)/100, pct: resultatsAvant.sig.ebe !== 0 ? Math.round((resultatsApres.sig.ebe - resultatsAvant.sig.ebe)/Math.abs(resultatsAvant.sig.ebe)*10000)/100 : 0 },
    rcai: { avant: resultatsAvant.sig.rcai, apres: resultatsApres.sig.rcai, delta: Math.round((resultatsApres.sig.rcai - resultatsAvant.sig.rcai)*100)/100 },
    tresorerieMin: { avant: resultatsAvant.indicTreso.tresorerieMin||0, apres: resultatsApres.indicTreso.tresorerieMin||0, delta: Math.round(((resultatsApres.indicTreso.tresorerieMin||0)-(resultatsAvant.indicTreso.tresorerieMin||0))*100)/100 },
    resilience: { avant: resultatsAvant.resilience.score, apres: resultatsApres.resilience.score, delta: resultatsApres.resilience.score - resultatsAvant.resilience.score }
  };
  return { avant: resultatsAvant, apres: resultatsApres, delta: d, leviersAppliques: leviers.map(l => ({ id: l.id, nom: l.nom, categorie: l.categorie })), assolementModifie: assolementModifie !== null };
}

function appliquerLevier(expl, ref, annee, levier) {
  const imp = levier.impact, cs = expl.charges_structure, pi = ref.prix_intrants[annee];
  if (imp.charges_engrais_n && pi) { pi.ammonitrate_335 = Math.round(pi.ammonitrate_335 * (1+imp.charges_engrais_n)); pi.solution_n39 = Math.round(pi.solution_n39 * (1+imp.charges_engrais_n)); }
  if (imp.charges_phytos && pi) pi.index_phytos = Math.round(pi.index_phytos * (1+imp.charges_phytos));
  if (imp.rendement_cereales) { const a = expl.assolements[annee]; if (a) for (const c of a) if (['ble_tendre','ble_dur','orge_hiver','orge_printemps','triticale'].includes(c.culture)) { if (c.rendement_vise) c.rendement_vise = Math.round(c.rendement_vise*(1+imp.rendement_cereales)*100)/100; if (c.rendement_realise) c.rendement_realise = Math.round(c.rendement_realise*(1+imp.rendement_cereales)*100)/100; } }
  if (imp.rendement_colza) { const a = expl.assolements[annee]; if (a) for (const c of a) if (c.culture==='colza') { if (c.rendement_vise) c.rendement_vise = Math.round(c.rendement_vise*(1+imp.rendement_colza)*100)/100; if (c.rendement_realise) c.rendement_realise = Math.round(c.rendement_realise*(1+imp.rendement_colza)*100)/100; } }
  if (imp.amort_materiel) { cs.amort_materiel = Math.max(0, (cs.amort_materiel||0)+imp.amort_materiel); expl.charges_structure_total = recalcCS(cs); }
  if (imp.fermage) { cs.fermage = Math.round((cs.fermage||0)*(1+imp.fermage)); expl.charges_structure_total = recalcCS(cs); }
  if (imp.annuites) expl.annuites_total = Math.round((expl.annuites_total||0)*(1+imp.annuites));
  if (imp.cout_mecanisation) { cs.amort_materiel = Math.round((cs.amort_materiel||0)*(1+imp.cout_mecanisation)); expl.charges_structure_total = recalcCS(cs); }
  if (imp.cout_irrigation) { if (cs.redevance_eau) cs.redevance_eau = Math.round(cs.redevance_eau*(1+imp.cout_irrigation)); if (cs.energie_irrigation) cs.energie_irrigation = Math.round(cs.energie_irrigation*(1+imp.cout_irrigation)); expl.charges_structure_total = recalcCS(cs); }
}

function recalcCS(cs) { return Object.values(cs).reduce((s,v) => s + (typeof v === 'number' ? v : 0), 0); }
function hasCulture(expl, ck) { for (const a of ['N','N-1','N-2']) { const as = expl.assolements[a]; if (as && as.some(c => c.culture === ck)) return true; } return false; }
