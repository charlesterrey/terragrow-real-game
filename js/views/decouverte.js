// js/views/decouverte.js — Etape 1 : Decouverte de l'exploitation
import { chargerExploitation, chargerITK, chargerReferentiel, getEtat, sauvegarderEtat } from '../app.js';
import { setProgression, getProgression } from '../state.js';
import { renderStepper, renderStepObjective, renderStepNavigation } from '../components/stepper.js';

let charts = [];
const fmt = new Intl.NumberFormat('fr-FR');
const fmtE = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

const CULTURE_LABELS = {
  ble_tendre: 'Blé tendre', colza: 'Colza', orge_hiver: 'Orge d\'hiver',
  betterave_sucriere: 'Betterave sucrière', ble_dur: 'Blé dur',
  orge_printemps: 'Orge de printemps', pois: 'Pois protéagineux',
  mais_grain: 'Maïs grain', mais_grain_irrigue: 'Maïs irrigué', mais_irrigue: 'Maïs irrigué',
  tournesol: 'Tournesol', soja: 'Soja', soja_irrigue: 'Soja irrigué', lentille: 'Lentille',
  lentille_puy: 'Lentille du Puy', pomme_de_terre: 'Pomme de terre', pomme_terre: 'Pomme de terre',
  lin: 'Lin fibre', lin_fibre: 'Lin fibre',
  sorgho: 'Sorgho', prairie: 'Prairie temporaire', prairie_foin: 'Prairie (foin)',
  feverole: 'Féverole', haricots_verts: 'Haricots verts', petits_pois: 'Petits pois',
  ble_tendre_bio: 'Blé tendre bio', triticale: 'Triticale'
};

const REGION_LABELS = {
  beauce: 'Beauce (Centre)', nord_picardie: 'Nord-Picardie',
  bretagne: 'Bretagne', sud_ouest: 'Sud-Ouest', rhone_alpes: 'Rhône-Alpes'
};

const REGION_CONTEXT = {
  beauce: 'Sols limoneux profonds à très fort potentiel céréalier. Climat océanique dégradé, pluviométrie 550-650 mm. Région de grandes cultures intensives. Risque principal : volatilité des prix sur marchés mondiaux.',
  nord_picardie: 'Limons battants très fertiles, potentiel élevé. Climat océanique, pluviométrie 650-750 mm. Forte diversification : betteraves, pommes de terre, lin, légumes. Pression foncière importante.',
  bretagne: 'Sols variés (schiste, granit, limon). Climat océanique doux, pluviométrie > 800 mm. Polyculture-élevage dominant, grandes cultures en progression. Risque : adventices, pression phyto.',
  sud_ouest: 'Boulbènes et terreforts. Climat océanique à influence méditerranéenne, été sec. Irrigation indispensable pour maïs. Forte diversification : tournesol, soja, blé dur. Risque : sécheresse estivale.',
  rhone_alpes: 'Limagne : terres noires volcaniques très fertiles. Velay : sols plus pauvres, altitude. Climat semi-continental. Diversification en lentille AOP, cultures de niche.'
};

const CHART_COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EF4444', '#EC4899', '#06B6D4', '#F97316'];

