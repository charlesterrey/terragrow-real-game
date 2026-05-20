# Sprint Plan : The Real Game — Build Complet

**Dates :** Lancement immédiat — livraison en un run Claude Code
**Équipe :** Claude Code (agent automatisé, plan mode + auto mode)
**Sprint Goal :** Livrer une application web statique complète, déployable sur GitHub Pages, qui permet aux étudiants de diagnostiquer 10 exploitations agricoles, simuler des crises, appliquer des recommandations de conseil, et exporter un dossier PDF de recommandation.

---

## Capacity

| Ressource | Disponibilité | Notes |
|-----------|--------------|-------|
| Claude Code (auto mode) | 1 session longue | Tout en séquentiel, pas de parallélisme |
| Données de contexte | 100% prêtes | 23 fichiers MD dans /context et /specs |

---

## Backlog — Ordonné par dépendances

### PHASE 1 — Fondations données (P0, bloquant tout le reste)

| # | Item | Estimation | Dépendance | Détail |
|---|------|-----------|------------|--------|
| 1.1 | Générer `referentiel-prix.js` | S | Aucune | Prix intrants/vente sur 3 ans, aides PAC. Source : `01-REGLES-METIER.md` |
| 1.2 | Générer les 10 fichiers `exploitation-{id}.js` | M | Aucune | Profil complet de chaque exploitation : identité, assolement 3 ans, matériel, emprunts, charges structure. Source : fichiers `expl-*.md` |
| 1.3 | Générer les 30 fichiers `grand-livre-{id}-{annee}.js` | L | 1.1 + 1.2 | 10 exploitations × 3 ans. Écritures comptables détaillées. Source : `spec-data-model.md` + ITK régionaux |
| 1.4 | Générer `scenarios.js` | S | 1.1 | 6 scénarios prédéfinis avec multiplicateurs. Source : `module-simulation.md` |
| 1.5 | Générer `leviers-conseil.js` | M | Aucune | **MAJ** — 15-20 leviers d'action avec filtrage par région/type d'exploitation. Catégories : charges opé, méca, assolement, commercialisation, risques, financier, structure |
| 1.6 | Générer `itk-regionaux.js` | M | Aucune | **NOUVEAU** — ITK détaillés par culture par région (coûts opé : semences, engrais, phytos, méca). Alimente le moteur CdP et les fiches Session 1 |

### PHASE 2 — Moteur de calcul (P0)

| # | Item | Estimation | Dépendance | Détail |
|---|------|-----------|------------|--------|
| 2.0 | Module `state.js` | S | Aucune | **NOUVEAU** — Gestion d'état + persistance localStorage (exploitation, scénario, leviers, assolement modifié, nom étudiant). Restauration auto au chargement + bouton réinitialiser |
| 2.1 | Module `engine/couts-production.js` | M | 1.x | Calcul CdP par culture : charges opé (depuis itk-regionaux) + méca + structure + rémunération MO. Source : `module-couts-production.md` |
| 2.2 | Module `engine/sig.js` | S | 1.x | Calcul des SIG : produit brut → marge brute → EBE → résultat → RCAI |
| 2.3 | Module `engine/simulation.js` | M | 2.1 + 1.4 | Applique un scénario (multiplicateurs) et recalcule tous les indicateurs |
| 2.4 | Module `engine/conseil.js` | M | 2.1 + 1.5 | Applique les leviers de conseil (filtrage par région) et recalcule l'impact. Comparaison avant/après |
| 2.5 | Module `engine/resilience.js` | S | 2.1 + 2.3 | Score de résilience (0-100) basé sur : trésorerie résiduelle, annuités/EBE, diversification, marge de sécurité |

### PHASE 3 — Interface web (P0)

| # | Item | Estimation | Dépendance | Détail |
|---|------|-----------|------------|--------|
| 3.1 | Page accueil + sélection exploitation | S | 1.2 | Carte de France stylisée, 10 cartes exploitation |
| 3.2 | Vue tableau de bord exploitation | M | 2.1 + 2.2 | KPI, assolement (donut), jauges santé, sélecteur année |
| 3.3 | Vue grand livre interactif | M | 1.3 | Table filtrable (compte, journal, date, analytique), recherche, export CSV |
| 3.4 | Vue SIG + waterfall chart | S | 2.2 | Tableau SIG + graphique cascade + comparaison 3 ans |
| 3.5 | Vue coûts de production | M | 2.1 | Tableau par culture, barres empilées décomposition CdP, CdP vs prix vente |
| 3.6 | Vue simulateur de scénarios | L | 2.3 | Sliders interactifs, scénarios prédéfinis, résultats temps réel, jauges, tableau avant/après |
| 3.7 | Vue mode conseil | L | 2.4 | **NOUVEAU** — Modifier assolement, appliquer leviers, voir impact avant/après, score de résilience |
| 3.8 | Vue comparaison inter-exploitations | M | 2.x | Sélection multiple, radar superposé, barres groupées |
| 3.9 | Vue export PDF / dossier de recommandation | M | 3.x | **NOUVEAU** — Template de rapport : diagnostic, CdP, simulation, recommandations, plan d'action. Bouton "Imprimer / Exporter PDF" |

