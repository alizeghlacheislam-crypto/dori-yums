/** $ formatting used across economy modules: "$4 750". */
export function money(value: number): string {
  return `$${Math.round(value).toLocaleString('en-US').replace(/,/g, ' ')}`;
}

/** Seconds → "M:SS" clock. Negative values clamp to 0:00. */
export function clock(seconds: number): string {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Seconds → "SS.T" for high-tension bomb countdowns. */
export function preciseClock(seconds: number): string {
  return Math.max(0, seconds).toFixed(1);
}

export function pct(value: number, digits = 0): string {
  return `${value.toFixed(digits)}%`;
}

export function ratio(value: number, digits = 2): string {
  return value.toFixed(digits);
}

/** "st"/"nd"/"rd"/"th" ordinal for map numbers etc. */
export function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}
