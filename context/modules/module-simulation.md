# Module — Simulateur de Scénarios (Hard Game)

## Concept

Le simulateur permet aux étudiants de tester l'impact de chocs exogènes (géopolitiques, climatiques, marchés, réglementaires) sur la rentabilité des exploitations. Chaque scénario modifie un ou plusieurs paramètres économiques, et les étudiants observent en temps réel les conséquences sur les coûts de production, les marges et la trésorerie.

## Architecture du simulateur

### Paramètres modifiables

Chaque scénario agit sur un ou plusieurs de ces leviers :

| Catégorie | Paramètre | Unité | Plage de variation |
|-----------|-----------|-------|-------------------|
| **Prix intrants** | Prix engrais azotés | €/t ammonitrate | 300 - 900 |
| | Prix engrais PK | €/t composé | 250 - 600 |
| | Prix semences | index (base 100) | 90 - 130 |
| | Prix phytosanitaires | index (base 100) | 85 - 150 |
| | Prix GNR | €/L | 0.70 - 1.80 |
| | Prix eau irrigation | €/m³ | 0.05 - 0.25 |
| **Prix vente** | Prix blé tendre | €/t | 140 - 350 |
| | Prix blé dur | €/t | 200 - 500 |
| | Prix orge | €/t | 130 - 320 |
| | Prix colza | €/t | 300 - 700 |
| | Prix maïs | €/t | 130 - 320 |
| | Prix tournesol | €/t | 280 - 650 |
| | Prix pois | €/t | 180 - 400 |
| | Prix betterave | €/t 16° | 22 - 45 |
| | Prix pomme de terre | €/t | 80 - 350 |
| | Prix soja | €/t | 350 - 700 |
| | Prix lentille AOP | €/t | 600 - 1500 |
| **Rendements** | Rendement par culture | % du rendement moyen | 40% - 120% |
| **Charges structure** | Fermage | index (base 100) | 95 - 115 |
| | MSA | index (base 100) | 95 - 110 |
| | Taux d'intérêt | % | 1.5 - 6.0 |
| **Aides** | DPB | €/ha | 100 - 170 |
| | Éco-régime | €/ha | 0 - 80 |
| | Aides couplées | €/ha | 0 - 150 |

### Scénarios prédéfinis

#### 1. CRISE D'ORMUZ — Conflit Iran / Détroit d'Ormuz (2026)

*Contexte : Blocage du détroit d'Ormuz, flambée du pétrole et du gaz naturel, tension sur les engrais azotés issus du gaz.*

| Paramètre | Variation | Nouvelle valeur indicative |
|-----------|----------|--------------------------|
| Prix engrais azotés | **+60%** | Ammonitrate 650 → 900 €/t |
| Prix GNR | **+45%** | 1.10 → 1.60 €/L |
| Prix phytos | **+12%** | Index 112 |
| Prix blé tendre | **+18%** | 200 → 236 €/t |
| Prix colza | **+15%** | 430 → 495 €/t |
| Prix maïs | **+20%** | 190 → 228 €/t |
| Rendements | inchangés | 100% |

**Impact attendu** : Hausse massive des charges opérationnelles (+80-120 €/ha en blé), partiellement compensée par la hausse des prix de vente. Les exploitations les plus consommatrices d'azote (blé, maïs, colza) sont les plus impactées. L'exploitation Sud-Ouest irriguée est doublement touchée (énergie irrigation + engrais).

#### 2. SÉCHERESSE SÉVÈRE — Printemps-été

*Contexte : Déficit pluviométrique de 40-60% d'avril à août, températures > +3°C par rapport aux normales.*

| Paramètre | Variation | Notes |
|-----------|----------|-------|
| Rendement blé tendre | **-20% à -35%** | Variable selon région et irrigation |
| Rendement orge | **-15% à -30%** | |
| Rendement colza | **-15% à -25%** | |
| Rendement maïs sec | **-35% à -55%** | Très sensible |
| Rendement maïs irrigué | **-5% à -15%** | Protégé si eau disponible |
| Rendement tournesol | **-10% à -20%** | Plus résistant |
| Rendement betterave | **-20% à -30%** | |
| Rendement pois | **-25% à -40%** | Très sensible |
| Prix blé | **+12%** | Effet rareté |
| Prix maïs | **+15%** | |
| Restrictions irrigation | **Quota -30%** | Régions Sud-Ouest et Beauce |
| Indemnité MRC | **Variable** | Selon contrat et franchise |

