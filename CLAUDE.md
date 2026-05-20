# CLAUDE.md — Instructions pour Claude Code

## Projet : THE REAL GAME

Application web statique (HTML/CSS/JS, zéro backend) de simulation de gestion d'exploitation agricole pour des étudiants en école d'ingénieur agronome. Déployable sur GitHub Pages.

## Contexte

Tous les fichiers de contexte sont dans `/context` et `/specs`. Lis-les TOUS avant de commencer à coder :

- `context/00-ARCHITECTURE.md` — Vision, périmètre, modules
- `context/01-REGLES-METIER.md` — Rotations, ITK, charges, prix, SIG, scénarios
- `context/02-PLAN-COMPTABLE.md` — Plan comptable agricole détaillé (comptes 3-4 chiffres)
- `context/regions/*.md` — 5 fiches régionales (Beauce, Nord-Picardie, Bretagne, Sud-Ouest, Rhône-Alpes) avec cultures, rendements, ITK détaillés, charges
- `context/exploitations/*.md` — 10 profils d'exploitations fictives (assolement 3 ans, matériel, emprunts, charges structure)
- `context/modules/module-couts-production.md` — Méthode de calcul des coûts de production
- `context/modules/module-simulation.md` — 6 scénarios de crise avec paramètres
- `context/modules/module-pedagogie.md` — 5 sessions de 2h, exercices, fiches
- `specs/spec-data-model.md` — Structure JSON des grands livres, algorithme de génération
- `specs/spec-app-web.md` — Architecture de l'app, vues, composants, palette couleurs
- `SPRINT-PLAN.md` — Backlog ordonné par priorité et dépendances

## Stack technique

- **HTML5 / CSS3 / JavaScript ES6+** (vanilla, pas de framework)
- **Tailwind CSS** via CDN : `<link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">`
- **Chart.js** via CDN pour tous les graphiques : `<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>`
- **Aucun serveur** — tout en fichiers statiques, ouvrable en local avec `index.html`
- **Données** en fichiers JS (modules exportant des objets) pour compatibilité `file://` — voir section "Gestion des données" ci-dessous

## Gestion des données — IMPORTANT

Les navigateurs bloquent `fetch()` sur le protocole `file://` (CORS). Pour que l'app fonctionne en double-clic sur `index.html` ET sur GitHub Pages, **les fichiers de données doivent être des modules JavaScript**, pas des JSON purs.

Chaque fichier de données est un `.js` qui exporte une constante :
```javascript
// data/exploitations/beauce-01.js
export const data = { "id": "beauce-01", ... };
```

Les fichiers sont importés dynamiquement avec `import()` :
```javascript
// Lazy-loading d'un grand livre
const module = await import(`../data/grands-livres/${id}-${annee}.js`);
const grandLivre = module.data;
```

Cela fonctionne avec `<script type="module">` aussi bien en `file://` qu'en `https://`.

**Convention de nommage :** Tous les fichiers dans `data/` ont l'extension `.js` et exportent `export const data = { ... };`

## Structure de fichiers cible

```
real-game/
├── index.html                    # Page unique SPA (Single Page Application)
├── css/
│   └── styles.css                # Styles custom + @media print pour export PDF
├── js/
│   ├── app.js                    # Routeur SPA, navigation, état global
│   ├── state.js                  # Gestion d'état + persistance localStorage
│   ├── engine/
│   │   ├── couts-production.js   # Calcul des coûts de production par culture
│   │   ├── sig.js                # Calcul des SIG (marge brute → EBE → RCAI)
│   │   ├── simulation.js         # Moteur de simulation de scénarios
│   │   ├── conseil.js            # Moteur de recommandation (leviers d'action)
│   │   ├── tresorerie.js         # Calcul du plan de trésorerie mensuel
│   │   └── resilience.js         # Score de résilience (0-100)
│   └── views/
│       ├── accueil.js            # Sélection exploitation + carte France
│       ├── tableau-bord.js       # Dashboard KPI exploitation
│       ├── grand-livre.js        # Grand livre interactif filtrable
│       ├── sig.js                # Vue SIG + waterfall chart
│       ├── couts-production.js   # Vue analyse CdP par culture
│       ├── simulateur.js         # Vue simulateur avec sliders
│       ├── conseil.js            # Vue mode conseil (modifier assolement + leviers)
│       ├── tresorerie.js         # Vue plan de trésorerie mensuel
│       ├── comparaison.js        # Vue comparaison inter-exploitations
│       ├── rapport.js            # Vue export PDF / dossier recommandation
│       └── fiches-session1.js    # Fiches imprimables calcul à la main
├── data/
│   ├── referentiel-prix.js       # Prix intrants, prix vente, aides PAC sur 3 ans
│   ├── scenarios.js              # 6 scénarios prédéfinis avec multiplicateurs
│   ├── leviers-conseil.js        # Bibliothèque de leviers d'action du conseiller (15-20 leviers)
│   ├── itk-regionaux.js          # ITK par culture par région (coûts opé détaillés)
│   ├── exploitations/
│   │   ├── beauce-01.js          # Profil complet exploitation
│   │   ├── beauce-02.js
│   │   ├── ... (10 fichiers)
│   │   └── rhone-alpes-02.js
│   └── grands-livres/
│       ├── beauce-01-N-2.js
│       ├── beauce-01-N-1.js
│       ├── beauce-01-N.js
│       ├── ... (30 fichiers)
│       └── rhone-alpes-02-N.js
├── context/                      # Fichiers de contexte (pour référence, pas chargés par l'app)
├── specs/                        # Spécifications (pour référence)
└── README.md                     # Guide déploiement + utilisation pour le prof
```

