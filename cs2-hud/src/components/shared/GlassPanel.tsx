import { forwardRef, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react';
import styles from './GlassPanel.module.css';
import { cn } from '@/utils/cn';

export interface GlassPanelProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  /** darker card surface instead of the deep background tint */
  card?: boolean;
  /** colored accent edge */
  accent?: 'top' | 'left' | 'right' | 'none';
  accentColor?: string;
}

/** The base glassmorphism surface every HUD module sits on. */
export const GlassPanel = forwardRef<HTMLDivElement, GlassPanelProps>(
  ({ children, card, accent = 'none', accentColor, className, style, ...rest }, ref) => (
    <div
      ref={ref}
      className={cn(
        styles.panel,
        card && styles.card,
        accent === 'top' && styles.accentTop,
        accent === 'left' && styles.accentLeft,
        accent === 'right' && styles.accentRight,
        className,
      )}
      style={
        accentColor
          ? ({ ...style, '--edge-color': accentColor } as CSSProperties)
          : style
      }
      {...rest}
    >
      {children}
    </div>
  ),
);
GlassPanel.displayName = 'GlassPanel';
