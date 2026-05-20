# TerraGrow Business Game

**Serious game de gestion d'exploitation agricole** destine aux etudiants en ecole d'ingenieur agronome, specialisation conseil et performance economique des exploitations.

Developpe par [TerraGrow](https://terragrow.fr) pour la formation des futurs conseillers de gestion agricole.

---

## Objectif pedagogique

Plonger les etudiants dans la realite economique et financiere d'exploitations de grandes cultures francaises a travers :

1. **Le calcul manuel** des couts de production (comme un conseiller de gestion)
2. **L'analyse comptable** a partir de grands livres realistes (4 800+ ecritures)
3. **La simulation de scenarios** de crise (geopolitiques, climatiques, marches)
4. **La formulation de recommandations** chiffrees en tant que conseiller

Les etudiants travaillent en binome sur un portefeuille de 10 exploitations reparties dans 5 regions agricoles francaises, chacune avec un profil economique distinct.

---

## Contenu du jeu

### 10 exploitations fictives

| Exploitation | Region | SAU | Profil |
|---|---|---|---|
| EARL des Trois Moulins | Beauce | 235 ha | Intensive, endettee |
| GAEC de la Pierre Plate | Beauce | 148 ha | GAEC familial, CUMA |
| SCEA des Hauts Champs | Nord-Picardie | 310 ha | Grosse expl., pomme de terre + lin |
| EARL du Moulin d'Arcy | Nord-Picardie | 130 ha | Jeune agricultrice, installation recente |
| GAEC du Menez | Bretagne | 165 ha | Reconversion elevage, charges residuelles |
| EARL de Kersaint | Bretagne | 95 ha | Petite expl. CUMA, legumes industrie |
| SCEA de Gascogne | Sud-Ouest | 280 ha | Irriguee, mais-soja-ble dur |
| EARL des Coteaux | Sud-Ouest | 120 ha | JA en sec, TCS/semis direct |
| EARL de Limagne | Rhone-Alpes | 200 ha | Croisiere, desendettee, Limagne |
| GAEC du Velay | Rhone-Alpes | 110 ha | Montagne, lentille AOP, ICHN |

### 6 scenarios de crise

- **Crise d'Ormuz** -- Flambee petrole/gaz, tension engrais azotes
- **Secheresse severe** -- Deficit pluviometrique, rendements en chute
- **Gel tardif** -- Episode de gel mi-avril au stade epiaison
- **Effondrement des marches** -- Surproduction mondiale, chute des cours
- **Interdiction phyto** -- Retrait d'une molecule cle, alternatives couteuses
- **Scenario compose 2024** -- Reproduction des conditions reelles 2024

### 20 leviers de conseil

Charges operationnelles, mecanisation, assolement, commercialisation, gestion des risques, financier et structure -- filtres par region et type d'exploitation.

---

## Progression pedagogique (5 sessions de 2h)

| Session | Contenu | Support |
|---|---|---|
| **1. Decouverte** | Calcul a la main des couts de production | Fiches imprimables |
| **2. Comptabilite** | Lecture du grand livre, SIG, tableau de bord | Application web |
| **3. Couts de production** | Analyse CdP par culture, benchmarking | Application web |
| **4. Tresorerie & Simulation** | Plan de tresorerie, simulation de crise | Application web |
| **5. Conseil & Restitution** | Recommandations, leviers, dossier PDF | Application web |

---

## Comment jouer

### Pour le professeur

1. **Deployer l'application** (voir section Deploiement ci-dessous)
2. **Session 1** : Aller sur `#fiches-session1`, cliquer "Imprimer TOUTES les fiches" pour generer les 30 pages (3 par exploitation). Distribuer un jeu par binome.
3. **Sessions 2 a 5** : Les etudiants ouvrent l'application dans leur navigateur et progressent de facon autonome.

### Pour les etudiants

1. **Ouvrir l'application** dans Chrome ou Firefox
2. **Renseigner votre equipe** (nom d'equipe + noms des etudiants)
3. **Selectionner une exploitation** dans le portefeuille
4. **Suivre les etapes** :
   - Decouverte de l'exploitation (fiche d'identite, assolement, patrimoine)
   - Analyse comptable (grand livre, SIG, ratios)
   - Couts de production par culture (charges ope, mecanisation, structure, CdP/t)
   - Plan de tresorerie mensuel (encaissements/decaissements, BFR)
   - Simulation de crise (choisir un scenario, observer les impacts)
   - Mode conseil (selectionner des leviers, modifier l'assolement, mesurer l'effet)
5. **Generer le dossier de recommandation** (rapport PDF imprimable)

### Fonctionnalites cles

- **Portefeuille** : vue globale des 10 exploitations avec KPI (EBE, RCAI, resilience). Selecteur de scenario pour voir l'impact sur tout le portefeuille en un clic.
- **Fiche client** : diagnostic complet par exploitation avec onglets (Vue d'ensemble, Assolement, SIG, Couts de production, Patrimoine, Diagnostic).
- **Grand livre** : 120 a 280 ecritures comptables par exploitation et par an, filtrable par compte, journal, date, analytique. Export CSV.
- **Simulateur** : 6 scenarios predefined + mode libre avec sliders. Tableau avant/apres, courbe de tresorerie, verdict.
- **Mode conseil** : 20 leviers d'action filtres par region, assolement editable, comparaison avant/apres.
- **Rapport PDF** : dossier de recommandation imprimable (page de garde, diagnostic, CdP, tresorerie, simulation, recommandations, score de resilience).
- **Comparaison** : radar multi-exploitations, tableau comparatif.
- **Persistance** : tout le travail est sauvegarde dans le navigateur (localStorage). On peut fermer et revenir plus tard.

---

## Deploiement

### Option 1 : GitHub Pages (recommande)

1. Activer GitHub Pages dans Settings > Pages
2. Source : branch `main`, dossier `/ (root)`
3. L'application sera accessible a `https://charlesterrey.github.io/terragrow-real-game/`

### Option 2 : Ouverture locale

Double-cliquer sur `index.html` dans Chrome ou Firefox. L'application fonctionne en `file://` grace aux modules JavaScript (pas de `fetch()`, pas de CORS).

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

- **HTML5 / CSS3 / JavaScript ES6+** (vanilla, zero framework)
- **Tailwind CSS** via CDN
- **Chart.js** via CDN pour les graphiques
- **Zero backend** -- tout est statique, deployable sur GitHub Pages
- **Donnees** en modules JavaScript (`export const data = ...`) pour compatibilite `file://`

---

## Structure du projet

```
terragrow-real-game/
├── index.html                    # Point d'entree SPA
├── css/styles.css                # Design system Marcassin
├── js/
│   ├── app.js                    # Routeur SPA + chargement donnees
│   ├── state.js                  # Persistance localStorage
│   ├── engine/                   # Moteurs de calcul
│   │   ├── couts-production.js   # Couts de production par culture
│   │   ├── sig.js                # Soldes Intermediaires de Gestion
│   │   ├── simulation.js         # Simulation de scenarios
│   │   ├── conseil.js            # Application des leviers
│   │   ├── tresorerie.js         # Plan de tresorerie mensuel
│   │   └── resilience.js         # Score de resilience (0-100)
│   └── views/                    # 11 vues de l'application
├── data/
│   ├── referentiel-prix.js       # Prix intrants/vente sur 3 ans
│   ├── scenarios.js              # 6 scenarios de crise
│   ├── leviers-conseil.js        # 20 leviers d'action
│   ├── itk-regionaux.js          # ITK par culture par region
│   ├── exploitations/            # 10 profils d'exploitation
│   └── grands-livres/            # 30 grands livres comptables
├── context/                      # Fichiers de reference (non charges par l'app)
└── specs/                        # Specifications techniques
```

## Donnees comptables

- **30 grands livres** (10 exploitations x 3 exercices)
- **4 800+ ecritures comptables** conformes au Plan Comptable General Agricole
- Comptes a 4-5 chiffres avec ventilation analytique par culture
- Ecritures triees chronologiquement (juillet a juin = exercice agricole)
- Coherence : ventes = surface x rendement x prix, intrants = ITK x surface, charges structure = profil exploitation

---

## Licence

Usage pedagogique reserve. Developpe par TerraGrow.
