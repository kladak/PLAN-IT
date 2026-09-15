/** Shared visual tokens so screens stay consistent. */
export const colors = {
  bg: '#F7F9F6',
  surface: '#FFFFFF',
  primary: '#3E6B4F',
  primarySoft: '#BED0BC',
  primaryMuted: '#AFC6B8',
  primaryDark: '#2F513C',
  accent: '#637763',
  text: '#1C2B21',
  textMuted: '#5A6B5E',
  border: '#D5DED6',
  danger: '#B42318',
  dangerSoft: '#FEE4E2',
  warningSoft: '#FEF0C7',
  success: '#027A48',
  successSoft: '#D1FADF',
  scoreHigh: '#027A48',
  scoreMid: '#B54708',
  scoreLow: '#667085',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export function scoreColor(percent) {
  const n = Number(percent);
  if (!Number.isFinite(n)) return colors.scoreLow;
  if (n >= 70) return colors.scoreHigh;
  if (n >= 40) return colors.scoreMid;
  return colors.scoreLow;
}

export function formatMatch(percent) {
  const n = Number(percent);
  if (!Number.isFinite(n)) return null;
  return `${Math.round(n)}% match`;
}

/** Texas A&M Earth-Kind style regions used by the Backend (0–7). */
export const REGIONS = [
  { id: 0, label: 'Region 0 (default sample)' },
  { id: 1, label: 'Region 1' },
  { id: 2, label: 'Region 2' },
  { id: 3, label: 'Region 3' },
  { id: 4, label: 'Region 4' },
  { id: 5, label: 'Region 5' },
  { id: 6, label: 'Region 6' },
  { id: 7, label: 'Region 7' },
];
