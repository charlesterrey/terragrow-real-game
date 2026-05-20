# V1-SPEC — THE REAL GAME : De la MVP à la V1 Production

## Vision

Transformer l'outil de simulation agricole d'une MVP fonctionnelle en une **plateforme pédagogique professionnelle** de niveau Finthesis/Agicap, avec :
- Un **parcours guidé step-by-step** pour chaque exploitation
- Un **système de checklist et progression** multi-exploitations  
- Un **design premium** inspiré des meilleurs outils financiers SaaS
- Une **profondeur métier** digne d'un vrai outil de conseil agricole

---

## 1. PARCOURS GUIDÉ — L'étudiant sait toujours quoi faire

### 1.1 Concept : Le "Dossier d'exploitation"

Quand l'étudiant clique sur une exploitation, il n'arrive plus sur un dashboard brut. Il entre dans un **dossier structuré en 6 étapes** :

```
ÉTAPE 1 — Découverte de l'exploitation
  → Fiche identité, contexte régional, assolement, profil exploitant
  → L'étudiant lit et comprend le cas avant de calculer quoi que ce soit

ÉTAPE 2 — Analyse comptable  
  → Grand livre interactif, SIG, comprendre d'où vient le résultat
  → Exercices : trouver les comptes clés, calculer la marge brute

ÉTAPE 3 — Coûts de production
  → CdP par culture, décomposition, seuil de commercialisation
  → Identifier la culture la plus/moins rentable, comparer avec d'autres exploitations

ÉTAPE 4 — Plan de trésorerie
  → Trésorerie mensuelle, identifier les mois critiques, BFR
  → Comprendre le cycle de trésorerie agricole (creux hiver, pic moisson)

ÉTAPE 5 — Simulation de crise
  → Choisir un scénario, lancer la simulation, analyser les impacts
  → Identifier les vulnérabilités spécifiques de CETTE exploitation

ÉTAPE 6 — Conseil et recommandations
  → Sélectionner des leviers, modifier l'assolement, mesurer l'effet
  → Générer le dossier de recommandation final
```

### 1.2 Interface du stepper

En haut de chaque page "dossier", un **stepper horizontal** type Finthesis :

```
[1. Découverte] ——→ [2. Comptabilité] ——→ [3. Coûts prod.] ——→ [4. Trésorerie] ——→ [5. Simulation] ——→ [6. Conseil]
     ✅                    ✅                   🔵 En cours            ⬜                    ⬜                   ⬜
```

- Chaque étape a un **objectif clair** affiché en haut
- Un bouton "Étape suivante →" guide la progression
- L'étudiant peut revenir en arrière librement
- L'étape active est sauvegardée dans localStorage

### 1.3 Contenu détaillé de chaque étape

#### ÉTAPE 1 : Découverte (nouvelle vue)

**Layout type Finthesis :** Grande carte identité + colonnes KPI

```
┌─────────────────────────────────────────────────────────────────┐
│  EARL des Trois Moulins                          Beauce (28)    │
│  Jean-Michel DUVAL, 52 ans                       EARL           │
│  "Intensive conventionnelle, bien équipée"                      │
├─────────────┬──────────────┬──────────────┬─────────────────────┤
│  SAU        │  Main-d'oeuvre│  Fermage     │  Endettement       │
│  235 ha     │  1.8 UTH     │  250 €/ha    │  384 000 €         │
│             │              │  (81% SAU)   │  Annuités: 42 400€ │
├─────────────┴──────────────┴──────────────┴─────────────────────┤
│                                                                  │
│  ASSOLEMENT (donut chart)          CONTEXTE RÉGIONAL            │
│  [Donut interactif avec            Beauce : Sols limoneux       │
│   surfaces et % par culture]       profonds, potentiel élevé.   │
│                                    Climat océanique dégradé.    │
│                                    Risque principal : prix.     │
│                                                                  │
│  MATÉRIEL PRINCIPAL                EMPRUNTS                     │
│  • Tracteur JD 6195R (2019)       • Foncier: 180k€ @2.5%      │
│  • Moissonneuse NH CX8.80         • Matériel: 120k€ @3.2%     │
│  • Pulvé Berthoud 36m             • Bâtiment: 84k€ @2.8%      │
│  Total amort: 85 533 €/an         Total annuités: 42 400€/an  │
│                                                                  │
│  ITK DÉTAILLÉ PAR CULTURE (accordéon dépliable)                │
│  ▸ Blé tendre — 82 ha — 83 q/ha visé                          │
│  ▸ Colza — 38 ha — 36 q/ha visé                               │
│  ▸ Orge d'hiver — 32 ha — 75 q/ha visé                        │
│  ▸ ...                                                          │
│                                                                  │
│  [✓ J'ai pris connaissance du dossier → Passer à l'étape 2]   │
└─────────────────────────────────────────────────────────────────┘
```

