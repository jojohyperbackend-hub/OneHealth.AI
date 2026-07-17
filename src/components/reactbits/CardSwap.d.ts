import type { ForwardRefExoticComponent, HTMLAttributes, ReactNode, RefAttributes } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  customClass?: string;
}

export const Card: ForwardRefExoticComponent<CardProps & RefAttributes<HTMLDivElement>>;

export interface CardSwapProps {
  width?: number;
  height?: number;
  cardDistance?: number;
  verticalDistance?: number;
  delay?: number;
  pauseOnHover?: boolean;
  onCardClick?: (index: number) => void;
  skewAmount?: number;
  easing?: 'elastic' | 'linear';
  children: ReactNode;
}

declare const CardSwap: (props: CardSwapProps) => JSX.Element;
export default CardSwap;
