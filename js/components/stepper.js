// js/components/stepper.js — Composant stepper pour le parcours guide
// Usage: renderStepper(container, currentStep) where currentStep is 1-6

const STEPS = [
  { num: 1, label: 'Decouverte', hash: 'decouverte' },
  { num: 2, label: 'Comptabilite', hash: 'dashboard' },
  { num: 3, label: 'Couts prod.', hash: 'couts-production' },
  { num: 4, label: 'Tresorerie', hash: 'tresorerie' },
  { num: 5, label: 'Simulation', hash: 'simulateur' },
  { num: 6, label: 'Conseil', hash: 'conseil' }
];

export function renderStepper(currentStep = 1) {
  return `
    <div class="stepper fade-in">
      ${STEPS.map((step, i) => {
        const status = step.num < currentStep ? 'completed' : step.num === currentStep ? 'active' : 'pending';
        const dotContent = status === 'completed' ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>' : step.num;
        return `
          ${i > 0 ? `<div class="stepper-line ${step.num <= currentStep ? 'completed' : ''}"></div>` : ''}
          <div class="stepper-step ${status}" data-step="${step.num}" data-hash="${step.hash}" style="cursor: ${status !== 'pending' ? 'pointer' : 'default'}">
            <div class="stepper-dot ${status}">${dotContent}</div>
            <span class="stepper-label">${step.label}</span>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

export function renderStepObjective(currentStep) {
  const objectives = {
    1: { title: 'Decouverte de l\'exploitation', desc: 'Prenez connaissance du profil de l\'exploitation : identite, assolement, contexte regional, materiel et endettement.' },
    2: { title: 'Analyse comptable', desc: 'Explorez le grand livre, identifiez les postes cles et calculez les Soldes Intermediaires de Gestion (SIG).' },
    3: { title: 'Couts de production', desc: 'Analysez les couts de production par culture, identifiez les plus et moins rentables, comparez avec d\'autres exploitations.' },
    4: { title: 'Plan de tresorerie', desc: 'Etudiez le plan de tresorerie mensuel, identifiez les mois critiques et le besoin en fonds de roulement.' },
    5: { title: 'Simulation de crise', desc: 'Appliquez un scenario de crise et analysez son impact sur les couts, la marge et la tresorerie.' },
    6: { title: 'Conseil et recommandations', desc: 'Selectionnez des leviers d\'action, modifiez l\'assolement et generez votre dossier de recommandation.' }
  };
  const obj = objectives[currentStep] || objectives[1];
  return `
    <div class="alert alert-info fade-in" style="margin-bottom: 20px;">
      <div>
        <strong>Etape ${currentStep}/6 — ${obj.title}</strong>
        <div style="font-size: 12px; font-weight: 400; margin-top: 2px; opacity: 0.85;">${obj.desc}</div>
      </div>
    </div>
  `;
}

export function renderStepNavigation(currentStep, exploitationId) {
  const prevStep = currentStep > 1 ? STEPS[currentStep - 2] : null;
  const nextStep = currentStep < 6 ? STEPS[currentStep] : null;

  return `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 32px; padding-top: 20px; border-top: 1px solid var(--gray-100);" class="no-print">
      ${prevStep ? `
        <a href="#${prevStep.hash}" class="btn btn-secondary" style="text-decoration:none;">
          &larr; Etape ${prevStep.num}: ${prevStep.label}
        </a>
      ` : '<div></div>'}
      ${nextStep ? `
        <a href="#${nextStep.hash}" class="btn btn-primary" style="text-decoration:none;" id="btn-next-step">
          Etape ${nextStep.num}: ${nextStep.label} &rarr;
        </a>
      ` : `
        <a href="#rapport" class="btn btn-success" style="text-decoration:none;">
          Generer le rapport final &#10003;
        </a>
      `}
    </div>
  `;
}

export { STEPS };
