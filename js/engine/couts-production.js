// js/engine/couts-production.js — Calcul des coûts de production par culture
const REMUNERATION_UTH = 31800;
const CULTURES_PAILLE = ['ble_tendre', 'ble_dur', 'orge_hiver', 'orge_printemps', 'triticale'];

export function calculerCoutsProduction(exploitation, annee, referentiel, itk) {
  const assolement = exploitation.assolements[annee];
  if (!assolement) return [];
  const region = exploitation.region.replace(/-/g, '_');
  const itkRegion = itk[region] || {};
  const sau = exploitation.sau_totale;
  const uth = exploitation.uth_total;
  const cs = exploitation.charges_structure;

  // Charges structure hors amort et frais financiers
  const csHorsAmortFF = Object.entries(cs).reduce((sum, [k, v]) => {
    if (['amort_materiel', 'amort_batiments', 'amort_irrigation', 'frais_financiers'].includes(k)) return sum;
    return sum + (typeof v === 'number' ? v : 0);
  }, 0);

  const chargesMeca = (cs.amort_materiel || 0) + (cs.amort_irrigation || 0);
  const amortBat = cs.amort_batiments || 0;

  // Index prix
  const pi = referentiel.prix_intrants[annee] || referentiel.prix_intrants['N'];
  const piN = referentiel.prix_intrants['N'];
  const idxN = pi.ammonitrate_335 / piN.ammonitrate_335;
  const idxPK = pi.engrais_pk_0_25_25 / piN.engrais_pk_0_25_25;
  const idxSem = pi.index_semences / piN.index_semences;
  const idxPhy = pi.index_phytos / piN.index_phytos;

  const pv = referentiel.prix_vente[annee] || referentiel.prix_vente['N'];
  const ap = referentiel.aides_pac;
  const paille = referentiel.paille || { prix_tonne: 30, rendement_t_ha: 4, taux_vente: 0.5 };

  const aidesHa = ap.dpb_moyen + (exploitation.eco_regime === 'superieur' ? ap.eco_regime_sup : ap.eco_regime_inf) + (Math.min(sau, ap.redistributif_plafond_ha) * ap.redistributif / sau);
  const remuMoHa = (uth * REMUNERATION_UTH) / sau;

  const resultats = [];
  for (const culture of assolement) {
    const ck = culture.culture;
    const surface = culture.surface;
    const rdt = culture.rendement_realise || culture.rendement_vise || 0;
    const rdtT = rdt / 10; // dt/ha → t/ha (toutes cultures, y compris betterave/pdt)

    const itkC = itkRegion[ck] || itkRegion[mapKey(ck)] || null;
    let coHa = 0, mecaHa = 0;
    if (itkC) {
      coHa = ((itkC.semences?.cout_ha || 0) * idxSem) + ((itkC.engrais_total_ha || 0) * idxN) + ((itkC.phytos_total_ha || 0) * idxPhy) + (itkC.irrigation_ha || 0) + (itkC.sechage_ha || 0) + (itkC.tri_conditionnement_ha || 0);
      mecaHa = itkC.mecanisation_ha || 0;
    } else { coHa = 400; mecaHa = 300; }

    const structHa = csHorsAmortFF / sau;
    const amortBatHa = amortBat / sau;
    let coproduitsHa = 0;
    if (CULTURES_PAILLE.includes(ck)) coproduitsHa = paille.prix_tonne * paille.rendement_t_ha * paille.taux_vente;

    const cdpHa = coHa + mecaHa + structHa + amortBatHa + remuMoHa - coproduitsHa;
    const cdpT = rdtT > 0 ? cdpHa / rdtT : 0;

    let aidesCHa = aidesHa;
    if (['pois', 'feverole', 'lentille_puy'].includes(ck)) aidesCHa += ap.aide_couplee_proteagineux;
    if (exploitation.ichn_montant) aidesCHa += exploitation.ichn_montant / sau;
    const aidesT = rdtT > 0 ? aidesCHa / rdtT : 0;
    const seuil = cdpT - aidesT;

    const pvKey = { mais_grain_irrigue: 'mais_grain', soja_irrigue: 'soja', orge_printemps: 'orge_printemps_brass', betterave_sucriere: 'betterave_dt16', lin_fibre: 'lin_paille_dt', lentille_puy: 'lentille_puy', haricots_verts: 'haricots_verts_dt', petits_pois: 'petits_pois_dt', prairie_foin: 'prairie_foin_dt' }[ck] || ck;
    // Prices ending in _dt are in EUR/dt — multiply by 10 to get EUR/t
    const prixRaw = pv[pvKey] || 200;
    const prix = pvKey.includes('_dt') ? prixRaw * 10 : prixRaw;
    const margeT = prix - seuil;
    const pbHa = (rdtT * prix) + aidesCHa;
    const mbHa = pbHa - coHa;

    resultats.push({ culture: ck, surface, rendement: rdt, rendement_t_ha: r(rdtT), charges_ope_ha: r(coHa), mecanisation_ha: r(mecaHa), structure_ha: r(structHa), amort_bat_ha: r(amortBatHa), remuneration_mo_ha: r(remuMoHa), coproduits_ha: r(coproduitsHa), cdp_ha: r(cdpHa), cdp_tonne: r(cdpT), aides_ha: r(aidesCHa), aides_tonne: r(aidesT), seuil_commercialisation: r(seuil), prix_vente: r(prix), marge_tonne: r(margeT), produit_brut_ha: r(pbHa), marge_brute_ha: r(mbHa), marge_brute_totale: r(mbHa * surface), produit_brut_total: r(pbHa * surface), charges_ope_totales: r(coHa * surface) });
  }
  return resultats;
}

export function calculerResumeCdP(cdp) {
  const tPB = cdp.reduce((s, c) => s + c.produit_brut_total, 0);
  const tCO = cdp.reduce((s, c) => s + c.charges_ope_totales, 0);
  const tMB = cdp.reduce((s, c) => s + c.marge_brute_totale, 0);
  const tS = cdp.reduce((s, c) => s + c.surface, 0);
  return { totalProduitBrut: r(tPB), totalChargesOpe: r(tCO), totalMargeBrute: r(tMB), margeBruteHaMoyen: tS > 0 ? r(tMB / tS) : 0, cultures: cdp };
}

// isBP removed — all crops use /10 for dt→t conversion
function mapKey(k) { return { mais_ensilage: 'mais_grain', soja: 'soja_irrigue' }[k] || k; }
function r(n) { return Math.round(n * 100) / 100; }
