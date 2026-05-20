# Module — Pédagogie et Exercices

## Progression pédagogique (10 heures)

### Vision d'ensemble

| Session | Durée | Titre | Méthode | Support |
|---------|-------|-------|---------|---------|
| 1 | 2h | **Le calcul à la main** | Travail papier + calculatrice | Fiches d'exploitation imprimées |
| 2 | 2h | **Lecture du grand livre et SIG** | Outil web — mode découverte | Application web |
| 3 | 2h | **Analyse des coûts de production** | Outil web — mode analyse | Application web |
| 4 | 2h | **Simulation de chocs** | Outil web — mode simulation | Application web |
| 5 | 2h | **Crise et stratégie d'adaptation** | Simulation + restitution orale | Application web + présentation |

---

## SESSION 1 — Le calcul à la main (2 heures)

### Objectifs pédagogiques
- Comprendre la structure d'un coût de production
- Savoir distinguer charges opérationnelles, charges de structure et rémunération
- Calculer un coût de production €/ha et €/tonne à la main
- Calculer un seuil de commercialisation

### Déroulement

#### Phase 1 : Introduction (20 min)
- Présentation du métier de conseiller de gestion agricole
- Pourquoi le coût de production est l'indicateur clé ?
- Présentation rapide du cas (1 exploitation par binôme)

#### Phase 2 : Distribution des fiches et travail individuel (50 min)

Chaque binôme reçoit :
1. **Fiche exploitation** (version allégée) : SAU, assolement, rendements
2. **Fiche ITK** : itinéraire technique d'une culture (blé tendre) avec les coûts unitaires
3. **Fiche charges de structure** : total des charges fixes de l'exploitation
4. **Feuille de calcul vierge** : tableau à remplir

##### Exercice 1 : Calcul des charges opérationnelles (15 min)

> À partir de la fiche ITK du blé tendre, calculez :
> - Le coût total des semences (€/ha)
> - Le coût total des engrais (€/ha) en détaillant azote et PK
> - Le coût total des produits phytosanitaires (€/ha)
> - Le total des charges opérationnelles (€/ha)

##### Exercice 2 : Répartition des charges de structure (15 min)

> À partir de la fiche charges de structure :
> - Calculez le total des charges de structure de l'exploitation (€)
> - Répartissez-les au prorata de la surface de blé tendre
> - Exprimez le résultat en €/ha de blé tendre

##### Exercice 3 : Coût de production complet (20 min)

> En combinant les résultats des exercices 1 et 2 :
> - Calculez le coût de production du blé tendre en €/ha
> - Calculez le coût de production en €/tonne
> - Calculez le seuil de commercialisation (avec les aides PAC)
> - Le blé tendre se vend actuellement à 200 €/t : cette exploitation est-elle rentable sur le blé ?

#### Phase 3 : Mise en commun et discussion (30 min)

- Chaque binôme annonce son coût de production
- Affichage au tableau : comparaison des coûts entre exploitations
- Questions clés :
  - "Pourquoi les coûts diffèrent-ils entre exploitations ?"
  - "Que se passe-t-il si le rendement baisse de 20% ?"
  - "Que se passe-t-il si le prix des engrais augmente de 50% ?"
- Introduction du concept de sensibilité

#### Phase 4 : Transition vers l'outil (20 min)

- "Ce que vous venez de faire à la main, l'outil le fait pour toutes les cultures et toutes les exploitations"
- Démonstration rapide de l'application web
- Teasing de la session 2

### Fiches à distribuer

#### Fiche Exploitation (modèle — à personnaliser par exploitation)

