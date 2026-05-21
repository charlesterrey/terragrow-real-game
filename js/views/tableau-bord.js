// js/views/tableau-bord.js — Fiche client exploitation
import { chargerExploitation, chargerReferentiel, chargerITK, chargerToutesExploitations, getEtat } from '../app.js';
import { calculerCoutsProduction, calculerResumeCdP } from '../engine/couts-production.js?v=10';
import { calculerSIGAgrege, calculerRatios } from '../engine/sig.js?v=10';
import { calculerTresorerieEstimee, calculerIndicateursTreso } from '../engine/tresorerie.js?v=10';
import { calculerResilience } from '../engine/resilience.js?v=10';
import { genererDiagnostic } from '../engine/diagnostic.js?v=10';
import { renderStepper, renderStepObjective, renderStepNavigation } from '../components/stepper.js';
import { setProgression } from '../state.js';

let charts = [];

export async function render(container) {
  charts.forEach(c => c.destroy());
  charts = [];

  const state = getEtat();
  setProgression(state.exploitationId, 2);
  const expl = await chargerExploitation(state.exploitationId);
  const ref = await chargerReferentiel();
  const itk = await chargerITK();
  const annee = state.annee;
  const allExpls = await chargerToutesExploitations();

  const ids = allExpls.map(e => e.id);
  const curIdx = ids.indexOf(expl.id);
  const prevId = curIdx > 0 ? ids[curIdx - 1] : null;
  const nextId = curIdx < ids.length - 1 ? ids[curIdx + 1] : null;

  const cdp = calculerCoutsProduction(expl, annee, ref, itk);
  const resume = calculerResumeCdP(cdp);
  const cs = expl.charges_structure;
  const amortTotal = (cs.amort_materiel || 0) + (cs.amort_batiments || 0) + (cs.amort_irrigation || 0);
  const ff = cs.frais_financiers || 0;
  const csHors = expl.charges_structure_total - amortTotal - ff;
  const aides = calcAides(expl, annee, ref);
  const sig = calculerSIGAgrege({ ventesTotal: resume.totalProduitBrut - aides, aidesTotal: aides, chargesOpeTotal: resume.totalChargesOpe, chargesStructureTotal: csHors, amortissementsTotal: amortTotal, fraisFinanciersTotal: ff });
  const ratios = calculerRatios(sig, expl.annuites_total || 0);
  const planT = calculerTresorerieEstimee(expl, annee, ref, cdp);
  const indT = calculerIndicateursTreso(planT);
  const assolement = expl.assolements[annee] || [];
  const resil = calculerResilience({ tresorerieMin: indT.tresorerieMin || 0, annuites: expl.annuites_total || 0, ebe: sig.ebe, assolement, cdpParCulture: cdp, chargesFixesTotales: expl.charges_structure_total, chargesTotales: resume.totalChargesOpe + expl.charges_structure_total });

  // Diagnostic structurel
  const diagnostic = genererDiagnostic(expl, annee, ref, itk, { cdp, resume, sig, ratios, planT, indT, resil });

  const annEbe = sig.ebe > 0 ? Math.round((expl.annuites_total || 0) / sig.ebe * 100) : 999;
  const rk = expl.region.replace(/-/g, '_');
  const RC = { beauce: { bg: '#DBEAFE', text: '#1D4ED8' }, nord_picardie: { bg: '#DCFCE7', text: '#15803D' }, bretagne: { bg: '#FEF3C7', text: '#B45309' }, sud_ouest: { bg: '#FEE2E2', text: '#DC2626' }, rhone_alpes: { bg: '#EDE9FE', text: '#7C3AED' } };
  const RL = { beauce: 'Beauce', nord_picardie: 'Nord-Picardie', bretagne: 'Bretagne', sud_ouest: 'Sud-Ouest', rhone_alpes: 'Rhône-Alpes' };
  const rc = RC[rk] || { bg: '#F3F4F6', text: '#4B5563' };

  container.innerHTML = `
    ${renderStepper(2)}
    ${renderStepObjective(2)}
    <style>
      .fc-nav { display: flex; align-items: center; gap: 6px; margin-bottom: 20px; }
      .fc-nav-btn { padding: 5px 10px; border: 1px solid var(--gray-200); border-radius: 6px; background: white; color: var(--gray-500); font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.1s; display: inline-flex; align-items: center; gap: 4px; text-decoration: none; line-height: 1; }
      .fc-nav-btn:hover { background: var(--gray-50); color: var(--gray-700); border-color: var(--gray-300); }
      .fc-nav-btn[disabled] { opacity: 0.3; pointer-events: none; }
      .fc-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid var(--gray-100); }
      .fc-avatar { width: 40px; height: 40px; background: var(--accent); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 15px; flex-shrink: 0; }
      .fc-tabs { display: flex; gap: 2px; background: var(--gray-100); padding: 3px; border-radius: 8px; width: fit-content; margin-bottom: 20px; }
      .fc-tab { padding: 5px 14px; border: none; border-radius: 6px; font-size: 12px; font-weight: 500; color: var(--gray-500); background: transparent; cursor: pointer; transition: all 0.1s; }
      .fc-tab:hover { color: var(--gray-700); background: rgba(255,255,255,0.6); }
      .fc-tab.active { color: var(--gray-900); background: white; font-weight: 600; box-shadow: 0 1px 2px rgba(0,0,0,0.06); }
      .fc-props { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0; border: 1px solid var(--gray-100); border-radius: 10px; background: white; overflow: hidden; margin-bottom: 24px; }
      .fc-prop { padding: 12px 16px; border-bottom: 1px solid var(--gray-100); border-right: 1px solid var(--gray-100); }
      .fc-prop:nth-child(4n) { border-right: none; }
      .fc-prop-label { font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; color: var(--gray-400); margin-bottom: 3px; }
      .fc-prop-value { font-size: 13px; font-weight: 600; color: var(--gray-900); font-variant-numeric: tabular-nums; }
      .sig-row { display: flex; justify-content: space-between; padding: 7px 0; border-bottom: 1px solid var(--gray-100); font-size: 13px; }
      .sig-row:last-child { border-bottom: none; }
      .sig-row.sig-total { font-weight: 700; }
      .sig-row.sig-highlight { background: var(--gray-50); margin: 0 -16px; padding: 8px 16px; border-radius: 6px; }
      .assolement-bar { display: flex; height: 6px; border-radius: 3px; overflow: hidden; gap: 2px; }
    </style>

    <!-- Navigation breadcrumb -->
    <div class="fc-nav">
      <a href="#accueil" class="fc-nav-btn">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        Portefeuille
      </a>
      <span style="color: var(--gray-300);">/</span>
      <span style="font-size: 12px; font-weight: 600; color: var(--gray-700);">${expl.nom}</span>
      <div style="flex:1;"></div>
      <button class="fc-nav-btn" ${!prevId ? 'disabled' : ''} onclick="switchExploitation('${prevId}')">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
      </button>
      <span style="font-size: 11px; color: var(--gray-400); font-variant-numeric: tabular-nums;">${curIdx + 1}/${ids.length}</span>
      <button class="fc-nav-btn" ${!nextId ? 'disabled' : ''} onclick="switchExploitation('${nextId}')">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
      </button>
    </div>

    <!-- Header -->
    <div class="fc-header">
      <div style="display: flex; align-items: center; gap: 14px;">
        <div class="fc-avatar">${expl.nom.charAt(0)}</div>
        <div>
          <h1 style="font-size: 18px; font-weight: 700; color: var(--gray-900); letter-spacing: -0.3px; margin-bottom: 3px;">${expl.nom}</h1>
          <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
            <span style="font-size: 13px; color: var(--gray-500);">${expl.exploitant}</span>
            <span style="width:3px;height:3px;border-radius:50%;background:var(--gray-300);"></span>
            <span style="display:inline-block;background:${rc.bg};color:${rc.text};padding:1px 8px;border-radius:9999px;font-size:11px;font-weight:500;">${RL[rk] || rk}</span>
            <span style="width:3px;height:3px;border-radius:50%;background:var(--gray-300);"></span>
            <span style="font-size: 13px; color: var(--gray-500);">${expl.commune}</span>
          </div>
        </div>
      </div>
      <div style="display: flex; align-items: center; gap: 8px;">
        <div style="text-align: right;">
          <div style="font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; color: var(--gray-400);">Résilience</div>
          <div style="font-size: 20px; font-weight: 700; color: ${resil.couleur}; font-variant-numeric: tabular-nums; line-height: 1.2;">${resil.score}<span style="font-size: 12px; font-weight: 500; color: var(--gray-400);">/100</span></div>
        </div>
      </div>
    </div>

    ${renderAlerts(sig, annEbe, indT)}

    <!-- Properties -->
    <div class="fc-props">
      ${prop('SAU totale', expl.sau_totale + ' ha')}
      ${prop('Forme juridique', expl.forme_juridique)}
      ${prop('Main d\'oeuvre', expl.uth_total + ' UTH')}
      ${prop('Fermage', expl.sau_fermage + ' ha (' + Math.round(expl.sau_fermage / expl.sau_totale * 100) + '%)')}
      ${prop('Annuités', fm(expl.annuites_total || 0))}
      ${prop('Endettement', fm(expl.emprunts?.reduce((s, e) => s + e.capital_restant, 0) || 0))}
      ${prop('Charges structure', fm(expl.charges_structure_total))}
      ${prop('Exercice', annee + ' (' + (ref.annees[annee]?.label || '') + ')')}
    </div>

    <!-- Tabs -->
    <div class="fc-tabs" id="fc-section-tabs">
      <button class="fc-tab active" data-section="overview" onclick="showFcSection('overview')">Vue d'ensemble</button>
      <button class="fc-tab" data-section="assolement" onclick="showFcSection('assolement')">Assolement</button>
      <button class="fc-tab" data-section="sig" onclick="showFcSection('sig')">SIG</button>
      <button class="fc-tab" data-section="cdp" onclick="showFcSection('cdp')">Coûts de production</button>
      <button class="fc-tab" data-section="patrimoine" onclick="showFcSection('patrimoine')">Patrimoine</button>
      <button class="fc-tab" data-section="diagnostic" onclick="showFcSection('diagnostic')">Diagnostic</button>
    </div>

    <!-- Overview -->
    <div id="section-overview" class="fc-section">
      <div class="kpi-grid">
        ${kpi('Produit brut', fm(sig.produitBrut), '', Math.round(sig.produitBrut / expl.sau_totale) + ' EUR/ha', '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>')}
        ${kpi('Marge brute', fm(sig.margeBrute), sig.margeBrute > 0 ? 'ok' : 'critique', Math.round(sig.margeBrute / expl.sau_totale) + ' EUR/ha', '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>')}
        ${kpi('EBE', fm(sig.ebe), ratios.alerteEbe, Math.round(sig.ebe / expl.sau_totale) + ' EUR/ha', '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>')}
        ${kpi('RCAI', fm(sig.rcai), ratios.alerteRcai, sig.rcai >= 0 ? 'Bénéfice' : 'Perte', '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>')}
        ${kpi('Trésorerie min.', fm(indT.tresorerieMin || 0), (indT.tresorerieMin || 0) < 0 ? 'critique' : 'ok', indT.moisCritique ? 'Mois : ' + indT.moisCritique : '', '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 12V7H5a2 2 0 010-4h14v4"/><path d="M3 5v14a2 2 0 002 2h16v-5"/><path d="M18 12a2 2 0 100 4h4v-4h-4z"/></svg>')}
        ${kpi('Annuités / EBE', (annEbe < 999 ? annEbe + '%' : '--'), ratios.alerteAnnuites, annEbe > 60 ? 'Sous tension' : 'Correct', '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>')}
      </div>
    </div>

    <!-- Assolement -->
    <div id="section-assolement" class="fc-section" style="display:none;">
      <div class="card" style="padding: 16px;">
        <div class="assolement-bar" style="margin-bottom: 16px;">
          ${assolement.map((c, i) => `<div style="flex:${c.surface};background:${chartColors[i % chartColors.length]};border-radius:2px;" title="${fmtC(c.culture)}: ${c.surface} ha"></div>`).join('')}
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 6px;">
          ${assolement.map((c, i) => `
            <div style="display:flex;align-items:center;gap:8px;padding:8px 10px;border:1px solid var(--gray-100);border-radius:8px;">
              <div style="width:8px;height:8px;border-radius:2px;background:${chartColors[i % chartColors.length]};flex-shrink:0;"></div>
              <div style="min-width:0;">
                <div style="font-size:13px;font-weight:600;color:var(--gray-900);">${fmtC(c.culture)}</div>
                <div style="font-size:11px;color:var(--gray-400);">${c.surface} ha (${Math.round(c.surface / expl.sau_totale * 100)}%) -- ${c.rendement_vise || c.rendement_realise || '?'} q/ha</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <!-- SIG -->
    <div id="section-sig" class="fc-section" style="display:none;">
      <div class="card" style="padding: 16px;">
        ${sigLine('Ventes de récolte', sig.ventes)}
        ${sigLine('Aides PAC', sig.aides)}
        ${sigLine('Produit brut', sig.produitBrut, true, true)}
        ${sigLine('Charges opérationnelles', -sig.chargesOpe, false, false, true)}
        ${sigLine('Marge brute', sig.margeBrute, true)}
        ${sigLine('Charges de structure', -sig.chargesStructure, false, false, true)}
        ${sigLine('EBE', sig.ebe, true, true)}
        ${sigLine('Amortissements', -sig.amortissements, false, false, true)}
        ${sigLine('Frais financiers', -sig.fraisFinanciers, false, false, true)}
        ${sigLine('RCAI', sig.rcai, true, true)}
      </div>
    </div>

    <!-- CdP -->
    <div id="section-cdp" class="fc-section" style="display:none;">
      <div style="background: white; border: 1px solid var(--gray-100); border-radius: 10px; overflow: hidden;">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="padding:9px 16px;text-align:left;font-size:11px;font-weight:600;color:var(--gray-400);text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid var(--gray-200);background:var(--gray-50);">Culture</th>
              <th style="padding:9px 16px;text-align:right;font-size:11px;font-weight:600;color:var(--gray-400);text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid var(--gray-200);background:var(--gray-50);">Surface</th>
              <th style="padding:9px 16px;text-align:right;font-size:11px;font-weight:600;color:var(--gray-400);text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid var(--gray-200);background:var(--gray-50);">Rdt</th>
              <th style="padding:9px 16px;text-align:right;font-size:11px;font-weight:600;color:var(--gray-400);text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid var(--gray-200);background:var(--gray-50);">CdP/t</th>
              <th style="padding:9px 16px;text-align:right;font-size:11px;font-weight:600;color:var(--gray-400);text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid var(--gray-200);background:var(--gray-50);">Prix vente</th>
              <th style="padding:9px 16px;text-align:right;font-size:11px;font-weight:600;color:var(--gray-400);text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid var(--gray-200);background:var(--gray-50);">Marge/t</th>
              <th style="padding:9px 16px;text-align:right;font-size:11px;font-weight:600;color:var(--gray-400);text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid var(--gray-200);background:var(--gray-50);">MB totale</th>
            </tr>
          </thead>
          <tbody>
            ${cdp.map(c => `<tr style="transition:background 0.1s;" onmouseover="this.style.background='var(--gray-50)'" onmouseout="this.style.background=''">
              <td style="padding:10px 16px;border-bottom:1px solid var(--gray-100);font-weight:600;color:var(--gray-900);font-size:13px;">${fmtC(c.culture)}</td>
              <td style="padding:10px 16px;border-bottom:1px solid var(--gray-100);text-align:right;font-size:13px;font-variant-numeric:tabular-nums;color:var(--gray-600);">${c.surface} ha</td>
              <td style="padding:10px 16px;border-bottom:1px solid var(--gray-100);text-align:right;font-size:13px;font-variant-numeric:tabular-nums;color:var(--gray-600);">${c.rendement_t_ha} t/ha</td>
              <td style="padding:10px 16px;border-bottom:1px solid var(--gray-100);text-align:right;font-size:13px;font-weight:600;font-variant-numeric:tabular-nums;">${Math.round(c.cdp_tonne)}</td>
              <td style="padding:10px 16px;border-bottom:1px solid var(--gray-100);text-align:right;font-size:13px;font-variant-numeric:tabular-nums;color:var(--gray-600);">${Math.round(c.prix_vente)}</td>
              <td style="padding:10px 16px;border-bottom:1px solid var(--gray-100);text-align:right;font-size:13px;font-weight:600;color:${c.marge_tonne >= 0 ? 'var(--green-500)' : 'var(--red-500)'};font-variant-numeric:tabular-nums;">${c.marge_tonne >= 0 ? '+' : ''}${Math.round(c.marge_tonne)}</td>
              <td style="padding:10px 16px;border-bottom:1px solid var(--gray-100);text-align:right;font-size:13px;font-variant-numeric:tabular-nums;color:${c.marge_brute_totale >= 0 ? 'var(--gray-700)' : 'var(--red-500)'};">${fmtKv(c.marge_brute_totale)}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Patrimoine -->
    <div id="section-patrimoine" class="fc-section" style="display:none;">
      <div class="grid-2">
        <div class="card">
          <div class="card-header">Matériel</div>
          <div style="max-height: 320px; overflow-y: auto;">
            ${(expl.materiel || []).map(m => `
              <div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--gray-100);font-size:12px;">
                <span style="color:var(--gray-700);">${m.nom}</span>
                <span style="color:var(--gray-400);font-variant-numeric:tabular-nums;white-space:nowrap;margin-left:12px;">${fm(m.amort_annuel)}/an</span>
              </div>
            `).join('')}
          </div>
        </div>
        <div>
          <div class="card">
            <div class="card-header">Emprunts</div>
            ${(expl.emprunts || []).map(e => `
              <div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--gray-100);font-size:12px;">
                <div>
                  <div style="color:var(--gray-700);">${e.objet}</div>
                  <div style="color:var(--gray-400);font-size:11px;">Ech. ${e.echeance} -- ${e.taux}%</div>
                </div>
                <div style="text-align:right;white-space:nowrap;margin-left:12px;">
                  <div style="color:var(--gray-900);font-weight:600;font-variant-numeric:tabular-nums;">${fm(e.annuite)}/an</div>
                  <div style="color:var(--gray-400);font-size:11px;">CRD ${fm(e.capital_restant)}</div>
                </div>
              </div>
            `).join('')}
          </div>
          <div class="card">
            <div class="card-header">Bâtiments</div>
            ${(expl.batiments || []).map(b => `
              <div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--gray-100);font-size:12px;">
                <span style="color:var(--gray-700);">${b.nom}</span>
                <span style="color:var(--gray-400);font-variant-numeric:tabular-nums;">${fm(b.valeur)}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>

    <!-- Diagnostic -->
    <div id="section-diagnostic" class="fc-section" style="display:none;">
      ${renderDiagnosticSection(diagnostic)}
    </div>

    ${renderStepNavigation(2, state.exploitationId)}
  `;

  window.showFcSection = function(id) {
    document.querySelectorAll('.fc-section').forEach(s => s.style.display = 'none');
    document.querySelectorAll('.fc-tab').forEach(t => t.classList.toggle('active', t.dataset.section === id));
    const el = document.getElementById('section-' + id);
    if (el) el.style.display = '';
  };
}

const chartColors = ['#3B82F6','#F59E0B','#10B981','#8B5CF6','#EF4444','#EC4899','#06B6D4','#F97316','#84CC16','#6366F1'];

function renderAlerts(sig, annEbe, indT) {
  const alerts = [];
  if (sig.rcai < 0) alerts.push({ text: 'RCAI négatif — l\'exploitation perd de l\'argent', type: 'danger' });
  if (annEbe > 80) alerts.push({ text: 'Annuités/EBE à ' + annEbe + '% — capacité de remboursement critique', type: 'danger' });
  else if (annEbe > 50) alerts.push({ text: 'Annuités/EBE à ' + annEbe + '% — vigilance requise', type: 'warning' });
  if ((indT.tresorerieMin || 0) < 0) alerts.push({ text: 'Trésorerie négative en ' + (indT.moisCritique || '?') + ' (' + fm(indT.tresorerieMin) + ')', type: 'danger' });
  if (!alerts.length) return '';
  return `<div style="margin-bottom: 16px;">${alerts.map(a => `<div class="alert alert-${a.type}">${a.text}</div>`).join('')}</div>`;
}

function prop(label, value) {
  return `<div class="fc-prop"><div class="fc-prop-label">${label}</div><div class="fc-prop-value">${value}</div></div>`;
}

function kpi(label, value, status, sub, iconSvg) {
  const iconHtml = iconSvg ? `<div class="kpi-icon ${status === 'ok' ? 'green' : status === 'attention' ? 'amber' : status === 'critique' ? 'red' : 'neutral'}">${iconSvg}</div>` : '';
  const badgeHtml = status === 'ok' ? '<span class="kpi-badge ok">Sain</span>' : status === 'attention' ? '<span class="kpi-badge attention">Vigilance</span>' : status === 'critique' ? '<span class="kpi-badge critique">Critique</span>' : '';
  return `<div class="kpi-card ${status || ''}">
    <div class="kpi-card-accent"></div>
    <div class="kpi-card-body">
      <div class="kpi-card-top">${iconHtml}<div class="kpi-label">${label}</div>${badgeHtml}</div>
      <div class="kpi-value">${value}</div>
      ${sub ? `<div class="kpi-sub"><span class="kpi-variation neutral">${sub}</span></div>` : ''}
    </div>
  </div>`;
}

function sigLine(label, value, isTotal = false, isHighlight = false, isNeg = false) {
  const cls = isTotal ? 'sig-row sig-total' : 'sig-row';
  const extra = isHighlight ? ' sig-highlight' : '';
  const color = isNeg ? 'color:var(--red-500);' : (value < 0 ? 'color:var(--red-500);' : '');
  return `<div class="${cls}${extra}"><span>${label}</span><span style="font-variant-numeric:tabular-nums;${color}">${fm(value)}</span></div>`;
}

function calcAides(expl, annee, ref) {
  const a = ref.aides_pac, sau = expl.sau_totale, as = expl.assolements[annee] || [];
  let t = sau * (a.dpb_moyen + (expl.eco_regime === 'superieur' ? a.eco_regime_sup : a.eco_regime_inf));
  t += Math.min(sau, a.redistributif_plafond_ha) * a.redistributif;
  t += as.filter(c => ['pois', 'feverole', 'lentille_puy'].includes(c.culture)).reduce((s, c) => s + c.surface, 0) * a.aide_couplee_proteagineux;
  if (expl.ichn_montant) t += expl.ichn_montant;
  return t;
}

function fm(n) { return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n || 0); }
function fmtKv(n) { if (Math.abs(n) >= 1000) return Math.round(n / 1000) + 'k'; return Math.round(n) + ''; }
function fmtC(k) {
  return { ble_tendre:'Blé tendre', ble_dur:'Blé dur', orge_hiver:'Orge hiver', orge_printemps:'Orge printemps', colza:'Colza', mais_grain:'Maïs grain', mais_grain_irrigue:'Maïs irrigué', tournesol:'Tournesol', pois:'Pois', feverole:'Féverole', betterave_sucriere:'Betterave', pomme_terre:'Pomme de terre', lin_fibre:'Lin fibre', soja:'Soja', soja_irrigue:'Soja irrigué', sorgho:'Sorgho', triticale:'Triticale', lentille_puy:'Lentille du Puy', haricots_verts:'Haricots verts', petits_pois:'Petits pois', prairie_foin:'Prairie foin' }[k] || k;
}

// ─── Diagnostic section rendering ───

function renderDiagnosticSection(diag) {
  const alerteColors = {
    ok: { bg: '#DCFCE7', text: '#15803D', border: '#BBF7D0', icon: '&#10003;' },
    warning: { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A', icon: '&#9888;' },
    danger: { bg: '#FEE2E2', text: '#991B1B', border: '#FECACA', icon: '&#10060;' }
  };

  const severiteColors = {
    haute: { bg: '#FEE2E2', text: '#991B1B', dot: '#EF4444' },
    moyenne: { bg: '#FEF3C7', text: '#92400E', dot: '#F59E0B' },
    faible: { bg: '#F3F4F6', text: '#4B5563', dot: '#9CA3AF' }
  };

  const impactColors = {
    eleve: { bg: '#FEE2E2', text: '#991B1B' },
    moyen: { bg: '#FEF3C7', text: '#92400E' },
    faible: { bg: '#DCFCE7', text: '#15803D' }
  };

  // --- Note globale ---
  const noteHtml = `
    <div style="display:flex;align-items:center;gap:20px;margin-bottom:24px;">
      <div style="width:72px;height:72px;border-radius:16px;background:${diag.noteCouleur};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
        <span style="font-size:32px;font-weight:800;color:white;line-height:1;">${diag.noteGlobale}</span>
      </div>
      <div>
        <div style="font-size:18px;font-weight:700;color:var(--gray-900);margin-bottom:2px;">Diagnostic : ${diag.noteLabel}</div>
        <div style="font-size:13px;color:var(--gray-500);">${diag.forces.length} point(s) fort(s), ${diag.faiblesses.length} faiblesse(s) identifiée(s), ${diag.risques.length} risque(s)</div>
      </div>
    </div>
  `;

  // --- Ratios cles ---
  const ratioKeys = [
    { key: 'annuitesEbe', label: 'Annuités / EBE' },
    { key: 'ebeHa', label: 'EBE / ha' },
    { key: 'tresorerieHa', label: 'Trésorerie min. / ha' },
    { key: 'chargesStructureHa', label: 'Charges struct. / ha' },
    { key: 'margeSecurite', label: 'Marge de sécurité' },
    { key: 'tauxEndettement', label: 'Taux d\'endettement' },
    { key: 'diversification', label: 'Diversification (Shannon)' },
    { key: 'rcaiHa', label: 'RCAI / ha' }
  ];

  const ratiosHtml = `
    <div class="card" style="padding:16px;margin-bottom:20px;">
      <div class="card-header" style="margin-bottom:12px;">Ratios clés</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(280px, 1fr));gap:10px;">
        ${ratioKeys.map(rk => {
          const r = diag.ratios[rk.key];
          if (!r) return '';
          const c = alerteColors[r.alerte] || alerteColors.ok;
          const val = r.unite === 'EUR/ha' ? Math.round(r.valeur) + ' EUR/ha' :
                      r.unite === '%' ? Math.round(r.valeur) + '%' :
                      (Math.round(r.valeur * 100) / 100).toString();
          return `
            <div style="display:flex;align-items:flex-start;gap:10px;padding:10px 12px;border:1px solid ${c.border};border-radius:8px;background:${c.bg};">
              <span style="font-size:14px;flex-shrink:0;margin-top:1px;">${c.icon}</span>
              <div style="min-width:0;">
                <div style="display:flex;align-items:baseline;gap:6px;flex-wrap:wrap;">
                  <span style="font-size:12px;font-weight:600;color:${c.text};text-transform:uppercase;letter-spacing:0.3px;">${rk.label}</span>
                  <span style="font-size:15px;font-weight:700;color:${c.text};font-variant-numeric:tabular-nums;">${val}</span>
                </div>
                <div style="font-size:11px;color:${c.text};opacity:0.85;margin-top:2px;">${r.interpretation}</div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;

  // --- Forces ---
  const forcesHtml = diag.forces.length > 0 ? `
    <div class="card" style="padding:16px;margin-bottom:20px;">
      <div class="card-header" style="margin-bottom:12px;">
        <span style="color:#15803D;">&#10003;</span> Points forts (${diag.forces.length})
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;">
        ${diag.forces.map(f => `
          <div style="padding:10px 12px;border:1px solid #BBF7D0;border-radius:8px;background:#F0FDF4;">
            <div style="font-size:13px;font-weight:600;color:#15803D;margin-bottom:2px;">${f.titre}</div>
            <div style="font-size:12px;color:#166534;">${f.detail}</div>
          </div>
        `).join('')}
      </div>
    </div>
  ` : '';

  // --- Faiblesses ---
  const faiblessesHtml = diag.faiblesses.length > 0 ? `
    <div class="card" style="padding:16px;margin-bottom:20px;">
      <div class="card-header" style="margin-bottom:12px;">
        <span style="color:#DC2626;">&#9888;</span> Faiblesses (${diag.faiblesses.length})
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;">
        ${diag.faiblesses.map(f => {
          const sc = severiteColors[f.severite] || severiteColors.faible;
          return `
            <div style="padding:10px 12px;border:1px solid ${sc.dot}30;border-radius:8px;background:${sc.bg};">
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px;">
                <span style="width:6px;height:6px;border-radius:50%;background:${sc.dot};flex-shrink:0;"></span>
                <span style="font-size:13px;font-weight:600;color:${sc.text};">${f.titre}</span>
                <span style="font-size:10px;font-weight:500;color:${sc.text};opacity:0.7;text-transform:uppercase;letter-spacing:0.5px;margin-left:auto;">${f.severite}</span>
              </div>
              <div style="font-size:12px;color:${sc.text};padding-left:12px;">${f.detail}</div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  ` : '';

  // --- Risques ---
  const risquesHtml = diag.risques.length > 0 ? `
    <div class="card" style="padding:16px;margin-bottom:20px;">
      <div class="card-header" style="margin-bottom:12px;">
        <span>&#9889;</span> Facteurs de risque (${diag.risques.length})
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;">
        ${diag.risques.map(r => {
          const ic = impactColors[r.impact] || impactColors.moyen;
          return `
            <div style="padding:10px 12px;border:1px solid var(--gray-200);border-radius:8px;background:white;">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;flex-wrap:wrap;">
                <span style="font-size:13px;font-weight:600;color:var(--gray-900);">${r.titre}</span>
                <span style="font-size:10px;font-weight:500;padding:1px 6px;border-radius:9999px;background:${ic.bg};color:${ic.text};text-transform:uppercase;">Impact ${r.impact}</span>
                <span style="font-size:10px;font-weight:500;padding:1px 6px;border-radius:9999px;background:var(--gray-100);color:var(--gray-600);text-transform:uppercase;">Proba. ${r.probabilite}</span>
              </div>
              <div style="font-size:12px;color:var(--gray-600);padding-left:0;">${r.detail}</div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  ` : '';

  // --- Prevision tresorerie ---
  const tresoHtml = `
    <div class="card" style="padding:16px;margin-bottom:20px;">
      <div class="card-header" style="margin-bottom:12px;">Prévision trésorerie</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(150px, 1fr));gap:10px;margin-bottom:12px;">
        <div style="padding:10px;border-radius:8px;background:var(--gray-50);text-align:center;">
          <div style="font-size:11px;color:var(--gray-400);text-transform:uppercase;margin-bottom:2px;">Mois critique</div>
          <div style="font-size:16px;font-weight:700;color:var(--gray-900);">${diag.previsionTresorerie.moisCritique || '--'}</div>
        </div>
        <div style="padding:10px;border-radius:8px;background:${diag.previsionTresorerie.besoinMaximal < 0 ? '#FEE2E2' : '#DCFCE7'};text-align:center;">
          <div style="font-size:11px;color:var(--gray-400);text-transform:uppercase;margin-bottom:2px;">Besoin maximal</div>
          <div style="font-size:16px;font-weight:700;color:${diag.previsionTresorerie.besoinMaximal < 0 ? '#DC2626' : '#15803D'};">${fm(diag.previsionTresorerie.besoinMaximal)}</div>
        </div>
        <div style="padding:10px;border-radius:8px;background:${diag.previsionTresorerie.dureeNegative > 0 ? '#FEF3C7' : '#DCFCE7'};text-align:center;">
          <div style="font-size:11px;color:var(--gray-400);text-transform:uppercase;margin-bottom:2px;">Mois en négatif</div>
          <div style="font-size:16px;font-weight:700;color:${diag.previsionTresorerie.dureeNegative > 0 ? '#92400E' : '#15803D'};">${diag.previsionTresorerie.dureeNegative}</div>
        </div>
      </div>
      <div style="font-size:12px;color:var(--gray-600);padding:8px 10px;background:var(--gray-50);border-radius:6px;">${diag.previsionTresorerie.commentaire}</div>
    </div>
  `;

  // --- Sensibilite ---
  const sensi = diag.sensibilite;
  const sensibiliteHtml = sensi ? `
    <div class="card" style="padding:16px;margin-bottom:20px;">
      <div class="card-header" style="margin-bottom:12px;">Analyse de sensibilité</div>
      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;font-size:12px;">
          <thead>
            <tr>
              <th style="padding:8px 12px;text-align:left;font-weight:600;color:var(--gray-400);text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid var(--gray-200);font-size:11px;">Scénario</th>
              <th style="padding:8px 12px;text-align:right;font-weight:600;color:var(--gray-400);text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid var(--gray-200);font-size:11px;">Perte CA</th>
              <th style="padding:8px 12px;text-align:right;font-weight:600;color:var(--gray-400);text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid var(--gray-200);font-size:11px;">EBE après</th>
              <th style="padding:8px 12px;text-align:left;font-weight:600;color:var(--gray-400);text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid var(--gray-200);font-size:11px;">Verdict</th>
            </tr>
          </thead>
          <tbody>
            ${['prixBle20', 'rendements15', 'combine'].map(k => {
              const s = sensi[k];
              const ebeColor = s.ebeApres < 0 ? '#DC2626' : s.ebeApres < 20000 ? '#F59E0B' : 'var(--gray-900)';
              return `
                <tr style="border-bottom:1px solid var(--gray-100);">
                  <td style="padding:10px 12px;font-weight:600;color:var(--gray-900);">${s.label}</td>
                  <td style="padding:10px 12px;text-align:right;color:#DC2626;font-weight:600;font-variant-numeric:tabular-nums;">${fm(-s.perteCA)}</td>
                  <td style="padding:10px 12px;text-align:right;color:${ebeColor};font-weight:700;font-variant-numeric:tabular-nums;">${fm(s.ebeApres)}</td>
                  <td style="padding:10px 12px;font-size:11px;color:var(--gray-600);">${s.verdict}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  ` : '';

  return noteHtml + ratiosHtml + forcesHtml + faiblessesHtml + risquesHtml + tresoHtml + sensibiliteHtml;
}
