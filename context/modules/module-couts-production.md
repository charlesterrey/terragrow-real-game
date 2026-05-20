# Module — Calcul des Coûts de Production

## Objectif

Reconstituer le coût de production complet de chaque culture, pour chaque exploitation, en intégrant :
1. Les charges opérationnelles directes (issues des ITK)
2. Les charges de mécanisation réparties
3. Les charges de structure réparties
4. La rémunération de la main d'œuvre

## Méthode de calcul

### Étape 1 : Charges opérationnelles directes (€/ha)

Charges directement affectables à une culture, issues de l'itinéraire technique cultural :

```
CHARGES OPÉ DIRECTES =
  Semences (achat ou autoproduction valorisée)
+ Engrais (azote + PK + soufre + oligo)
+ Produits phytosanitaires (herbicides + fongicides + insecticides + régulateurs)
```

Source : ITK de la fiche régionale, ajusté selon le profil de l'exploitation.

### Étape 2 : Charges de mécanisation spécifiques (€/ha)

Charges liées aux opérations culturales sur la parcelle :

```
CHARGES MÉCA SPÉCIFIQUES =
  Carburant (GNR) par opération
+ Entretien proportionnel (pièces, réparations au prorata des heures)
+ Part d'amortissement matériel au prorata du temps d'utilisation par culture
+ Travaux par entreprise (ETA) si sous-traités
+ CUMA (cotisation + utilisation)
```

#### Clé de répartition de la mécanisation

| Matériel | Clé de répartition |
|----------|-------------------|
| Tracteur | Heures d'utilisation par culture |
| Moissonneuse | Surface moissonnée par culture |
| Charrue / déchaumeur | Surface travaillée par culture |
| Semoir | Surface semée par culture |
| Pulvérisateur | Nombre de passages × surface par culture |
| Épandeur | Nombre de passages × surface par culture |
| Matériel spécifique (arracheur betterave, etc.) | 100% sur la culture concernée |

**Simplification pédagogique** : en première approche, les charges de mécanisation peuvent être réparties au prorata de la surface de chaque culture (clé SAU).

### Étape 3 : Charges de structure réparties (€/ha)

Charges fixes réparties sur l'ensemble des cultures :

```
CHARGES STRUCTURE RÉPARTIES =
  Fermage (au prorata exact de la surface par culture)
+ MSA exploitant (au prorata SAU)
+ Assurances (au prorata SAU, sauf MRC spécifique par culture)
+ Frais de gestion / comptabilité (au prorata SAU)
+ Impôts et taxes (au prorata SAU)
+ Énergie / télécom (au prorata SAU)
+ Frais financiers (au prorata des capitaux engagés, ou SAU en simplifié)
+ Amortissements bâtiments (au prorata SAU, ou spécifique si silo dédié)
+ Autres (au prorata SAU)
```

### Étape 4 : Rémunération de la main d'œuvre exploitant (€/ha)

```
RÉMUNÉRATION MO EXPLOITANT =
  Nombre UTH exploitant × (SMIC annuel brut × 1.5)
÷ SAU totale
× Surface de la culture

En 2024-2025 :
  SMIC annuel brut ≈ 21 200 €
  Forfait rémunération exploitant = 21 200 × 1.5 = 31 800 €/UTH
  Pour 1 UTH sur 200 ha = 159 €/ha
```

### Étape 5 : Coût de production total

```
COÛT DE PRODUCTION (€/ha) =
  Charges opérationnelles directes
+ Charges de mécanisation spécifiques
+ Charges de structure réparties
+ Rémunération MO exploitant
─ Coproduits valorisés (paille vendue, etc.)

COÛT DE PRODUCTION (€/t) =
  Coût de production €/ha ÷ Rendement (t/ha)
```

### Étape 6 : Seuil de commercialisation

```
SEUIL DE COMMERCIALISATION (€/t) =
  Coût de production (€/t) ─ Aides PAC ramenées à la tonne

Où :
  Aides PAC / tonne = (DPB + éco-régime + redistributif + aide couplée) ÷ rendement (t/ha)
```

## Exemple de calcul — Blé tendre, BEAUCE-01

### Données
- Surface blé tendre : 82 ha
- Rendement visé : 83 q/ha = 8.3 t/ha
- SAU totale : 235 ha

### Calcul

