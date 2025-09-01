// Stage -> color mapping (KPI tiles, funnels, headers)
export const seekerStageColors = {
  // Positive/neutral progression
  applied:       { bg: '#E3F2FD', text: '#0D47A1', solid: '#2196F3' },   // Blue
  viewed:        { bg: '#E0F7FA', text: '#006064', solid: '#26C6DA' },   // Cyan
  interviewing:  { bg: '#E8F5E9', text: '#1B5E20', solid: '#43A047' },   // Green
  offers:        { bg: '#F3E5F5', text: '#4A148C', solid: '#8E24AA' },   // Purple
  hired:         { bg: '#E0F2F1', text: '#004D40', solid: '#2E7D32' },   // Success

  // Negative
  rejected:      { bg: '#FFEBEE', text: '#B71C1C', solid: '#E53935' },   // Red

  // Info / neutral
  info:          { bg: '#E0F2F1', text: '#00695C', solid: '#26A69A' },   // Teal
  neutral:       { bg: '#ECEFF1', text: '#37474F', solid: '#90A4AE' },   // Gray

  // Brand accent (buttons, not a status)
  brand:         { solid: '#FF7043' },                                   // Forge orange
};

export const STAGE_ORDER = ['applied', 'viewed', 'interviewing', 'offers', 'hired'];
export const colorFor = (k) => seekerStageColors[k] ?? seekerStageColors.neutral;
export const kpiColors = (k) => {
  const c = colorFor(k);
  return { bg: c.bg, text: c.text };
};