```
╔════════════════════════════════════════════════════════════╗
║  EXPLOITATION : EARL des Trois Moulins (BEAUCE-01)        ║
║  Exploitant : Jean-Michel DUVAL — Beauce (28)             ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║  SAU totale : 235 ha        Main d'œuvre : 1.8 UTH         ║
║  dont fermage : 190 ha      Fermage moyen : 250 €/ha       ║
║                                                            ║
║  ASSOLEMENT (campagne en cours)                            ║
║  ┌─────────────────────┬─────────┬──────────────────────┐  ║
║  │ Culture             │ Surface │ Rendement espéré     │  ║
║  ├─────────────────────┼─────────┼──────────────────────┤  ║
║  │ Blé tendre          │  82 ha  │ 83 q/ha              │  ║
║  │ Colza               │  38 ha  │ 36 q/ha              │  ║
║  │ Orge d'hiver        │  32 ha  │ 75 q/ha              │  ║
║  │ Betterave sucrière  │  22 ha  │ 900 dt/ha            │  ║
║  │ Blé dur             │  20 ha  │ 68 q/ha              │  ║
║  │ Orge de printemps   │  18 ha  │ 65 q/ha              │  ║
║  │ Pois protéagineux   │  15 ha  │ 45 q/ha              │  ║
║  │ Maïs grain          │   8 ha  │ 95 q/ha              │  ║
║  └─────────────────────┴─────────┴──────────────────────┘  ║
║                                                            ║
║  CHARGES DE STRUCTURE TOTALES : 255 783 €                  ║
║  dont fermage : 47 500 € | MSA : 24 800 €                 ║
║  dont amort. matériel : 85 533 € | amort. bâtiments : 17 250 € ║
║  dont frais financiers : 12 800 €                          ║
║  dont salaires+charges : 22 700 € | assurances : 15 900 € ║
║  dont autres : 29 300 €                                    ║
║                                                            ║
║  AIDES PAC : DPB 129 €/ha + éco-régime 80 €/ha            ║
║  + redistributif 50 €/ha (52 premiers ha)                  ║
║  + aide couplée protéagineux : 106 €/ha (sur 15 ha pois)  ║
╚════════════════════════════════════════════════════════════╝
```

#### Fiche ITK Blé Tendre (modèle)

```
╔════════════════════════════════════════════════════════════╗
║  ITINÉRAIRE TECHNIQUE — BLÉ TENDRE — Beauce               ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║  SEMENCES                                                  ║
║  Variété Apache, 160 kg/ha × 0.41 €/kg = _______ €/ha    ║
║                                                            ║
║  ENGRAIS                                                   ║
║  ┌──────────────────────────┬──────┬────────┬──────────┐   ║
║  │ Produit                  │ Dose │ Prix   │ Coût/ha  │   ║
║  ├──────────────────────────┼──────┼────────┼──────────┤   ║
║  │ Ammonitrate 33,5% (#1)  │150 kg│0.35€/kg│ ______   │   ║
║  │ Ammonitrate 33,5% (#2)  │200 kg│0.35€/kg│ ______   │   ║
║  │ Ammonitrate 33,5% (#3)  │150 kg│0.35€/kg│ ______   │   ║
║  │ Engrais PK 0-25-25      │300 kg│0.26€/kg│ ______   │   ║
║  │ TOTAL ENGRAIS            │      │        │ ______   │   ║
║  └──────────────────────────┴──────┴────────┴──────────┘   ║
║                                                            ║
║  PRODUITS PHYTOSANITAIRES                                  ║
║  ┌──────────────────────────┬──────┬────────┬──────────┐   ║
║  │ Produit                  │ Dose │ Prix   │ Coût/ha  │   ║
║  ├──────────────────────────┼──────┼────────┼──────────┤   ║
║  │ Désherbage automne       │ 3L   │10.7€/L │ ______   │   ║
║  │ Désherbage rattrapage    │ 1L   │28 €/L  │ ______   │   ║
║  │ Fongicide T1 (Prosaro)   │0.8L  │43.8€/L │ ______   │   ║
║  │ Fongicide T2 (SDHI)      │ 1L   │45 €/L  │ ______   │   ║
║  │ Régulateur (CCC)         │1.5L  │ 8 €/L  │ ______   │   ║
║  │ Insecticide (si besoin)  │.075L │107€/L  │ ______   │   ║
║  │ TOTAL PHYTOS             │      │        │ ______   │   ║
║  └──────────────────────────┴──────┴────────┴──────────┘   ║
║                                                            ║
║  CHARGES MÉCANISATION (forfait par ha)      : 400 €/ha    ║
║  (inclut amort., fuel, entretien, ETA)                     ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
```

#### Feuille de calcul vierge (à remplir)

