// js/engine/resilience.js — Score de résilience composite (0-100)

export function calculerResilience({ tresorerieMin = 0, annuites = 0, ebe = 0, assolement = [], cdpParCulture = [], chargesFixesTotales = 0, chargesTotales = 1 }) {
  const scoreTreso = clamp(tresorerieMin / 500, 0, 100);
  const ratioAnnEbe = ebe > 0 ? (annuites / ebe) : 2;
  const scoreAnnuites = clamp(100 - ratioAnnEbe * 100, 0, 100);
  const shannon = calculerShannon(assolement);
  const scoreDiversification = clamp(shannon / 1.8 * 100, 0, 100);
  let sommeMS = 0, nb = 0;
  for (const c of cdpParCulture) {
    if (c.prix_vente > 0 && c.seuil_commercialisation > 0) {
      sommeMS += (c.prix_vente - c.seuil_commercialisation) / c.prix_vente;
      nb++;
    }
  }
  const msMoy = nb > 0 ? sommeMS / nb : 0;
  const scoreMS = clamp((msMoy + 0.1) / 0.3 * 100, 0, 100);
  const partFixes = chargesTotales > 0 ? chargesFixesTotales / chargesTotales : 0.5;
  const scoreCF = clamp((0.7 - partFixes) / 0.4 * 100, 0, 100);
  const score = clamp(Math.round(scoreTreso * 0.25 + scoreAnnuites * 0.25 + scoreDiversification * 0.15 + scoreMS * 0.20 + scoreCF * 0.15), 0, 100);
  return {
    score,
    detail: {
      tresorerie: { score: Math.round(scoreTreso), poids: 25, valeur: tresorerieMin },
      annuites_ebe: { score: Math.round(scoreAnnuites), poids: 25, valeur: r(ratioAnnEbe * 100) },
      diversification: { score: Math.round(scoreDiversification), poids: 15, valeur: r(shannon) },
      marge_securite: { score: Math.round(scoreMS), poids: 20, valeur: r(msMoy * 100) },
      charges_fixes: { score: Math.round(scoreCF), poids: 15, valeur: r(partFixes * 100) }
    },
    niveau: score >= 70 ? 'bon' : score >= 40 ? 'moyen' : 'critique',
    couleur: score >= 70 ? '#22C55E' : score >= 40 ? '#F59E0B' : '#EF4444',
    verdict: score >= 70 ? "L'exploitation est résiliente" : score >= 40 ? "Résilience fragile — vigilance requise" : "Exploitation en danger — mesures urgentes nécessaires"
  };
}

function calculerShannon(assolement) {
  const total = assolement.reduce((s, c) => s + c.surface, 0);
  if (total === 0) return 0;
  let h = 0;
  for (const c of assolement) { const p = c.surface / total; if (p > 0) h -= p * Math.log(p); }
  return h;
}

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function r(n) { return Math.round(n * 100) / 100; }
