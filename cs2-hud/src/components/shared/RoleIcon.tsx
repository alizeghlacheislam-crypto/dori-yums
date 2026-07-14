import { memo } from 'react';
import type { PlayerRole } from '@/types/hud';
import {
  AnchorIcon,
  AWPerIcon,
  EntryIcon,
  IGLIcon,
  LurkerIcon,
  SupportIcon,
} from '@/assets/icons/Icons';

const ROLE_COMPONENTS = {
  igl: IGLIcon,
  awper: AWPerIcon,
  support: SupportIcon,
  anchor: AnchorIcon,
  lurker: LurkerIcon,
  entry: EntryIcon,
} as const;

export const ROLE_LABELS: Record<PlayerRole, string> = {
  igl: 'IGL',
  awper: 'AWPer',
  support: 'Support',
  anchor: 'Anchor',
  lurker: 'Lurker',
  entry: 'Entry',
};

export const RoleIcon = memo(
  ({ role, size = 12, className }: { role: PlayerRole; size?: number; className?: string }) => {
    const Component = ROLE_COMPONENTS[role];
    return <Component size={size} className={className} aria-label={ROLE_LABELS[role]} />;
  },
);
RoleIcon.displayName = 'RoleIcon';