```
╔════════════════════════════════════════════════════════════╗
║  CALCUL DU COÛT DE PRODUCTION — BLÉ TENDRE                ║
║  Exploitation : ____________________                       ║
║  Surface blé : _______ ha   Rendement : _______ q/ha      ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║  A. CHARGES OPÉRATIONNELLES DIRECTES                       ║
║     Semences :                              _______ €/ha   ║
║     Engrais (total) :                       _______ €/ha   ║
║     Phytosanitaires (total) :               _______ €/ha   ║
║     ─────────────────────────────────────────────────       ║
║     TOTAL CHARGES OPÉ :                     _______ €/ha   ║
║                                                            ║
║  B. CHARGES DE MÉCANISATION                                ║
║     Forfait mécanisation :                  _______ €/ha   ║
║                                                            ║
║  C. CHARGES DE STRUCTURE RÉPARTIES                         ║
║     Total charges structure exploitation :  _______ €      ║
║     SAU totale :                            _______ ha     ║
║     Charges structure / ha SAU :            _______ €/ha   ║
║     × surface blé / SAU totale :            _______ €/ha   ║
║                                                            ║
║  D. RÉMUNÉRATION EXPLOITANT                                ║
║     UTH exploitant : _______                               ║
║     Rémunération forfaitaire : 31 800 €/UTH                ║
║     Par ha : _______ UTH × 31 800 / _______ ha SAU        ║
║     = _______ €/ha                                         ║
║                                                            ║
║  E. COPRODUITS (paille vendue)                             ║
║     Estimation : _______ €/ha  (à déduire)                ║
║                                                            ║
║  ═══════════════════════════════════════════════════════    ║
║  COÛT DE PRODUCTION (€/ha) = A + B + C + D − E             ║
║  = _______ + _______ + _______ + _______ − _______        ║
║  = _______________________ €/ha                            ║
║                                                            ║
║  COÛT DE PRODUCTION (€/t) = CdP €/ha ÷ Rendement (t/ha)   ║
║  = _______ ÷ _______ = _______________________ €/t        ║
║                                                            ║
║  SEUIL DE COMMERCIALISATION                                ║
║  Aides PAC estimées : _______ €/ha ÷ _______ t/ha         ║
║  = _______ €/t d'aides                                     ║
║  Seuil = CdP €/t − Aides €/t = _______ − _______          ║
║  = _______________________ €/t                             ║
║                                                            ║
║  CONCLUSION : Prix actuel du blé = 200 €/t                 ║
║  Mon CdP est de _______ €/t → Marge de _______ €/t        ║
║  Cette culture est : □ Rentable  □ À l'équilibre  □ Déficitaire ║
╚════════════════════════════════════════════════════════════╝
```

---

## SESSION 2 — Lecture du grand livre et SIG (2 heures)

### Objectifs
- Naviguer dans un grand livre comptable réel
- Identifier les postes de charges et produits
- Calculer les SIG (marge brute, EBE, résultat courant)
- Comparer 2 exploitations

### Exercices
1. Ouvrir le grand livre de BEAUCE-01, trouver les comptes 6011 (engrais) et 70111 (ventes blé)
2. Calculer la marge brute du blé à partir du grand livre
3. Reconstituer l'EBE à partir des comptes
4. Comparer avec BEAUCE-02 : "qui a le meilleur EBE/ha ?"

---

## SESSION 3 — Analyse des coûts de production (2 heures)

### Objectifs
- Utiliser l'outil pour analyser les coûts de production de toutes les cultures
- Comprendre les leviers : charges opé vs structure vs rémunération
- Benchmarker entre exploitations

### Exercices
1. Afficher le tableau des CdP pour une exploitation
2. Identifier la culture la plus et la moins rentable
3. Comparer le CdP blé de 3 exploitations de régions différentes
4. Exercice de simulation manuelle : "si les engrais augmentent de 30%, quel est le nouveau CdP ?"

---

## SESSION 4 — Simulation de chocs (2 heures)

### Objectifs
- Utiliser le simulateur de scénarios
- Comprendre les effets de transmission des chocs
- Évaluer la résilience différenciée des exploitations

### Exercices
1. Scénario sécheresse : quel est l'impact sur chaque région ?
2. Scénario effondrement marché : quelle exploitation survit ? Laquelle fait défaut ?
3. Travail en groupe : "vous êtes le conseiller de gestion de l'exploitation X, que recommandez-vous ?"

---

## SESSION 5 — Crise et stratégie (2 heures)

### Objectifs
- Mobiliser tous les acquis pour gérer une crise complète
- Proposer des solutions concrètes et chiffrées
- Restituer en mode professionnel

### Déroulement
1. **Scénario "Crise d'Ormuz"** lancé (30 min de travail en groupe)
2. Chaque groupe présente sa "feuille de route de survie" pour son exploitation (10 min/groupe)
3. Débriefing et évaluation par les pairs
4. Conclusion : les vrais enjeux de la gestion d'exploitation

### Critères d'évaluation de la restitution

| Critère | Points |
|---------|--------|
| Diagnostic chiffré de l'impact | /5 |
| Pertinence des mesures proposées | /5 |
| Chiffrage des mesures | /4 |
| Qualité de la présentation | /3 |
| Réponse aux questions | /3 |
| **TOTAL** | **/20** |
