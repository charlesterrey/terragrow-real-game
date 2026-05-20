// js/engine/sig.js — Calcul des Soldes Intermédiaires de Gestion

export function calculerSIG(ecritures) {
  const soldes = {};
  for (const e of ecritures) {
    if (e.compte_debit) soldes[e.compte_debit] = (soldes[e.compte_debit] || 0) + e.montant_ht;
    if (e.compte_credit) soldes[e.compte_credit] = (soldes[e.compte_credit] || 0) - e.montant_ht;
  }
  const ventes = -somme(soldes, '701');
  const variationStocks = -somme(soldes, '713');
  const aides = -somme(soldes, '74');
  const autresProduits = -somme(soldes, '75');
  const produitBrut = ventes + variationStocks + aides + autresProduits;
  const chargesOpe = somme(soldes, '601') + somme(soldes, '602') + somme(soldes, '604') + somme(soldes, '606');
  const margeBrute = produitBrut - chargesOpe;
  const chargesStructure = somme(soldes, '61') + somme(soldes, '62') + somme(soldes, '63') + somme(soldes, '64') + somme(soldes, '65');
  const ebe = margeBrute - chargesStructure;
  const amortissements = somme(soldes, '681');
  const resultatExploitation = ebe - amortissements;
  const fraisFinanciers = somme(soldes, '66');
  const produitsFinanciers = -somme(soldes, '76');
  const rcai = resultatExploitation - fraisFinanciers + produitsFinanciers;
  return { ventes: r(ventes), variationStocks: r(variationStocks), aides: r(aides), autresProduits: r(autresProduits), produitBrut: r(produitBrut), chargesOpe: r(chargesOpe), margeBrute: r(margeBrute), chargesStructure: r(chargesStructure), ebe: r(ebe), amortissements: r(amortissements), resultatExploitation: r(resultatExploitation), fraisFinanciers: r(fraisFinanciers), produitsFinanciers: r(produitsFinanciers), rcai: r(rcai) };
}

export function calculerSIGAgrege({ ventesTotal = 0, aidesTotal = 0, autresProduits = 0, chargesOpeTotal = 0, chargesStructureTotal = 0, amortissementsTotal = 0, fraisFinanciersTotal = 0 }) {
  const produitBrut = ventesTotal + aidesTotal + autresProduits;
  const margeBrute = produitBrut - chargesOpeTotal;
  const ebe = margeBrute - chargesStructureTotal;
  const resultatExploitation = ebe - amortissementsTotal;
  const rcai = resultatExploitation - fraisFinanciersTotal;
  return { ventes: r(ventesTotal), variationStocks: 0, aides: r(aidesTotal), autresProduits: r(autresProduits), produitBrut: r(produitBrut), chargesOpe: r(chargesOpeTotal), margeBrute: r(margeBrute), chargesStructure: r(chargesStructureTotal), ebe: r(ebe), amortissements: r(amortissementsTotal), resultatExploitation: r(resultatExploitation), fraisFinanciers: r(fraisFinanciersTotal), produitsFinanciers: 0, rcai: r(rcai) };
}

export function calculerRatios(sig, annuites = 0) {
  const ratioAnn = sig.ebe > 0 ? annuites / sig.ebe : 9.99;
  return {
    ebeParProduitBrut: sig.produitBrut > 0 ? r(sig.ebe / sig.produitBrut * 100) : 0,
    annuitesParEbe: r(ratioAnn * 100),
    alerteEbe: sig.ebe < 0 ? 'critique' : sig.ebe < 30000 ? 'attention' : 'ok',
    alerteRcai: sig.rcai < 0 ? 'critique' : sig.rcai < 10000 ? 'attention' : 'ok',
    alerteAnnuites: ratioAnn > 0.6 ? 'critique' : ratioAnn > 0.4 ? 'attention' : 'ok'
  };
}

function somme(soldes, prefix) {
  let t = 0;
  for (const [k, v] of Object.entries(soldes)) { if (k.startsWith(prefix)) t += v; }
  return t;
}
function r(n) { return Math.round(n * 100) / 100; }