### PHASE 4 — Finitions (P1)

| # | Item | Estimation | Dépendance | Détail |
|---|------|-----------|------------|--------|
| 4.1 | Navigation globale + responsive | S | 3.x | Sidebar, breadcrumbs, fonctionne tablette |
| 4.2 | Fiches imprimables Session 1 (calcul à la main) | S | 1.2 | HTML imprimable : fiche exploitation + ITK + feuille de calcul vierge. Source : `module-pedagogie.md` |
| 4.3 | Score de résilience + verdict fin de partie | S | 2.5 | Écran verdict : "L'exploitation survit / est en cessation de paiement" avec score |
| 4.4 | README.md + instructions déploiement GitHub Pages | S | Tout | Guide prof : comment déployer, comment utiliser en cours |

### STRETCH (P2 — si le temps le permet)

| # | Item | Estimation | Dépendance |
|---|------|-----------|------------|
| 5.1 | Carte de France interactive avec indicateurs par région | S | 3.x |
| 5.2 | Mode multijoueur (chaque groupe voit son exploitation) | M | 3.x |
| 5.3 | Historique des actions conseil (undo/redo) | S | 3.7 |

---

## Estimation de charge

| Taille | Signification | Items |
|--------|--------------|-------|
| S (Small) | < 100 lignes de code/données | 1.1, 1.4, 2.0, 2.2, 2.5, 3.1, 3.4, 4.1, 4.2, 4.3, 4.4 |
| M (Medium) | 100-500 lignes | 1.2, 1.5, 1.6, 2.1, 2.3, 2.4, 3.2, 3.3, 3.5, 3.8, 3.9 |
| L (Large) | 500+ lignes | 1.3, 3.6, 3.7 |

**Total estimé :** ~5 000-8 000 lignes de code + ~15 000 lignes de données JSON

---

## Risques

| Risque | Impact | Mitigation |
|--------|--------|------------|
| Grands livres trop volumineux (30 fichiers JSON) | Temps de génération long, app lente | Générer les grands livres comme fichiers séparés lazy-loaded. Résumer les soldes dans le fichier exploitation. |
| Cohérence des données inter-fichiers | Chiffres qui ne collent pas entre GL et SIG | Le moteur de calcul recalcule tout à partir des écritures. Vérification automatique. |
| Export PDF complexe en pur HTML/JS | Rendu PDF moche | Utiliser une CSS `@media print` soignée. Pas de librairie PDF externe. |
| App trop lourde pour GitHub Pages | Fichiers JSON > 10 Mo | Compression, lazy loading, données agrégées |

---

## Definition of Done

- [ ] L'app se lance en ouvrant `index.html` dans un navigateur **sans serveur** (double-clic, `file://`)
- [ ] Les 10 exploitations sont navigables avec leurs 3 années de données
- [ ] Le grand livre est filtrable par compte, journal, date et culture
- [ ] Les coûts de production sont calculés pour chaque culture de chaque exploitation
- [ ] Le simulateur permet de lancer les 6 scénarios et d'ajuster les paramètres librement
- [ ] Le mode conseil affiche des leviers filtrés par région et permet de modifier l'assolement
- [ ] L'export PDF génère un dossier de recommandation propre avec **graphiques visibles** (canvas → img)
- [ ] La page de garde du rapport affiche le nom de l'étudiant/binôme
- [ ] Les fiches Session 1 sont imprimables **individuellement et en batch (10 exploitations)**
- [ ] L'état de travail persiste entre les sessions (localStorage) et se restaure au rechargement
- [ ] Le bouton Réinitialiser remet tout à zéro
- [ ] L'app est déployable sur GitHub Pages (dossier statique)
- [ ] Un README explique le déploiement et l'utilisation
