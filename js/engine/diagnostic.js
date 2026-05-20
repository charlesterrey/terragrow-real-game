// js/engine/diagnostic.js — Moteur de diagnostic structurel d'exploitation
// Analyse les forces, faiblesses, ratios cles et risques pour aider
// l'etudiant-conseiller a comprendre POURQUOI une exploitation est fragile.

import { calculerCoutsProduction, calculerResumeCdP } from './couts-production.js?v=2';
import { calculerSIGAgrege, calculerRatios } from './sig.js?v=2';
import { calculerTresorerieEstimee, calculerIndicateursTreso } from './tresorerie.js?v=2';
import { calculerResilience } from './resilience.js?v=2';

// ─── Seuils de reference (normes CER France / Chambres d'agriculture) ───
const SEUILS = {
  annuitesEbe: { ok: 40, warning: 50, danger: 80 },           // % — au-dela de 50% c'est tendu
  tresorerieHa: { ok: 50, warning: 0, danger: -100 },         // EUR/ha
  chargesStructureHa: { ok: 600, warning: 800, danger: 1100 }, // EUR/ha hors amort
  margeSecurite: { ok: 25, warning: 15, danger: 5 },           // % marge entre CdP/t et prix vente
  tauxEndettement: { ok: 30, warning: 40, danger: 60 },        // % dette / actif estime
  diversification: { ok: 1.2, warning: 0.8, danger: 0.5 },    // indice de Shannon
  ebeHa: { ok: 400, warning: 250, danger: 100 },              // EUR/ha
  rcaiHa: { ok: 100, warning: 0, danger: -100 }               // EUR/ha
};

// Rendements moyens regionaux (q/ha) — references indicatives
const RENDEMENTS_REGIONAUX = {
  beauce: { ble_tendre: 78, colza: 35, orge_hiver: 72, orge_printemps: 62, betterave_sucriere: 850, mais_grain: 90, pois: 42, ble_dur: 65 },
  nord_picardie: { ble_tendre: 82, colza: 37, orge_hiver: 75, orge_printemps: 65, betterave_sucriere: 880, mais_grain: 85, pois: 40, lin_fibre: 70 },
  bretagne: { ble_tendre: 72, colza: 32, orge_hiver: 65, mais_grain: 80, triticale: 60, pois: 38 },
  sud_ouest: { ble_tendre: 62, colza: 28, mais_grain: 95, tournesol: 25, soja: 28, sorgho: 55 },
  rhone_alpes: { ble_tendre: 65, colza: 30, orge_hiver: 60, mais_grain: 85, tournesol: 26, lentille_puy: 12 }
};

/**
 * Genere un diagnostic complet de l'exploitation.
 * @param {Object} exploitation - Profil exploitation complet
 * @param {string} annee - 'N-2', 'N-1' ou 'N'
 * @param {Object} referentiel - Referentiel prix
 * @param {Object} itk - ITK regionaux
 * @param {Object|null} situationComplete - Donnees pre-calculees (optionnel)
 * @returns {Object} Diagnostic structure
 */
