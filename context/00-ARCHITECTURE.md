# THE REAL GAME — Architecture Globale du Projet

## Vision

**The Real Game** est un serious game de gestion d'exploitation agricole destiné aux étudiants en école d'ingénieur agronome, spécialisés en conseil et performance économique des exploitations agricoles.

L'objectif est de plonger les étudiants dans la réalité économique et financière d'exploitations de grandes cultures, à travers :
1. **Le calcul manuel** des coûts de production (comme un conseiller de gestion)
2. **L'analyse comptable** à partir de grands livres réalistes
3. **La simulation de scénarios** de crise (géopolitiques, climatiques, marchés)

## Public cible

- Étudiants en école d'ingénieur agronome
- Spécialisation : conseil et performance économique/financière des exploitations
- Durée de formation : 10 heures (réparties sur plusieurs sessions)

## Périmètre

### Régions couvertes (5 régions clés)

| # | Région | Spécificité dominante |
|---|--------|----------------------|
| 1 | **Beauce / Île-de-France** | Grandes cultures intensives, limons profonds |
| 2 | **Nord-Picardie (Hauts-de-France)** | Betteraves, pommes de terre, blé, lin |
| 3 | **Bretagne (Ouest)** | Polyculture-élevage reconverti, légumes industrie |
| 4 | **Sud-Ouest (Occitanie)** | Maïs irrigué, tournesol, soja, diversification |
| 5 | **Rhône-Alpes (Auvergne-Rhône-Alpes)** | Cultures de montagne/piémont, noix, céréales |

### Ateliers de production

Focus exclusif sur les **grandes cultures** :
- Céréales : blé tendre, blé dur, orge d'hiver, orge de printemps, maïs grain, triticale, avoine
- Oléagineux : colza, tournesol, soja
- Protéagineux : pois, féverole, lentille
- Cultures industrielles : betterave sucrière, pomme de terre, lin fibre
- Cultures fourragères : maïs ensilage (si pertinent pour la région)

### Exploitations

- **2 exploitations par région = 10 exploitations fictives au total**
- Diversité de profils : taille (petite 80-120 ha / grande 200-400 ha), stratégie (intensive / raisonnée / bio), équipement (CUMA / individuel)
- Surfaces aléatoires mais réalistes pour chaque région

## Architecture des fichiers

```
real-game/
├── context/                          # Fichiers de contexte pour Claude Code
│   ├── 00-ARCHITECTURE.md            # Ce fichier
│   ├── 01-REGLES-METIER.md           # Règles de gestion agricole
│   ├── 02-PLAN-COMPTABLE.md          # Plan comptable agricole détaillé
│   ├── regions/                      # Fiches régionales
│   │   ├── region-beauce.md
│   │   ├── region-nord-picardie.md
│   │   ├── region-bretagne.md
│   │   ├── region-sud-ouest.md
│   │   └── region-rhone-alpes.md
│   ├── exploitations/                # Profils des exploitations
│   │   ├── expl-beauce-01.md
│   │   ├── expl-beauce-02.md
│   │   ├── ... (10 fichiers)
│   │   └── expl-rhone-alpes-02.md
│   ├── comptabilite/                 # Données comptables
│   │   └── (grands livres JSON/CSV par exploitation)
│   └── modules/                      # Spécifications des modules
│       ├── module-couts-production.md
│       ├── module-simulation.md
│       └── module-pedagogie.md
├── specs/                            # Spécifications techniques pour le dev
│   ├── spec-app-web.md               # Architecture de l'app web
│   ├── spec-data-model.md            # Modèle de données
│   └── spec-ui-ux.md                 # Interface utilisateur
├── data/                             # Données générées (JSON)
│   ├── grand-livre-beauce-01.json
│   ├── ... (30 fichiers : 10 exploitations × 3 ans)
│   └── referentiel-prix.json
└── pedagogie/                        # Supports pédagogiques
    ├── jour1-calcul-manuel.md
    ├── exercices/
    └── corriges/
```

## Modules fonctionnels

### Module 1 : Référentiel régional
- Cultures disponibles par région
- Rendements espérés (min / moyen / max)
- Itinéraires techniques culturaux (ITK) détaillés
- Prix de chaque opération culturale

### Module 2 : Générateur d'exploitations
- Génération aléatoire de surfaces (dans des fourchettes réalistes)
- Attribution d'un assolement cohérent avec la région
- Calcul du parc matériel nécessaire
- Estimation de la main d'œuvre (UTH)

### Module 3 : Comptabilité détaillée
- Plan comptable agricole à 3-4 chiffres
- Grand livre sur 3 exercices (N-2, N-1, N)
- Charges opérationnelles liées aux ITK
- Charges de structure indexées sur des paramètres pluriannuels
- Produits (ventes, aides PAC, assurances)

### Module 4 : Coûts de production
- Reconstitution des coûts de production par culture
- Charges opérationnelles directes (semences, engrais, phytos, mécanisation)
- Charges de structure réparties (fermage, assurances, frais généraux)
- Amortissements répartis
- Rémunération de la main d'œuvre
- Coût de production / tonne et / hectare

### Module 5 : Simulateur de scénarios (Hard Game)
- Bibliothèque de scénarios prédéfinis
- Impact paramétrable sur : prix des intrants, prix de vente, rendements
- Visualisation en temps réel des conséquences sur la trésorerie et le résultat
- Comparaison entre exploitations (résilience)

### Module 6 : Pédagogie
- Exercices de calcul manuel (Jour 1)
- Sessions guidées sur l'outil (Jours 2-3)
- Simulation libre et restitution (Jours 4-5)

## Workflow pédagogique (10 heures)

| Session | Durée | Contenu |
|---------|-------|---------|
| 1 | 2h | Introduction + calcul à la main des coûts de production |
| 2 | 2h | Découverte de l'outil, lecture du grand livre, SIG |
| 3 | 2h | Analyse des coûts de production par culture, comparaison inter-exploitations |
| 4 | 2h | Simulation de scénarios : chocs de prix, événements climatiques |
| 5 | 2h | Simulation avancée : crise géopolitique + restitution et débriefing |

## Principes de conception

1. **Réalisme** : toutes les données doivent être cohérentes avec la réalité agricole française
2. **Progressivité** : du calcul papier au simulateur numérique
3. **Comparabilité** : les exploitations doivent être comparables entre elles
4. **Jouabilité** : l'interface doit être intuitive, les résultats visuels
5. **Modularité** : chaque module est indépendant et réutilisable
