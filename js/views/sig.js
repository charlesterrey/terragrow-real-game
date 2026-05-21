// js/views/sig.js — Vue SIG + waterfall chart + comparaison 3 ans
import { chargerExploitation, chargerReferentiel, chargerITK, getEtat } from '../app.js';
import { calculerCoutsProduction, calculerResumeCdP } from '../engine/couts-production.js?v=10';
import { calculerSIGAgrege } from '../engine/sig.js?v=10';
import { COLORS, fmtEur, fmtK, applyFinancialDefaults, euroScale, categoryScale, euroTooltip, legendTop, legendHidden, gridStyle, zeroLineGrid } from '../chart-config.js';

let charts = [];

export async function render(container) {
  charts.forEach(c => c.destroy());
  charts = [];

  applyFinancialDefaults();

  const state = getEtat();
  const expl = await chargerExploitation(state.exploitationId);
  const ref = await chargerReferentiel();
  const itk = await chargerITK();

  // Calculate SIG for all 3 years
  const sigParAnnee = {};
  for (const annee of ['N-2', 'N-1', 'N']) {
    const cdp = calculerCoutsProduction(expl, annee, ref, itk);
    const resume = calculerResumeCdP(cdp);
    const cs = expl.charges_structure;
    const amortTotal = (cs.amort_materiel || 0) + (cs.amort_batiments || 0) + (cs.amort_irrigation || 0);
    const fraisFin = cs.frais_financiers || 0;
    const csHorsAmortFF = expl.charges_structure_total - amortTotal - fraisFin;
    const aidesTotal = calcAides(expl, annee, ref);

    sigParAnnee[annee] = calculerSIGAgrege({
      ventesTotal: resume.totalProduitBrut - aidesTotal,
      aidesTotal,
      chargesOpeTotal: resume.totalChargesOpe,
      chargesStructureTotal: csHorsAmortFF,
      amortissementsTotal: amortTotal,
      fraisFinanciersTotal: fraisFin
    });
  }

  const sig = sigParAnnee[state.annee];

  container.innerHTML = `
    <h2 style="font-size: 1.3rem; font-weight: 800; color: var(--accent); margin-bottom: 16px;">
      Soldes Intermediaires de Gestion - ${expl.nom}
    </h2>

    <div class="grid-2">
      <div class="card">
        <div class="card-header">SIG - Annee ${state.annee} (${ref.annees[state.annee]?.label || ''})</div>
        <div class="table-container">
          <table>
            <tbody>
              ${sigRow('Ventes de récolte', sig.ventes, '')}
              ${sigRow('Aides PAC et subventions', sig.aides, '')}
              ${sigRow('Autres produits', sig.autresProduits, '')}
              ${sigRow('PRODUIT BRUT', sig.produitBrut, 'bold primary-bg')}
              ${sigRow('Charges opérationnelles', -sig.chargesOpe, 'danger')}
              ${sigRow('MARGE BRUTE', sig.margeBrute, 'bold success-bg')}
              ${sigRow('Charges de structure', -sig.chargesStructure, 'danger')}
              ${sigRow('EBE', sig.ebe, 'bold ' + (sig.ebe >= 0 ? 'success-bg' : 'danger-bg'))}
              ${sigRow('Amortissements', -sig.amortissements, '')}
              ${sigRow('Résultat d\'exploitation', sig.resultatExploitation, 'bold')}
              ${sigRow('Frais financiers', -sig.fraisFinanciers, '')}
              ${sigRow('RCAI', sig.rcai, 'bold ' + (sig.rcai >= 0 ? 'success-bg' : 'danger-bg'))}
            </tbody>
          </table>
        </div>
      </div>
      <div class="card">
        <div class="card-header">Formation du résultat (waterfall)</div>
        <div class="chart-container">
          <canvas id="chart-waterfall"></canvas>
        </div>
      </div>
    </div>

    <div class="card mt-4">
      <div class="card-header">Comparaison sur 3 ans</div>
      <div class="grid-2">
        <div class="table-container">
          <table>
            <thead><tr><th>Indicateur</th><th>N-2</th><th>N-1</th><th>N</th></tr></thead>
            <tbody>
              ${comp3Row('Produit brut', sigParAnnee, 'produitBrut')}
              ${comp3Row('Charges opé', sigParAnnee, 'chargesOpe')}
              ${comp3Row('Marge brute', sigParAnnee, 'margeBrute')}
              ${comp3Row('EBE', sigParAnnee, 'ebe')}
              ${comp3Row('RCAI', sigParAnnee, 'rcai')}
            </tbody>
          </table>
        </div>
        <div class="chart-container">
          <canvas id="chart-3ans"></canvas>
        </div>
      </div>
    </div>

    <div class="card mt-4">
      <div class="card-header">Ratios clés</div>
      <div class="kpi-grid">
        ${ratioKPI('EBE/Produit brut', sig.produitBrut > 0 ? Math.round(sig.ebe / sig.produitBrut * 100) + '%' : '-', sig.produitBrut > 0 && sig.ebe / sig.produitBrut > 0.3 ? 'ok' : 'attention', 'Objectif > 30%')}
        ${ratioKPI('Annuités/EBE', sig.ebe > 0 ? Math.round((expl.annuites_total || 0) / sig.ebe * 100) + '%' : 'N/A', sig.ebe > 0 && (expl.annuites_total || 0) / sig.ebe < 0.5 ? 'ok' : 'critique', 'Alerte si > 50%')}
        ${ratioKPI('Ch. ope/ha', Math.round(sig.chargesOpe / expl.sau_totale) + ' EUR/ha', '', '')}
        ${ratioKPI('EBE/ha', Math.round(sig.ebe / expl.sau_totale) + ' EUR/ha', sig.ebe / expl.sau_totale > 300 ? 'ok' : 'attention', '')}
      </div>
    </div>
  `;

  renderWaterfall(sig);
  render3YearChart(sigParAnnee);
}

