import { chargerToutesExploitations, chargerReferentiel, chargerITK, getEtat } from '../app.js';

export async function render(container) {
  const state = getEtat();
  const ref = await chargerReferentiel();
  const itk = await chargerITK();
  const expls = await chargerToutesExploitations();
  let sel = null;
  if (state.exploitationId) sel = expls.find(e => e.id === state.exploitationId);

  const fc = k => ({
    ble_tendre: 'Blé tendre', ble_dur: 'Blé dur', orge_hiver: 'Orge hiver',
    orge_printemps: 'Orge print.', colza: 'Colza', mais_grain: 'Maïs',
    mais_grain_irrigue: 'Maïs irr.', tournesol: 'Tournesol', pois: 'Pois',
    feverole: 'Féverole', betterave_sucriere: 'Betterave', pomme_terre: 'Pdt',
    lin_fibre: 'Lin', soja: 'Soja', soja_irrigue: 'Soja irr.', sorgho: 'Sorgho',
    triticale: 'Triticale', lentille_puy: 'Lentille du Puy',
    haricots_verts: 'Haricots verts', petits_pois: 'Petits pois',
    prairie_foin: 'Prairie (foin)'
  }[k] || k);

  const isBP = k => ['betterave_sucriere', 'pomme_terre'].includes(k);

  function ficheSet(expl) {
    const rg = expl.region.replace(/-/g, '_');
    const ir = itk[rg] || {};
    const ib = ir.ble_tendre || {};
    const as = expl.assolements['N'] || [];
    const bs = as.find(c => c.culture === 'ble_tendre')?.surface || 0;
    const br = as.find(c => c.culture === 'ble_tendre')?.rendement_vise || 0;

    return `<div class="card page-break" style="border:2px solid var(--accent);font-size:0.9rem;">
    <div style="text-align:center;padding:12px;background:var(--accent);color:#fff;margin:-20px -20px 16px;border-radius:10px 10px 0 0;">
      <div style="font-size:1.2rem;font-weight:800;">${expl.nom} (${expl.id.toUpperCase()})</div>
      <div>${expl.exploitant} - ${expl.commune}</div>
    </div>
    <table style="width:100%;"><tr><td><strong>SAU</strong> ${expl.sau_totale} ha</td><td><strong>UTH</strong> ${expl.uth_total}</td><td><strong>Fermage</strong> ${expl.sau_fermage} ha</td></tr></table>
    <h4 style="color:var(--accent);margin-top:12px;">ASSOLEMENT</h4>
    <table style="width:100%;border-collapse:collapse;">
      <thead><tr style="background:var(--border-light);"><th style="padding:4px 8px;text-align:left;">Culture</th><th>Surface</th><th>Rdt espéré</th></tr></thead>
      <tbody>${as.map(c => `<tr style="border-bottom:1px solid var(--border);"><td style="padding:4px 8px;">${fc(c.culture)}</td><td style="text-align:center;">${c.surface} ha</td><td style="text-align:center;">${c.rendement_vise || c.rendement_realise || '?'} ${isBP(c.culture) ? 'dt' : 'q'}/ha</td></tr>`).join('')}
      </tbody>
    </table>
    <p style="margin-top:8px;"><strong>Charges structure totales :</strong> ${(expl.charges_structure_total || 0).toLocaleString('fr-FR')} EUR</p>
    <p><strong>Aides PAC :</strong> DPB 129 + éco-régime ${expl.eco_regime === 'superieur' ? '80' : '60'} + redistributif 50 EUR/ha (52 premiers ha)</p>
    </div>

    <div class="card page-break" style="border:2px solid var(--secondary);font-size:0.9rem;">
    <div style="text-align:center;padding:12px;background:var(--secondary);color:var(--text);margin:-20px -20px 16px;border-radius:10px 10px 0 0;">
      <div style="font-size:1.1rem;font-weight:800;">ITK BLÉ TENDRE - ${expl.id.toUpperCase()}</div>
    </div>
    <h4>SEMENCES</h4>
    <p>${ib.semences?.variete || '?'}, ${ib.semences?.dose_kg_ha || '?'} kg/ha x ${ib.semences?.prix_kg || '?'} EUR/kg = _______ EUR/ha</p>
    <h4 style="margin-top:8px;">ENGRAIS</h4>
    <table style="width:100%;">
      <thead><tr style="background:var(--border-light);"><th>Produit</th><th>Dose</th><th>Prix</th><th>Coût/ha</th></tr></thead>
      <tbody>${(ib.engrais || []).map(e => `<tr style="border-bottom:1px solid var(--border);"><td>${e.produit} (#${e.apport})</td><td style="text-align:center;">${e.dose_kg_ha || e.dose_l_ha || '?'}</td><td style="text-align:center;">${e.prix_kg || e.prix_l || '?'} EUR</td><td style="text-align:center;">_______</td></tr>`).join('')}
      <tr style="font-weight:700;"><td colspan="3">TOTAL</td><td style="text-align:center;">_______</td></tr>
      </tbody>
    </table>
    <h4 style="margin-top:8px;">PHYTOS</h4>
    <table style="width:100%;">
      <thead><tr style="background:var(--border-light);"><th>Type</th><th>Dose</th><th>Prix</th><th>Coût/ha</th></tr></thead>
      <tbody>${(ib.phytos || []).map(p => `<tr style="border-bottom:1px solid var(--border);"><td>${p.type}</td><td style="text-align:center;">${p.dose_l_ha || '?'} L</td><td style="text-align:center;">${p.prix_l || '?'} EUR/L</td><td style="text-align:center;">_______</td></tr>`).join('')}
      <tr style="font-weight:700;"><td colspan="3">TOTAL</td><td style="text-align:center;">_______</td></tr>
      </tbody>
    </table>
    <p style="margin-top:8px;"><strong>MÉCANISATION (forfait) : ${ib.mecanisation_ha || 400} EUR/ha</strong></p>
    </div>

    <div class="card page-break" style="border:2px solid var(--accent);font-size:0.9rem;">
    <div style="text-align:center;padding:12px;background:var(--accent);color:#fff;margin:-20px -20px 16px;border-radius:10px 10px 0 0;">
      <div style="font-size:1.1rem;font-weight:800;">CALCUL CdP - BLÉ TENDRE</div>
      <div>${expl.nom} | ${bs} ha | ${br} q/ha</div>
    </div>
    <table style="width:100%;line-height:2.2;">
    <tr><td colspan="2" style="font-weight:700;color:var(--accent);">A. CHARGES OPÉ DIRECTES</td></tr>
    <tr><td style="padding-left:16px;">Semences :</td><td style="border-bottom:1px dotted #ccc;width:200px;">_______ EUR/ha</td></tr>
    <tr><td style="padding-left:16px;">Engrais :</td><td style="border-bottom:1px dotted #ccc;">_______ EUR/ha</td></tr>
    <tr><td style="padding-left:16px;">Phytos :</td><td style="border-bottom:1px dotted #ccc;">_______ EUR/ha</td></tr>
    <tr><td style="padding-left:16px;font-weight:700;">TOTAL OPÉ :</td><td style="border-bottom:2px solid #333;">_______ EUR/ha</td></tr>
    <tr><td style="font-weight:700;color:var(--accent);">B. MÉCANISATION</td><td style="border-bottom:1px dotted #ccc;">_______ EUR/ha</td></tr>
    <tr><td style="font-weight:700;color:var(--accent);">C. STRUCT. RÉPARTIES</td><td style="border-bottom:1px dotted #ccc;">_______ EUR/ha</td></tr>
    <tr><td style="font-weight:700;color:var(--accent);">D. RÉMU. MO</td><td style="border-bottom:1px dotted #ccc;">_______ EUR/ha</td></tr>
    <tr><td style="font-weight:700;color:var(--accent);">E. COPRODUITS</td><td style="border-bottom:1px dotted #ccc;">-_______ EUR/ha</td></tr>
    <tr><td style="font-weight:900;font-size:1rem;border-top:3px double #333;">CdP (EUR/ha) = A+B+C+D-E</td><td style="border-bottom:2px solid #333;font-weight:900;">_______ EUR/ha</td></tr>
    <tr><td style="font-weight:900;">CdP (EUR/t) = CdP/Rdt</td><td style="border-bottom:2px solid #333;font-weight:900;">_______ EUR/t</td></tr>
    <tr><td>Seuil = CdP/t - Aides/t</td><td style="border-bottom:2px solid #333;">_______ EUR/t</td></tr>
    <tr><td colspan="2">Prix blé = ${ref.prix_vente['N']?.ble_tendre || 195} EUR/t. Marge = _______ EUR/t. [ ] Rentable [ ] Équilibre [ ] Déficitaire</td></tr>
    </table></div>`;
  }

  container.innerHTML = `<h2 style="font-size:1.3rem;font-weight:800;color:var(--accent);margin-bottom:16px;">Fiches Session 1</h2>
  <div class="no-print" style="margin-bottom:16px;display:flex;gap:12px;">
    <button class="btn btn-primary" onclick="window.print()">Imprimer</button>
    <button class="btn btn-secondary" id="btn-all">Imprimer TOUTES (10 exploitations)</button>
  </div>
  <div id="fc-cont">${sel ? ficheSet(sel) : '<p style="color:var(--text-light);">Sélectionnez une exploitation ou imprimez toutes les fiches.</p>'}</div>`;

  document.getElementById('btn-all')?.addEventListener('click', () => {
    document.getElementById('fc-cont').innerHTML = expls.map(e => ficheSet(e)).join('');
    setTimeout(() => window.print(), 500);
  });
}
