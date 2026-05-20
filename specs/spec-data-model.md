# Spécification — Modèle de Données et Génération des Grands Livres

## Objectif

Ce document spécifie comment générer automatiquement les grands livres comptables détaillés pour chaque exploitation sur 3 exercices (N-2, N-1, N), à partir des données de contexte (fiches régionales, profils d'exploitation, ITK).

## Structure des données JSON

### Fichier de référentiel : `referentiel-prix.json`

```json
{
  "annees": {
    "N-2": { "label": "2022-2023", "exercice_debut": "2022-07-01", "exercice_fin": "2023-06-30" },
    "N-1": { "label": "2023-2024", "exercice_debut": "2023-07-01", "exercice_fin": "2024-06-30" },
    "N":   { "label": "2024-2025", "exercice_debut": "2024-07-01", "exercice_fin": "2025-06-30" }
  },
  "prix_intrants": {
    "N-2": {
      "ammonitrate_335": 420,
      "solution_n39": 320,
      "engrais_pk_0_25_25": 260,
      "gnr": 1.05,
      "index_semences": 100,
      "index_phytos": 100
    },
    "N-1": {
      "ammonitrate_335": 370,
      "solution_n39": 285,
      "engrais_pk_0_25_25": 245,
      "gnr": 1.10,
      "index_semences": 103,
      "index_phytos": 102
    },
    "N": {
      "ammonitrate_335": 455,
      "solution_n39": 340,
      "engrais_pk_0_25_25": 265,
      "gnr": 1.15,
      "index_semences": 106,
      "index_phytos": 105
    }
  },
  "prix_vente": {
    "N-2": {
      "ble_tendre": 270, "ble_dur": 370, "orge_hiver": 250, "orge_printemps_brass": 275,
      "colza": 520, "mais_grain": 250, "tournesol": 480, "pois": 310,
      "feverole": 280, "betterave_dt16": 32, "pomme_terre": 180, "lin_paille_dt": 12,
      "soja": 520, "sorgho": 230, "triticale": 210, "lentille_puy": 1100
    },
    "N-1": {
      "ble_tendre": 200, "ble_dur": 290, "orge_hiver": 180, "orge_printemps_brass": 210,
      "colza": 430, "mais_grain": 190, "tournesol": 390, "pois": 250,
      "feverole": 230, "betterave_dt16": 30, "pomme_terre": 150, "lin_paille_dt": 11,
      "soja": 440, "sorgho": 190, "triticale": 175, "lentille_puy": 950
    },
    "N": {
      "ble_tendre": 195, "ble_dur": 280, "orge_hiver": 175, "orge_printemps_brass": 205,
      "colza": 415, "mais_grain": 185, "tournesol": 380, "pois": 240,
      "feverole": 225, "betterave_dt16": 29, "pomme_terre": 160, "lin_paille_dt": 11,
      "soja": 420, "sorgho": 185, "triticale": 170, "lentille_puy": 1000
    }
  },
  "aides_pac": {
    "dpb_moyen": 129,
    "eco_regime_sup": 80,
    "eco_regime_inf": 60,
    "redistributif": 50,
    "redistributif_plafond_ha": 52,
    "aide_couplee_proteagineux": 106,
    "aide_couplee_legumineuses_fourrageres": 150,
    "ichn_montagne": 170
  }
}
```

### Structure d'un grand livre : `grand-livre-{exploitation}-{annee}.json`

```json
{
  "exploitation": "BEAUCE-01",
  "annee": "N-1",
  "exercice": "2023-2024",
  "date_debut": "2023-07-01",
  "date_fin": "2024-06-30",
  "ecritures": [
    {
      "date": "2023-08-15",
      "journal": "AC",
      "piece": "AC-2023-001",
      "libelle": "Facture AXEREAL - Semences blé Apache",
      "compte_debit": "60121",
      "compte_credit": "4011",
      "montant_ht": 5100.00,
      "tva": 510.00,
      "montant_ttc": 5610.00,
      "analytique": "BT",
      "fournisseur": "AXEREAL"
    }
  ],
  "soldes_comptes": {
    "60111": { "libelle": "Engrais azotés", "debit": 38500, "credit": 0, "solde": 38500 },
    "...": "..."
  },
  "sig": {
    "produit_brut": 0,
    "charges_operationnelles": 0,
    "marge_brute": 0,
    "charges_structure": 0,
    "ebe": 0,
    "amortissements": 0,
    "resultat_exploitation": 0,
    "frais_financiers": 0,
    "rcai": 0
  }
}
```

## Algorithme de génération du grand livre

### Étape 1 : Générer les écritures de ventes (juillet-décembre)

Pour chaque culture de l'exploitation :
```
volume_vendu = surface × rendement_realise × prix_vente_annee
```

Les ventes sont éclatées en 2-4 factures réalistes (livraisons échelonnées) :

| Culture | Répartition des ventes | Journaux |
|---------|----------------------|----------|
| Blé tendre | 40% juillet, 30% septembre, 30% décembre | VT |
| Colza | 60% juillet, 40% octobre | VT |
| Orge | 50% juillet, 50% septembre | VT |
| Betterave | 100% novembre (livraison usine) | VT |
| Maïs | 40% novembre, 60% janvier | VT |
| Tournesol | 50% octobre, 50% décembre | VT |
| Pois | 60% août, 40% octobre | VT |

### Étape 2 : Générer les écritures d'achats d'intrants

Pour chaque culture, à partir de l'ITK :

| Type | Période d'achat | Compte | Journal |
|------|----------------|--------|---------|
| Semences | Août-Octobre (hiver) / Février-Mars (printemps) | 60121-60128 | AC |
| Engrais azotés | Décembre-Janvier (anticipé) + Février-Mars | 60111 | AC |
| Engrais PK | Janvier-Février | 60114 | AC |
| Herbicides | Octobre-Novembre + Mars | 60131 | AC |
| Fongicides | Mars-Avril | 60132 | AC |
| Insecticides | Avril-Mai | 60133 | AC |
| Régulateurs | Mars-Avril | 60134 | AC |

### Étape 3 : Générer les écritures de charges de structure

| Charge | Fréquence | Mois | Compte | Journal |
|--------|-----------|------|--------|---------|
| Fermage | Annuel | Novembre | 6131 | OD |
| MSA exploitant | Trimestriel | Oct, Jan, Avr, Juil | 6452 | BQ |
| MSA salariés | Mensuel | Chaque mois | 6451 | BQ |
| Salaires | Mensuel | Chaque mois | 6411 | BQ |
| Assurances | Semestriel | Octobre, Avril | 6161-6164 | BQ |
| MRC | Annuel | Novembre | 6162 | BQ |
| GNR | Trimestriel | Oct, Jan, Avr, Juil | 60211 | AC |
| Entretien matériel | Irrégulier | Nov, Mars, Mai | 6152 | AC |
| Comptable | Semestriel | Décembre, Juin | 6222 | AC |
| Taxes foncières | Annuel | Octobre | 6351 | BQ |
| CFE | Annuel | Décembre | 6352 | BQ |
| Électricité | Bimestriel | 6 fois/an | 6063 | BQ |
| Téléphone | Mensuel | Chaque mois | 6262 | BQ |
| Banque | Mensuel | Chaque mois | 627 | BQ |
| Cotisations pro | Annuel | Janvier | 6281-6283 | BQ |

### Étape 4 : Générer les écritures d'amortissements

Une écriture par mois (ou annuelle en OD de clôture) pour chaque immobilisation :
```
débit : 6811x (dotation amortissement)
crédit : 2815x (amortissement cumulé)
```

### Étape 5 : Générer les écritures d'aides PAC

| Aide | Date | Compte débit | Compte crédit |
|------|------|-------------|---------------|
| DPB + éco-régime | Décembre (acompte 50%) | 4411 | 7411+7414 |
| DPB + éco-régime | Mars (solde 50%) | 512 | 4411 |
| Aides couplées | Mars-Avril | 512 | 7421 |
| Redistributif | Décembre (avec DPB) | 4411 | 7412 |

### Étape 6 : Générer les écritures de remboursement d'emprunts

Pour chaque emprunt, mensualités ou annuités :
```
débit : 661x (intérêts) + 164x (capital)
crédit : 512 (banque)
```

### Étape 7 : Écritures d'inventaire (clôture)

| Écriture | Débit | Crédit | Montant |
|----------|-------|--------|---------|
| Variation stock produits | 35xx | 713x | Stock final − stock initial |
| Avances aux cultures | 341x | 34x | Charges engagées pour N+1 |
| Charges à payer | 6xxx | 4681 | Factures non parvenues |
| Produits à recevoir | 4687 | 7xxx | Aides PAC solde |

## Journaux comptables

| Code | Nom | Usage |
|------|-----|-------|
| AC | Achats | Factures fournisseurs |
| VT | Ventes | Factures clients |
| BQ | Banque | Mouvements bancaires |
| OD | Opérations diverses | Écritures d'inventaire, amortissements |
| AN | À nouveau | Report des soldes à l'ouverture |

## Variabilité entre années

### Année N-2 (2022-2023) — Bonne année
- Rendements : 100-110% du rendement moyen régional
- Prix de vente : élevés (post-Ukraine)
- Prix intrants : élevés mais compensés par les prix de vente
- Résultat : bon à très bon

### Année N-1 (2023-2024) — Mauvaise année
- Rendements : 85-92% du rendement moyen (climat défavorable)
- Prix de vente : en baisse significative
- Prix intrants : en baisse mais pas suffisamment
- Résultat : médiocre à déficitaire pour certaines exploitations

### Année N (2024-2025) — Année courante (prévisionnelle)
- Rendements : visés à 100% du moyen
- Prix de vente : bas (marché déprimé)
- Prix intrants : remontée des engrais azotés
- Résultat : tendu, effet ciseau prix/charges

## Nombre d'écritures estimé par exploitation et par an

| Catégorie | Nb écritures estimé |
|-----------|-------------------|
| Ventes (2-4 par culture × 6-8 cultures) | 15-30 |
| Achats intrants | 25-40 |
| Charges structure mensuelles | 50-70 |
| Amortissements | 12-15 |
| Aides PAC | 4-6 |
| Emprunts | 12-24 |
| Écritures d'inventaire | 8-15 |
| **TOTAL** | **126-200 écritures / an** |

Pour 10 exploitations × 3 ans = **3 780 à 6 000 écritures au total**.
