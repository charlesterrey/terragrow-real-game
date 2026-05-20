# Design System — Marcassin

Reference pour Claude. Conventions visuelles de l'app Cabinets TerraGrow.

---

## Couleurs

### Accent (bleu nuit)

| Token         | Hex       | Usage                                      |
|---------------|-----------|---------------------------------------------|
| `accent`      | `#021130` | Boutons primaires, icones actives, strokes  |
| `accent-50`   | `#E8EDF5` | Fonds legers (badges, pills, hover subtil)  |
| `accent-100`  | `#C7D2E6` | Bordures legeres                            |
| `accent-200`  | `#94A7CC` | Texte secondaire sur fond clair             |
| `accent-300`  | `#617CB3` | —                                           |
| `accent-400`  | `#3A5A99` | —                                           |
| `accent-500`  | `#021130` | = DEFAULT                                   |
| `accent-600`  | `#020E28` | —                                           |
| `accent-700`  | `#010A1E` | Texte sur fond accent-50                    |
| `accent-800`  | `#010714` | —                                           |
| `accent-900`  | `#00030A` | —                                           |

### Neutres (Tailwind gray)

| Token      | Hex       | Usage                                    |
|------------|-----------|-------------------------------------------|
| `gray-50`  | `#F9FAFB` | —                                         |
| `gray-100` | `#F3F4F6` | Bordures de cards, separateurs legers     |
| `gray-200` | `#E5E7EB` | Bordures d'inputs, badges inactifs        |
| `gray-400` | `#9CA3AF` | Texte placeholder, labels secondaires     |
| `gray-500` | `#6B7280` | Texte desactive, nav non-active           |
| `gray-600` | `#4B5563` | Texte secondaire, labels de formulaire    |
| `gray-800` | `#1F2937` | Texte principal du body                   |
| `gray-900` | `#111827` | Titres, texte fort                        |

### Semantiques

| Couleur         | Hex       | Usage                          |
|-----------------|-----------|--------------------------------|
| `red-50`        | `#FEF2F2` | Fond alerte / destructif       |
| `red-400`       | `#F87171` | Asterisque requis              |
| `red-500`       | `#EF4444` | Bouton supprimer, erreurs      |
| `red-600`       | `#DC2626` | Bouton supprimer hover         |
| `green-400`     | `#4ADE80` | Icone toast succes             |
| `green-500`     | `#22C55E` | Stepper done, outbound 100%    |
| `amber-100`     | `#FEF3C7` | Badge "en cours" fond          |
| `amber-700`     | `#B45309` | Badge "en cours" texte         |
| `blue-100`      | `#DBEAFE` | Badge "contacte" fond          |
| `blue-700`      | `#1D4ED8` | Badge "contacte" texte         |
| `green-100`     | `#DCFCE7` | Badge "integre/partenaire" fond|
| `green-700`     | `#15803D` | Badge "integre/partenaire" texte|

### Fonds

| Zone            | Valeur                  |
|-----------------|-------------------------|
| Body            | `#FAFAFA` (`bg-[#FAFAFA]`) |
| Cards / Panels  | `white`                 |
| Login page      | `#0B1437`               |
| Overlay modal   | `black/40` + `backdrop-blur-sm` |

### Carte — Gradient par densite

**Mode Cabinets** (bleu) :
`#D6DFED` → `#A8BFDE` → `#7A9ECE` → `#1E4A8A` → `#021130`

**Mode Outbound** (rouge→vert) :
`#EF4444` → `#F97316` → `#F59E0B` → `#84CC16` → `#22C55E`

---

## Arrondis (border-radius)

| Composant              | Classe Tailwind   | Valeur   |
|------------------------|-------------------|----------|
| Boutons                | `rounded-lg`      | 8px      |
| Inputs / Selects       | `rounded-lg`      | 8px      |
| Cards (cabinet)        | `rounded-xl` (12px via CSS) | 12px |
| Modales                | `rounded-2xl`     | 16px     |
| Badges / Pills         | `rounded-full`    | 9999px   |
| Nav tabs (container)   | `rounded-lg`      | 8px      |
| Nav tabs (item actif)  | `rounded-md`      | 6px      |
| Tooltip                | `rounded-md`      | 6px      |
| Drop zone (import)     | 16px (CSS)        | 16px     |
| Toast                  | `rounded-xl`      | 12px     |
| Login card             | `rounded-2xl`     | 16px     |
| Login input            | `rounded-xl`      | 12px     |
| Logo                   | `rounded-lg`      | 8px      |
| Stepper dot            | `rounded-full`    | 50%      |
| Zoom controls          | `rounded-lg`      | 8px      |

---

## Boutons

### Primaire

```html
<button
  style="background-color:#021130"
  class="text-white text-sm font-semibold py-2.5 px-6 rounded-lg hover:brightness-110 transition-all">
  Label
</button>
```