## Ordre de build — RESPECTER CETTE SÉQUENCE

### ÉTAPE 1 : Générer les données JSON

**1.1 — `data/referentiel-prix.json`**

Générer le référentiel de prix sur 3 ans à partir de `context/01-REGLES-METIER.md`. Structure :
```json
{
  "annees": { "N-2": {...}, "N-1": {...}, "N": {...} },
  "prix_intrants": { "N-2": {...}, "N-1": {...}, "N": {...} },
  "prix_vente": { "N-2": {...}, "N-1": {...}, "N": {...} },
  "aides_pac": {...}
}
```

**1.2 — `data/exploitations/*.json` (10 fichiers)**

Pour chaque exploitation, convertir le fichier MD en JSON structuré :
```json
{
  "id": "beauce-01",
  "nom": "EARL des Trois Moulins",
  "exploitant": "Jean-Michel DUVAL",
  "age": 52,
  "region": "beauce",
  "commune": "Voves (28)",
  "forme_juridique": "EARL",
  "sau_totale": 235,
  "sau_propriete": 45,
  "sau_fermage": 190,
  "uth_total": 1.8,
  "assolements": {
    "N-2": [ { "culture": "ble_tendre", "surface": 80, "rendement_realise": 88 }, ... ],
    "N-1": [ { "culture": "ble_tendre", "surface": 78, "rendement_realise": 72 }, ... ],
    "N":   [ { "culture": "ble_tendre", "surface": 82, "rendement_vise": 83 }, ... ]
  },
  "materiel": [ { "nom": "Tracteur JD 6195R", "valeur_achat": 135000, "annee": 2019, "duree_amort": 10, "amort_annuel": 13500 }, ... ],
  "batiments": [ ... ],
  "emprunts": [ { "objet": "Emprunt foncier", "capital_restant": 180000, "taux": 2.5, "annuite": 14400, "echeance": 2035 }, ... ],
  "charges_structure": {
    "fermage": 47500,
    "msa_exploitant": 24800,
    "salaires_charges": 22700,
    "assurances": 9800,
    "mrc": 6100,
    "amort_materiel": 85533,
    "amort_batiments": 17250,
    "frais_financiers": 12800,
    "comptable": 5500,
    "taxes": 7200,
    "energie": 4800,
    "telecom": 1800,
    "deplacements": 3500,
    "cotisations": 2800,
    "frais_bancaires": 1200,
    "divers": 2500
  },
  "charges_structure_total": 255783,
  "fermage_moyen_ha": 250,
  "profil": "Intensive conventionnelle, bien équipée, endettement élevé"
}
```

**1.3 — `data/grands-livres/*.json` (30 fichiers)**

Suivre l'algorithme de `specs/spec-data-model.md`. Pour chaque exploitation et chaque année, générer 120-200 écritures comptables. Chaque écriture :
```json
{
  "date": "2023-08-15",
  "journal": "AC",
  "piece": "AC-2023-001",
  "libelle": "Facture AXEREAL - Semences blé Apache 78 ha",
  "compte_debit": "60121",
  "compte_credit": "4011",
  "montant_ht": 5070.00,
  "tva_taux": 10,
  "tva": 507.00,
  "montant_ttc": 5577.00,
  "analytique": "BT"
}
```

IMPORTANT pour la cohérence :
- Les montants des écritures d'achat d'intrants doivent correspondre aux ITK de la fiche régionale × la surface de la culture × les prix du référentiel pour l'année
- Les montants des ventes = surface × rendement réalisé × prix de vente de l'année
- Les aides PAC = DPB + éco-régime + redistributif (plafonné 52 ha) + aides couplées
- Les charges de structure mensualisées doivent totaliser le montant annuel du profil exploitation
- Les amortissements = somme des amortissements annuels du matériel + bâtiments
- Les remboursements d'emprunts = capital + intérêts conformes aux emprunts du profil

**1.4 — `data/scenarios.json`**