function renderWaterfall(sig) {
  const ctx = document.getElementById('chart-waterfall');
  if (!ctx) return;

  const labels = ['Produit brut', 'Ch. opé', 'Marge brute', 'Ch. struct.', 'EBE', 'Amort.', 'Fr. fin.', 'RCAI'];
  const values = [sig.produitBrut, -sig.chargesOpe, sig.margeBrute, -sig.chargesStructure, sig.ebe, -sig.amortissements, -sig.fraisFinanciers, sig.rcai];
  const colors = values.map(v => v >= 0 ? COLORS.positive : COLORS.negative);

  // For waterfall, we use floating bars
  const bases = [0, sig.produitBrut, 0, sig.margeBrute, 0, sig.ebe, sig.resultatExploitation, 0];
  const tops = [sig.produitBrut, sig.margeBrute + sig.chargesOpe, sig.margeBrute, sig.ebe + sig.chargesStructure, sig.ebe, sig.resultatExploitation + sig.amortissements, sig.rcai + sig.fraisFinanciers, sig.rcai];

  const chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: colors,
        borderRadius: 3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      animation: { duration: 600, easing: 'easeOutQuart' },
      plugins: {
        tooltip: euroTooltip,
        legend: legendHidden
      },
      scales: {
        y: euroScale({ zeroLine: true }),
        x: categoryScale()
      }
    }
  });
  charts.push(chart);
}

function render3YearChart(sigParAnnee) {
  const ctx = document.getElementById('chart-3ans');
  if (!ctx) return;

  const chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Marge brute', 'EBE', 'RCAI'],
      datasets: [
        { label: 'N-2', data: [sigParAnnee['N-2'].margeBrute, sigParAnnee['N-2'].ebe, sigParAnnee['N-2'].rcai], backgroundColor: COLORS.slate, borderRadius: 3, barPercentage: 0.7, categoryPercentage: 0.75 },
        { label: 'N-1', data: [sigParAnnee['N-1'].margeBrute, sigParAnnee['N-1'].ebe, sigParAnnee['N-1'].rcai], backgroundColor: COLORS.steel, borderRadius: 3, barPercentage: 0.7, categoryPercentage: 0.75 },
        { label: 'N', data: [sigParAnnee['N'].margeBrute, sigParAnnee['N'].ebe, sigParAnnee['N'].rcai], backgroundColor: COLORS.navy, borderRadius: 3, barPercentage: 0.7, categoryPercentage: 0.75 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: { tooltip: euroTooltip, legend: legendTop },
      scales: { y: euroScale(), x: categoryScale() }
    }
  });
  charts.push(chart);
}

function sigRow(label, value, cls) {
  const isBold = cls.includes('bold');
  const bg = cls.includes('success-bg') ? 'background: rgba(34,197,94,0.08);' :
             cls.includes('danger-bg') ? 'background: rgba(239,68,68,0.08);' :
             cls.includes('primary-bg') ? 'background: rgba(45,80,22,0.06);' : '';
  const color = value < 0 ? 'color: var(--danger);' : '';
  return `<tr style="${bg}">
    <td ${isBold ? 'class="font-bold"' : ''}>${label}</td>
    <td class="text-right ${isBold ? 'font-bold' : ''}" style="${color}">${fmtM(value)}</td>
  </tr>`;
}

function comp3Row(label, sigPar, key) {
  return `<tr>
    <td class="font-bold">${label}</td>
    <td class="text-right">${fmtM(sigPar['N-2'][key])}</td>
    <td class="text-right">${fmtM(sigPar['N-1'][key])}</td>
    <td class="text-right font-bold">${fmtM(sigPar['N'][key])}</td>
  </tr>`;
}

function ratioKPI(label, value, status, sub) {
  return `<div class="kpi-card ${status}">
    <div class="kpi-card-accent"></div>
    <div class="kpi-card-body">
      <div class="kpi-card-top"><div class="kpi-label">${label}</div>${status === 'ok' ? '<span class="kpi-badge ok">Sain</span>' : status === 'critique' ? '<span class="kpi-badge critique">Critique</span>' : status === 'attention' ? '<span class="kpi-badge attention">Vigilance</span>' : ''}</div>
      <div class="kpi-value">${value}</div>
      ${sub ? `<div class="kpi-sub"><span class="kpi-variation neutral">${sub}</span></div>` : ''}
    </div>
  </div>`;
}

function calcAides(expl, annee, ref) {
  const a = ref.aides_pac;
  const sau = expl.sau_totale;
  const assol = expl.assolements[annee] || [];
  let t = sau * (a.dpb_moyen + (expl.eco_regime === 'superieur' ? a.eco_regime_sup : a.eco_regime_inf));
  t += Math.min(sau, a.redistributif_plafond_ha) * a.redistributif;
  t += assol.filter(c => ['pois','feverole','lentille_puy'].includes(c.culture)).reduce((s,c) => s+c.surface, 0) * a.aide_couplee_proteagineux;
  if (expl.ichn_montant) t += expl.ichn_montant;
  return t;
}

function fmtM(n) { return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n || 0); }
