export const data = [
  {
    "id": "ormuz", "nom": "Crise d'Ormuz", "categorie": "geopolitique", "couleur": "#DC2626",
    "description": "Blocage du détroit d'Ormuz, flambée pétrole et gaz, tension sur les engrais azotés.",
    "multiplicateurs": {
      "prix_engrais_n": 1.60, "prix_engrais_pk": 1.10, "prix_gnr": 1.45, "prix_phytos": 1.12, "prix_semences": 1.05,
      "prix_vente": { "ble_tendre": 1.18, "ble_dur": 1.15, "orge_hiver": 1.16, "orge_printemps_brass": 1.16, "colza": 1.15, "mais_grain": 1.20, "tournesol": 1.12, "pois": 1.10, "feverole": 1.10, "betterave_dt16": 1.05, "pomme_terre": 1.08, "lin_paille_dt": 1.05, "soja": 1.15, "sorgho": 1.18, "triticale": 1.14, "lentille_puy": 1.05, "haricots_verts_dt": 1.05, "petits_pois_dt": 1.05, "prairie_foin_dt": 1.10 },
      "rendements": { "defaut": 1.00 }, "charges_structure": { "energie": 1.30 }
    }
  },
  {
    "id": "secheresse", "nom": "Sécheresse sévère", "categorie": "climatique", "couleur": "#F59E0B",
    "description": "Déficit pluviométrique de 40-60% d'avril à août, températures +3°C au-dessus des normales.",
    "multiplicateurs": {
      "prix_engrais_n": 1.00, "prix_engrais_pk": 1.00, "prix_gnr": 1.05, "prix_phytos": 1.00, "prix_semences": 1.00,
      "prix_vente": { "ble_tendre": 1.12, "ble_dur": 1.15, "orge_hiver": 1.10, "orge_printemps_brass": 1.10, "colza": 1.08, "mais_grain": 1.15, "tournesol": 1.10, "pois": 1.08, "feverole": 1.08, "betterave_dt16": 1.05, "pomme_terre": 1.20, "lin_paille_dt": 1.05, "soja": 1.12, "sorgho": 1.10, "triticale": 1.08, "lentille_puy": 1.10, "haricots_verts_dt": 1.15, "petits_pois_dt": 1.15, "prairie_foin_dt": 1.30 },
      "rendements": { "ble_tendre": 0.75, "ble_dur": 0.72, "orge_hiver": 0.78, "orge_printemps_brass": 0.75, "colza": 0.80, "mais_grain": 0.60, "tournesol": 0.82, "pois": 0.65, "feverole": 0.65, "betterave_dt16": 0.75, "pomme_terre": 0.70, "lin_paille_dt": 0.80, "soja": 0.70, "sorgho": 0.78, "triticale": 0.80, "lentille_puy": 0.60, "haricots_verts_dt": 0.65, "petits_pois_dt": 0.60, "prairie_foin_dt": 0.55, "defaut": 0.75 },
      "charges_structure": {}
    },
    "impact_regional": {
      "beauce": { "rendements_ajustement": 0.95 }, "nord_picardie": { "rendements_ajustement": 1.00 },
      "bretagne": { "rendements_ajustement": 0.98 }, "sud_ouest": { "rendements_ajustement": 0.85 },
      "rhone_alpes": { "rendements_ajustement": 0.92 }
    }
  },
  {
    "id": "gel_tardif", "nom": "Gel tardif (mi-avril)", "categorie": "climatique", "couleur": "#3B82F6",
    "description": "Épisode de gel à -5°C sur 2 nuits consécutives au stade épiaison des céréales d'hiver.",
    "multiplicateurs": {
      "prix_engrais_n": 1.00, "prix_engrais_pk": 1.00, "prix_gnr": 1.00, "prix_phytos": 1.00, "prix_semences": 1.00,
      "prix_vente": { "ble_tendre": 1.10, "ble_dur": 1.12, "orge_hiver": 1.10, "orge_printemps_brass": 1.08, "colza": 1.08, "mais_grain": 1.00, "tournesol": 1.00, "pois": 1.05, "feverole": 1.05, "betterave_dt16": 1.00, "pomme_terre": 1.00, "lin_paille_dt": 1.00, "soja": 1.00, "sorgho": 1.00, "triticale": 1.08, "lentille_puy": 1.05, "haricots_verts_dt": 1.00, "petits_pois_dt": 1.05, "prairie_foin_dt": 1.00 },
      "rendements": { "ble_tendre": 0.65, "ble_dur": 0.58, "orge_hiver": 0.68, "orge_printemps_brass": 0.90, "colza": 0.78, "mais_grain": 1.00, "tournesol": 1.00, "pois": 0.80, "feverole": 0.78, "betterave_dt16": 1.00, "pomme_terre": 1.00, "lin_paille_dt": 0.90, "soja": 1.00, "sorgho": 1.00, "triticale": 0.70, "lentille_puy": 0.75, "haricots_verts_dt": 0.95, "petits_pois_dt": 0.85, "prairie_foin_dt": 0.90, "defaut": 0.80 },
      "charges_structure": {}
    }
  },
  {
    "id": "effondrement_marche", "nom": "Effondrement des marchés", "categorie": "marche", "couleur": "#7C3AED",
    "description": "Récoltes records mondiales. Stocks au plus haut. Chute des cours.",
    "multiplicateurs": {
      "prix_engrais_n": 0.90, "prix_engrais_pk": 0.95, "prix_gnr": 0.95, "prix_phytos": 1.00, "prix_semences": 1.00,
      "prix_vente": { "ble_tendre": 0.72, "ble_dur": 0.78, "orge_hiver": 0.70, "orge_printemps_brass": 0.75, "colza": 0.80, "mais_grain": 0.75, "tournesol": 0.82, "pois": 0.85, "feverole": 0.85, "betterave_dt16": 0.90, "pomme_terre": 0.70, "lin_paille_dt": 0.90, "soja": 0.82, "sorgho": 0.75, "triticale": 0.72, "lentille_puy": 0.90, "haricots_verts_dt": 0.92, "petits_pois_dt": 0.92, "prairie_foin_dt": 0.85 },
      "rendements": { "defaut": 1.00 }, "charges_structure": {}
    }
  },
  {
    "id": "interdiction_phyto", "nom": "Interdiction molécule phyto clé", "categorie": "reglementaire", "couleur": "#059669",
    "description": "Retrait d'un herbicide majeur et restriction sur les fongicides SDHI.",
    "multiplicateurs": {
      "prix_engrais_n": 1.00, "prix_engrais_pk": 1.00, "prix_gnr": 1.05, "prix_phytos": 1.25, "prix_semences": 1.03,
      "prix_vente": { "ble_tendre": 1.03, "ble_dur": 1.03, "orge_hiver": 1.02, "orge_printemps_brass": 1.02, "colza": 1.03, "mais_grain": 1.02, "tournesol": 1.02, "pois": 1.01, "feverole": 1.01, "betterave_dt16": 1.02, "pomme_terre": 1.05, "lin_paille_dt": 1.02, "soja": 1.02, "sorgho": 1.01, "triticale": 1.02, "lentille_puy": 1.01, "haricots_verts_dt": 1.03, "petits_pois_dt": 1.03, "prairie_foin_dt": 1.00 },
      "rendements": { "ble_tendre": 0.93, "ble_dur": 0.90, "orge_hiver": 0.94, "orge_printemps_brass": 0.95, "colza": 0.88, "mais_grain": 0.97, "tournesol": 0.97, "pois": 0.95, "feverole": 0.95, "betterave_dt16": 0.90, "pomme_terre": 0.88, "lin_paille_dt": 0.92, "soja": 0.97, "sorgho": 0.98, "triticale": 0.95, "lentille_puy": 0.95, "haricots_verts_dt": 0.92, "petits_pois_dt": 0.93, "prairie_foin_dt": 1.00, "defaut": 0.93 },
      "charges_structure": { "mecanisation": 1.15 }
    }
  },
  {
    "id": "crise_2024", "nom": "Scénario composé 2024", "categorie": "composite", "couleur": "#92400E",
    "description": "Conditions réelles 2024 : mauvais rendements, prix déprimés, engrais en baisse partielle.",
    "multiplicateurs": {
      "prix_engrais_n": 0.80, "prix_engrais_pk": 0.92, "prix_gnr": 1.02, "prix_phytos": 1.00, "prix_semences": 1.02,
      "prix_vente": { "ble_tendre": 1.00, "ble_dur": 1.00, "orge_hiver": 1.00, "orge_printemps_brass": 1.00, "colza": 1.00, "mais_grain": 1.00, "tournesol": 1.00, "pois": 1.00, "feverole": 1.00, "betterave_dt16": 1.00, "pomme_terre": 1.00, "lin_paille_dt": 1.00, "soja": 1.00, "sorgho": 1.00, "triticale": 1.00, "lentille_puy": 1.00, "haricots_verts_dt": 1.00, "petits_pois_dt": 1.00, "prairie_foin_dt": 1.00 },
      "rendements": { "ble_tendre": 0.88, "ble_dur": 0.85, "orge_hiver": 0.87, "orge_printemps_brass": 0.86, "colza": 0.82, "mais_grain": 0.85, "tournesol": 0.80, "pois": 0.80, "feverole": 0.78, "betterave_dt16": 0.85, "pomme_terre": 0.82, "lin_paille_dt": 0.78, "soja": 0.82, "sorgho": 0.82, "triticale": 0.85, "lentille_puy": 0.60, "haricots_verts_dt": 0.82, "petits_pois_dt": 0.80, "prairie_foin_dt": 0.85, "defaut": 0.85 },
      "charges_structure": {}
    }
  }
];