export function genererDiagnostic(exploitation, annee, referentiel, itk, situationComplete = null) {
  // ─── 1. Calculs de base (ou reutilisation si fournis) ───
  const sau = exploitation.sau_totale;
  const assolement = exploitation.assolements[annee] || [];

  let cdp, resume, sig, ratiosSig, planT, indT, resil;

  if (situationComplete) {
    cdp = situationComplete.cdp;
    resume = situationComplete.resume;
    sig = situationComplete.sig;
    ratiosSig = situationComplete.ratios;
    planT = situationComplete.planT;
    indT = situationComplete.indT;
    resil = situationComplete.resil;
  } else {
    cdp = calculerCoutsProduction(exploitation, annee, referentiel, itk);
    resume = calculerResumeCdP(cdp);
    const cs = exploitation.charges_structure;
    const amortTotal = (cs.amort_materiel || 0) + (cs.amort_batiments || 0) + (cs.amort_irrigation || 0);
    const ff = cs.frais_financiers || 0;
    const csHors = exploitation.charges_structure_total - amortTotal - ff;
    const aides = calculerAidesTotal(exploitation, annee, referentiel);
    sig = calculerSIGAgrege({
      ventesTotal: resume.totalProduitBrut - aides,
      aidesTotal: aides,
      chargesOpeTotal: resume.totalChargesOpe,
      chargesStructureTotal: csHors,
      amortissementsTotal: amortTotal,
      fraisFinanciersTotal: ff
    });
    ratiosSig = calculerRatios(sig, exploitation.annuites_total || 0);
    planT = calculerTresorerieEstimee(exploitation, annee, referentiel, cdp);
    indT = calculerIndicateursTreso(planT);
    resil = calculerResilience({
      tresorerieMin: indT.tresorerieMin || 0,
      annuites: exploitation.annuites_total || 0,
      ebe: sig.ebe,
      assolement,
      cdpParCulture: cdp,
      chargesFixesTotales: exploitation.charges_structure_total,
      chargesTotales: resume.totalChargesOpe + exploitation.charges_structure_total
    });
  }

  // ─── 2. Calcul des ratios cles ───
  const annuites = exploitation.annuites_total || 0;
  const ratioAnnEbe = sig.ebe > 0 ? rd(annuites / sig.ebe * 100) : 999;
  const tresoHa = rd((indT.tresorerieMin || 0) / sau);
  const csHorsAmortFF = calculerCSHorsAmortFF(exploitation);
  const csHa = rd(csHorsAmortFF / sau);
  const ebeHa = rd(sig.ebe / sau);
  const rcaiHa = rd(sig.rcai / sau);

  // Marge de securite moyenne ponderee par surface
  let sommeMarge = 0, sommeS = 0;
  for (const c of cdp) {
    if (c.prix_vente > 0 && c.seuil_commercialisation > 0) {
      const mPct = (c.prix_vente - c.seuil_commercialisation) / c.prix_vente * 100;
      sommeMarge += mPct * c.surface;
      sommeS += c.surface;
    }
  }
  const margeSecurite = sommeS > 0 ? rd(sommeMarge / sommeS) : 0;

  // Taux d'endettement : dette totale / actif estime
  const detteTotal = (exploitation.emprunts || []).reduce((s, e) => s + e.capital_restant, 0);
  const actifMateriel = (exploitation.materiel || []).reduce((s, m) => s + (m.valeur_achat || 0), 0);
  const actifBatiments = (exploitation.batiments || []).reduce((s, b) => s + (b.valeur || 0), 0);
  const actifFoncier = exploitation.sau_propriete * 7000; // estimation 7000 EUR/ha en moyenne
  const actifTotal = actifMateriel + actifBatiments + actifFoncier;
  const tauxEndettement = actifTotal > 0 ? rd(detteTotal / actifTotal * 100) : 0;

  // Indice de Shannon
  const shannon = calculerShannon(assolement, sau);

  // ─── 3. Construction des ratios avec interpretation ───
  const ratios = {
    annuitesEbe: buildRatio(ratioAnnEbe, SEUILS.annuitesEbe, '%',
      ratioAnnEbe > 80 ? 'Capacite de remboursement critique — risque de cessation' :
      ratioAnnEbe > 50 ? 'Capacite de remboursement tendue — peu de marge de manoeuvre' :
      'Capacite de remboursement correcte', true),
    ebeHa: buildRatio(ebeHa, SEUILS.ebeHa, 'EUR/ha',
      ebeHa < 100 ? 'EBE tres faible — l\'exploitation ne degage pas assez de revenu' :
      ebeHa < 250 ? 'EBE modeste — revenu limite apres charges' :
      'EBE satisfaisant'),
    tresorerieHa: buildRatio(tresoHa, SEUILS.tresorerieHa, 'EUR/ha',
      tresoHa < -100 ? 'Tresorerie structurellement negative — besoin de financement CT important' :
      tresoHa < 0 ? 'Tresorerie negative — besoin de financement court terme' :
      'Tresorerie positive'),
    chargesStructureHa: buildRatio(csHa, SEUILS.chargesStructureHa, 'EUR/ha',
      csHa > 1100 ? 'Charges de structure tres elevees — sur-investissement probable' :
      csHa > 800 ? 'Charges de structure elevees par rapport a la SAU' :
      'Charges de structure maitrisees', true),
    margeSecurite: buildRatio(margeSecurite, SEUILS.margeSecurite, '%',
      margeSecurite < 5 ? 'Marge quasi nulle — la moindre baisse de prix met en peril' :
      margeSecurite < 15 ? 'Marge faible entre cout de production et prix de vente' :
      'Marge de securite confortable'),
    tauxEndettement: buildRatio(tauxEndettement, SEUILS.tauxEndettement, '%',
      tauxEndettement > 60 ? 'Endettement excessif — structure financiere fragile' :
      tauxEndettement > 40 ? 'Endettement significatif — vigilance sur la capacite d\'investissement' :
      'Endettement maitrise', true),
    diversification: buildRatio(shannon, SEUILS.diversification, '',
      shannon < 0.5 ? 'Assolement trop concentre — forte dependance a 1-2 cultures' :
      shannon < 0.8 ? 'Diversification insuffisante — elargir l\'assolement' :
      shannon < 1.2 ? 'Diversification correcte' :
      'Bonne diversification de l\'assolement'),
    rcaiHa: buildRatio(rcaiHa, SEUILS.rcaiHa, 'EUR/ha',
      rcaiHa < -100 ? 'L\'exploitation perd de l\'argent — situation critique' :
      rcaiHa < 0 ? 'Resultat negatif — l\'exploitation ne couvre pas toutes ses charges' :
      'Resultat positif')
  };

  // ─── 4. Identification des forces ───
  const forces = [];
  const rk = exploitation.region.replace(/-/g, '_');
  const rdtRef = RENDEMENTS_REGIONAUX[rk] || {};

  // Comparer rendements a la moyenne regionale
  for (const c of assolement) {
    const ref = rdtRef[c.culture];
    const rdt = c.rendement_realise || c.rendement_vise || 0;
    if (ref && rdt > ref * 1.05) {
      forces.push({
        titre: 'Bon rendement ' + fmtC(c.culture),
        detail: 'Le rendement ' + fmtC(c.culture) + ' (' + rdt + ' q/ha) est superieur a la moyenne regionale (' + ref + ' q/ha), soit +' + Math.round((rdt / ref - 1) * 100) + '%.'
      });
    }
  }

  // Bonne diversification
  if (shannon >= 1.2) {
    forces.push({ titre: 'Assolement diversifie', detail: 'L\'indice de Shannon (' + rd(shannon) + ') traduit une bonne repartition des cultures, ce qui reduit le risque.' });
  }

  // Maitrise des charges ope
  const coHaMoy = resume.totalChargesOpe / sau;
  if (coHaMoy < 450) {
    forces.push({ titre: 'Charges operationnelles maitrisees', detail: 'Les charges ope moyennes (' + Math.round(coHaMoy) + ' EUR/ha) sont contenues.' });
  }

  // Bonne marge de securite
  if (margeSecurite > 25) {
    forces.push({ titre: 'Bonne marge de securite', detail: 'La marge moyenne entre CdP et prix de vente est de ' + Math.round(margeSecurite) + '%, offrant un tampon en cas de baisse des prix.' });
  }

  // Faible endettement
  if (tauxEndettement < 25) {
    forces.push({ titre: 'Endettement maitrise', detail: 'Le taux d\'endettement (' + Math.round(tauxEndettement) + '%) est faible, laissant une capacite d\'investissement.' });
  }

  // EBE solide
  if (ebeHa > 400) {
    forces.push({ titre: 'EBE solide', detail: 'L\'EBE de ' + Math.round(ebeHa) + ' EUR/ha est au-dessus du seuil de confort (400 EUR/ha).' });
  }

  // Part en propriete
  if (exploitation.sau_propriete > 0) {
    const pctPropriete = Math.round(exploitation.sau_propriete / sau * 100);
    if (pctPropriete > 30) {
      forces.push({ titre: 'Part fonciere en propriete', detail: pctPropriete + '% de la SAU en propriete (' + exploitation.sau_propriete + ' ha) — reduit la charge de fermage.' });
    }
  }

  // Stockage
  if (exploitation.a_stockage) {
    forces.push({ titre: 'Capacite de stockage', detail: 'La presence d\'un stockage permet de differer la vente et de capter de meilleurs prix.' });
  }

  // ─── 5. Identification des faiblesses ───
  const faiblesses = [];

  if (ratioAnnEbe > 80) {
    faiblesses.push({ titre: 'Surendettement critique', detail: 'Les annuites representent ' + Math.round(ratioAnnEbe) + '% de l\'EBE. Au-dela de 50%, la capacite d\'investissement est compromise. Au-dela de 80%, le risque de cessation de paiement est reel.', severite: 'haute' });
  } else if (ratioAnnEbe > 50) {
    faiblesses.push({ titre: 'Poids des annuites', detail: 'Les annuites representent ' + Math.round(ratioAnnEbe) + '% de l\'EBE. Il reste peu de marge pour investir ou absorber un choc.', severite: 'moyenne' });
  }

  if (sig.rcai < 0) {
    faiblesses.push({ titre: 'Resultat negatif', detail: 'Le RCAI est de ' + fmtM(sig.rcai) + '. L\'exploitation ne couvre pas l\'ensemble de ses charges, amortissements et frais financiers inclus.', severite: 'haute' });
  }

  if (tresoHa < -50) {
    faiblesses.push({ titre: 'Tresorerie structurellement negative', detail: 'La tresorerie minimale atteint ' + fmtM(indT.tresorerieMin) + ' soit ' + Math.round(tresoHa) + ' EUR/ha. Un financement court terme est indispensable.', severite: 'haute' });
  } else if (tresoHa < 0) {
    faiblesses.push({ titre: 'Creux de tresorerie', detail: 'La tresorerie passe en negatif pendant ' + (indT.moisNegatifs || 0) + ' mois, avec un minimum de ' + fmtM(indT.tresorerieMin) + '.', severite: 'moyenne' });
  }

  if (csHa > 1000) {
    faiblesses.push({ titre: 'Charges de structure elevees', detail: 'A ' + Math.round(csHa) + ' EUR/ha (hors amortissements), les charges de structure sont nettement au-dessus de la norme (600-800 EUR/ha). Verifier fermage, MSA, salaires.', severite: 'haute' });
  } else if (csHa > 800) {
    faiblesses.push({ titre: 'Charges de structure a surveiller', detail: 'A ' + Math.round(csHa) + ' EUR/ha, les charges fixes sont au-dessus de la moyenne. Potentiel d\'optimisation.', severite: 'moyenne' });
  }

  if (margeSecurite < 5) {
    faiblesses.push({ titre: 'Marge de securite quasi nulle', detail: 'En moyenne, le prix de vente ne depasse le cout de production que de ' + Math.round(margeSecurite) + '%. Toute fluctuation de prix ou de rendement impacte directement le revenu.', severite: 'haute' });
  } else if (margeSecurite < 15) {
    faiblesses.push({ titre: 'Marge de securite faible', detail: 'La marge moyenne CdP/prix est de ' + Math.round(margeSecurite) + '%. Vulnerable a une baisse des prix de marche.', severite: 'moyenne' });
  }

  // Rendements sous la moyenne regionale
  for (const c of assolement) {
    const ref = rdtRef[c.culture];
    const rdt = c.rendement_realise || c.rendement_vise || 0;
    if (ref && rdt < ref * 0.85) {
      faiblesses.push({ titre: 'Rendement ' + fmtC(c.culture) + ' faible', detail: fmtC(c.culture) + ' a ' + rdt + ' q/ha contre ' + ref + ' q/ha en moyenne regionale (-' + Math.round((1 - rdt / ref) * 100) + '%). Verifier les ITK.', severite: 'moyenne' });
    }
  }

  // Cultures a marge negative
  for (const c of cdp) {
    if (c.marge_tonne < 0) {
      faiblesses.push({ titre: fmtC(c.culture) + ' deficitaire', detail: 'Le CdP (' + Math.round(c.cdp_tonne) + ' EUR/t) depasse le prix de vente (' + Math.round(c.prix_vente) + ' EUR/t). Perte de ' + Math.round(Math.abs(c.marge_tonne)) + ' EUR/t, soit ' + fmtM(Math.abs(c.marge_tonne * c.rendement_t_ha * c.surface)) + ' sur ' + c.surface + ' ha.', severite: 'haute' });
    }
  }

  // Dependance au fermage
  const pctFermage = Math.round(exploitation.sau_fermage / sau * 100);
  if (pctFermage > 80) {
    faiblesses.push({ titre: 'Forte dependance au fermage', detail: pctFermage + '% de la SAU est en fermage. Le fermage represente ' + fmtM(exploitation.charges_structure?.fermage || 0) + '/an, limitant la flexibilite.', severite: 'faible' });
  }

  // Shannon faible
  if (shannon < 0.8) {
    faiblesses.push({ titre: 'Assolement peu diversifie', detail: 'Indice de Shannon = ' + rd(shannon) + '. Quelques cultures dominent, ce qui concentre le risque.', severite: 'moyenne' });
  }

  // ─── 6. Analyse des risques ───
  const risques = [];

  // Risque prix ble (culture dominante souvent)
  const bleCulture = assolement.find(c => c.culture === 'ble_tendre');
  if (bleCulture) {
    const pctBle = Math.round(bleCulture.surface / sau * 100);
    if (pctBle > 30) {
      const cdpBle = cdp.find(c => c.culture === 'ble_tendre');
      const perte20 = cdpBle ? Math.round(cdpBle.prix_vente * 0.20 * cdpBle.rendement_t_ha * bleCulture.surface) : 0;
      risques.push({
        titre: 'Dependance au ble tendre',
        detail: 'Le ble represente ' + pctBle + '% de la SAU. Une baisse de 20% du prix entrainerait une perte de ' + fmtM(perte20) + '.',
        probabilite: 'moyenne',
        impact: pctBle > 40 ? 'eleve' : 'moyen'
      });
    }
  }

  // Risque rendement (secheresse)
  const perteRdt15 = cdp.reduce((s, c) => {
    const pertePB = c.rendement_t_ha * 0.15 * c.prix_vente * c.surface;
    return s + pertePB;
  }, 0);
  risques.push({
    titre: 'Risque climatique (secheresse -15% rendement)',
    detail: 'Une baisse generalisee de 15% des rendements entrainerait une perte de chiffre d\'affaires de ' + fmtM(perteRdt15) + ', soit ' + Math.round(perteRdt15 / sig.ebe * 100) + '% de l\'EBE.',
    probabilite: 'moyenne',
    impact: perteRdt15 > sig.ebe * 0.5 ? 'eleve' : 'moyen'
  });

  // Risque prix intrants (+30% engrais)
  const surchargeEngrais = cdp.reduce((s, c) => {
    // Approximation : engrais ~ 50% des charges ope
    return s + c.charges_ope_ha * 0.5 * 0.30 * c.surface;
  }, 0);
  risques.push({
    titre: 'Risque hausse intrants (+30% engrais)',
    detail: 'Une hausse de 30% du prix des engrais augmenterait les charges de ' + fmtM(surchargeEngrais) + ', reduisant d\'autant l\'EBE.',
    probabilite: 'moyenne',
    impact: surchargeEngrais > sig.ebe * 0.3 ? 'eleve' : 'moyen'
  });

  // Risque echeances proches d'emprunt
  const anneeActuelle = new Date().getFullYear();
  const empruntsProches = (exploitation.emprunts || []).filter(e => e.echeance - anneeActuelle <= 2);
  if (empruntsProches.length > 0) {
    const totalAnnu = empruntsProches.reduce((s, e) => s + e.annuite, 0);
    risques.push({
      titre: 'Echeances d\'emprunt proches',
      detail: empruntsProches.length + ' emprunt(s) arrivent a echeance d\'ici 2 ans. Cela liberera ' + fmtM(totalAnnu) + '/an d\'annuites, mais attention au renouvellement eventuel de materiel.',
      probabilite: 'certaine',
      impact: 'moyen'
    });
  }

  // Risque si pas de MRC
  if (!exploitation.charges_structure?.mrc || exploitation.charges_structure.mrc < 2000) {
    risques.push({
      titre: 'Absence d\'assurance recolte',
      detail: 'L\'exploitation ne semble pas ou peu couverte en assurance multirisque climatique. En cas d\'alea majeur, la perte est integralement supportee.',
      probabilite: 'faible',
      impact: 'eleve'
    });
  }

  // ─── 7. Prevision tresorerie ───
  const moisNegatifs = planT.filter(m => m.tresorerie_cumulee < 0);
  const moisCrit = planT.reduce((min, m) => m.tresorerie_cumulee < min.tresorerie_cumulee ? m : min, planT[0]);
  const previsionTresorerie = {
    moisCritique: moisCrit ? moisCrit.label : null,
    besoinMaximal: moisCrit ? Math.round(moisCrit.tresorerie_cumulee) : 0,
    dureeNegative: moisNegatifs.length,
    commentaire: moisNegatifs.length === 0
      ? 'La tresorerie reste positive sur l\'ensemble de l\'exercice.'
      : 'La tresorerie est negative pendant ' + moisNegatifs.length + ' mois (' + moisNegatifs.map(m => m.label).join(', ') + '). Le pic de besoin atteint ' + fmtM(Math.abs(moisCrit.tresorerie_cumulee)) + ' en ' + moisCrit.label + '.'
  };

  // ─── 8. Analyse de sensibilite ───
  const sensibilite = calculerSensibilite(exploitation, annee, referentiel, itk, cdp, sig);

  // ─── 9. Note globale ───
  const { noteGlobale, noteLabel, noteCouleur } = calculerNoteGlobale(ratios, sig, indT);

  return {
    noteGlobale,
    noteLabel,
    noteCouleur,
    ratios,
    forces,
    faiblesses: faiblesses.sort((a, b) => severiteOrdre(b.severite) - severiteOrdre(a.severite)),
    risques,
    previsionTresorerie,
    sensibilite,
    resilience: resil
  };
}


