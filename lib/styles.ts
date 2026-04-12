/**
 * Centralized Design System - Landing Page Consistent
 * All font sizes, weights, and colors based on landing page analysis
 */

// Color Palette - Landing Page Consistent
export const colors = {
  // Primary Colors
  primary: '#1a56db',
  primaryDark: '#1e3a8a',
  primaryLight: '#3f83f8',
  primaryAccent: '#93c5fd',
  primaryHover: '#2563eb',
  
  // Neutral Colors
  white: '#ffffff',
  bg: '#f0f4ff',
  bgCard: '#ffffff',
  textPrimary: '#111928',
  textSecondary: '#6b7280',
  textMuted: '#9ca3af',
  border: '#e5edff',
  
  // Status Colors
  success: '#057a55',
  successBg: '#def7ec',
  warning: '#c27803',
  warningBg: '#fdf6b2',
  danger: '#c81e1e',
  dangerBg: '#fde8e8',
  
  // Sidebar Colors
  sidebarBg: '#1e3a8a',
  sidebarActive: '#1a56db',
  sidebarText: '#bfdbfe',
  sidebarMuted: '#93c5fd',
  
  // Legacy Support
  accent: '#3f83f8',
  primaryLightLegacy: '#ebf5ff',
  primaryDarkLegacy: '#1e429f',
} as const

// Font Sizes - Landing Page Based
export const fontSizes = {
  xs: '11px',
  sm: '12px',
  base: '14px',
  lg: '15px',
  xl: '16px',
  '2xl': '18px',
  '3xl': '20px',
  '4xl': '22px',
  '5xl': '28px',
  '6xl': '36px',
  '7xl': '48px',
  '8xl': '60px',
} as const

// Font Weights
export const fontWeights = {
  light: 300,
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
  black: 900,
} as const

// Typography Styles - Landing Page Consistent
export const typography = {
  // Hero Section
  hero: {
    fontSize: fontSizes['8xl'],
    fontWeight: fontWeights.black,
    fontFamily: 'Urbanist',
    color: colors.white,
    letterSpacing: '-0.03em',
    lineHeight: '1.1',
  },
  heroSubtitle: {
    fontSize: fontSizes['2xl'],
    fontWeight: fontWeights.normal,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: '1.6',
  },
  
  // Section Titles
  sectionTitle: {
    fontSize: fontSizes['7xl'],
    fontWeight: fontWeights.black,
    fontFamily: 'Urbanist',
    color: colors.textPrimary,
    letterSpacing: '-0.03em',
    lineHeight: '1.1',
  },
  
  // Feature Cards
  featureTitle: {
    fontSize: fontSizes['2xl'],
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    lineHeight: '1.4',
  },
  featureDesc: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.normal,
    color: colors.textSecondary,
    lineHeight: '1.6',
  },
  
  // Stats
  statNumber: {
    fontSize: fontSizes['6xl'],
    fontWeight: fontWeights.extrabold,
    color: colors.white,
    letterSpacing: '-0.02em',
    lineHeight: '1',
  },
  statLabel: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semibold,
    color: colors.primaryAccent,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  
  // Navigation
  nav: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semibold,
    color: colors.textSecondary,
  },
  logo: {
    fontSize: fontSizes['4xl'],
    fontWeight: fontWeights.extrabold,
    fontFamily: 'Urbanist',
    color: colors.primary,
  },
  
  // Testimonials
  testimonial: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.normal,
    color: '#374151',
    fontStyle: 'italic',
  },
  
  // Contact
  contactLabel: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.medium,
    color: colors.textPrimary,
  },
  contactValue: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.normal,
    color: colors.textSecondary,
  },
  
  // Footer
  footerLink: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.normal,
    color: '#64748b',
  },
  footerHeading: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.bold,
    color: colors.white,
  },
  
  // Categories
  category: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    color: colors.primaryDark,
  },
  
  // Countdown
  countdown: {
    fontSize: fontSizes['2xl'],
    fontWeight: fontWeights.bold,
    color: colors.white,
  },
  countdownLabel: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.normal,
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
  },
} as const

// Border Radius
export const borderRadius = {
  card: '12px',
  btn: '8px',
  badge: '6px',
  pill: '50px',
} as const

// Shadows
export const shadows = {
  card: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
  hover: '0 4px 12px rgba(26,86,219,0.1)',
  buttonHover: '0 4px 12px rgba(26,86,219,0.3)',
} as const

// Spacing
export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  '2xl': '48px',
  '3xl': '64px',
} as const

// Utility function to get CSS styles object
export const getStyles = (styleType: keyof typeof typography) => typography[styleType]

// Utility function to get color
export const getColor = (colorName: keyof typeof colors) => colors[colorName]

// Utility function to get font size
export const getFontSize = (sizeName: keyof typeof fontSizes) => fontSizes[sizeName]

// Utility function to get font weight
export const getFontWeight = (weightName: keyof typeof fontWeights) => fontWeights[weightName]
