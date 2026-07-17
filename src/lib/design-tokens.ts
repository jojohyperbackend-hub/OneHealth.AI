/**
 * lib/design-tokens.ts — OneHealth.AI
 * Design system tokens derived from DESIGN.md (Clinical Vigilance palette)
 * Single source of truth — import ini jangan hardcode warna/spacing di komponen.
 */

export const colors = {
  primary: '#00559a',
  primaryContainer: '#296eb7',
  onPrimary: '#ffffff',
  onPrimaryContainer: '#e8efff',
  inversePrimary: '#a3c9ff',

  secondary: '#006c52',
  secondaryContainer: '#08fdc6',
  onSecondary: '#ffffff',
  onSecondaryContainer: '#007056',
  secondaryFixedDim: '#00e0af',

  surface: '#f8f9ff',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#eef4ff',
  surfaceContainer: '#e5eeff',
  surfaceContainerHigh: '#dfe9fa',
  onSurface: '#121c28',
  onSurfaceVariant: '#414751',

  outline: '#727782',
  outlineVariant: '#c1c7d2',

  error: '#ba1a1a',
  errorContainer: '#ffdad6',
  onError: '#ffffff',
} as const;

export const typography = {
  headlineXl: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: '64px',
    fontWeight: '700',
    lineHeight: '1.1',
    letterSpacing: '-0.02em',
  },
  headlineLg: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: '48px',
    fontWeight: '700',
    lineHeight: '1.1',
    letterSpacing: '-0.01em',
  },
  headlineLgMobile: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: '32px',
    fontWeight: '700',
    lineHeight: '1.2',
  },
  headlineMd: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: '32px',
    fontWeight: '600',
    lineHeight: '1.2',
  },
  bodyLg: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: '18px',
    fontWeight: '400',
    lineHeight: '1.6',
  },
  bodyMd: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: '16px',
    fontWeight: '400',
    lineHeight: '1.5',
  },
  labelSm: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: '12px',
    fontWeight: '600',
    lineHeight: '1',
    letterSpacing: '0.05em',
  },
} as const;

export const spacing = {
  base: '8px',
  containerMax: '1280px',
  gutter: '24px',
  marginMobile: '16px',
  marginDesktop: '48px',
  stackSm: '8px',
  stackMd: '24px',
  stackLg: '48px',
} as const;

export const borderRadius = {
  sm: '0.5rem',
  DEFAULT: '1rem',
  md: '1.5rem',
  lg: '2rem',
  xl: '3rem',
  full: '9999px',
} as const;