```json
[
  {
    "id": "ormuz",
    "nom": "Crise d'Ormuz",
    "description": "Blocage du détroit d'Ormuz, flambée pétrole et gaz, tension sur les engrais azotés",
    "categorie": "geopolitique",
    "multiplicateurs": {
      "prix_engrais_n": 1.60,
      "prix_gnr": 1.45,
      "prix_phytos": 1.12,
      "prix_vente": { "ble_tendre": 1.18, "colza": 1.15, "mais_grain": 1.20, ... },
      "rendements": { "defaut": 1.00 }
    }
  },
  ...
]
```

**1.5 — `data/leviers-conseil.js`**

Bibliothèque de **15-20 leviers d'action** du conseiller de gestion. Chaque levier a un champ `applicable` qui filtre par région et/ou type d'exploitation pour ne proposer que des leviers pertinents.

```javascript
export const data = [
  // === CHARGES OPÉRATIONNELLES ===
  {
    "id": "reduire_azote_10",
    "nom": "Réduire la dose d'azote de 10%",
    "categorie": "charges_operationnelles",
    "description": "Baisser la fertilisation azotée de 10% avec un impact rendement limité (-2% céréales, -3% colza)",
    "applicable": { "regions": ["toutes"], "condition": null },
    "impact": { "charges_engrais_n": -0.10, "rendement_cereales": -0.02, "rendement_colza": -0.03 }
  },
  {
    "id": "reduire_azote_20",
    "nom": "Réduire la dose d'azote de 20%",
    "categorie": "charges_operationnelles",
    "description": "Réduction forte — économie significative mais perte de rendement notable (-5% céréales, -8% colza)",
    "applicable": { "regions": ["toutes"], "condition": null },
    "impact": { "charges_engrais_n": -0.20, "rendement_cereales": -0.05, "rendement_colza": -0.08 }
  },
  {
    "id": "supprimer_t2_fongicide",
    "nom": "Supprimer le 2e traitement fongicide",
    "categorie": "charges_operationnelles",
    "description": "Ne garder qu'un seul passage fongicide — économie ~45 €/ha mais risque sanitaire accru",
    "applicable": { "regions": ["toutes"], "condition": null },
    "impact": { "charges_phytos": -0.25, "rendement_cereales": -0.04 }
  },
  {
    "id": "semences_ferme",
    "nom": "Utiliser des semences de ferme (blé)",
    "categorie": "charges_operationnelles",
    "description": "Réutiliser sa propre récolte comme semence : économie ~40 €/ha mais pas sur variétés protégées",
    "applicable": { "regions": ["toutes"], "condition": "a_ble_tendre" },
    "impact": { "charges_semences_ble": -0.55, "rendement_ble": -0.01 }
  },

  // === MÉCANISATION ===
  {
    "id": "passer_cuma_moisson",
    "nom": "Passer la moisson en CUMA",
    "categorie": "charges_mecanisation",
    "description": "Remplacer la moissonneuse propre par la CUMA — baisse amortissement, hausse coût/ha",
    "applicable": { "regions": ["toutes"], "condition": "possede_moissonneuse" },
    "impact": { "amort_materiel": -23000, "cout_moisson_ha": 85 }
  },
  {
    "id": "passer_tcs",
    "nom": "Passer en TCS (abandon du labour)",
    "categorie": "charges_mecanisation",
    "description": "Techniques culturales simplifiées : -20% fuel/usure, +15% herbicides, risque adventices an 1",
    "applicable": { "regions": ["toutes"], "condition": null },
    "impact": { "cout_mecanisation": -0.20, "cout_herbicides": 0.15, "rendement_annee1": -0.05, "rendement_annee3": 0.00 }
  },
  {
    "id": "externaliser_epandage",
    "nom": "Externaliser l'épandage (ETA)",
    "categorie": "charges_mecanisation",
    "description": "Faire appel à une ETA pour l'épandage — réduit l'amortissement mais coûte ~35 €/ha",
    "applicable": { "regions": ["toutes"], "condition": null },
    "impact": { "amort_materiel": -8000, "cout_eta_ha": 35 }
  },

  // === ASSOLEMENT ===
  {
    "id": "augmenter_proteagineux",
    "nom": "Augmenter la sole de protéagineux (+10 ha)",
    "categorie": "assolement",
    "description": "Remplacer 10 ha de blé par du pois : économie azote + aide couplée 106 €/ha",
    "applicable": { "regions": ["toutes"], "condition": null },
    "impact": { "surface_ble_tendre": -10, "surface_pois": 10, "aide_couplee_supplementaire": 1060 }
  },
  {
    "id": "diversifier_tournesol",
    "nom": "Introduire du tournesol (10 ha)",
    "categorie": "assolement",
    "description": "Culture peu gourmande en intrants, bonne tête d'assolement — adapté Sud et Centre",
    "applicable": { "regions": ["beauce", "sud_ouest", "rhone_alpes"], "condition": null },
    "impact": { "surface_ble_tendre": -10, "surface_tournesol": 10 }
  },
  {
    "id": "introduire_lentille",
    "nom": "Introduire de la lentille (5 ha)",
    "categorie": "assolement",
    "description": "Forte valeur ajoutée (lentille verte du Puy AOP) — mais rendement aléatoire",
    "applicable": { "regions": ["rhone_alpes"], "condition": null },
    "impact": { "surface_ble_tendre": -5, "surface_lentille": 5 }
  },
  {
    "id": "reduire_mais_irrigue",
    "nom": "Réduire le maïs irrigué (-15 ha) au profit du sorgho",
    "categorie": "assolement",
    "description": "Le sorgho consomme 30% d'eau en moins et coûte moins cher en irrigation",
    "applicable": { "regions": ["sud_ouest"], "condition": "a_mais_irrigue" },
    "impact": { "surface_mais": -15, "surface_sorgho": 15, "cout_irrigation": -0.30 }
  },

  // === COMMERCIALISATION ===
  {
    "id": "stockage_difere",
    "nom": "Stocker et vendre en différé (+3 mois)",
    "categorie": "commercialisation",
    "description": "Reporter la vente pour capter un meilleur prix — coût stockage 5 €/t, bonus espéré +8%",
    "applicable": { "regions": ["toutes"], "condition": null },
    "impact": { "cout_stockage_t": 5, "prix_vente_bonus_pct": 8, "risque_baisse_pct": -5 }
  },
  {
    "id": "contrat_prix_ferme",
    "nom": "Souscrire un contrat à prix ferme avant moisson",
    "categorie": "commercialisation",
    "description": "Fixer le prix de 50% de la récolte 3 mois avant moisson — sécurise le revenu",
    "applicable": { "regions": ["toutes"], "condition": null },
    "impact": { "prix_vente_couvert_pct": 50, "prix_fixe_ble": 210 }
  },

  // === GESTION DES RISQUES ===
  {
    "id": "souscrire_mrc",
    "nom": "Souscrire une assurance récolte MRC",
    "categorie": "gestion_risques",
    "description": "Multirisque climatique franchise 25% — coût ~30 €/ha, indemnisation si perte > 25%",
    "applicable": { "regions": ["toutes"], "condition": null },
    "impact": { "cout_mrc_ha": 30, "indemnisation_si_perte_25pct": true }
  },
  {
    "id": "epargne_precaution",
    "nom": "Constituer une épargne de précaution (DEP)",
    "categorie": "gestion_risques",
    "description": "Mettre de côté 15 000 € sur un compte DEP — réduit la trésorerie immédiate mais sécurise",
    "applicable": { "regions": ["toutes"], "condition": null },
    "impact": { "tresorerie_immediate": -15000, "reserve_mobilisable": 15000 }
  },

  // === FINANCIER ===
  {
    "id": "renegocier_emprunt",
    "nom": "Renégocier les emprunts (allonger durée)",
    "categorie": "financier",
    "description": "Allonger la durée de 3 ans — réduit les annuités de 25% mais augmente le coût total (+15%)",
    "applicable": { "regions": ["toutes"], "condition": "a_emprunts" },
    "impact": { "annuites": -0.25, "cout_total_interet": 0.15 }
  },
  {
    "id": "renegocier_fermage",
    "nom": "Renégocier le fermage (-5%)",
    "categorie": "financier",
    "description": "Demander une baisse de fermage au propriétaire — applicable en année de crise",
    "applicable": { "regions": ["toutes"], "condition": "a_fermage" },
    "impact": { "fermage": -0.05 }
  },

  // === STRUCTURE ===
  {
    "id": "mutualiser_sechage",
    "nom": "Mutualiser le séchage maïs (CUMA)",
    "categorie": "charges_structure",
    "description": "Séchoir collectif au lieu d'individuel — économie d'amortissement",
    "applicable": { "regions": ["bretagne", "sud_ouest"], "condition": "a_mais" },
    "impact": { "cout_sechage_ha_mais": -0.30, "amort_materiel": -5000 }
  },
  {
    "id": "optimiser_irrigation",
    "nom": "Optimiser l'irrigation (sondes tensiométriques)",
    "categorie": "charges_structure",
    "description": "Pilotage par sondes — réduit la consommation d'eau de 15% sans impact rendement",
    "applicable": { "regions": ["sud_ouest", "rhone_alpes"], "condition": "a_irrigation" },
    "impact": { "cout_irrigation": -0.15 }
  }
];
```

