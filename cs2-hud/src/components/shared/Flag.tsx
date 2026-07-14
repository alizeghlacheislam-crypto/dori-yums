import { memo, useState } from 'react';
import { countryFlag } from '../../utils/players';

interface Props {
  country: string | null;
  height?: number;
}

/**
 * Country flag: SVG from flagcdn (crisp at broadcast scale) with an emoji
 * fallback, and nothing rendered at all when the country is unknown — a
 * missing flag must never leave a broken-image hole on stream.
 */
export const Flag = memo(function Flag({ country, height = 11 }: Props) {
  const [failed, setFailed] = useState(false);
  const code = country?.trim().toLowerCase();
  if (!code || !/^[a-z]{2}$/.test(code)) return null;

  if (failed) {
    const emoji = countryFlag(country);
    return emoji ? <span style={{ fontSize: height, lineHeight: 1 }}>{emoji}</span> : null;
  }

  return (
    <img
      src={`https://flagcdn.com/h24/${code}.png`}
      alt={code.toUpperCase()}
      height={height}
      style={{ borderRadius: 1.5, display: 'block' }}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
});