Quand on déplie un ITK (ex: Blé tendre), on voit le détail complet :
- Semences : variété, dose, prix, coût/ha
- Engrais : chaque apport détaillé (produit, dose, prix, coût)
- Phytos : chaque traitement (type, dose, prix, coût)
- Mécanisation : forfait ou détail
- **Total charges opérationnelles / ha**

C'est exactement ce qu'ils auraient sur la fiche papier de la Session 1, mais en interactif.

#### ÉTAPE 2 : Analyse comptable (vue grand-livre + SIG améliorée)

- Grand livre filtrable (existant, à polir)
- SIG avec waterfall chart Finthesis-style
- **Nouveau : mini-exercices intégrés** (optionnels)
  - "Trouvez le total des achats d'engrais (compte 6011)" → champ de réponse → validation
  - "Quel est le montant des ventes de blé ?" → etc.

#### ÉTAPE 3 : Coûts de production (vue CdP améliorée)

- Tableau par culture avec sparklines
- **Graphique "CdP vs Prix de vente"** — barres empilées (charges opé + méca + struct + rém MO) vs ligne rouge (prix marché)
- **Graphique radar par culture** : rentabilité relative
- Drill-down : cliquer sur une culture → détail complet de son CdP

#### ÉTAPE 4 : Plan de trésorerie (nouvelle vue dédiée, style Agicap)

- **Graphique principal** : courbe de trésorerie cumulée sur 12 mois (juil → juin)
- Barres vertes (encaissements) et rouges (décaissements) par mois
- Zone rouge quand la trésorerie passe sous zéro
- KPIs : BFR max, mois le plus critique, nb de mois en négatif
- Tableau détaillé encaissements/décaissements par catégorie

#### ÉTAPE 5 : Simulation (vue simulateur existante, améliorée)

- Impact en temps réel quand on bouge les sliders (pas besoin de cliquer "Lancer")
- **Courbe de trésorerie AVANT (bleu) vs APRÈS (rouge)** — le visuel le plus parlant
- Tableau variation CdP par culture
- Verdict visuel : jauge de santé (vert/orange/rouge)

#### ÉTAPE 6 : Conseil (vue conseil existante, améliorée)

- Checklist de leviers avec impact estimé affiché avant de cocher
- Éditeur d'assolement : tableau avec +/- sur les surfaces, contrainte SAU totale
- **3 courbes de trésorerie** : initial (bleu), scénario (rouge), scénario+conseil (vert)
- Score de résilience avant/après
- Bouton "Générer mon rapport" → vue rapport PDF

---

## 2. CHECKLIST ET PROGRESSION MULTI-EXPLOITATIONS

### 2.1 Vue Portfolio améliorée (accueil)

L'accueil devient un **tableau de bord de progression** :

