import { memo } from 'react';

/**
 * Country flag as a Unicode regional-indicator pair. Fully offline and
 * license-free; renders through the system emoji font. Falls back to the
 * raw ISO code in small caps if the code is unknown.
 */
const isoToEmoji = (code: string): string | null => {
  const cc = code.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(cc)) return null;
  return String.fromCodePoint(...[...cc].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
};

export interface FlagProps {
  country?: string;
  size?: number;
  className?: string;
}

export const Flag = memo(({ country, size = 14, className }: FlagProps) => {
  if (!country) return null;
  const emoji = isoToEmoji(country);
  return (
    <span
      className={className}
      style={{ fontSize: size, lineHeight: 1, display: 'inline-block' }}
      title={country.toUpperCase()}
    >
      {emoji ?? country.toUpperCase()}
    </span>
  );
});
Flag.displayName = 'Flag';
