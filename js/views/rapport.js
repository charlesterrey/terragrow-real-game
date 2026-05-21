import { chargerExploitation, chargerReferentiel, chargerITK, getEtat, sauvegarderEtat } from '../app.js';
import { calculerCoutsProduction, calculerResumeCdP } from '../engine/couts-production.js?v=8';
import { calculerSIGAgrege, calculerRatios } from '../engine/sig.js?v=8';
import { calculerTresorerieEstimee, calculerIndicateursTreso } from '../engine/tresorerie.js?v=8';
import { calculerResilience } from '../engine/resilience.js?v=8';
import { genererDiagnostic } from '../engine/diagnostic.js?v=8';

export async function render(container) {
  const state = getEtat();
  const expl = await chargerExploitation(state.exploitationId);
  const ref = await chargerReferentiel();
  const itk = await chargerITK();
  const annee = state.annee;

  // --- Core calculations ---
  const cdp = calculerCoutsProduction(expl, annee, ref, itk);
  const resume = calculerResumeCdP(cdp);
  const cs = expl.charges_structure;
  const am = (cs.amort_materiel || 0) + (cs.amort_batiments || 0) + (cs.amort_irrigation || 0);
  const ff = cs.frais_financiers || 0;
  const a2 = calcAides(expl, annee, ref);
  const sig = calculerSIGAgrege({
    ventesTotal: resume.totalProduitBrut - a2,
    aidesTotal: a2,
    chargesOpeTotal: resume.totalChargesOpe,
    chargesStructureTotal: expl.charges_structure_total - am - ff,
    amortissementsTotal: am,
    fraisFinanciersTotal: ff
  });
  const ratios = calculerRatios(sig, expl.annuites_total || 0);
  const pt = calculerTresorerieEstimee(expl, annee, ref, cdp);
  const it = calculerIndicateursTreso(pt);
  const rl = calculerResilience({
    tresorerieMin: it.tresorerieMin || 0,
    annuites: expl.annuites_total || 0,
    ebe: sig.ebe,
    assolement: expl.assolements[annee] || [],
    cdpParCulture: cdp,
    chargesFixesTotales: expl.charges_structure_total,
    chargesTotales: resume.totalChargesOpe + expl.charges_structure_total
  });

  // Diagnostic
  let diag = null;
  try { diag = genererDiagnostic(expl, annee, ref, itk); } catch (e) { console.warn('Diagnostic error:', e); }

  // Conseil results
  const conseilRes = state.resultatsConseil;
  const simRes = state.resultatsSimulation;
  const coms = state.commentairesConseil || { analyse: '', justification: '', conclusion: '' };

  // --- Formatting helpers ---
  const fm = n => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n || 0);
  const fn = n => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n || 0);
  const fp = n => (n >= 0 ? '+' : '') + fn(n);
  const fc = k => ({
    ble_tendre: 'Blé tendre', ble_dur: 'Blé dur', orge_hiver: 'Orge hiver',
    orge_printemps: 'Orge print.', colza: 'Colza', mais_grain: 'Maïs grain',
    mais_grain_irrigue: 'Maïs irr.', tournesol: 'Tournesol', pois: 'Pois',
    feverole: 'Féverole', betterave_sucriere: 'Betterave', pomme_terre: 'Pdt',
    lin_fibre: 'Lin', soja: 'Soja', soja_irrigue: 'Soja irr.', sorgho: 'Sorgho',
    triticale: 'Triticale', lentille_puy: 'Lentille', haricots_verts: 'H. verts',
    petits_pois: 'P. pois', prairie_foin: 'Prairie'
  }[k] || k);
  const rn = k => ({ beauce: 'Beauce', nord_picardie: 'Nord-Picardie', bretagne: 'Bretagne', sud_ouest: 'Sud-Ouest', rhone_alpes: 'Rhône-Alpes' }[k] || k);
  const date = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const nom = state.nomEquipe
    ? `${state.nomEquipe}${state.etudiant1 ? ' — ' + state.etudiant1 : ''}${state.etudiant2 ? ' & ' + state.etudiant2 : ''}`
    : (state.nomEtudiant || '');

  // Assolement for table
  const assol = expl.assolements[annee] || [];

  // Grade color helper
  const gc = c => `color:${c};font-weight:900;`;

  // --- Build HTML ---
  let html = '';

  // ===================== PRINT BUTTON =====================
  html += `<div class="no-print" style="margin-bottom:16px;display:flex;gap:12px;align-items:center;flex-wrap:wrap;">
    <button class="btn btn-primary btn-lg" id="btn-print">Imprimer / Exporter PDF</button>
    <span style="font-size:0.85rem;color:var(--text-light);">Le dossier complet sera mis en forme pour l'impression (Ctrl+P)</span>
  </div>`;

  // ===================== PAGE 1: COVER =====================
  html += `<div class="rapport-page rapport-cover" style="text-align:center;padding:80px 40px 60px;min-height:90vh;display:flex;flex-direction:column;justify-content:center;align-items:center;">
    <div style="width:80px;height:4px;background:var(--accent);border-radius:2px;margin-bottom:32px;"></div>
    <div style="font-size:0.9rem;letter-spacing:3px;text-transform:uppercase;color:var(--gray-500);margin-bottom:8px;">TERRAGROW BUSINESS GAME</div>
    <div style="font-size:2.2rem;font-weight:900;color:var(--gray-900);line-height:1.2;">Dossier de recommandation</div>
    <div style="font-size:1rem;color:var(--gray-500);margin-top:4px;">Conseil en gestion d'exploitation agricole</div>
    <div style="width:60px;height:2px;background:var(--gray-300);margin:32px auto;"></div>
    <div style="font-size:1.5rem;font-weight:700;color:var(--gray-800);">${expl.nom}</div>
    <div style="color:var(--gray-500);margin-top:4px;">${expl.exploitant} — ${expl.commune}</div>
    <div style="color:var(--gray-500);">${rn(expl.region)} | ${expl.sau_totale} ha | ${expl.forme_juridique}</div>
    ${nom ? `<div style="margin-top:40px;padding:16px 32px;background:var(--gray-50);border-radius:8px;border:1px solid var(--gray-200);">
      <div style="font-size:0.75rem;text-transform:uppercase;letter-spacing:1px;color:var(--gray-400);margin-bottom:4px;">Réalisé par</div>
      <div style="font-size:1.1rem;font-weight:600;color:var(--gray-800);">${nom}</div>
    </div>` : ''}
    <div style="margin-top:auto;padding-top:40px;font-size:0.85rem;color:var(--gray-400);">${date}</div>
  </div>`;

  // ===================== PAGE 2: FICHE D'IDENTITE =====================
  html += `<div class="rapport-page page-break">
    <div class="rapport-section-header">1. Fiche d'identité de l'exploitation</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;">
      <div class="rapport-info-block">
        <div class="rapport-info-row"><span>Exploitant</span><strong>${expl.exploitant}</strong></div>
        <div class="rapport-info-row"><span>Forme juridique</span><strong>${expl.forme_juridique}</strong></div>
        <div class="rapport-info-row"><span>Commune</span><strong>${expl.commune}</strong></div>
        <div class="rapport-info-row"><span>Region</span><strong>${rn(expl.region)}</strong></div>
      </div>
      <div class="rapport-info-block">
        <div class="rapport-info-row"><span>SAU totale</span><strong>${expl.sau_totale} ha</strong></div>
        <div class="rapport-info-row"><span>dont propriété</span><strong>${expl.sau_propriete || 0} ha</strong></div>
        <div class="rapport-info-row"><span>dont fermage</span><strong>${expl.sau_fermage || 0} ha</strong></div>
        <div class="rapport-info-row"><span>UTH</span><strong>${expl.uth_total}</strong></div>
      </div>
    </div>
    <div class="rapport-sub-header">Assolement (année ${annee})</div>
    <table class="rapport-table"><thead><tr><th>Culture</th><th class="text-right">Surface (ha)</th><th class="text-right">% SAU</th><th class="text-right">Rendement</th></tr></thead><tbody>
    ${assol.map(c => `<tr><td>${fc(c.culture)}</td><td class="text-right">${c.surface}</td><td class="text-right">${Math.round(c.surface / expl.sau_totale * 100)}%</td><td class="text-right">${c.rendement_realise || c.rendement_vise || '-'} q/ha</td></tr>`).join('')}
    <tr class="rapport-table-total"><td>TOTAL</td><td class="text-right">${expl.sau_totale}</td><td class="text-right">100%</td><td></td></tr>
    </tbody></table>
    <div class="rapport-sub-header" style="margin-top:20px;">Indicateurs clés</div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;">
      ${rpKpi('EBE', fm(sig.ebe), sig.ebe > 0 ? 'var(--green-700)' : 'var(--red-500)')}
      ${rpKpi('RCAI', fm(sig.rcai), sig.rcai >= 0 ? 'var(--green-700)' : 'var(--red-500)')}
      ${rpKpi('Résilience', rl.score + '/100', rl.couleur)}
      ${rpKpi('Annuités/EBE', Math.round(ratios?.annuitesEbe || 0) + '%', (ratios?.annuitesEbe || 0) > 50 ? 'var(--red-500)' : 'var(--green-700)')}
    </div>
  </div>`;

  // ===================== PAGE 3: DIAGNOSTIC =====================
  html += `<div class="rapport-page page-break">
    <div class="rapport-section-header">2. Diagnostic de l'exploitation</div>`;
  if (diag) {
    html += `<div style="display:flex;align-items:center;gap:16px;margin-bottom:20px;padding:16px;background:var(--gray-50);border-radius:8px;border:1px solid var(--gray-200);">
      <div style="font-size:3rem;font-weight:900;${gc(diag.noteCouleur)}">${diag.noteGlobale}</div>
      <div><div style="font-size:1.1rem;font-weight:700;color:var(--gray-800);">Note globale : ${diag.noteLabel}</div>
      <div style="font-size:0.85rem;color:var(--gray-500);">Basée sur 8 ratios structurels (CER France)</div></div>
    </div>`;
    // Ratios table
    html += `<div class="rapport-sub-header">Ratios cles</div>
    <table class="rapport-table"><thead><tr><th>Indicateur</th><th class="text-right">Valeur</th><th>Alerte</th><th>Interpretation</th></tr></thead><tbody>`;
    const ratioNames = {
      annuitesEbe: 'Annuités / EBE', ebeHa: 'EBE / ha', tresorerieHa: 'Trésorerie min / ha',
      chargesStructureHa: 'Charges struct. / ha', margeSecurite: 'Marge sécurité moy.',
      tauxEndettement: 'Taux endettement', diversification: 'Diversification (Shannon)', rcaiHa: 'RCAI / ha'
    };
    for (const [k, r] of Object.entries(diag.ratios)) {
      const badge = r.alerte === 'ok' ? '<span style="color:var(--green-700);font-weight:600;">OK</span>'
        : r.alerte === 'warning' ? '<span style="color:var(--amber-500);font-weight:600;">Attention</span>'
        : '<span style="color:var(--red-500);font-weight:600;">Danger</span>';
      html += `<tr><td>${ratioNames[k] || k}</td><td class="text-right">${r.valeur} ${r.unite}</td><td>${badge}</td><td style="font-size:0.8rem;color:var(--gray-600);">${r.interpretation}</td></tr>`;
    }
    html += `</tbody></table>`;
    // Forces & Faiblesses
    if (diag.forces.length) {
      html += `<div class="rapport-sub-header" style="margin-top:16px;">Forces</div><ul class="rapport-list rapport-list-ok">`;
      for (const f of diag.forces) html += `<li><strong>${f.titre}</strong> — ${f.detail}</li>`;
      html += `</ul>`;
    }
    if (diag.faiblesses.length) {
      html += `<div class="rapport-sub-header" style="margin-top:12px;">Faiblesses</div><ul class="rapport-list rapport-list-warn">`;
      for (const f of diag.faiblesses) {
        const sev = f.severite === 'haute' ? ' style="color:var(--red-600);"' : '';
        html += `<li${sev}><strong>${f.titre}</strong> — ${f.detail}</li>`;
      }
      html += `</ul>`;
    }
  } else {
    html += `<p style="color:var(--gray-500);">Diagnostic non disponible.</p>`;
  }
  html += `</div>`;

  // ===================== PAGE 4: COUTS DE PRODUCTION =====================
  html += `<div class="rapport-page page-break">
    <div class="rapport-section-header">3. Analyse des coûts de production</div>
    <table class="rapport-table"><thead><tr><th>Culture</th><th class="text-right">Surface</th><th class="text-right">Rdt (t/ha)</th><th class="text-right">Ch. ope/ha</th><th class="text-right">Ch. meca/ha</th><th class="text-right">Ch. struct/ha</th><th class="text-right">CdP/ha</th><th class="text-right">CdP/t</th><th class="text-right">Prix vente</th><th class="text-right">Marge/t</th></tr></thead><tbody>
    ${cdp.map(c => `<tr>
      <td>${fc(c.culture)}</td>
      <td class="text-right">${c.surface} ha</td>
      <td class="text-right">${(c.rendement_t_ha || 0).toFixed(1)}</td>
      <td class="text-right">${fn(c.charges_ope_ha)}</td>
      <td class="text-right">${fn(c.mecanisation_ha)}</td>
      <td class="text-right">${fn(c.structure_ha)}</td>
      <td class="text-right">${fn(c.cdp_ha)}</td>
      <td class="text-right">${fn(c.cdp_tonne)}</td>
      <td class="text-right">${fn(c.prix_vente)}</td>
      <td class="text-right ${c.marge_tonne >= 0 ? '' : 'text-danger'}" style="font-weight:600;">${fn(c.marge_tonne)}</td>
    </tr>`).join('')}
    </tbody></table>
    <div style="margin-top:16px;padding:12px;background:var(--gray-50);border-radius:6px;font-size:0.85rem;">
      <strong>Lecture :</strong> Le CdP/t inclut charges opérationnelles + mécanisation + charges de structure réparties + rémunération MO, hors aides PAC.
      Les cultures dont la marge/t est négative sont déficitaires au prix de marché actuel.
    </div>
    <div class="rapport-sub-header" style="margin-top:16px;">Synthèse produit brut et charges</div>
    <table class="rapport-table">
      <tr><td>Produit brut total</td><td class="text-right font-bold">${fm(resume.totalProduitBrut)}</td></tr>
      <tr><td>Charges opérationnelles totales</td><td class="text-right">${fm(resume.totalChargesOpe)}</td></tr>
      <tr><td>Charges de structure (hors amort. & frais fi.)</td><td class="text-right">${fm(expl.charges_structure_total - am - ff)}</td></tr>
      <tr><td>Amortissements</td><td class="text-right">${fm(am)}</td></tr>
      <tr><td>Frais financiers</td><td class="text-right">${fm(ff)}</td></tr>
      <tr class="rapport-table-total"><td>RCAI</td><td class="text-right">${fm(sig.rcai)}</td></tr>
    </table>
  </div>`;

  // ===================== PAGE 5: TRESORERIE =====================
  html += `<div class="rapport-page page-break">
    <div class="rapport-section-header">4. Plan de trésorerie mensuel</div>
    <table class="rapport-table" style="font-size:0.75rem;"><thead><tr><th></th>${pt.map(m => `<th class="text-center" style="min-width:55px;">${m.label}</th>`).join('')}</tr></thead><tbody>
    <tr><td style="font-weight:600;">Encaissements</td>${pt.map(m => `<td class="text-right">${Math.round(m.encaissements.total / 1000)}k</td>`).join('')}</tr>
    <tr><td style="font-weight:600;">Décaissements</td>${pt.map(m => `<td class="text-right">${Math.round(m.decaissements.total / 1000)}k</td>`).join('')}</tr>
    <tr style="border-top:2px solid var(--gray-300);"><td style="font-weight:600;">Solde mensuel</td>${pt.map(m => `<td class="text-right ${m.solde_mensuel < 0 ? 'text-danger' : ''}">${Math.round(m.solde_mensuel / 1000)}k</td>`).join('')}</tr>
    <tr style="background:var(--gray-50);font-weight:700;"><td>Cumul</td>${pt.map(m => `<td class="text-right ${m.tresorerie_cumulee < 0 ? 'text-danger' : ''}">${Math.round(m.tresorerie_cumulee / 1000)}k</td>`).join('')}</tr>
    </tbody></table>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:16px;">
      ${rpKpi('BFR max', fm(it.bfr), Math.abs(it.bfr) > 50000 ? 'var(--red-500)' : 'var(--gray-800)')}
      ${rpKpi('Mois critique', it.moisCritique || '-', 'var(--gray-800)')}
      ${rpKpi('Trésorerie min', fm(it.tresorerieMin), (it.tresorerieMin || 0) < 0 ? 'var(--red-500)' : 'var(--green-700)')}
    </div>
    ${diag && diag.previsionTresorerie ? `<div style="margin-top:16px;padding:12px;background:var(--gray-50);border-radius:6px;font-size:0.85rem;">${diag.previsionTresorerie.commentaire}</div>` : ''}
  </div>`;

  // ===================== PAGE 6: SIMULATION =====================
  if (simRes && state.scenarioActif) {
    const sd = simRes.delta || {};
    html += `<div class="rapport-page page-break">
      <div class="rapport-section-header">5. Simulation de crise</div>
      <div style="padding:12px;background:rgba(239,68,68,0.05);border-left:4px solid var(--red-500);border-radius:4px;margin-bottom:16px;">
        <strong>Scénario appliqué :</strong> ${state.scenarioActif}
      </div>
      <div class="rapport-sub-header">Impact sur les indicateurs</div>
      <table class="rapport-table"><thead><tr><th>Indicateur</th><th class="text-right">Avant</th><th class="text-right">Apres</th><th class="text-right">Variation</th></tr></thead><tbody>`;
    const simRows = [
      ['EBE', sd.ebe], ['RCAI', sd.rcai], ['Marge brute', sd.margeBrute],
      ['Trésorerie min', sd.tresorerieMin], ['Résilience', sd.resilience]
    ];
    for (const [label, d] of simRows) {
      if (!d) continue;
      const isRes = label === 'Résilience';
      const fmtV = isRes ? v => (v || 0) + '/100' : v => fm(v);
      const delta = isRes ? ((d.delta || 0) + ' pts') : fm(d.delta || 0);
      const cls = (d.delta || 0) >= 0 ? '' : 'text-danger';
      html += `<tr><td>${label}</td><td class="text-right">${fmtV(d.avant)}</td><td class="text-right ${cls}">${fmtV(d.apres)}</td><td class="text-right ${cls}" style="font-weight:600;">${(d.delta || 0) >= 0 ? '+' : ''}${delta}</td></tr>`;
    }
    html += `</tbody></table>`;
    // CdP variation if available
    if (simRes.cdpApres && simRes.cdpApres.length) {
      html += `<div class="rapport-sub-header" style="margin-top:16px;">Variation des coûts de production</div>
      <table class="rapport-table"><thead><tr><th>Culture</th><th class="text-right">CdP/t avant</th><th class="text-right">CdP/t après</th><th class="text-right">Variation</th></tr></thead><tbody>`;
      for (const ca of simRes.cdpApres) {
        const cb = cdp.find(c => c.culture === ca.culture);
        if (!cb) continue;
        const diff = (ca.cdp_tonne || 0) - (cb.cdp_tonne || 0);
        html += `<tr><td>${fc(ca.culture)}</td><td class="text-right">${fn(cb.cdp_tonne)}</td><td class="text-right">${fn(ca.cdp_tonne)}</td><td class="text-right ${diff > 0 ? 'text-danger' : ''}" style="font-weight:600;">${diff > 0 ? '+' : ''}${fn(diff)}</td></tr>`;
      }
      html += `</tbody></table>`;
    }
    html += `</div>`;
  }

  // ===================== PAGE 7: RECOMMANDATIONS =====================
  html += `<div class="rapport-page page-break">
    <div class="rapport-section-header">${simRes ? '6' : '5'}. Recommandations du conseiller</div>`;
  // Student analysis
  if (coms.analyse) {
    html += `<div class="rapport-sub-header">Analyse de la situation</div>
    <div class="rapport-comment-block">${escHtml(coms.analyse)}</div>`;
  }
  // Levers applied
  if (conseilRes && conseilRes.leviersAppliques && conseilRes.leviersAppliques.length) {
    html += `<div class="rapport-sub-header" style="margin-top:16px;">Leviers appliqués</div>
    <table class="rapport-table"><thead><tr><th>Levier</th><th>Catégorie</th><th>Description</th></tr></thead><tbody>
    ${conseilRes.leviersAppliques.map(l => `<tr><td style="font-weight:600;">${l.nom}</td><td style="font-size:0.8rem;">${l.categorie || ''}</td><td style="font-size:0.8rem;">${l.description || ''}</td></tr>`).join('')}
    </tbody></table>`;
  }
  // Student justification
  if (coms.justification) {
    html += `<div class="rapport-sub-header" style="margin-top:16px;">Justification des choix</div>
    <div class="rapport-comment-block">${escHtml(coms.justification)}</div>`;
  }
  // Conseil impact
  if (conseilRes && conseilRes.delta) {
    const cd = conseilRes.delta;
    html += `<div class="rapport-sub-header" style="margin-top:16px;">Impact des recommandations</div>
    <table class="rapport-table"><thead><tr><th>Indicateur</th><th class="text-right">Avant</th><th class="text-right">Après conseil</th><th class="text-right">Variation</th></tr></thead><tbody>`;
    const cRows = [['EBE', cd.ebe], ['RCAI', cd.rcai], ['Résilience', cd.resilience]];
    for (const [label, d] of cRows) {
      if (!d) continue;
      const isRes = label === 'Résilience';
      const fmtV = isRes ? v => (v || 0) + '/100' : v => fm(v);
      const delta = isRes ? ((d.delta || 0) + ' pts') : fm(d.delta || 0);
      const cls = (d.delta || 0) >= 0 ? 'text-success' : 'text-danger';
      html += `<tr><td>${label}</td><td class="text-right">${fmtV(d.avant)}</td><td class="text-right ${cls}">${fmtV(d.apres)}</td><td class="text-right ${cls}" style="font-weight:600;">${(d.delta || 0) >= 0 ? '+' : ''}${delta}</td></tr>`;
    }
    html += `</tbody></table>`;
  }
  // Assolement modified
  if (state.assolementModifie) {
    html += `<div class="rapport-sub-header" style="margin-top:16px;">Assolement modifié</div>
    <table class="rapport-table"><thead><tr><th>Culture</th><th class="text-right">Avant (ha)</th><th class="text-right">Après (ha)</th><th class="text-right">Variation</th></tr></thead><tbody>`;
    for (const ca of state.assolementModifie) {
      const cb = assol.find(c => c.culture === ca.culture);
      const avant = cb ? cb.surface : 0;
      const diff = ca.surface - avant;
      if (diff === 0) continue;
      html += `<tr><td>${fc(ca.culture)}</td><td class="text-right">${avant}</td><td class="text-right">${ca.surface}</td><td class="text-right" style="font-weight:600;">${diff > 0 ? '+' : ''}${diff}</td></tr>`;
    }
    html += `</tbody></table>`;
  }
  html += `</div>`;

  // ===================== PAGE 8: SYNTHESE =====================
  html += `<div class="rapport-page page-break">
    <div class="rapport-section-header">${simRes ? '7' : '6'}. Synthese et verdict</div>`;
  // Resilience before/after
  const resilAvant = rl.score;
  const resilApres = conseilRes?.delta?.resilience?.apres ?? rl.score;
  html += `<div style="display:flex;gap:32px;justify-content:center;align-items:center;padding:24px;margin-bottom:20px;">
    <div style="text-align:center;">
      <div style="font-size:0.75rem;text-transform:uppercase;letter-spacing:1px;color:var(--gray-500);margin-bottom:4px;">Avant</div>
      <div style="font-size:3rem;font-weight:900;color:${rl.couleur};">${resilAvant}</div>
      <div style="font-size:0.85rem;color:var(--gray-500);">/100</div>
    </div>
    <div style="font-size:2rem;color:var(--gray-300);">&#8594;</div>
    <div style="text-align:center;">
      <div style="font-size:0.75rem;text-transform:uppercase;letter-spacing:1px;color:var(--gray-500);margin-bottom:4px;">Après conseil</div>
      <div style="font-size:3rem;font-weight:900;color:${resilApres >= 60 ? 'var(--green-700)' : resilApres >= 40 ? 'var(--amber-500)' : 'var(--red-500)'};">${resilApres}</div>
      <div style="font-size:0.85rem;color:var(--gray-500);">/100</div>
    </div>
  </div>`;
  // Verdict
  if (diag) {
    html += `<div style="padding:16px;background:var(--gray-50);border-radius:8px;border:1px solid var(--gray-200);margin-bottom:20px;">
      <div style="font-weight:700;margin-bottom:8px;">Verdict</div>
      <div style="font-size:0.9rem;color:var(--gray-700);">${rl.verdict || ''}</div>
    </div>`;
  }
  // Student conclusion
  if (coms.conclusion) {
    html += `<div class="rapport-sub-header">Conclusion et plan d'action</div>
    <div class="rapport-comment-block">${escHtml(coms.conclusion)}</div>`;
  }
  // Risks summary
  if (diag && diag.risques && diag.risques.length) {
    html += `<div class="rapport-sub-header" style="margin-top:16px;">Risques identifiés</div>
    <table class="rapport-table"><thead><tr><th>Risque</th><th>Probabilite</th><th>Impact</th></tr></thead><tbody>
    ${diag.risques.map(r => `<tr><td>${r.titre}</td><td>${r.probabilite || ''}</td><td>${r.impact || ''}</td></tr>`).join('')}
    </tbody></table>`;
  }
  // Sensitivity
  if (diag && diag.sensibilite) {
    html += `<div class="rapport-sub-header" style="margin-top:16px;">Analyse de sensibilité</div>
    <table class="rapport-table"><thead><tr><th>Scénario</th><th class="text-right">Perte CA</th><th class="text-right">EBE après</th><th>Verdict</th></tr></thead><tbody>`;
    for (const [k, s] of Object.entries(diag.sensibilite)) {
      html += `<tr><td>${s.label}</td><td class="text-right text-danger">${fm(s.perteCA)}</td><td class="text-right ${s.ebeApres < 0 ? 'text-danger' : ''}">${fm(s.ebeApres)}</td><td style="font-size:0.8rem;">${s.verdict}</td></tr>`;
    }
    html += `</tbody></table>`;
  }
  html += `<div style="margin-top:32px;text-align:center;font-size:0.8rem;color:var(--gray-400);border-top:1px solid var(--gray-200);padding-top:12px;">
    TERRAGROW BUSINESS GAME — Dossier généré le ${date}
  </div></div>`;

  container.innerHTML = html;

  // --- Print handler ---
  document.getElementById('btn-print')?.addEventListener('click', () => {
    // Prompt for team name if not set
    if (!state.nomEquipe && !state.nomEtudiant) {
      const n = prompt('Nom de votre équipe / binôme :');
      if (n) {
        sauvegarderEtat({ nomEtudiant: n });
        // Update the cover page name
        render(container);
        return;
      }
    }
    // Convert canvas charts to images for printing
    document.querySelectorAll('#view-container canvas').forEach(cv => {
      try {
        const img = document.createElement('img');
        img.src = cv.toDataURL('image/png');
        img.style.maxWidth = '100%';
        img.classList.add('print-only');
        cv.parentNode.insertBefore(img, cv.nextSibling);
      } catch (e) { /* ignore cross-origin canvas errors */ }
    });
    window.print();
  });
}

// --- Utility functions ---

function calcAides(e, an, ref) {
  const a = ref.aides_pac, s = e.sau_totale;
  let t = s * (a.dpb_moyen + (e.eco_regime === 'superieur' ? a.eco_regime_sup : a.eco_regime_inf));
  t += Math.min(s, a.redistributif_plafond_ha) * a.redistributif;
  t += (e.assolements[an] || []).filter(c => ['pois', 'feverole', 'lentille_puy'].includes(c.culture)).reduce((s, c) => s + c.surface, 0) * a.aide_couplee_proteagineux;
  if (e.ichn_montant) t += e.ichn_montant;
  return t;
}

function rpKpi(label, value, color) {
  return `<div style="text-align:center;padding:12px;background:var(--gray-50);border-radius:6px;border:1px solid var(--gray-200);">
    <div style="font-size:0.7rem;text-transform:uppercase;letter-spacing:0.5px;color:var(--gray-500);margin-bottom:4px;">${label}</div>
    <div style="font-size:1.1rem;font-weight:800;color:${color};">${value}</div>
  </div>`;
}

function escHtml(s) {
  if (!s) return '';
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
}