export async function render(container) {
  charts.forEach(c => c.destroy());
  charts = [];

  const state = getEtat();
  const expl = await chargerExploitation(state.exploitationId);
  const itk = await chargerITK();
  const annee = state.annee;
  const assolement = expl.assolements[annee] || expl.assolements['N'];
  const regionKey = expl.region.replace(/-/g, '_');
  const regionITK = itk[regionKey] || {};

  // Calculs derives
  const totalEndettement = (expl.emprunts || []).reduce((s, e) => s + (e.capital_restant || 0), 0);
  const totalAnnuites = (expl.emprunts || []).reduce((s, e) => s + (e.annuite || 0), 0);
  const totalAmortMat = (expl.materiel || []).reduce((s, e) => s + (e.amort_annuel || 0), 0);

  // Marquer progression
  setProgression(state.exploitationId, 1);

  container.innerHTML = `
    ${renderStepper(1)}
    ${renderStepObjective(1)}

    <!-- IDENTITE -->
    <div class="card fade-in" style="border-left: 4px solid var(--accent);">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px;">
        <div>
          <h1 style="font-size: 22px; font-weight: 800; color: var(--gray-900); letter-spacing: -0.5px; margin-bottom: 4px;">${expl.nom}</h1>
          <p style="font-size: 14px; color: var(--gray-500);">${expl.exploitant}, ${expl.age} ans &middot; ${expl.commune} &middot; ${expl.forme_juridique}</p>
          <p style="font-size: 13px; color: var(--gray-400); margin-top: 4px; font-style: italic;">"${expl.profil || ''}"</p>
        </div>
        <span style="padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; background: var(--accent-50); color: var(--accent-700);">
          ${REGION_LABELS[regionKey] || expl.region}
        </span>
      </div>
    </div>

    <!-- KPIs -->
    <div class="kpi-grid fade-in">
      <div class="kpi-card info">
        <div class="kpi-card-accent"></div>
        <div class="kpi-card-body">
          <div class="kpi-card-top">
            <div class="kpi-icon blue"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 21h18M12 3v18M5 14l7-7 7 7"/></svg></div>
            <div class="kpi-label">SAU totale</div>
          </div>
          <div class="kpi-value">${fmt.format(expl.sau_totale)} ha</div>
          <div class="kpi-sub">
            <span class="kpi-variation neutral">${fmt.format(expl.sau_propriete)} ha propres</span>
            <span class="kpi-variation neutral">${fmt.format(expl.sau_fermage)} ha fermage</span>
          </div>
        </div>
      </div>
      <div class="kpi-card accent">
        <div class="kpi-card-accent"></div>
        <div class="kpi-card-body">
          <div class="kpi-card-top">
            <div class="kpi-icon accent"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg></div>
            <div class="kpi-label">Main d'oeuvre</div>
          </div>
          <div class="kpi-value">${expl.uth_total} UTH</div>
          <div class="kpi-sub">
            <span class="kpi-variation neutral">${(expl.uth_detail || []).map(u => u.type).join(', ') || 'Exploitant'}</span>
          </div>
        </div>
      </div>
      <div class="kpi-card attention">
        <div class="kpi-card-accent"></div>
        <div class="kpi-card-body">
          <div class="kpi-card-top">
            <div class="kpi-icon amber"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg></div>
            <div class="kpi-label">Endettement</div>
          </div>
          <div class="kpi-value">${fmtE.format(totalEndettement)}</div>
          <div class="kpi-sub">
            <span class="kpi-variation neutral">Annuités ${fmtE.format(totalAnnuites)}/an</span>
          </div>
        </div>
      </div>
      <div class="kpi-card critique">
        <div class="kpi-card-accent"></div>
        <div class="kpi-card-body">
          <div class="kpi-card-top">
            <div class="kpi-icon red"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg></div>
            <div class="kpi-label">Charges structure</div>
          </div>
          <div class="kpi-value">${fmtE.format(expl.charges_structure_total || 0)}</div>
          <div class="kpi-sub">
            <span class="kpi-variation neutral">dont fermage ${fmtE.format(expl.charges_structure?.fermage || 0)}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ASSOLEMENT + CONTEXTE -->
    <div class="grid-2 fade-in">
      <div class="card">
        <div class="card-header">Assolement ${annee} (${fmt.format(expl.sau_totale)} ha)</div>
        <div class="chart-container" style="max-height: 280px;">
          <canvas id="chart-assolement"></canvas>
        </div>
        <div class="table-container mt-4" style="max-height: 260px; overflow-y: auto;">
          <table>
            <thead>
              <tr>
                <th>Culture</th>
                <th class="text-right">Surface</th>
                <th class="text-right">% SAU</th>
                <th class="text-right">Rendement</th>
              </tr>
            </thead>
            <tbody>
              ${assolement.map((c, i) => {
                const pct = ((c.surface / expl.sau_totale) * 100).toFixed(1);
                const rdt = c.rendement_realise || c.rendement_vise || '-';
                return `<tr>
                  <td><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${CHART_COLORS[i % CHART_COLORS.length]};margin-right:6px;"></span>${CULTURE_LABELS[c.culture] || c.culture}</td>
                  <td class="text-right">${c.surface} ha</td>
                  <td class="text-right">${pct}%</td>
                  <td class="text-right">${rdt} q/ha</td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <div class="card">
          <div class="card-header">Contexte regional</div>
          <p style="font-size: 13px; color: var(--gray-600); line-height: 1.6;">
            ${REGION_CONTEXT[regionKey] || 'Informations regionales non disponibles.'}
          </p>
        </div>
        <div class="card">
          <div class="card-header">Charges de structure</div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 12px;">
            ${Object.entries(expl.charges_structure || {}).map(([k, v]) => `
              <div style="color: var(--gray-500); padding: 3px 0;">${k.replace(/_/g, ' ')}</div>
              <div style="text-align: right; font-weight: 600; color: var(--gray-800); font-variant-numeric: tabular-nums; padding: 3px 0;">${fmtE.format(v)}</div>
            `).join('')}
            <div style="color: var(--gray-900); font-weight: 700; padding: 6px 0; border-top: 2px solid var(--gray-200);">TOTAL</div>
            <div style="text-align: right; font-weight: 800; color: var(--gray-900); font-variant-numeric: tabular-nums; padding: 6px 0; border-top: 2px solid var(--gray-200);">${fmtE.format(expl.charges_structure_total || 0)}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- MATERIEL -->
    <div class="accordion-item fade-in">
      <div class="accordion-header" onclick="this.closest('.accordion-item').classList.toggle('open')">
        <span>Matériel et équipements (${(expl.materiel || []).length} postes &middot; Amort. total : ${fmtE.format(totalAmortMat)}/an)</span>
        <svg class="accordion-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
      </div>
      <div class="accordion-body">
        <div class="table-container">
          <table>
            <thead>
              <tr><th>Équipement</th><th class="text-right">Valeur</th><th class="text-right">Année</th><th class="text-right">Durée</th><th class="text-right">Amort./an</th></tr>
            </thead>
            <tbody>
              ${(expl.materiel || []).map(m => `
                <tr>
                  <td>${m.nom}</td>
                  <td class="text-right">${fmtE.format(m.valeur_achat)}</td>
                  <td class="text-right">${m.annee}</td>
                  <td class="text-right">${m.duree_amort} ans</td>
                  <td class="text-right font-bold">${fmtE.format(m.amort_annuel)}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr><td colspan="4">Total amortissements</td><td class="text-right">${fmtE.format(totalAmortMat)}</td></tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>

    <!-- EMPRUNTS -->
    <div class="accordion-item fade-in">
      <div class="accordion-header" onclick="this.closest('.accordion-item').classList.toggle('open')">
        <span>Emprunts (${(expl.emprunts || []).length} lignes &middot; Annuités : ${fmtE.format(totalAnnuites)}/an)</span>
        <svg class="accordion-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
      </div>
      <div class="accordion-body">
        <div class="table-container">
          <table>
            <thead>
              <tr><th>Objet</th><th class="text-right">Capital restant</th><th class="text-right">Taux</th><th class="text-right">Annuité</th><th class="text-right">Échéance</th></tr>
            </thead>
            <tbody>
              ${(expl.emprunts || []).map(e => `
                <tr>
                  <td>${e.objet}</td>
                  <td class="text-right">${fmtE.format(e.capital_restant)}</td>
                  <td class="text-right">${e.taux}%</td>
                  <td class="text-right font-bold">${fmtE.format(e.annuite)}</td>
                  <td class="text-right">${e.echeance}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr><td colspan="3">Total</td><td class="text-right">${fmtE.format(totalAnnuites)}</td><td></td></tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>

    <!-- ITK PAR CULTURE -->
    <div class="card fade-in">
      <div class="card-header">Itinéraires techniques par culture (ITK)</div>
      <p style="font-size: 12px; color: var(--gray-400); margin-bottom: 12px;">Dépliez chaque culture pour voir le détail des charges opérationnelles : semences, engrais, phytos.</p>
      ${assolement.map((c, i) => {
        const itkData = regionITK[c.culture];
        const label = CULTURE_LABELS[c.culture] || c.culture;
        const rdt = c.rendement_realise || c.rendement_vise || '-';
        const totalOpe = itkData?.charges_ope_total_ha || '-';
        const meca = itkData?.mecanisation_ha || '-';
        return `
          <div class="accordion-item">
            <div class="accordion-header" onclick="this.closest('.accordion-item').classList.toggle('open')">
              <div style="display:flex;align-items:center;gap:8px;">
                <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${CHART_COLORS[i % CHART_COLORS.length]};"></span>
                <span>${label}</span>
                <span style="color:var(--gray-400);font-weight:400;font-size:12px;">${c.surface} ha &middot; ${rdt} q/ha</span>
              </div>
              <div style="display:flex;align-items:center;gap:12px;">
                ${totalOpe !== '-' ? `<span style="font-size:12px;color:var(--accent-600);font-weight:600;">${fmt.format(totalOpe)} EUR/ha charges opé.</span>` : '<span style="font-size:12px;color:var(--gray-400);">ITK non détaillé</span>'}
                <svg class="accordion-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
            </div>
            <div class="accordion-body">
              ${itkData ? renderITKDetail(itkData, meca) : '<p style="color:var(--gray-400);font-size:13px;">Données ITK détaillées non disponibles pour cette culture dans cette région.</p>'}
            </div>
          </div>
        `;
      }).join('')}
    </div>

    ${renderStepNavigation(1, state.exploitationId)}
  `;

  // --- CHART : Donut assolement ---
  const ctx = document.getElementById('chart-assolement');
  if (ctx) {
    const chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: assolement.map(c => CULTURE_LABELS[c.culture] || c.culture),
        datasets: [{
          data: assolement.map(c => c.surface),
          backgroundColor: CHART_COLORS.slice(0, assolement.length),
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        cutout: '55%',
        plugins: {
          legend: { position: 'right', labels: { font: { family: 'inherit', size: 11 }, padding: 8, usePointStyle: true, pointStyle: 'circle', boxWidth: 8 } },
          tooltip: {
            backgroundColor: '#1F2937',
            titleFont: { family: 'inherit', size: 12 },
            bodyFont: { family: 'inherit', size: 12 },
            cornerRadius: 8,
            padding: 10,
            callbacks: {
              label: function(ctx) {
                const pct = ((ctx.parsed / expl.sau_totale) * 100).toFixed(1);
                return ` ${ctx.label}: ${ctx.parsed} ha (${pct}%)`;
              }
            }
          }
        },
        animation: { animateRotate: true, duration: 800 }
      }
    });
    charts.push(chart);
  }
}

function renderITKDetail(itk, meca) {
  let html = '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; font-size: 12px;">';

  // Semences
  html += '<div>';
  html += '<h4 style="font-weight:700;color:var(--gray-700);margin-bottom:6px;font-size:13px;">Semences</h4>';
  if (itk.semences) {
    const s = itk.semences;
    html += `<div style="color:var(--gray-500);">${s.variete || 'Variété standard'}`;
    if (s.dose_kg_ha && s.prix_kg) {
      html += ` &middot; ${s.dose_kg_ha} kg/ha x ${s.prix_kg} EUR/kg`;
    }
    html += `</div>`;
    html += `<div style="font-weight:700;color:var(--gray-900);margin-top:2px;">${fmt.format(s.cout_ha || 0)} EUR/ha</div>`;
  }
  html += '</div>';

  // Engrais
  html += '<div>';
  html += '<h4 style="font-weight:700;color:var(--gray-700);margin-bottom:6px;font-size:13px;">Engrais</h4>';
  if (itk.engrais && Array.isArray(itk.engrais)) {
    itk.engrais.forEach(e => {
      html += `<div style="display:flex;justify-content:space-between;padding:2px 0;color:var(--gray-500);">
        <span>${e.produit} (#${e.apport})</span>
        <span style="font-weight:600;color:var(--gray-700);">${fmt.format(e.cout_ha)} EUR</span>
      </div>`;
    });
    html += `<div style="border-top:1px solid var(--gray-200);margin-top:4px;padding-top:4px;font-weight:700;color:var(--gray-900);text-align:right;">Total : ${fmt.format(itk.engrais_total_ha)} EUR/ha</div>`;
  } else if (itk.engrais_total_ha) {
    html += `<div style="font-weight:700;color:var(--gray-900);">Total : ${fmt.format(itk.engrais_total_ha)} EUR/ha</div>`;
  }
  html += '</div>';

  // Phytos
  html += '<div>';
  html += '<h4 style="font-weight:700;color:var(--gray-700);margin-bottom:6px;font-size:13px;">Phytosanitaires</h4>';
  if (itk.phytos && Array.isArray(itk.phytos)) {
    itk.phytos.forEach(p => {
      html += `<div style="display:flex;justify-content:space-between;padding:2px 0;color:var(--gray-500);">
        <span>${p.type}</span>
        <span style="font-weight:600;color:var(--gray-700);">${fmt.format(p.cout_ha)} EUR</span>
      </div>`;
    });
    html += `<div style="border-top:1px solid var(--gray-200);margin-top:4px;padding-top:4px;font-weight:700;color:var(--gray-900);text-align:right;">Total : ${fmt.format(itk.phytos_total_ha)} EUR/ha</div>`;
  } else if (itk.phytos_total_ha) {
    html += `<div style="font-weight:700;color:var(--gray-900);">Total : ${fmt.format(itk.phytos_total_ha)} EUR/ha</div>`;
  }
  html += '</div>';

  // Mécanisation
  html += '<div>';
  html += '<h4 style="font-weight:700;color:var(--gray-700);margin-bottom:6px;font-size:13px;">Mécanisation</h4>';
  html += `<div style="font-weight:700;color:var(--gray-900);">${meca !== '-' ? fmt.format(meca) + ' EUR/ha' : 'Non renseigné'}</div>`;
  html += '<div style="color:var(--gray-400);font-size:11px;margin-top:2px;">Amort. + fuel + entretien</div>';
  html += '</div>';

  html += '</div>'; // grid

  // Total
  html += `<div style="margin-top:12px;padding:10px 12px;background:var(--gray-50);border-radius:8px;display:flex;justify-content:space-between;align-items:center;">
    <span style="font-weight:600;color:var(--gray-700);">Total charges opérationnelles</span>
    <span style="font-size:16px;font-weight:800;color:var(--accent-700);">${fmt.format(itk.charges_ope_total_ha || 0)} EUR/ha</span>
  </div>`;

  return html;
}
