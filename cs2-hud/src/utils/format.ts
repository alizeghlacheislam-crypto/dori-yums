/** `$4,750` — broadcast money formatting. */
export const formatMoney = (value: number): string => `$${value.toLocaleString('en-US')}`;

/** `1:55` from a seconds float, clamped at zero. */
export const formatClock = (seconds: number): string => {
  const s = Math.max(0, Math.ceil(seconds));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
};

/** `39.9` — bomb/defuse countdowns show a single decimal. */
export const formatCountdown = (seconds: number): string =>
  Math.max(0, seconds).toFixed(1);

export const formatPercent = (v: number): string => `${Math.round(v * 100)}%`;

export const clamp = (v: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, v));

/** Team short name: first word truncated to 4 chars, uppercased. */
export const shortTeamName = (name: string): string => {
  const clean = name.trim();
  if (clean.length <= 5) return clean.toUpperCase();
  const words = clean.split(/\s+/);
  if (words.length > 1) {
    return words
      .map((w) => w[0])
      .join('')
      .slice(0, 4)
      .toUpperCase();
  }
  return clean.slice(0, 4).toUpperCase();
};

export const ordinal = (n: number): string => {
  const rem10 = n % 10;
  const rem100 = n % 100;
  if (rem10 === 1 && rem100 !== 11) return `${n}st`;
  if (rem10 === 2 && rem100 !== 12) return `${n}nd`;
  if (rem10 === 3 && rem100 !== 13) return `${n}rd`;
  return `${n}th`;
};
