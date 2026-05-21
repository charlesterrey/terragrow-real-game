import { chargerToutesExploitations, chargerReferentiel, chargerITK } from '../app.js';
import { COLORS, applyFinancialDefaults, legendTop } from '../chart-config.js';
import { calculerCoutsProduction, calculerResumeCdP } from '../engine/couts-production.js?v=8';
import { calculerSIGAgrege } from '../engine/sig.js?v=8';
import { calculerResilience } from '../engine/resilience.js?v=8';
import { calculerTresorerieEstimee, calculerIndicateursTreso } from '../engine/tresorerie.js?v=8';

let charts = [];

export async function render(container) {
  charts.forEach(c => c.destroy()); charts = [];
  const expls = await chargerToutesExploitations();
  const ref = await chargerReferentiel();
  const itk = await chargerITK();
  const fm = n => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n || 0);

  container.innerHTML = `<h2 style="font-size:1.3rem;font-weight:800;color:var(--accent);margin-bottom:16px;">Comparaison inter-exploitations</h2>
  <div class="card"><div class="card-header">Sélectionnez 2 à 4 exploitations</div>
  <div style="display:flex;flex-wrap:wrap;gap:8px;">${expls.map(e => `<label style="display:flex;align-items:center;gap:4px;padding:6px 10px;border:1px solid var(--border);border-radius:6px;cursor:pointer;font-size:0.85rem;"><input type="checkbox" class="cmp-cb" value="${e.id}"> ${e.nom} (${e.sau_totale}ha)</label>`).join('')}</div>
  <button class="btn btn-primary mt-4" id="btn-cmp">Comparer</button></div><div id="cmp-res"></div>`;

  document.getElementById('btn-cmp').addEventListener('click', async () => {
    const ids = Array.from(document.querySelectorAll('.cmp-cb:checked')).map(e => e.value);
    if (ids.length < 2) { alert('Min 2'); return; }
    if (ids.length > 4) { alert('Max 4'); return; }
    const res = [];
    for (const id of ids) {
      const e = expls.find(x => x.id === id);
      const cdp = calculerCoutsProduction(e, 'N', ref, itk);
      const r2 = calculerResumeCdP(cdp);
      const cs = e.charges_structure;
      const am = (cs.amort_materiel || 0) + (cs.amort_batiments || 0) + (cs.amort_irrigation || 0);
      const ff = cs.frais_financiers || 0;
      const a2 = calcA(e, ref);
      const sig = calculerSIGAgrege({
        ventesTotal: r2.totalProduitBrut - a2,
        aidesTotal: a2,
        chargesOpeTotal: r2.totalChargesOpe,
        chargesStructureTotal: e.charges_structure_total - am - ff,
        amortissementsTotal: am,
        fraisFinanciersTotal: ff
      });
      const pt = calculerTresorerieEstimee(e, 'N', ref, cdp);
      const it = calculerIndicateursTreso(pt);
      const rl = calculerResilience({
        tresorerieMin: it.tresorerieMin || 0,
        annuites: e.annuites_total || 0,
        ebe: sig.ebe,
        assolement: e.assolements['N'] || [],
        cdpParCulture: cdp,
        chargesFixesTotales: e.charges_structure_total,
        chargesTotales: r2.totalChargesOpe + e.charges_structure_total
      });
      res.push({ e, sig, r2, rl, cdpBle: cdp.find(c => c.culture === 'ble_tendre') });
    }

    document.getElementById('cmp-res').innerHTML = `<div class="card mt-4"><div class="card-header">Tableau comparatif</div><div class="table-container"><table>
    <thead><tr><th>Indicateur</th>${res.map(r => `<th>${r.e.nom}</th>`).join('')}</tr></thead><tbody>
    <tr><td>SAU</td>${res.map(r => `<td class="text-right">${r.e.sau_totale} ha</td>`).join('')}</tr>
    <tr><td>EBE</td>${res.map(r => `<td class="text-right font-bold">${fm(r.sig.ebe)}</td>`).join('')}</tr>
    <tr><td>EBE/ha</td>${res.map(r => `<td class="text-right">${Math.round(r.sig.ebe / r.e.sau_totale)} EUR</td>`).join('')}</tr>
    <tr><td>RCAI</td>${res.map(r => `<td class="text-right ${r.sig.rcai < 0 ? 'text-danger' : ''}">${fm(r.sig.rcai)}</td>`).join('')}</tr>
    <tr><td>CdP blé/t</td>${res.map(r => `<td class="text-right">${r.cdpBle ? Math.round(r.cdpBle.cdp_tonne) + ' EUR' : '-'}</td>`).join('')}</tr>
    <tr><td>Résilience</td>${res.map(r => `<td class="text-right font-bold" style="color:${r.rl.couleur}">${r.rl.score}/100</td>`).join('')}</tr>
    </tbody></table></div></div>
    <div class="card mt-4"><div class="card-header">Radar</div><div class="chart-container" style="max-height:350px;"><canvas id="ch-radar"></canvas></div></div>`;

    const ctx = document.getElementById('ch-radar');
    if (!ctx) return;
    const cols = [COLORS.navy, COLORS.coral, COLORS.sage, COLORS.gold];
    const ch = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: ['EBE/ha', 'Résilience', 'MB/ha', 'Diversif.', 'Faible endett.'],
        datasets: res.map((r, i) => ({
          label: r.e.nom,
          data: [
            Math.min(100, Math.max(0, r.sig.ebe / r.e.sau_totale / 5)),
            r.rl.score,
            Math.min(100, Math.max(0, r.r2.margeBruteHaMoyen / 5)),
            Math.min(100, (r.e.assolements['N']?.length || 1) * 15),
            Math.min(100, Math.max(0, 100 - (r.e.annuites_total || 0) / (r.sig.ebe || 1) * 100))
          ],
          borderColor: cols[i],
          backgroundColor: cols[i] + '20',
          borderWidth: 2.5,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        }))
      },
      options: {
        responsive: true,
        scales: { r: {
          beginAtZero: true,
          max: 100,
          ticks: { font: { size: 10 }, backdropColor: 'transparent', color: '#94A3B8' },
          pointLabels: { font: { size: 11, weight: '500' }, color: '#475569' },
          grid: { color: 'rgba(148,163,184,0.2)' }
        } },
        plugins: { legend: legendTop }
      }
    });
    charts.push(ch);
  });
}

function calcA(e, ref) {
  const a = ref.aides_pac, s = e.sau_totale;
  let t = s * (a.dpb_moyen + (e.eco_regime === 'superieur' ? a.eco_regime_sup : a.eco_regime_inf));
  t += Math.min(s, a.redistributif_plafond_ha) * a.redistributif;
  t += (e.assolements['N'] || []).filter(c => ['pois', 'feverole', 'lentille_puy'].includes(c.culture)).reduce((s, c) => s + c.surface, 0) * a.aide_couplee_proteagineux;
  if (e.ichn_montant) t += e.ichn_montant;
  return t;
}