**Impact régional différencié** :
- Beauce : impact modéré (sols profonds, réserve utile)
- Nord-Picardie : impact limité (meilleure pluviométrie)
- Bretagne : impact modéré (océanité protectrice)
- Sud-Ouest sec : impact catastrophique (tournesol/blé dur en décrochage)
- Sud-Ouest irrigué : impact limité si quota eau suffisant
- Rhône-Alpes Limagne : impact variable (terres noires = bonne réserve)
- Rhône-Alpes Velay : impact modéré (altitude = fraîcheur)

#### 3. GEL TARDIF — Mi-avril (après épiaison)

*Contexte : Épisode de gel à -5°C sur 2 nuits consécutives au stade épiaison des céréales.*

| Paramètre | Variation | Notes |
|-----------|----------|-------|
| Rendement blé tendre | **-25% à -45%** | Selon stade et T° |
| Rendement blé dur | **-30% à -50%** | Plus sensible |
| Rendement orge | **-20% à -35%** | En avance, plus touchée |
| Rendement colza | **-15% à -25%** | Avortement siliques |
| Rendement maïs/tournesol | inchangé | Pas encore semé ou très jeune |
| Qualité blé | **PS -5 à -10 kg/hl** | Déclassement possible |
| Prix blé | **+10%** | |
| Indemnité MRC | **Variable** | |

#### 4. EFFONDREMENT DES MARCHÉS — Surproduction mondiale

*Contexte : Récoltes records en Russie, Ukraine, Amérique du Nord. Stocks mondiaux au plus haut.*

| Paramètre | Variation |
|-----------|----------|
| Prix blé tendre | **-28%** → 145 €/t |
| Prix blé dur | **-22%** → 230 €/t |
| Prix orge | **-30%** → 125 €/t |
| Prix colza | **-20%** → 345 €/t |
| Prix maïs | **-25%** → 143 €/t |
| Prix tournesol | **-18%** → 328 €/t |
| Prix pois | **-15%** → 215 €/t |
| Engrais | **-10%** (demande en baisse) |
| Rendements | **inchangés** (bonne année) |

**Impact attendu** : Effondrement de la marge brute. Les exploitations à coûts de production élevés (petites structures, forte mécanisation) passent sous le seuil de rentabilité. L'exploitante JA de Nord-Picardie (CARPENTIER) et le JA du Sud-Ouest (LACOSTE) sont en danger. L'exploitation de Limagne (CHABRIER) encaisse mieux grâce à sa structure amortie.

#### 5. INTERDICTION D'UNE MOLÉCULE CLÉ — Restriction phyto

*Contexte : Retrait d'un herbicide majeur (ex. glyphosate) ou d'un fongicide SDHI.*

| Paramètre | Variation | Notes |
|-----------|----------|-------|
| Prix phytos | **+25%** | Alternatives plus coûteuses |
| Rendement blé | **-5 à -10%** | Pression adventices/maladies |
| Rendement colza | **-8 à -12%** | Plus sensible |
| Charges méca | **+15%** | Passages mécaniques supplémentaires |
| Rendement tournesol | **-3%** | Peu impacté |

#### 6. SCÉNARIO COMPOSÉ — Crise 2024 réelle

*Contexte : Reproduction des conditions 2024 — mauvais rendements + prix moyens + engrais en baisse.*

| Paramètre | Variation |
|-----------|----------|
| Rendements | **-12% globalement** |
| Prix blé | **195 €/t** |
| Prix colza | **430 €/t** |
| Prix engrais azotés | **-20%** |
| Prix phytos | **stable** |

## Interface du simulateur

### Écran principal