**Logique de filtrage dans l'interface :**
- Si `applicable.regions` contient `"toutes"` → levier affiché pour toutes les exploitations
- Sinon → affiché uniquement si la région de l'exploitation est dans la liste
- Si `applicable.condition` est non-null → vérifier la condition sur le profil de l'exploitation (ex : `possede_moissonneuse` = vrai si le matériel contient une moissonneuse-batteuse)
- Les leviers non applicables sont masqués (pas grisés) pour éviter la confusion

**1.6 — `data/itk-regionaux.js`** ⚠️ NOUVEAU

Fichier regroupant les ITK (coûts opérationnels détaillés par culture par région), extrait des fiches régionales MD. Utilisé par le moteur de CdP et les fiches Session 1.

```javascript
export const data = {
  "beauce": {
    "ble_tendre": {
      "semences": { "variete": "Apache", "dose_kg_ha": 160, "prix_kg": 0.41, "cout_ha": 65.6 },
      "engrais": [
        { "produit": "Ammonitrate 33,5%", "apport": 1, "dose_kg_ha": 150, "prix_kg": 0.35, "cout_ha": 52.5 },
        { "produit": "Ammonitrate 33,5%", "apport": 2, "dose_kg_ha": 200, "prix_kg": 0.35, "cout_ha": 70.0 },
        { "produit": "Ammonitrate 33,5%", "apport": 3, "dose_kg_ha": 150, "prix_kg": 0.35, "cout_ha": 52.5 },
        { "produit": "Engrais PK 0-25-25", "apport": 1, "dose_kg_ha": 300, "prix_kg": 0.26, "cout_ha": 78.0 }
      ],
      "engrais_total_ha": 253.0,
      "phytos": [
        { "type": "Herbicide automne", "dose_l_ha": 3.0, "prix_l": 10.7, "cout_ha": 32.1 },
        { "type": "Herbicide rattrapage", "dose_l_ha": 1.0, "prix_l": 28.0, "cout_ha": 28.0 },
        { "type": "Fongicide T1", "dose_l_ha": 0.8, "prix_l": 43.8, "cout_ha": 35.0 },
        { "type": "Fongicide T2", "dose_l_ha": 1.0, "prix_l": 45.0, "cout_ha": 45.0 },
        { "type": "Régulateur", "dose_l_ha": 1.5, "prix_l": 8.0, "cout_ha": 12.0 },
        { "type": "Insecticide", "dose_l_ha": 0.075, "prix_l": 107.0, "cout_ha": 8.0 }
      ],
      "phytos_total_ha": 160.1,
      "charges_ope_total_ha": 478.7,
      "mecanisation_ha": 400
    },
    "colza": { ... },
    ...
  },
  "nord_picardie": { ... },
  "bretagne": { ... },
  "sud_ouest": { ... },
  "rhone_alpes": { ... }
};
```