// ─── Fonctions utilitaires internes ───

/**
 * Construit un objet ratio avec alerte et interpretation.
 * Pour les ratios "inverses" (plus haut = pire), passer inverse=true.
 */
function buildRatio(valeur, seuils, unite, interpretation, inverse = false) {
  let alerte;
  if (inverse) {
    // Plus la valeur est haute, pire c'est (ex: annuites/EBE, charges/ha, endettement)
    alerte = valeur >= seuils.danger ? 'danger' : valeur >= seuils.warning ? 'warning' : 'ok';
  } else {
    // Plus la valeur est haute, mieux c'est (ex: marge securite, diversification)
    alerte = valeur <= seuils.danger ? 'danger' : valeur <= seuils.warning ? 'warning' : 'ok';
  }
  return {
    valeur: rd(valeur),
    seuil: seuils.warning,
    unite,
    alerte,
    interpretation
  };
}

/**
 * Calcule la note globale A-E a partir des ratios et indicateurs.
 */
function calculerNoteGlobale(ratios, sig, indT) {
  // Systeme de points : chaque ratio ok=2, warning=1, danger=0
  let pts = 0, total = 0;
  for (const [k, r] of Object.entries(ratios)) {
    if (!r) continue;
    total += 2;
    if (r.alerte === 'ok') pts += 2;
    else if (r.alerte === 'warning') pts += 1;
    // danger = 0
  }

  // Bonus/malus supplementaires
  if (sig.rcai < 0) pts -= 2;
  if (sig.ebe < 0) pts -= 3;
  if ((indT.tresorerieMin || 0) < -50000) pts -= 2;

  const pct = total > 0 ? pts / total * 100 : 50;

  if (pct >= 80) return { noteGlobale: 'A', noteLabel: 'Solide', noteCouleur: '#22C55E' };
  if (pct >= 60) return { noteGlobale: 'B', noteLabel: 'Correcte', noteCouleur: '#84CC16' };
  if (pct >= 40) return { noteGlobale: 'C', noteLabel: 'Fragile', noteCouleur: '#F59E0B' };
  if (pct >= 20) return { noteGlobale: 'D', noteLabel: 'En difficulte', noteCouleur: '#F97316' };
  return { noteGlobale: 'E', noteLabel: 'Critique', noteCouleur: '#EF4444' };
}

