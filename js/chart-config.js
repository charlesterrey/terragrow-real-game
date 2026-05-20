// js/chart-config.js — Shared financial chart configuration
// Professional, muted color palette and consistent styling across all charts

// ─── Color Palette ──────────────────────────────────────────────────────────
export const COLORS = {
  // Primary financial palette
  navy:      '#1B2A4A',
  steel:     '#4A6FA5',
  slate:     '#64748B',
  sage:      '#5B8C5A',
  coral:     '#C2654A',
  gold:      '#B09343',
  plum:      '#7C5B8D',
  teal:      '#3D7F8C',

  // Semantic
  positive:  '#2D7A4F',
  negative:  '#B33D3D',
  warning:   '#C08420',
  neutral:   '#6B7280',

  // Backgrounds (for fills)
  navyBg:    'rgba(27,42,74,0.08)',
  steelBg:   'rgba(74,111,165,0.08)',
  sageBg:    'rgba(91,140,90,0.08)',
  coralBg:   'rgba(194,101,74,0.08)',
  positiveBg:'rgba(45,122,79,0.12)',
  negativeBg:'rgba(179,61,61,0.12)',

  // Chart series (ordered for grouped/stacked charts)
  series: ['#1B2A4A', '#4A6FA5', '#5B8C5A', '#B09343', '#C2654A', '#7C5B8D', '#3D7F8C', '#64748B'],
  seriesBg: [
    'rgba(27,42,74,0.75)', 'rgba(74,111,165,0.75)', 'rgba(91,140,90,0.75)',
    'rgba(176,147,67,0.75)', 'rgba(194,101,74,0.75)', 'rgba(124,91,141,0.75)',
    'rgba(61,127,140,0.75)', 'rgba(100,116,139,0.75)'
  ]
};

// ─── Number Formatting ──────────────────────────────────────────────────────

const eurFmt = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

export function fmtEur(n) { return eurFmt.format(n || 0); }

export function fmtK(v) {
  if (v === 0) return '0';
  if (Math.abs(v) >= 1000000) return (v / 1000000).toFixed(1).replace('.0', '') + 'M €';
  if (Math.abs(v) >= 1000) return (v / 1000).toFixed(0) + 'k €';
  return Math.round(v) + ' €';
}

// ─── Shared Chart.js Defaults ───────────────────────────────────────────────

export function applyFinancialDefaults() {
  if (typeof Chart === 'undefined') return;

  Chart.defaults.font.family = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  Chart.defaults.font.size = 11;
  Chart.defaults.color = '#64748B';
  Chart.defaults.plugins.legend.labels.usePointStyle = true;
  Chart.defaults.plugins.legend.labels.pointStyle = 'rectRounded';
  Chart.defaults.plugins.legend.labels.padding = 16;
  Chart.defaults.plugins.legend.labels.font = { size: 11, weight: '500' };
  Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(15,23,42,0.92)';
  Chart.defaults.plugins.tooltip.titleFont = { size: 12, weight: '600' };
  Chart.defaults.plugins.tooltip.bodyFont = { size: 11 };
  Chart.defaults.plugins.tooltip.padding = { top: 8, bottom: 8, left: 12, right: 12 };
  Chart.defaults.plugins.tooltip.cornerRadius = 6;
  Chart.defaults.plugins.tooltip.displayColors = true;
  Chart.defaults.plugins.tooltip.boxPadding = 4;
}

// ─── Shared Scale Options ───────────────────────────────────────────────────

export const gridStyle = {
  color: 'rgba(148,163,184,0.15)',
  drawBorder: false,
};

export const zeroLineGrid = {
  color: (ctx) => ctx.tick.value === 0 ? 'rgba(100,116,139,0.4)' : 'rgba(148,163,184,0.15)',
  lineWidth: (ctx) => ctx.tick.value === 0 ? 1.5 : 1,
  drawBorder: false,
};

export function euroScale(options = {}) {
  return {
    ticks: {
      callback: v => fmtK(v),
      font: { size: 11 },
      color: '#94A3B8',
      padding: 8,
      ...options.ticks
    },
    grid: options.zeroLine ? zeroLineGrid : gridStyle,
    border: { display: false },
    ...options
  };
}

export function categoryScale(options = {}) {
  return {
    ticks: {
      font: { size: 11, weight: '500' },
      color: '#64748B',
      padding: 4,
      ...options.ticks
    },
    grid: { display: false },
    border: { display: false },
    ...options
  };
}

// ─── Tooltip Callbacks ──────────────────────────────────────────────────────

export const euroTooltip = {
  callbacks: {
    label: (ctx) => {
      const label = ctx.dataset.label || '';
      return ` ${label} : ${fmtEur(ctx.parsed.y || ctx.raw)}`;
    }
  }
};

export const euroTooltipWithTotal = {
  callbacks: {
    label: (ctx) => ` ${ctx.dataset.label || ''} : ${fmtEur(ctx.parsed.y || ctx.raw)}`,
    footer: (items) => {
      const total = items.reduce((s, i) => s + (i.parsed.y || 0), 0);
      return `Total : ${fmtEur(total)}`;
    }
  },
  footerFont: { weight: '600' }
};

// ─── Legend Presets ──────────────────────────────────────────────────────────

export const legendTop = {
  position: 'top',
  align: 'end',
  labels: {
    usePointStyle: true,
    pointStyle: 'rectRounded',
    padding: 16,
    font: { size: 11, weight: '500' }
  }
};

export const legendBottom = { ...legendTop, position: 'bottom' };
export const legendHidden = { display: false };