```
┌─────────────────────────────────────────────────────────────────┐
│  THE REAL GAME — Votre portefeuille                             │
│  Progression globale : ████████░░ 4/10 exploitations traitées  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Exploitation          │ Région       │ Étape    │ Statut       │
│  ──────────────────────┼──────────────┼──────────┼──────────────│
│  EARL des Trois Moulins│ Beauce       │ 6/6 ✅  │ Rapport fait │
│  GAEC du Plateau       │ Beauce       │ 4/6 🔵  │ Trésorerie   │
│  EARL Carpentier       │ Nord-Picardie│ 1/6 🔵  │ Découverte   │
│  SCA Dupont-Martin     │ Nord-Picardie│ —  ⬜   │ Non commencé │
│  GAEC Le Bihan         │ Bretagne     │ —  ⬜   │ Non commencé │
│  ...                                                             │
│                                                                  │
│  [Filtrer par région ▼]  [Filtrer par statut ▼]                │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Persistance de la progression

Dans `state.js`, ajout :

```javascript
progression: {
  "beauce-01": { etape: 6, complete: true, rapport: true, dateDebut: "...", dateFin: "..." },
  "beauce-02": { etape: 4, complete: false, rapport: false, dateDebut: "..." },
  "nord-picardie-01": { etape: 1, complete: false },
  // ... etc
}
```

### 2.3 Transition entre exploitations

Quand l'étudiant termine l'étape 6 et génère son rapport :
- Animation de complétion (confetti léger ou checkmark animé)
- Message : "Exploitation diagnostiquée ! Passez à la suivante."
- Bouton "→ Exploitation suivante" qui ouvre automatiquement la prochaine non-traitée
- Retour au portfolio avec la ligne mise à jour

---

## 3. DESIGN SYSTEM — Style Finthesis / Agicap

### 3.1 Palette de couleurs

```css
/* Fond et surfaces */
--bg-app: #F8F9FB;           /* Fond global gris très clair */
--bg-card: #FFFFFF;           /* Cartes blanches */
--bg-sidebar: #1A1D23;       /* Sidebar sombre */
--bg-sidebar-hover: #2A2D35;

/* Texte */
--text-primary: #1A1D23;     /* Titres */
--text-secondary: #6B7280;   /* Sous-titres, labels */
--text-tertiary: #9CA3AF;    /* Métadonnées */

/* Accent (vert agricole modernisé) */
--accent: #10B981;           /* Vert émeraude — succès, positif */
--accent-light: #D1FAE5;
--accent-dark: #059669;

/* Sémantique */
--danger: #EF4444;           /* Rouge — pertes, alertes */
--danger-light: #FEE2E2;
--warning: #F59E0B;          /* Orange — attention */
--warning-light: #FEF3C7;
--info: #3B82F6;             /* Bleu — information */
--info-light: #DBEAFE;

/* Graphiques */
--chart-1: #10B981;          /* Vert */
--chart-2: #3B82F6;          /* Bleu */
--chart-3: #F59E0B;          /* Orange */
--chart-4: #EF4444;          /* Rouge */
--chart-5: #8B5CF6;          /* Violet */
--chart-6: #EC4899;          /* Rose */
--chart-7: #06B6D4;          /* Cyan */

/* Bordures et ombres */
--border: #E5E7EB;
--border-light: #F3F4F6;
--shadow-sm: 0 1px 2px rgba(0,0,0,0.04);
--shadow-md: 0 4px 12px rgba(0,0,0,0.06);
--shadow-lg: 0 8px 24px rgba(0,0,0,0.08);
```

### 3.2 Typographie

```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
--font-mono: 'JetBrains Mono', 'SF Mono', monospace;

/* Tailles */
--text-xs: 11px;
--text-sm: 13px;
--text-base: 14px;
--text-lg: 16px;
--text-xl: 20px;
--text-2xl: 24px;
--text-3xl: 30px;
```

Font Inter chargée via Google Fonts CDN.

### 3.3 Composants UI

#### KPI Card (style Finthesis)
```
┌──────────────────────┐
│  EBE                 │
│  78 500 €            │  ← Gros chiffre
│  ▲ +12.3% vs N-1    │  ← Variation colorée (vert=positif)
│  ▓▓▓▓▓▓▓▓░░ 78%     │  ← Mini sparkline ou barre
└──────────────────────┘
```

#### Stepper horizontal
```
(1)───(2)───(3)───(4)───(5)───(6)
 ✓     ✓    ●     ○     ○     ○