| Poste | Calcul | €/ha |
|-------|--------|------|
| **Charges opé directes** | | |
| Semences | 65 €/ha | 65 |
| Engrais (N + PK + S) | 52 + 70 + 52 + 78 = 252 | 252 |
| Phytos (herb + fongi + insect + régul) | 60 + 80 + 8 + 12 = 160 | 160 |
| **Sous-total charges opé** | | **477** |
| **Charges mécanisation** | | |
| Mécanisation propre (au prorata SAU) | 85 533 × (82/235) = 29 847 → /82 ha | 364 |
| GNR estimé | 60 L/ha × 1.10 €/L | 66 |
| Entretien proportionnel | Forfait 25 €/ha | 25 |
| **Sous-total mécanisation** | | **455** |
| **Charges structure réparties** | | |
| Fermage | 47 500 × (82/235) = 16 574 → /82 | 202 |
| MSA exploitant | 24 800 × (82/235) | 106 |
| Salaire + charges salarié | 22 700 × (82/235) | 79 |
| Assurances | 9 800 × (82/235) | 34 |
| MRC | 6 100 × (82/235) | 21 |
| Bâtiments amort. | 17 250 × (82/235) | 60 |
| Frais financiers | 12 800 × (82/235) | 45 |
| Autres struct. | 25 300 × (82/235) | 88 |
| **Sous-total structure** | | **635** |
| **Rémunération MO** | | |
| 1.3 UTH × 31 800 / 235 ha × 1 ha | | 176 |
| **Coproduits** | | |
| Paille vendue (30 €/t × 4 t/ha × 50% surface) | | ─60 |
| **COÛT DE PRODUCTION** | | **1 683 €/ha** |
| **COÛT DE PRODUCTION / TONNE** | 1 683 / 8.3 | **203 €/t** |

### Seuil de commercialisation
```
Aides PAC : (129 DPB + 80 éco-régime + 50 redistributif proratisé) ≈ 210 €/ha
Aides PAC / tonne = 210 / 8.3 = 25 €/t
Seuil de commercialisation = 203 ─ 25 = 178 €/t
```

## Tableau de synthèse par culture (template)

Ce tableau doit être généré pour chaque exploitation :

| Culture | Surface (ha) | Rdt (t/ha) | Ch. opé (€/ha) | Ch. méca (€/ha) | Ch. struct. (€/ha) | Rém. MO (€/ha) | Coproduits (€/ha) | **CdP (€/ha)** | **CdP (€/t)** | Seuil (€/t) |
|---------|-------------|-----------|---------------|----------------|-------------------|----------------|------------------|--------------|-------------|------------|
| Blé tendre | 82 | 8.3 | 477 | 455 | 635 | 176 | -60 | **1 683** | **203** | 178 |
| Colza | 38 | 3.6 | 489 | 455 | 635 | 176 | 0 | **1 755** | **488** | 460 |
| ... | ... | ... | ... | ... | ... | ... | ... | ... | ... | ... |

## Variantes de calcul

### Variante 1 : Sans rémunération exploitant
Utile pour calculer le seuil de survie (ne couvre pas la rémunération de l'exploitant).

### Variante 2 : Charges de mécanisation réelles (non proratisées)
Plus précis mais nécessite un suivi des temps par culture.

### Variante 3 : Coût marginal
Seules les charges opérationnelles directes, utile pour la décision d'emblaver une culture supplémentaire.

## Indicateurs dérivés

### Marge brute par culture
```
MARGE BRUTE (€/ha) = Produit brut (ventes + aides) ─ Charges opérationnelles
```

### Marge nette par culture
```
MARGE NETTE (€/ha) = Produit brut ─ Coût de production complet
```

### Marge de sécurité
```
MARGE SÉCURITÉ (%) = (Prix de vente ─ Seuil commercialisation) / Prix de vente × 100
```
→ Si < 10%, la culture est à risque en cas de baisse de prix ou de rendement.

## Règles de cohérence

1. La somme des coûts de production × surfaces doit correspondre au total des charges du compte de résultat
2. Le coût de production ne doit pas être confondu avec le prix de revient (qui exclut la rémunération exploitant)
3. Les amortissements comptables et économiques peuvent différer (utiliser les amortissements économiques pour le coût de production)
4. En année de mauvais rendement, le coût €/t augmente mécaniquement (même charges fixes / moins de tonnes)