Les prix unitaires dans l'ITK sont les prix de base (année N). Pour N-2 et N-1, le moteur applique les index du référentiel (`index_semences`, `index_phytos`, prix engrais réels).

### ÉTAPE 1bis : Module d'état (`js/state.js`) ⚠️ NOUVEAU

Module de gestion d'état qui persiste dans `localStorage` pour conserver le travail des étudiants entre les sessions (5 sessions de 2h sur plusieurs semaines).

```javascript
// js/state.js
const STATE_KEY = 'real-game-state';

const defaultState = {
  // Identification
  nomEtudiant: '',          // Nom de l'étudiant ou du binôme
  exploitationId: null,     // Exploitation sélectionnée
  annee: 'N',               // Année active (N-2, N-1, N)

  // Scénario actif
  scenarioActif: null,      // ID du scénario sélectionné (null = aucun)
  parametresLibres: {},      // Paramètres custom si mode libre

  // Conseil
  leviersSelectionnes: [],   // IDs des leviers cochés
  assolementModifie: null,   // Assolement modifié par l'étudiant (null = pas de modif)

  // Résultats calculés (pour ne pas recalculer à chaque navigation)
  resultatsSimulation: null,
  resultatsConseil: null,

  // Timestamp
  derniereSauvegarde: null
};

export function chargerEtat() {
  try {
    const saved = localStorage.getItem(STATE_KEY);
    return saved ? { ...defaultState, ...JSON.parse(saved) } : { ...defaultState };
  } catch {
    return { ...defaultState };
  }
}

export function sauvegarderEtat(state) {
  state.derniereSauvegarde = new Date().toISOString();
  localStorage.setItem(STATE_KEY, JSON.stringify(state));
}

export function reinitialiserEtat() {
  localStorage.removeItem(STATE_KEY);
  return { ...defaultState };
}
```

**Comportement attendu :**
- L'état est sauvegardé automatiquement à chaque action significative (sélection exploitation, lancement simulation, application leviers, modification assolement)
- Au chargement de l'app, si un état existe, l'app restaure la dernière session (exploitation, scénario, leviers)
- Un bandeau discret en haut affiche "Session restaurée — [Exploitation] — [Date]" avec un bouton "Réinitialiser"
- Le bouton "Réinitialiser" dans la sidebar demande confirmation puis remet tout à zéro

---

### ÉTAPE 2 : Moteur de calcul (dossier `js/engine/`)

**2.1 — `engine/couts-production.js`**