```
Pastilles connectées par une ligne, états : complété (vert), actif (bleu pulsant), à venir (gris).

#### Tableaux
- Headers gris clair, police uppercase 11px
- Lignes alternées subtiles
- Hover avec fond bleu très léger
- Nombres alignés à droite, font tabular-nums
- Variations colorées : vert si positif, rouge si négatif

#### Graphiques Chart.js
- Coins arrondis sur les barres (borderRadius: 6)
- Grille légère (couleur #F3F4F6)
- Tooltips custom avec fond sombre et border-radius
- Légendes en bas, pastilles rondes
- Animations d'entrée (700ms ease)

---

## 4. AMÉLIORATIONS MÉTIER

### 4.1 Fiche ITK interactive (nouvelle)

Pour chaque culture de chaque exploitation, un panneau dépliable avec :
- Détail des semences, engrais (apport par apport), phytos (traitement par traitement)
- Coûts unitaires × doses = coût/ha
- Total charges opérationnelles
- Comparaison avec la moyenne régionale (indicateur vert/rouge)

### 4.2 Dashboard exploitation enrichi

KPIs Finthesis-style en 4 colonnes :
1. **EBE** — montant + variation N-1 + sparkline 3 ans
2. **RCAI** — montant + variation + couleur sémantique
3. **Trésorerie min** — mois + montant + alerte si < 0
4. **Annuités/EBE** — ratio + jauge circulaire

Puis :
- Donut assolement (interactif, clic = détail culture)
- Mini waterfall SIG
- Mini courbe trésorerie 12 mois
- Radar résilience (5 axes)

### 4.3 Trésorerie style Agicap

- **Graphique combiné** : barres (encaissements verts en haut, décaissements rouges en bas) + ligne (solde cumulé)
- Tableau 12 colonnes avec catégories d'encaissements et décaissements
- Zone rouge visuelle quand le solde cumulé < 0
- KPI : "Votre trésorerie sera au plus bas en **février** : **-23 400 €**"
- Comparaison AVANT/APRÈS scénario en overlay

### 4.4 Simulateur amélioré

- **Impact en temps réel** : les KPIs se mettent à jour dès qu'on bouge un slider
- Mini-carte de France avec coloration d'impact par région
- Tableau comparatif CdP avant/après pour chaque culture
- **Focus sur la trésorerie** : la courbe AVANT/APRÈS est le visuel central
- Panneau "Ce que ça signifie" : interprétation automatique ("L'exploitation ne peut plus rembourser ses emprunts dès mars")

### 4.5 Mode Conseil enrichi

- **Bibliothèque de leviers avec preview** : avant de cocher, l'étudiant voit l'impact estimé
- **Éditeur d'assolement** : tableau avec surfaces modifiables, contrainte SAU, recalcul automatique
- **3 courbes de trésorerie** : la preuve visuelle que les recommandations fonctionnent
- **Score de résilience** : radar AVANT/APRÈS, score numérique

---

## 5. ARCHITECTURE TECHNIQUE (inchangée)

Aucun changement d'architecture :
- HTML/CSS/JS vanilla, pas de framework
- Données en .js avec export const data = {...}
- Import dynamique avec import()
- localStorage pour la persistance
- Chart.js pour les graphiques
- Tailwind CSS via CDN + CSS custom

Ajouts :
- Font Inter via Google Fonts CDN
- CSS custom variables pour le design system
- js/views/decouverte.js (nouvelle vue étape 1)
- js/components/stepper.js (composant stepper réutilisable)
- js/components/kpi-card.js (composant KPI card)
- Modification de state.js pour la progression multi-exploitations

---

## 6. ORDRE D'IMPLÉMENTATION

### Sprint 1 : Fondations design + parcours
1. Refonte CSS complète (design system Finthesis)
2. Composant stepper
3. Composant KPI card
4. Refonte sidebar avec progression
5. Vue accueil avec checklist de progression

### Sprint 2 : Vues métier
6. Vue Découverte (étape 1) — nouvelle
7. Refonte Dashboard (étape 2 intro)
8. Refonte Grand Livre + SIG
9. Refonte Coûts de Production avec drill-down
10. Vue Trésorerie style Agicap

### Sprint 3 : Simulation et conseil
11. Refonte Simulateur avec impact temps réel
12. Refonte Mode Conseil avec preview leviers
13. Refonte Rapport PDF
14. Comparaison inter-exploitations

### Sprint 4 : Polish et tests
15. Animations et transitions
16. Tests de bout en bout
17. Optimisation performances
18. README et guide du prof
