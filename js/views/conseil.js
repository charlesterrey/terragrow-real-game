import { chargerExploitation, chargerReferentiel, chargerITK, chargerLeviers, getEtat, sauvegarderEtat } from '../app.js';
import { filtrerLeviers, appliquerConseil } from '../engine/conseil.js?v=2';
import { renderStepper, renderStepObjective, renderStepNavigation } from '../components/stepper.js';
import { setProgression } from '../state.js';

let charts = [];
export async function render(container) {
  charts.forEach(c => c.destroy()); charts = [];
  const state = getEtat();
  setProgression(state.exploitationId, 6);
  const expl = await chargerExploitation(state.exploitationId);
  const ref = await chargerReferentiel();
  const itk = await chargerITK();
  const tousLeviers = await chargerLeviers();
  const annee = state.annee;
  const dispo = filtrerLeviers(tousLeviers, expl);
  const assol = JSON.parse(JSON.stringify(expl.assolements[annee] || []));
  const cats = {};
  for (const l of dispo) {
    if (!cats[l.categorie]) cats[l.categorie] = [];
    cats[l.categorie].push(l);
  }
  const cn = {
    charges_operationnelles: 'Charges opé',
    charges_mecanisation: 'Mécanisation',
    assolement: 'Assolement',
    commercialisation: 'Commercialisation',
    gestion_risques: 'Gestion risques',
    financier: 'Financier',
    charges_structure: 'Structure'
  };
  const fc = k => ({
    ble_tendre: 'Blé tendre', ble_dur: 'Blé dur', orge_hiver: 'Orge hiver',
    orge_printemps: 'Orge print.', colza: 'Colza', mais_grain: 'Maïs',
    mais_grain_irrigue: 'Maïs irr.', tournesol: 'Tournesol', pois: 'Pois',
    feverole: 'Féverole', betterave_sucriere: 'Betterave', sorgho: 'Sorgho',
    triticale: 'Triticale', lentille_puy: 'Lentille', haricots_verts: 'H. verts',
    petits_pois: 'P. pois', prairie_foin: 'Prairie', lin_fibre: 'Lin',
    pomme_terre: 'Pdt', soja: 'Soja', soja_irrigue: 'Soja irr.'
  }[k] || k);
  const fm = n => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n || 0);

  const coms = state.commentairesConseil || { analyse: '', justification: '', conclusion: '' };
  const esc = s => (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

  container.innerHTML = `${renderStepper(6)}
  ${renderStepObjective(6)}
  <h2 style="font-size:1.3rem;font-weight:800;color:var(--accent);margin-bottom:16px;">Mode Conseil — ${expl.nom}</h2>
  ${state.scenarioActif ? `<div style="background:rgba(239,68,68,0.1);border-left:4px solid var(--red-500);padding:10px 14px;border-radius:8px;margin-bottom:16px;font-size:0.85rem;">Scénario actif : <strong>${state.scenarioActif}</strong></div>` : ''}

  <!-- 1. Analyse (full width) -->
  <div class="card mb-4">
    <div class="card-header" style="font-size:0.95rem;">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
      Analyse de la situation
    </div>
    <textarea id="com-analyse" class="comment-area" style="min-height:140px;" placeholder="Décrivez votre diagnostic : quels sont les points forts et les faiblesses de cette exploitation ? Quels indicateurs vous alertent ? Quelle est la situation financière globale (EBE, trésorerie, endettement) ?">${esc(coms.analyse)}</textarea>
  </div>

  <!-- 2. Leviers + Assolement (side by side) -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
    <div>
      <div class="card"><div class="card-header">Leviers disponibles (${dispo.length})</div>
      <div style="max-height:500px;overflow-y:auto;padding-right:4px;">
      ${Object.entries(cats).map(([cat, ls]) => `<h4 style="font-size:0.75rem;font-weight:700;color:var(--accent);margin:12px 0 6px;text-transform:uppercase;letter-spacing:0.5px;">${cn[cat] || cat}</h4>
      ${ls.map(l => `<div class="levier-card"><input type="checkbox" id="lv-${l.id}" value="${l.id}" class="lv-cb" ${(state.leviersSelectionnes || []).includes(l.id) ? 'checked' : ''}><div><div class="levier-nom">${l.nom}</div><div class="levier-desc">${l.description}</div></div></div>`).join('')}`).join('')}
      </div>
      </div>
    </div>
    <div>
      <div class="card"><div class="card-header">Assolement modifiable</div>
      <p style="font-size:0.8rem;color:var(--gray-500);margin-bottom:8px;">SAU totale = <strong>${expl.sau_totale} ha</strong></p>
      <div class="table-container"><table><thead><tr><th>Culture</th><th>Actuel</th><th>Modifié</th></tr></thead><tbody>
      ${assol.map((c, i) => `<tr><td>${fc(c.culture)}</td><td class="text-right">${c.surface} ha</td><td><input type="number" class="as-in" data-idx="${i}" value="${c.surface}" min="0" max="${expl.sau_totale}" step="1" style="width:80px;text-align:right;"></td></tr>`).join('')}
      </tbody><tfoot><tr><td class="font-bold">TOTAL</td><td class="text-right font-bold">${expl.sau_totale} ha</td><td id="as-tot" class="text-right font-bold">${expl.sau_totale} ha</td></tr></tfoot></table></div></div>
      <button class="btn btn-primary btn-lg mt-4" style="width:100%;background:var(--accent);font-size:0.95rem;padding:12px 20px;" id="btn-app">APPLIQUER MES RECOMMANDATIONS</button>
    </div>
  </div>

  <!-- 3. Justification (full width) -->
  <div class="card mt-4" style="background:var(--gray-50);border:1px dashed var(--gray-300);">
    <div class="card-header" style="font-size:0.9rem;">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      Justification des leviers choisis
    </div>
    <textarea id="com-justification" class="comment-area" style="min-height:120px;" placeholder="Expliquez pourquoi vous avez retenu ces leviers. Quels sont les postes de charges ou les risques que vous ciblez ? Pourquoi ces leviers sont-ils adaptés à cette exploitation et à sa région ?">${esc(coms.justification)}</textarea>
  </div>

  <!-- 4. Résultats -->
  <div id="cs-res"></div>

  <!-- 5. Conclusion (full width, shown after results) -->
  <div id="com-conclusion-wrap" style="display:${state.resultatsConseil ? 'block' : 'none'};">
    <div class="card mt-4" style="background:var(--gray-50);border:1px dashed var(--gray-300);">
      <div class="card-header" style="font-size:0.9rem;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        Conclusion et plan d'action
      </div>
      <textarea id="com-conclusion" class="comment-area" style="min-height:140px;" placeholder="Rédigez votre conclusion : quel est l'impact global de vos recommandations ? L'exploitation est-elle viable après vos ajustements ? Quelles actions prioritaires proposez-vous à l'exploitant pour les 12 prochains mois ?">${esc(coms.conclusion)}</textarea>
    </div>
  </div>
  ${renderStepNavigation(6, state.exploitationId)}`;

  document.querySelectorAll('.as-in').forEach(inp => {
    inp.addEventListener('input', () => {
      const t = Array.from(document.querySelectorAll('.as-in')).reduce((s, e) => s + (parseFloat(e.value) || 0), 0);
      const el = document.getElementById('as-tot');
      el.textContent = t + ' ha';
      el.style.color = t === expl.sau_totale ? '' : 'var(--danger)';
    });
  });

  // Auto-save comment textareas on blur
  ['analyse', 'justification', 'conclusion'].forEach(field => {
    const el = document.getElementById('com-' + field);
    if (el) {
      el.addEventListener('blur', () => {
        const cur = getEtat().commentairesConseil || { analyse: '', justification: '', conclusion: '' };
        cur[field] = el.value;
        sauvegarderEtat({ commentairesConseil: cur });
      });
    }
  });

  document.getElementById('btn-app').addEventListener('click', async () => {
    const sel = Array.from(document.querySelectorAll('.lv-cb:checked')).map(e => e.value);
    const ins = document.querySelectorAll('.as-in');
    const na = assol.map((c, i) => ({ ...c, surface: parseFloat(ins[i]?.value) || c.surface }));
    const tot = na.reduce((s, c) => s + c.surface, 0);
    if (tot !== expl.sau_totale) { alert('Total (' + tot + ' ha) != SAU (' + expl.sau_totale + ' ha)'); return; }
    const changed = na.some((c, i) => c.surface !== assol[i].surface);
    const am = changed ? na : null;
    const res = appliquerConseil(expl, annee, ref, itk, sel, tousLeviers, am);
    sauvegarderEtat({ leviersSelectionnes: sel, assolementModifie: am, resultatsConseil: res });
    // Show conclusion textarea after results
    const cWrap = document.getElementById('com-conclusion-wrap');
    if (cWrap) cWrap.style.display = 'block';
    const d = res.delta;
    document.getElementById('cs-res').innerHTML = `<div class="card mt-4"><div class="card-header">Résultats</div>
    <div class="kpi-grid">
      <div class="kpi-card ${d.ebe.delta >= 0 ? 'ok' : 'critique'}"><div class="kpi-card-accent"></div><div class="kpi-card-body"><div class="kpi-card-top"><div class="kpi-icon ${d.ebe.delta >= 0 ? 'green' : 'red'}"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg></div><div class="kpi-label">EBE</div></div><div class="kpi-value">${fm(d.ebe.apres)}</div><div class="kpi-sub"><span class="kpi-variation ${d.ebe.delta >= 0 ? 'positive' : 'negative'}">${d.ebe.delta >= 0 ? '&#9650; +' : '&#9660; '}${fm(d.ebe.delta)}</span></div></div></div>
      <div class="kpi-card ${d.rcai.delta >= 0 ? 'ok' : 'critique'}"><div class="kpi-card-accent"></div><div class="kpi-card-body"><div class="kpi-card-top"><div class="kpi-icon ${d.rcai.delta >= 0 ? 'green' : 'red'}"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg></div><div class="kpi-label">RCAI</div></div><div class="kpi-value">${fm(d.rcai.apres)}</div><div class="kpi-sub"><span class="kpi-variation ${d.rcai.delta >= 0 ? 'positive' : 'negative'}">${d.rcai.delta >= 0 ? '&#9650; +' : '&#9660; '}${fm(d.rcai.delta)}</span></div></div></div>
      <div class="kpi-card ${d.resilience.delta >= 0 ? 'ok' : 'critique'}"><div class="kpi-card-accent"></div><div class="kpi-card-body"><div class="kpi-card-top"><div class="kpi-icon ${d.resilience.delta >= 0 ? 'green' : 'red'}"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div><div class="kpi-label">Résilience</div></div><div class="kpi-value">${d.resilience.apres}/100</div><div class="kpi-sub"><span class="kpi-variation ${d.resilience.delta >= 0 ? 'positive' : 'negative'}">${d.resilience.delta >= 0 ? '&#9650; +' : '&#9660; '}${d.resilience.delta} pts</span></div></div></div>
    </div>
    ${res.leviersAppliques.length ? `<p style="margin-top:12px;"><strong>Leviers :</strong> ${res.leviersAppliques.map(l => l.nom).join(', ')}</p>` : ''}
    <div style="margin-top:12px;"><a href="#rapport" class="btn btn-primary">GÉNÉRER LE DOSSIER</a></div></div>`;
  });

  if (state.resultatsConseil) {
    const d = state.resultatsConseil.delta;
    document.getElementById('cs-res').innerHTML = `<div class="card mt-4"><div class="card-header">Résultats précédents</div><div class="kpi-grid">
      <div class="kpi-card"><div class="kpi-card-accent"></div><div class="kpi-card-body"><div class="kpi-card-top"><div class="kpi-label">EBE après</div></div><div class="kpi-value">${fm(d.ebe.apres)}</div></div></div>
      <div class="kpi-card"><div class="kpi-card-accent"></div><div class="kpi-card-body"><div class="kpi-card-top"><div class="kpi-label">Résilience</div></div><div class="kpi-value">${d.resilience.apres}/100</div></div></div>
    </div></div>`;
  }
}
