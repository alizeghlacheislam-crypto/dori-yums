import { memo } from 'react';
import { HUDLayout } from '@/layouts/HUDLayout';
import { useHUDScale } from '@/hooks/useHUDScale';

/** The single page of the app: the scaled broadcast canvas. */
export const HUDPage = memo(() => {
  useHUDScale();
  return <HUDLayout />;
});
HUDPage.displayName = 'HUDPage';