- Fond : `#021130`
- Texte : `white`, `text-sm`, `font-semibold`
- Padding : `py-2.5 px-6` (standard) ou `py-3.5 px-5` (FAB)
- Hover : `hover:brightness-110`
- Arrondi : `rounded-lg`

### Secondaire (outline)

```html
<button
  class="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
  Annuler
</button>
```

- Fond : transparent
- Bordure : `border-gray-200`
- Texte : `text-gray-600`, `text-sm`, `font-medium`
- Hover : `hover:bg-gray-50`

### Destructif

```html
<button
  class="px-4 py-2.5 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors">
  Supprimer
</button>
```

### FAB (Floating Action Button)

```html
<button
  style="background-color:#021130"
  class="hover:brightness-110 active:scale-95 text-white font-semibold text-sm pl-5 pr-6 py-3.5 rounded-lg shadow-xl flex items-center gap-2.5 transition-all">
  <svg>...</svg>
  Label
</button>
```

### Bouton icone (zoom, actions)

```html
<button
  class="w-8 h-8 bg-white border border-gray-200 rounded-lg shadow-sm flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
  ...
</button>
```

---

## Badges (statuts)

Forme : `text-xs font-medium px-2 py-0.5 rounded-full`

| Statut          | Fond          | Texte          |
|-----------------|---------------|----------------|
| non_integre     | `gray-200`    | `gray-600`     |
| en_cours        | `amber-100`   | `amber-700`    |
| integre         | `green-100`   | `green-700`    |
| non_contacte    | `gray-200`    | `gray-600`     |
| contacte        | `blue-100`    | `blue-700`     |
| en_discussion   | `amber-100`   | `amber-700`    |
| partenaire      | `green-100`   | `green-700`    |

---

## Typographie

- **Titres** : `text-base font-semibold text-gray-900`
- **Sous-titres / meta** : `text-xs text-gray-400`
- **Corps** : `text-sm text-gray-800`
- **Labels formulaire** : `text-xs font-medium text-gray-600`
- **Placeholders** : `text-sm text-gray-400`
- **Nav active** : `text-sm font-semibold text-gray-900`
- **Nav inactive** : `text-sm font-medium text-gray-500`
- **Login titre** : `text-[26px] font-normal`, accent bleu sur mot-cle (`text-[#4B7BF5] font-semibold`)

Police : systeme (pas de font custom chargee).

---

## Ombres

| Usage               | Classe             |
|----------------------|--------------------|
| Header               | `shadow-sm`        |
| Cards hover          | `shadow-md` (via CSS: `0 2px 12px rgba(0,0,0,0.07)`) |
| Modal                | `shadow-2xl`       |
| FAB                  | `shadow-xl`        |
| Toast                | `shadow-xl`        |
| Tooltip              | `shadow-2xl`       |
| Zoom controls        | `shadow-sm`        |
| Legende carte        | `shadow-sm`        |
| Login card           | Custom (`0 25px 60px rgba(0,0,0,0.3)`) |

---

## Inputs

```html
<input class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm
  focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent
  transition-colors" />
```

- Bordure : `border-gray-200`
- Focus : ring `accent/30` + border `accent`
- Arrondi : `rounded-lg`
- Padding : `px-3 py-2`
- Login variant : `rounded-xl`, `pl-11 pr-4 py-3.5`, focus ring `[#4B7BF5]/25`

---

## Composants cles

### Card cabinet

```css
background: white;
border: 1px solid #F3F4F6;
border-radius: 12px;
padding: 14px;
```
Hover : `box-shadow: 0 2px 12px 0 rgba(0,0,0,0.07)`

### Modal

- Overlay : `bg-black/40 backdrop-blur-sm`
- Container : `bg-white rounded-2xl shadow-2xl max-w-md`
- Header : `px-6 py-5 border-b border-gray-100`
- Body : `px-6 py-5 space-y-4`
- Footer : `px-6 py-4 border-t border-gray-100 flex gap-3 justify-end`

### Toast

```html
<div class="bg-gray-900 text-white text-sm px-4 py-3 rounded-xl shadow-xl flex items-center gap-2">
```

### Nav tabs

- Container : `bg-gray-100 rounded-lg p-0.5 gap-0.5`
- Tab active : `bg-white shadow-sm rounded-md text-sm font-semibold text-gray-900`
- Tab inactive : `rounded-md text-sm font-medium text-gray-500 hover:text-gray-700`

---

## Espacements recurrents

| Zone              | Valeur         |
|-------------------|----------------|
| Header            | `px-6 py-3.5`  |
| Drawer header     | `px-5 py-4`    |
| Drawer liste      | `px-4 py-3`    |
| Card interne      | `p-[14px]`     |
| Modal sections    | `px-6 py-5`    |
| Gap entre cards   | `space-y-3`    |

---

## Icones

Heroicons (outline, stroke-width 2). Tailles courantes : `w-4 h-4`, `w-5 h-5`. Integrees en inline SVG.