Exporte une fonction `calculerCoutsProduction(exploitation, annee, referentiel)` qui retourne pour chaque culture :
- charges_ope_directes (semences + engrais + phytos)
- charges_mecanisation (amort prorata + fuel + entretien)
- charges_structure_reparties (fermage + MSA + assurances + ... prorata SAU)
- remuneration_mo (UTH × 31 800 € / SAU)
- coproduits (paille vendue estimée)
- cdp_ha = somme − coproduits
- cdp_tonne = cdp_ha / rendement en tonnes
- seuil_commercialisation = cdp_tonne − aides_pac_tonne

Source de la méthode : `context/modules/module-couts-production.md`

**2.2 — `engine/sig.js`**

Calcule les SIG à partir du grand livre ou des données agrégées :
- Produit brut (ventes + variation stocks + aides)
- Charges opérationnelles
- Marge brute
- Charges de structure
- EBE
- Amortissements
- Résultat d'exploitation
- Frais financiers
- RCAI

**2.3 — `engine/tresorerie.js`** ⚠️ CRITIQUE

Calcule un **plan de trésorerie mensuel** sur 12 mois à partir des écritures du grand livre.

Pour chaque mois (juillet à juin) :
```javascript
{
  mois: "2024-07",
  encaissements: {
    ventes_cereales: 45000,
    aides_pac: 0,
    autres: 0,
    total: 45000
  },
  decaissements: {
    achats_intrants: 12000,
    charges_structure: 8500,
    annuites_emprunt: 6000,
    msa: 6200,
    salaires: 1200,
    impots: 0,
    autres: 2000,
    total: 35900
  },
  solde_mensuel: 9100,
  tresorerie_cumulee: 9100
}
```

Le plan de trésorerie doit montrer :
- Les mois de "creux" (hiver : charges sans recettes)
- Les mois de "pic" (moisson : encaissements importants)
- L'impact d'un scénario sur le besoin de trésorerie max (BFR)
- La comparaison du plan de trésorerie AVANT et APRÈS scénario
- La comparaison AVANT et APRÈS application des leviers de conseil

**2.4 — `engine/simulation.js`**

Applique les multiplicateurs d'un scénario et recalcule TOUT :
- Nouveaux coûts de production par culture
- Nouveaux SIG
- Nouveau plan de trésorerie mensuel
- Delta (variation) pour chaque indicateur : en € et en %
- Identification du mois de trésorerie le plus critique

**2.5 — `engine/conseil.js`**

Applique les leviers de conseil sélectionnés par l'étudiant :
- Recalcule l'assolement si modifié
- Recalcule les charges impactées
- Recalcule les CdP, SIG, trésorerie
- Compare AVANT conseil / APRÈS conseil
- Peut être combiné avec un scénario : scénario + conseil = résultat final

**2.6 — `engine/resilience.js`**

Score composite 0-100 basé sur :
- Trésorerie minimale sur 12 mois (poids 25%)
- Ratio annuités / EBE (poids 25%)
- Diversification de l'assolement (indice de Shannon, poids 15%)
- Marge de sécurité moyenne sur les cultures (poids 20%)
- Part des charges fixes dans le total (poids 15%)

### ÉTAPE 3 : Interface web (dossier `js/views/`)

Architecture SPA (Single Page Application) dans un seul `index.html`. Navigation par hash routing (`#accueil`, `#dashboard`, `#grand-livre`, etc.).

**Palette couleurs** (voir `specs/spec-app-web.md`) :
- Primaire : `#2D5016` (vert agricole)
- Secondaire : `#D4A843` (or/blé)
- Fond : `#FDF8EE` (crème)
- Texte : `#2C2C2C`
- Vert/Orange/Rouge pour les alertes

**Graphiques Chart.js** à utiliser :
- Donut : assolement
- Waterfall (bar chart custom) : SIG
- Stacked bar : décomposition coûts de production
- Grouped bar : comparaison
- Line : trésorerie mensuelle (AVANT vs APRÈS en 2 lignes)
- Radar : profil résilience
- Gauge (doughnut partiel) : jauges de santé

**Vues à implémenter :**

3.1 **Accueil** — Carte de France stylisée SVG avec les 5 régions cliquables. 10 cartes exploitation avec SAU, région, score résilience.

3.2 **Tableau de bord** — KPI (EBE, RCAI, trésorerie, annuités/EBE) avec jauges colorées. Donut assolement. Sélecteur année N-2/N-1/N. Alertes si indicateurs dans le rouge.

3.3 **Grand livre** — Table HTML complète avec filtres dynamiques :
  - Dropdown : compte (arborescence 601 → 6011 → 60111)
  - Dropdown : journal (AC, VT, BQ, OD)
  - Date picker : du / au
  - Dropdown : analytique (BT, CZ, OH, etc.)
  - Champ texte : recherche dans libellés
  - Tri par colonne (clic sur en-tête)
  - Total débits / crédits / solde en pied de table
  - Bouton "Export CSV"

3.4 **SIG** — Tableau des SIG + graphique waterfall (Produit brut → déductions successives → RCAI). Comparaison sur 3 ans en barres groupées.