/**
 * Analyse de sensibilite : impact d'une baisse de prix ble -20% et de rendement -15%.
 */
function calculerSensibilite(exploitation, annee, referentiel, itk, cdpBase, sigBase) {
  const sau = exploitation.sau_totale;
  const assolement = exploitation.assolements[annee] || [];
  const pv = referentiel.prix_vente[annee] || referentiel.prix_vente['N'];

  // Scenario 1 : prix ble -20%
  let pertePrixBle = 0;
  const cdpBle = cdpBase.find(c => c.culture === 'ble_tendre');
  if (cdpBle) {
    pertePrixBle = cdpBle.rendement_t_ha * cdpBle.surface * cdpBle.prix_vente * 0.20;
  }
  const ebeApresPrixBle = sigBase.ebe - pertePrixBle;

  // Scenario 2 : rendements -15% toutes cultures
  let perteRendement = 0;
  for (const c of cdpBase) {
    perteRendement += c.rendement_t_ha * 0.15 * c.prix_vente * c.surface;
  }
  const ebeApresRendement = sigBase.ebe - perteRendement;

  // Scenario 3 : combine (prix ble -20% ET rendements -15%)
  const ebeApresCombine = sigBase.ebe - pertePrixBle - perteRendement + (cdpBle ? cdpBle.rendement_t_ha * 0.15 * cdpBle.prix_vente * 0.20 * cdpBle.surface : 0);

  return {
    prixBle20: {
      label: 'Prix ble tendre -20%',
      perteCA: Math.round(pertePrixBle),
      ebeApres: Math.round(ebeApresPrixBle),
      ebeVariation: Math.round(pertePrixBle),
      verdict: ebeApresPrixBle > 0 ? 'L\'exploitation absorbe le choc' : 'EBE negatif — situation critique'
    },
    rendements15: {
      label: 'Rendements -15% (toutes cultures)',
      perteCA: Math.round(perteRendement),
      ebeApres: Math.round(ebeApresRendement),
      ebeVariation: Math.round(perteRendement),
      verdict: ebeApresRendement > 0 ? 'L\'exploitation resiste' : 'EBE negatif — impossible de couvrir les charges'
    },
    combine: {
      label: 'Prix ble -20% ET rendements -15%',
      perteCA: Math.round(pertePrixBle + perteRendement),
      ebeApres: Math.round(ebeApresCombine),
      ebeVariation: Math.round(sigBase.ebe - ebeApresCombine),
      verdict: ebeApresCombine > 0 ? 'L\'exploitation survit mais en tension' : 'Situation de crise — cessation probable'
    }
  };
}

