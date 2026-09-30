/**
 * components/ui/index.ts
 * ======================
 * Point d'entrée unique de la bibliothèque de composants.
 *
 *   import { Screen, Text, Button, Card } from '@/components/ui';
 */

export { Avatar, initialsOf } from './Avatar';
export { Badge, DeliveryStatusBadge, OrderStatusBadge, VerifiedBadge } from './Badge';
export type { BadgeTone } from './Badge';
export { Button, ButtonRow, IconButton } from './Button';
export type { ButtonProps } from './Button';
export { Card } from './Card';
export type { CardProps } from './Card';
export { EmptyState, ErrorState } from './EmptyState';
export { Input } from './Input';
export type { InputProps } from './Input';
export { Price, PriceRow } from './Price';
export { Screen } from './Screen';
export type { ScreenProps } from './Screen';
export { ProductCardSkeleton, RowSkeleton, Skeleton } from './Skeleton';
export { StatGrid, StatTile } from './StatTile';
export { Text } from './Text';
export type { TextProps } from './Text';
export { ToastProvider, useToast } from './Toast';