3.5 **Coûts de production** — Tableau une ligne par culture : surface, rendement, charges opé, charges méca, charges struct, rémunération MO, coproduits, CdP/ha, CdP/t, seuil commercialisation, prix vente, marge/t. Graphique barres empilées : décomposition du CdP. Graphique : CdP/t vs prix de vente (ligne rouge = seuil, barres = CdP par culture).

3.6 **Simulateur** ⚠️ VUE CENTRALE DU JEU — En haut : dropdown scénario prédéfini (auto-remplit les sliders) + bouton "Mode libre". Sliders pour chaque paramètre (engrais, GNR, phytos, prix vente par culture, rendements). Bouton "LANCER LA SIMULATION". Résultats :
  - Tableau AVANT / APRÈS / VARIATION pour chaque indicateur (CdP par culture, marge brute, EBE, RCAI, trésorerie min)
  - **Graphique ligne trésorerie mensuelle : courbe AVANT (bleu) vs APRÈS scénario (rouge)** — montrer visuellement quand la trésorerie passe sous zéro
  - **Tableau variation des besoins de trésorerie** : BFR avant, BFR après, variation
  - **Tableau variation des CdP par culture** : CdP/t avant, après, variation en € et %
  - Jauges de santé après scénario
  - Verdict : "L'exploitation survit" / "Trésorerie critique" / "Cessation de paiement"

3.7 **Mode Conseil** — Interface pour l'étudiant-conseiller :
  - Sélection de leviers dans la bibliothèque (checkboxes)
  - Modification manuelle de l'assolement (tableau éditable : ajuster les surfaces, le total doit rester = SAU)
  - Bouton "APPLIQUER MES RECOMMANDATIONS"
  - Résultat : tableau AVANT / APRÈS CONSEIL pour tous les indicateurs
  - Peut être combiné avec un scénario actif : "impact du scénario + mes recommandations"
  - **Courbe trésorerie : 3 lignes — situation initiale (bleu), après scénario seul (rouge), après scénario + conseil (vert)**
  - Score de résilience avant/après
  - Bouton "GÉNÉRER LE DOSSIER DE RECOMMANDATION"