```
┌─────────────────────────────────────────────────────────────────┐
│  THE REAL GAME — Simulateur de scénarios                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [Sélection exploitation ▼]  [Sélection scénario ▼]  [LANCER]  │
│                                                                  │
│  ┌── Paramètres du scénario ──────────────────────────────────┐ │
│  │ Engrais azotés : [████████████░░░░] +60%    ← slider      │ │
│  │ GNR :            [████████░░░░░░░░] +45%                   │ │
│  │ Prix blé :       [██████████░░░░░░] +18%                   │ │
│  │ Rendement blé :  [██████████████░░]  -0%                   │ │
│  │ ...                                                         │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌── Résultats ───────────────────────────────────────────────┐ │
│  │                                                             │ │
│  │  AVANT           APRÈS            VARIATION                 │ │
│  │  ─────           ─────            ─────────                 │ │
│  │  CdP blé: 203 €/t → 248 €/t      +22%  ⚠️                │ │
│  │  Marge blé: +42 €/ha → -15 €/ha   PERTE                   │ │
│  │  EBE: 78 500 € → 42 200 €        -46%  🔴                │ │
│  │  RCAI: -5 200 € → -41 500 €      CRITIQUE                 │ │
│  │  Tréso: -12 000 € → -53 500 €    ALERTE                   │ │
│  │                                                             │ │
│  │  [📊 Graphiques]  [📋 Détail par culture]  [🔄 Comparer]  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌── Comparaison inter-exploitations ─────────────────────────┐ │
│  │  Exploitation  │ EBE avant │ EBE après │ Var. │ Résilience │ │
│  │  BEAUCE-01     │  78 500   │  42 200   │ -46% │  ⚠️       │ │
│  │  BEAUCE-02     │  52 000   │  28 100   │ -46% │  ⚠️       │ │
│  │  NORD-PIC-01   │ 125 000   │  88 500   │ -29% │  ✅       │ │
│  │  ...           │           │           │      │           │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Visualisations

1. **Jauge de trésorerie** : thermomètre rouge/orange/vert
2. **Graphique en cascade** (waterfall) : décomposition du passage avant/après
3. **Radar** : comparaison multi-critères entre exploitations
4. **Tableau de bord** : KPI avant/après pour chaque exploitation
5. **Carte de France** : coloration des régions selon l'impact

### Fonctionnalités

- **Mode scénario prédéfini** : sélection d'un scénario → paramètres auto-remplis → exécution
- **Mode libre** : l'étudiant ajuste chaque slider manuellement
- **Mode composé** : combiner 2 scénarios (ex. sécheresse + crise marché)
- **Comparaison** : afficher côte à côte 2 à 4 exploitations
- **Export** : télécharger les résultats en CSV ou PDF

## Calcul d'impact

### Algorithme

Pour chaque exploitation et chaque culture :

```python
def calculer_impact(exploitation, scenario):
    for culture in exploitation.cultures:
        # 1. Nouveau rendement
        nouveau_rdt = culture.rendement * scenario.facteur_rendement[culture.type]
        
        # 2. Nouvelles charges opé
        nouvelles_charges_ope = (
            culture.semences * scenario.index_semences +
            culture.engrais_N * scenario.facteur_engrais_N +
            culture.engrais_PK * scenario.facteur_engrais_PK +
            culture.phytos * scenario.index_phytos +
            culture.mecanisation * scenario.facteur_gnr
        )
        
        # 3. Nouveau prix de vente
        nouveau_prix = culture.prix_vente * scenario.facteur_prix[culture.type]
        
        # 4. Nouveau produit
        nouveau_produit = (nouveau_rdt * nouveau_prix) + culture.aides_ha
        
        # 5. Nouveau coût de production
        nouveau_cdp = (
            nouvelles_charges_ope +
            culture.charges_meca * scenario.facteur_gnr +
            culture.charges_structure +  # fixes
            culture.remuneration_mo       # fixe
        )
        
        # 6. Nouvelle marge
        nouvelle_marge = nouveau_produit - nouveau_cdp
    
    # Agrégation exploitation
    nouvel_ebe = sum(marges) - charges_structure_non_reparties
    nouveau_rcai = nouvel_ebe - amortissements - frais_financiers
    nouvelle_treso = nouveau_rcai - annuites + amortissements
```

### Indicateurs de résilience

| Indicateur | Formule | Seuil alerte |
|-----------|---------|-------------|
| Taux de couverture des charges | Produit / (Ch. opé + Ch. struct.) | < 100% |
| Capacité de remboursement | EBE / Annuités | < 1.2 |
| Point mort en prix | CdP €/t − Aides €/t | Si > prix marché actuel |
| Réserve de trésorerie | Tréso / charges mensuelles | < 2 mois |
| Vulnérabilité à la volatilité | Écart-type marge 3 ans / marge moyenne | > 50% |

## Scénarios pédagogiques suggérés

### Session 4 (2h) — Chocs de prix et climat

1. Lancer le scénario "Sécheresse" → observer l'impact différencié par région
2. Question : "Quelle exploitation s'en sort le mieux ? Pourquoi ?"
3. Lancer le scénario "Effondrement marchés" → comparer avec la sécheresse
4. Question : "Quel choc est le plus dangereux pour une exploitation céréalière ?"
5. Discussion : stratégies d'adaptation (assurance, stockage, diversification)

### Session 5 (2h) — Crise géopolitique + restitution

1. Lancer le scénario "Crise d'Ormuz"
2. Chaque groupe d'étudiants prend une exploitation et doit :
   - Calculer le nouvel EBE
   - Proposer des mesures d'adaptation (réduction N, changement d'assolement, renégociation emprunts)
   - Présenter une "feuille de route de survie" en 10 min
3. Débriefing collectif : comparaison des stratégies, vote pour la meilleure