/**
 * Calcule l'indice de Shannon pour un assolement.
 */
function calculerShannon(assolement, sau) {
  if (!assolement.length || sau <= 0) return 0;
  let h = 0;
  for (const c of assolement) {
    const p = c.surface / sau;
    if (p > 0) h -= p * Math.log(p);
  }
  return rd(h);
}

/**
 * Calcule les charges de structure hors amortissements et frais financiers.
 */
function calculerCSHorsAmortFF(exploitation) {
  const cs = exploitation.charges_structure;
  return Object.entries(cs).reduce((sum, [k, v]) => {
    if (['amort_materiel', 'amort_batiments', 'amort_irrigation', 'frais_financiers'].includes(k)) return sum;
    return sum + (typeof v === 'number' ? v : 0);
  }, 0);
}

/**
 * Calcule les aides PAC totales.
 */
function calculerAidesTotal(exploitation, annee, referentiel) {
  const a = referentiel.aides_pac;
  const sau = exploitation.sau_totale;
  const as = exploitation.assolements[annee] || [];
  let t = sau * (a.dpb_moyen + (exploitation.eco_regime === 'superieur' ? a.eco_regime_sup : a.eco_regime_inf));
  t += Math.min(sau, a.redistributif_plafond_ha) * a.redistributif;
  t += as.filter(c => ['pois', 'feverole', 'lentille_puy'].includes(c.culture)).reduce((s, c) => s + c.surface, 0) * a.aide_couplee_proteagineux;
  if (exploitation.ichn_montant) t += exploitation.ichn_montant;
  return t;
}

function severiteOrdre(s) { return { haute: 3, moyenne: 2, faible: 1 }[s] || 0; }
function rd(n) { return Math.round(n * 100) / 100; }
function fmtM(n) { return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n || 0); }
function fmtC(k) {
  return { ble_tendre: 'Ble tendre', ble_dur: 'Ble dur', orge_hiver: 'Orge hiver', orge_printemps: 'Orge printemps', colza: 'Colza', mais_grain: 'Mais grain', mais_grain_irrigue: 'Mais irrigue', tournesol: 'Tournesol', pois: 'Pois', feverole: 'Feverole', betterave_sucriere: 'Betterave', pomme_terre: 'Pomme de terre', lin_fibre: 'Lin fibre', soja: 'Soja', soja_irrigue: 'Soja irrigue', sorgho: 'Sorgho', triticale: 'Triticale', lentille_puy: 'Lentille du Puy', haricots_verts: 'Haricots verts', petits_pois: 'Petits pois', prairie_foin: 'Prairie foin' }[k] || k;
}