3.8 **Plan de trésorerie** — Vue dédiée au plan de trésorerie mensuel :
  - Tableau 12 colonnes (juil → juin) avec encaissements / décaissements / solde / cumul
  - Graphique ligne : trésorerie cumulée mois par mois
  - Mise en rouge des mois où la trésorerie est négative
  - Si scénario actif : superposition AVANT / APRÈS
  - Indicateur BFR max (besoin de trésorerie maximal dans l'année)

3.9 **Comparaison** — Sélection de 2 à 4 exploitations. Radar superposé (EBE/ha, CdP blé/t, trésorerie/ha, diversification, endettement). Barres groupées. Tableau comparatif.

3.10 **Rapport PDF** — Vue "dossier de recommandation" formatée pour impression (`@media print`). Structure :
  ```
  PAGE 1 : Page de garde (nom exploitation, nom étudiant/binôme depuis state.nomEtudiant, date)
  PAGE 2 : Diagnostic — Fiche identité exploitation + KPI + assolement
  PAGE 3 : Analyse des coûts de production — Tableau CdP par culture + graphique
  PAGE 4 : Plan de trésorerie — Tableau mensuel + graphique
  PAGE 5 : Simulation de crise — Scénario appliqué + impacts chiffrés
  PAGE 6 : Variation trésorerie et CdP — Tableaux comparatifs AVANT/APRÈS
  PAGE 7 : Recommandations du conseiller — Leviers appliqués + impact chiffré
  PAGE 8 : Plan de trésorerie APRÈS recommandations — Preuve que ça tient
  PAGE 9 : Score de résilience AVANT/APRÈS + Verdict
  PAGE 10 : Conclusion et plan d'action
  ```

  ⚠️ **Gestion des graphiques pour l'impression :**
  Les `<canvas>` Chart.js ne se rendent pas bien dans `window.print()`. Avant l'impression :
  1. Pour chaque graphique Chart.js visible dans la vue rapport, appeler `canvas.toDataURL('image/png')`
  2. Remplacer le `<canvas>` par un `<img src="data:image/png;base64,...">` dans le DOM de la vue rapport
  3. Les `<img>` s'impriment correctement contrairement aux canvas

  Bouton "Imprimer / Exporter PDF" :
  - Étape 1 : Vérifier que `state.nomEtudiant` n'est pas vide (sinon prompt demandant le nom)
  - Étape 2 : Convertir tous les canvas en images
  - Étape 3 : `window.print()` avec CSS `@media print` qui masque la navigation et formate proprement
  - La CSS `@media print` utilise `page-break-before: always` pour chaque section numérotée

3.11 **Fiches Session 1** — Fiches imprimables pour le calcul à la main :
  - Fiche exploitation (version allégée : SAU, assolement, charges structure)
  - Fiche ITK blé tendre avec prix unitaires et cases vides à remplir (données de `itk-regionaux.js`)
  - Feuille de calcul vierge coûts de production
  - Voir les templates dans `context/modules/module-pedagogie.md`

  ⚠️ **Mode batch pour le prof :**
  - Accessible via URL directe : `#fiches-session1` (sans avoir besoin de sélectionner une exploitation)
  - Par défaut : affiche les fiches de l'exploitation sélectionnée
  - Bouton **"Imprimer TOUTES les fiches (10 exploitations)"** : génère les fiches des 10 exploitations à la suite, avec saut de page entre chaque jeu de fiches. Chaque jeu = fiche exploitation + fiche ITK + feuille de calcul vierge = 3 pages par exploitation.
  - Le prof peut ainsi imprimer les 30 pages en un clic et distribuer à chaque binôme son lot

### ÉTAPE 4 : Finitions

4.1 **Navigation** — Sidebar fixe à gauche avec :
  - Logo "The Real Game"
  - **Champ texte "Nom / Binôme"** (sauvegardé dans localStorage, utilisé sur la page de garde du rapport PDF)
  - Exploitation sélectionnée (nom + région)
  - Sélecteur année (N-2 / N-1 / N)
  - Liens vers chaque vue (icônes + texte)
  - Indicateur scénario actif (si applicable, avec badge coloré)
  - Indicateur leviers actifs (nombre de leviers appliqués)
  - **Bouton "Réinitialiser"** — remet tout à zéro (confirmation modale avant) : exploitation, scénario, leviers, assolement modifié
  - Responsive tablette (sidebar rétractable en hamburger menu)

4.2 **README.md** — Instructions pour :
  - Déployer sur GitHub Pages (activer Pages sur la branche main, dossier /root)
  - Ouvrir en local (double-clic sur index.html)
  - Guide du prof : comment utiliser en cours, progression des 5 sessions

## Règles de code

1. **Pas de build step** — Le code doit fonctionner tel quel dans un navigateur. Pas de npm, pas de webpack, pas de TypeScript compilé. Que du JS vanilla avec `<script type="module">`.
2. **Fichiers de données en `.js` (pas `.json`)** — Chaque fichier data exporte `export const data = {...};` et est chargé avec `import()` dynamique. Cela garantit le fonctionnement en `file://` (pas de CORS). Les grands livres sont lazy-loaded (importés uniquement quand l'exploitation est sélectionnée).
3. **Persistance localStorage** — L'état de travail (exploitation, scénario, leviers, assolement modifié, nom étudiant) est sauvegardé automatiquement dans `localStorage` et restauré au rechargement.
4. **Responsive** — Minimum 1024px de large. Les tableaux scroll horizontalement sur petit écran.
5. **Accessibilité** — Contrastes suffisants, labels sur les champs, navigation clavier.
6. **Performance** — Les calculs du moteur doivent être < 100ms. Le chargement initial < 3s.
7. **Code commenté** — Chaque fonction du moteur de calcul doit avoir un commentaire expliquant la formule utilisée.
8. **Français** — Toute l'interface est en français. Les noms de variables dans le code peuvent être en anglais.

## Validation

Après le build, vérifier :
- [ ] `index.html` s'ouvre en double-clic dans Chrome/Firefox **sans serveur** (les imports dynamiques `.js` fonctionnent en `file://`)
- [ ] Les 10 exploitations sont accessibles depuis l'accueil
- [ ] Le grand livre de BEAUCE-01 affiche au moins 150 écritures pour N-1
- [ ] Les CdP blé tendre de BEAUCE-01 sont cohérents (~200 €/t)
- [ ] Le simulateur "Crise d'Ormuz" augmente le CdP blé d'au moins 15%
- [ ] Le plan de trésorerie montre un creux en hiver et un pic à la moisson
- [ ] Le mode conseil permet de modifier l'assolement et recalcule les indicateurs
- [ ] Les leviers affichés changent selon la région de l'exploitation (pas de tournesol en Bretagne, pas d'irrigation en Beauce, etc.)
- [ ] La courbe de trésorerie montre 3 lignes (initial, scénario, scénario+conseil) quand les 2 modes sont actifs
- [ ] Le rapport PDF s'imprime proprement sur 10 pages environ, **les graphiques apparaissent bien** (conversion canvas → img)
- [ ] La page de garde du rapport affiche le nom de l'étudiant saisi dans la sidebar
- [ ] Les fiches Session 1 s'impriment sur des pages séparées
- [ ] Le bouton "Imprimer TOUTES les fiches" génère les 10 jeux de fiches à la suite
- [ ] Le score de résilience change quand on applique des leviers de conseil
- [ ] **Persistance** : fermer le navigateur, rouvrir `index.html` → l'exploitation, le scénario et les leviers sont restaurés
- [ ] Le bouton "Réinitialiser" remet tout à zéro après confirmation
