# TerraGrow Business Game

**Serious game de gestion d'exploitation agricole** destiné aux étudiants en école d'ingénieur agronome, spécialisation conseil et performance économique des exploitations.

Développé par [TerraGrow](https://terragrow.fr) pour la formation des futurs conseillers de gestion agricole.

---

## Objectif pédagogique

Plonger les étudiants dans la réalité économique et financière d'exploitations de grandes cultures françaises à travers :

1. **Le calcul manuel** des coûts de production (comme un conseiller de gestion)
2. **L'analyse comptable** à partir de grands livres réalistes (4 800+ écritures)
3. **La simulation de scénarios** de crise (géopolitiques, climatiques, marchés)
4. **La formulation de recommandations** chiffrées en tant que conseiller

Les étudiants travaillent en binôme sur un portefeuille de 10 exploitations réparties dans 5 régions agricoles françaises, chacune avec un profil économique distinct.

---

## Contenu du jeu

### 10 exploitations fictives

| Exploitation | Région | SAU | Profil |
|---|---|---|---|
| EARL des Trois Moulins | Beauce | 235 ha | Intensive, endettée |
| GAEC de la Pierre Plate | Beauce | 148 ha | GAEC familial, CUMA |
| SCEA des Hauts Champs | Nord-Picardie | 310 ha | Grosse expl., pomme de terre + lin |
| EARL du Moulin d'Arcy | Nord-Picardie | 130 ha | Jeune agricultrice, installation récente |
| GAEC du Menez | Bretagne | 165 ha | Reconversion élevage, charges résiduelles |
| EARL de Kersaint | Bretagne | 95 ha | Petite expl. CUMA, légumes industrie |
| SCEA de Gascogne | Sud-Ouest | 280 ha | Irriguée, maïs-soja-blé dur |
| EARL des Coteaux | Sud-Ouest | 120 ha | JA en sec, TCS/semis direct |
| EARL de Limagne | Rhône-Alpes | 200 ha | Croisière, désendettée, Limagne |
| GAEC du Velay | Rhône-Alpes | 110 ha | Montagne, lentille AOP, ICHN |

### 6 scénarios de crise

- **Crise d'Ormuz** -- Flambée pétrole/gaz, tension engrais azotés
- **Sécheresse sévère** -- Déficit pluviométrique, rendements en chute
- **Gel tardif** -- Épisode de gel mi-avril au stade épiaison
- **Effondrement des marchés** -- Surproduction mondiale, chute des cours
- **Interdiction phyto** -- Retrait d'une molécule clé, alternatives coûteuses
- **Scénario composé 2024** -- Reproduction des conditions réelles 2024

### 20 leviers de conseil

Charges opérationnelles, mécanisation, assolement, commercialisation, gestion des risques, financier et structure -- filtrés par région et type d'exploitation.

---

## Progression pédagogique (5 sessions de 2h)

| Session | Contenu | Support |
|---|---|---|
| **1. Découverte** | Calcul à la main des coûts de production | Fiches imprimables |
| **2. Comptabilité** | Lecture du grand livre, SIG, tableau de bord | Application web |
| **3. Coûts de production** | Analyse CdP par culture, benchmarking | Application web |
| **4. Trésorerie & Simulation** | Plan de trésorerie, simulation de crise | Application web |
| **5. Conseil & Restitution** | Recommandations, leviers, dossier PDF | Application web |

---

## Comment jouer

### Pour le professeur

1. **Déployer l'application** (voir section Déploiement ci-dessous)
2. **Session 1** : Aller sur `#fiches-session1`, cliquer "Imprimer TOUTES les fiches" pour générer les 30 pages (3 par exploitation). Distribuer un jeu par binôme.
3. **Sessions 2 à 5** : Les étudiants ouvrent l'application dans leur navigateur et progressent de façon autonome.

### Pour les étudiants

1. **Ouvrir l'application** dans Chrome ou Firefox
2. **Renseigner votre équipe** (nom d'équipe + noms des étudiants)
3. **Sélectionner une exploitation** dans le portefeuille
4. **Suivre les étapes** :
   - Découverte de l'exploitation (fiche d'identité, assolement, patrimoine)
   - Analyse comptable (grand livre, SIG, ratios)
   - Coûts de production par culture (charges opé, mécanisation, structure, CdP/t)
   - Plan de trésorerie mensuel (encaissements/décaissements, BFR)
   - Simulation de crise (choisir un scénario, observer les impacts)
   - Mode conseil (sélectionner des leviers, modifier l'assolement, mesurer l'effet)
5. **Générer le dossier de recommandation** (rapport PDF imprimable)

### Fonctionnalités clés

- **Portefeuille** : vue globale des 10 exploitations avec KPI (EBE, RCAI, résilience). Sélecteur de scénario pour voir l'impact sur tout le portefeuille en un clic.
- **Fiche client** : diagnostic complet par exploitation avec onglets (Vue d'ensemble, Assolement, SIG, Coûts de production, Patrimoine, Diagnostic).
- **Grand livre** : 120 à 280 écritures comptables par exploitation et par an, filtré par compte, journal, date, analytique. Export CSV.
- **Simulateur** : 6 scénarios prédéfinis + mode libre avec sliders. Tableau avant/après, courbe de trésorerie, verdict.
- **Mode conseil** : 20 leviers d'action filtrés par région, assolement éditable, comparaison avant/après.
- **Rapport PDF** : dossier de recommandation imprimable (page de garde, diagnostic, CdP, trésorerie, simulation, recommandations, score de résilience).
- **Comparaison** : radar multi-exploitations, tableau comparatif.
- **Persistance** : tout le travail est sauvegardé dans le navigateur (localStorage). On peut fermer et revenir plus tard.

---

## Déploiement

### Option 1 : GitHub Pages (recommandé)

1. Activer GitHub Pages dans Settings > Pages
2. Source : branch `main`, dossier `/ (root)`
3. L'application sera accessible à `https://charlesterrey.github.io/terragrow-real-game/`

### Option 2 : Ouverture locale

Double-cliquer sur `index.html` dans Chrome ou Firefox. L'application fonctionne en `file://` grâce aux modules JavaScript (pas de `fetch()`, pas de CORS).

### Option 3 : Serveur local

```bash
# Python
python3 -m http.server 8080

# Node.js
npx serve -l 8080
```

Ouvrir `http://localhost:8080` dans le navigateur.

---

## Stack technique

- **HTML5 / CSS3 / JavaScript ES6+** (vanilla, zéro framework)
- **Tailwind CSS** via CDN
- **Chart.js** via CDN pour les graphiques
- **Zéro backend** -- tout est statique, déployable sur GitHub Pages
- **Données** en modules JavaScript (`export const data = ...`) pour compatibilité `file://`

---

## Structure du projet

```
terragrow-real-game/
├── index.html                    # Point d'entrée SPA
├── css/styles.css                # Design system Marcassin
├── js/
│   ├── app.js                    # Routeur SPA + chargement données
│   ├── state.js                  # Persistance localStorage
│   ├── engine/                   # Moteurs de calcul
│   │   ├── couts-production.js   # Coûts de production par culture
│   │   ├── sig.js                # Soldes Intermédiaires de Gestion
│   │   ├── simulation.js         # Simulation de scénarios
│   │   ├── conseil.js            # Application des leviers
│   │   ├── tresorerie.js         # Plan de trésorerie mensuel
│   │   └── resilience.js         # Score de résilience (0-100)
│   └── views/                    # 11 vues de l'application
├── data/
│   ├── referentiel-prix.js       # Prix intrants/vente sur 3 ans
│   ├── scenarios.js              # 6 scénarios de crise
│   ├── leviers-conseil.js        # 20 leviers d'action
│   ├── itk-regionaux.js          # ITK par culture par région
│   ├── exploitations/            # 10 profils d'exploitation
│   └── grands-livres/            # 30 grands livres comptables
├── context/                      # Fichiers de référence (non chargés par l'app)
└── specs/                        # Spécifications techniques
```

## Données comptables

- **30 grands livres** (10 exploitations x 3 exercices)
- **4 800+ écritures comptables** conformes au Plan Comptable Général Agricole
- Comptes à 4-5 chiffres avec ventilation analytique par culture
- Écritures triées chronologiquement (juillet à juin = exercice agricole)
- Cohérence : ventes = surface x rendement x prix, intrants = ITK x surface, charges structure = profil exploitation

---

## Licence

Usage pédagogique réservé. Développé par TerraGrow.
