import { chargerExploitation, chargerReferentiel, chargerITK, getEtat } from '../app.js';
import { calculerCoutsProduction } from '../engine/couts-production.js?v=10';
import { calculerTresorerieEstimee, calculerIndicateursTreso } from '../engine/tresorerie.js?v=10';
import { renderStepper, renderStepObjective, renderStepNavigation } from '../components/stepper.js';
import { setProgression } from '../state.js';
import { COLORS, fmtEur, fmtK as fmtKChart, applyFinancialDefaults, euroScale, categoryScale, euroTooltip, legendHidden, zeroLineGrid } from '../chart-config.js';

let charts = [];
export async function render(container) {
  charts.forEach(c => c.destroy()); charts = [];
  applyFinancialDefaults();
  const state = getEtat();
  setProgression(state.exploitationId, 4);
  const expl = await chargerExploitation(state.exploitationId);
  const ref = await chargerReferentiel();
  const itk = await chargerITK();
  const annee = state.annee;
  const cdp = calculerCoutsProduction(expl, annee, ref, itk);
  const plan = calculerTresorerieEstimee(expl, annee, ref, cdp);
  const indic = calculerIndicateursTreso(plan);
  const fmtM = n => new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(n||0);
  const fmtK = n => n ? (n/1000).toFixed(1)+'k' : '-';

  container.innerHTML = `
    ${renderStepper(4)}
    ${renderStepObjective(4)}
    <h2 style="font-size:1.3rem;font-weight:800;color:var(--accent);margin-bottom:16px;">Plan de trésorerie - ${expl.nom} - ${annee}</h2>
    <div class="kpi-grid">
      <div class="kpi-card ${indic.tresorerieMin<0?'critique':'ok'}">
        <div class="kpi-card-accent"></div>
        <div class="kpi-card-body">
          <div class="kpi-card-top"><div class="kpi-icon ${indic.tresorerieMin<0?'red':'green'}"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 12V7H5a2 2 0 010-4h14v4"/><path d="M3 5v14a2 2 0 002 2h16v-5"/><path d="M18 12a2 2 0 100 4h4v-4h-4z"/></svg></div><div class="kpi-label">Trésorerie min</div></div>
          <div class="kpi-value">${fmtM(indic.tresorerieMin)}</div>
          <div class="kpi-sub"><span class="kpi-variation neutral">Mois : ${indic.moisCritique}</span></div>
        </div>
      </div>
      <div class="kpi-card ${indic.bfr>0?'attention':'ok'}">
        <div class="kpi-card-accent"></div>
        <div class="kpi-card-body">
          <div class="kpi-card-top"><div class="kpi-icon ${indic.bfr>0?'amber':'green'}"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg></div><div class="kpi-label">BFR max</div></div>
          <div class="kpi-value">${fmtM(indic.bfr)}</div>
        </div>
      </div>
      <div class="kpi-card ok">
        <div class="kpi-card-accent"></div>
        <div class="kpi-card-body">
          <div class="kpi-card-top"><div class="kpi-icon green"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg></div><div class="kpi-label">Total encaissements</div></div>
          <div class="kpi-value">${fmtM(indic.totalEncaissements)}</div>
        </div>
      </div>
      <div class="kpi-card ${indic.moisNegatifs>3?'critique':indic.moisNegatifs>0?'attention':'ok'}">
        <div class="kpi-card-accent"></div>
        <div class="kpi-card-body">
          <div class="kpi-card-top"><div class="kpi-icon ${indic.moisNegatifs>3?'red':indic.moisNegatifs>0?'amber':'green'}"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div><div class="kpi-label">Mois négatifs</div>${indic.moisNegatifs>0?`<span class="kpi-badge ${indic.moisNegatifs>3?'critique':'attention'}">${indic.moisNegatifs>3?'Critique':'Vigilance'}</span>`:''}</div>
          <div class="kpi-value">${indic.moisNegatifs}/12</div>
        </div>
      </div>
    </div>
    <div class="card mt-4"><div class="card-header">Trésorerie cumulée</div><div class="chart-container"><canvas id="chart-treso"></canvas></div></div>
    <div class="card mt-4"><div class="card-header">Détail mensuel</div><div class="table-container"><table>
      <thead><tr><th>Mois</th>${plan.map(m=>`<th class="text-center" style="${m.tresorerie_cumulee<0?'background:var(--danger);':''}">${m.label}</th>`).join('')}</tr></thead>
      <tbody>
        <tr><td class="font-bold">Encaiss.</td>${plan.map(m=>`<td class="text-right">${fmtK(m.encaissements.total)}</td>`).join('')}</tr>
        <tr><td style="padding-left:16px;">Ventes</td>${plan.map(m=>`<td class="text-right text-muted">${fmtK(m.encaissements.ventes_cereales)}</td>`).join('')}</tr>
        <tr><td style="padding-left:16px;">Aides</td>${plan.map(m=>`<td class="text-right text-muted">${fmtK(m.encaissements.aides_pac)}</td>`).join('')}</tr>
        <tr><td class="font-bold">Décaiss.</td>${plan.map(m=>`<td class="text-right">${fmtK(m.decaissements.total)}</td>`).join('')}</tr>
        <tr><td style="padding-left:16px;">Intrants</td>${plan.map(m=>`<td class="text-right text-muted">${fmtK(m.decaissements.achats_intrants)}</td>`).join('')}</tr>
        <tr><td style="padding-left:16px;">Structure</td>${plan.map(m=>`<td class="text-right text-muted">${fmtK(m.decaissements.charges_structure)}</td>`).join('')}</tr>
        <tr><td style="padding-left:16px;">Annuités</td>${plan.map(m=>`<td class="text-right text-muted">${fmtK(m.decaissements.annuites_emprunt)}</td>`).join('')}</tr>
        <tr style="border-top:2px solid var(--accent);"><td class="font-bold">Solde</td>${plan.map(m=>`<td class="text-right font-bold ${m.solde_mensuel>=0?'text-success':'text-danger'}">${fmtK(m.solde_mensuel)}</td>`).join('')}</tr>
        <tr style="background:rgba(45,80,22,0.06);"><td class="font-bold">Cumul</td>${plan.map(m=>`<td class="text-right font-bold ${m.tresorerie_cumulee<0?'text-danger':''}">${fmtK(m.tresorerie_cumulee)}</td>`).join('')}</tr>
      </tbody></table></div></div>
    ${renderStepNavigation(4, state.exploitationId)}`;

  const ctx = document.getElementById('chart-treso');
  if (ctx) {
    const c = new Chart(ctx, {
      type: 'line',
      data: {
        labels: plan.map(m => m.label),
        datasets: [{
          label: 'Trésorerie cumulée',
          data: plan.map(m => m.tresorerie_cumulee),
          borderColor: COLORS.navy,
          borderWidth: 2.5,
          tension: 0.35,
          fill: true,
          backgroundColor: COLORS.navyBg,
          pointBackgroundColor: plan.map(m => m.tresorerie_cumulee >= 0 ? COLORS.positive : COLORS.negative),
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        }]
      },
      options: {
        responsive: true,
        animation: { duration: 800, easing: 'easeOutQuart' },
        plugins: {
          legend: legendHidden,
          tooltip: { callbacks: { label: ctx => `Trésorerie : ${fmtEur(ctx.parsed.y)}` } }
        },
        scales: {
          y: euroScale({ zeroLine: true }),
          x: categoryScale()
        }
      }
    });
    charts.push(c);
  }
}
