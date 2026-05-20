# Spécification — Application Web "The Real Game"

## Architecture technique

### Stack
- **Frontend** : HTML5 / CSS3 / JavaScript (vanilla ou avec framework léger)
- **Framework CSS** : Tailwind CSS (via CDN)
- **Graphiques** : Chart.js ou D3.js
- **Données** : Fichiers JSON statiques (pas de backend)
- **Déploiement** : Fichier HTML unique ou dossier statique (GitHub Pages, Netlify, ou local)

### Principe
Application 100% client-side. Toutes les données sont embarquées en JSON. Aucun serveur requis. Les étudiants ouvrent un fichier HTML ou accèdent à une URL.

## Pages / Vues

### 1. Accueil — Sélection de l'exploitation

```
┌─────────────────────────────────────────────────────────┐
│  🌾 THE REAL GAME                                        │
│  Simulation de gestion d'exploitation agricole           │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Choisissez votre exploitation :                         │
│                                                          │
│  ┌─── BEAUCE ─────────────┐  ┌─── NORD-PICARDIE ──────┐│
│  │ EARL Trois Moulins      │  │ SCEA Hauts Champs       ││
│  │ 235 ha | Voves (28)     │  │ 310 ha | Laon (02)      ││
│  │ [SÉLECTIONNER]          │  │ [SÉLECTIONNER]          ││
│  ├─────────────────────────┤  ├─────────────────────────┤│
│  │ GAEC Pierre Plate       │  │ EARL Moulin d'Arcy      ││
│  │ 148 ha | Orgères (28)   │  │ 130 ha | Péronne (80)   ││
│  │ [SÉLECTIONNER]          │  │ [SÉLECTIONNER]          ││
│  └─────────────────────────┘  └─────────────────────────┘│
│                                                          │
│  ┌─── BRETAGNE ───────────┐  ┌─── SUD-OUEST ──────────┐│
│  │ ...                     │  │ ...                      ││
│  └─────────────────────────┘  └─────────────────────────┘│
│                                                          │
│  ┌─── RHÔNE-ALPES ────────┐                              │
│  │ ...                     │                              │
│  └─────────────────────────┘                              │
└─────────────────────────────────────────────────────────┘
```

### 2. Tableau de bord de l'exploitation

Vue principale après sélection. Affiche la fiche d'identité et les KPI.

**Composants :**
- Carte d'identité (nom, SAU, UTH, région)
- Assolement visuel (diagramme camembert)
- KPI clés (EBE, RCAI, trésorerie, annuités/EBE) avec jauges
- Sélecteur d'année (N-2 / N-1 / N)
- Navigation vers les autres vues

### 3. Grand Livre comptable

Vue interactive du grand livre avec filtres.

**Fonctionnalités :**
- Filtre par compte (liste déroulante avec arborescence 601 → 6011 → 60111)
- Filtre par journal (AC, VT, BQ, OD)
- Filtre par date (calendrier)
- Filtre par analytique (culture : BT, CZ, OH, etc.)
- Recherche texte dans les libellés
- Tri par date, montant, compte
- Total des débits / crédits / solde en bas
- Export CSV

### 4. Soldes Intermédiaires de Gestion (SIG)

Vue structurée des SIG avec graphique en cascade (waterfall).

**Composants :**
- Tableau SIG : Produit brut → Marge brute → EBE → Résultat exploitation → RCAI
- Graphique waterfall : visualisation de la formation du résultat
- Comparaison sur 3 ans (barres groupées)
- Ratios clés avec indicateurs couleur (vert/orange/rouge)

### 5. Coûts de production

Vue centrale du jeu — analyse des coûts de production par culture.

**Composants :**
- Tableau : une ligne par culture avec CdP €/ha, CdP €/t, seuil commercialisation
- Graphique barres empilées : décomposition du CdP (charges opé + méca + structure + rémunération)
- Graphique comparaison : CdP vs prix de vente pour chaque culture
- Vue détaillée : cliquer sur une culture → décomposition complète

### 6. Simulateur de scénarios

Vue interactive avec sliders et résultats temps réel.

**Composants :**
- Sélection du scénario prédéfini (dropdown) → auto-remplissage des sliders
- Sliders pour chaque paramètre (drag & adjust)
- Mode libre : sliders tous ajustables
- Résultats :
  - Tableau avant/après avec colonnes variation
  - Jauges de trésorerie (thermomètre)
  - Graphique radar de résilience
  - Alerte rouge si RCAI négatif ou trésorerie < 0

### 7. Comparaison inter-exploitations

Vue permettant de comparer 2 à 4 exploitations côte à côte.

**Composants :**
- Sélection multiple d'exploitations (checkboxes)
- Tableau comparatif des KPI
- Graphiques radar superposés
- Graphique barres groupées : CdP blé tendre par exploitation
- Graphique barres : EBE/ha par exploitation

### 8. Carte de France

Vue géographique montrant les exploitations sur la carte avec indicateurs de santé.

## Navigation

```
Accueil → Tableau de bord → [Grand Livre | SIG | Coûts de production | Simulateur]
                          → Comparaison (multi-exploitation)
                          → Carte
```

Barre latérale permanente avec :
- Logo "The Real Game"
- Exploitation sélectionnée
- Année sélectionnée
- Navigation vers chaque vue
- Bouton "Comparer"
- Bouton "Simuler"

## Composants UI réutilisables

### KPI Card
```html
<div class="kpi-card">
  <div class="kpi-label">EBE</div>
  <div class="kpi-value">78 500 €</div>
  <div class="kpi-variation positive">+12% vs N-1</div>
  <div class="kpi-gauge" data-value="78500" data-max="150000"></div>
</div>
```

### Alert Badge
- 🟢 Vert : indicateur sain (ex. annuités/EBE < 40%)
- 🟡 Orange : attention (ex. 40-60%)
- 🔴 Rouge : alerte (ex. > 60%)

### Data Table
Table triable, filtrable, avec export CSV. Utiliser une librairie légère type AG Grid ou DataTable.

### Chart Components
- **Pie/Donut** : assolement
- **Waterfall** : SIG
- **Stacked Bar** : décomposition CdP
- **Grouped Bar** : comparaison
- **Radar** : profil exploitation
- **Line** : évolution 3 ans
- **Gauge** : jauges de santé

## Responsive Design

L'application doit fonctionner sur :
- Desktop (min 1024px) — usage principal
- Tablette (768px) — usage secondaire
- Mobile non prioritaire mais les tableaux doivent rester lisibles (scroll horizontal)

## Palette de couleurs

| Usage | Couleur | Hex |
|-------|---------|-----|
| Primaire (titres, nav) | Vert agricole | #2D5016 |
| Secondaire | Or/blé | #D4A843 |
| Accent | Terre | #8B6914 |
| Fond | Crème | #FDF8EE |
| Texte | Gris foncé | #2C2C2C |
| Alerte positive | Vert | #22C55E |
| Alerte attention | Orange | #F59E0B |
| Alerte critique | Rouge | #EF4444 |
| Graphique culture 1 | Blé | #E6B422 |
| Graphique culture 2 | Colza | #FDD835 |
| Graphique culture 3 | Orge | #A1887F |
| Graphique culture 4 | Betterave | #7B1FA2 |
| Graphique culture 5 | Maïs | #FF9800 |
| Graphique culture 6 | Tournesol | #FFEB3B |
| Graphique culture 7 | Pois | #4CAF50 |

## Performance

- Chargement initial < 3 secondes
- Pas de requête réseau après le chargement initial
- Toutes les données en JSON embarqué ou lazy-loaded
- Calculs de simulation en temps réel (< 100ms)
