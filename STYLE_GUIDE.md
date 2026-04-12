# Kunda Design System - Landing Page Consistent Styles

## Overview
This guide documents the consistent design system extracted from the landing page to be applied throughout the entire Kunda wedding planning platform.

## Color Palette

### Primary Colors
- **Primary Blue**: `#1a56db` - Main brand color
- **Primary Dark**: `#1e3a8a` - Darker variant for headers and accents
- **Primary Light**: `#3f83f8` - Lighter variant for highlights
- **Primary Accent**: `#93c5fd` - Very light blue for subtle accents

### Neutral Colors
- **White**: `#ffffff` - Pure white
- **Background**: `#f0f4ff` - Light blue background
- **Card Background**: `#ffffff` - White for cards
- **Text Primary**: `#111928` - Main text color
- **Text Secondary**: `#6b7280` - Secondary text color
- **Text Muted**: `#9ca3af` - Muted text color
- **Border**: `#e5edff` - Light border color

### Status Colors
- **Success**: `#057a55` with background `#def7ec`
- **Warning**: `#c27803` with background `#fdf6b2`
- **Danger**: `#c81e1e` with background `#fde8e8`

### Sidebar Colors
- **Sidebar Background**: `#1e3a8a`
- **Sidebar Active**: `#1a56db`
- **Sidebar Text**: `#bfdbfe`
- **Sidebar Muted**: `#93c5fd`

## Typography Scale

### Font Family
- **Primary**: 'Urbanist' (imported from Google Fonts)

### Font Sizes
- **XS**: 11px - Labels, small text
- **SM**: 12px - Small text, captions
- **Base**: 14px - Body text, default
- **LG**: 15px - Slightly larger body text
- **XL**: 16px - Small headings
- **2XL**: 18px - Medium headings
- **3XL**: 20px - Large headings
- **4XL**: 22px - Section titles
- **5XL**: 28px - Page titles
- **6XL**: 36px - Hero text, stats
- **7XL**: 48px - Large hero text
- **8XL**: 60px - Extra large hero text

### Font Weights
- **Light**: 300
- **Normal**: 400
- **Medium**: 500
- **Semibold**: 600
- **Bold**: 700
- **Extrabold**: 800
- **Black**: 900

### Typography Styles

#### Hero Section
- **Hero Title**: 60px, weight 900, Urbanist, white, letter-spacing -0.03em
- **Hero Subtitle**: 18px, weight 400, rgba(255,255,255,0.75)

#### Section Titles
- **Section Title**: 48px, weight 900, Urbanist, text-primary, letter-spacing -0.03em

#### Features
- **Feature Title**: 18px, weight 700, text-primary
- **Feature Description**: 14px, weight 400, text-secondary

#### Navigation
- **Nav Links**: 14px, weight 600, text-secondary
- **Logo**: 22px, weight 800, Urbanist, primary

#### Stats
- **Stat Number**: 36px, weight 800, white, letter-spacing -0.02em
- **Stat Label**: 14px, weight 600, uppercase, primary-accent, letter-spacing 0.06em

#### Contact
- **Contact Label**: 14px, weight 500, text-primary
- **Contact Value**: 14px, weight 400, text-secondary

#### Footer
- **Footer Links**: 14px, weight 400, #64748b
- **Footer Headings**: 14px, weight 700, white

## Border Radius
- **Card**: 12px
- **Button**: 8px
- **Badge**: 6px
- **Pill**: 50px

## Shadows
- **Card Shadow**: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)
- **Hover Shadow**: 0 4px 12px rgba(26,86,219,0.1)
- **Button Hover Shadow**: 0 4px 12px rgba(26,86,219,0.3)

## Spacing Scale
- **XS**: 4px
- **SM**: 8px
- **MD**: 16px
- **LG**: 24px
- **XL**: 32px
- **2XL**: 48px
- **3XL**: 64px

## Implementation

### Centralized Styles File
All design tokens are centralized in `lib/styles.ts` with the following exports:
- `colors` - All color variables
- `typography` - Pre-defined typography styles
- `getStyles()` - Helper function to get typography styles
- `getColor()` - Helper function to get colors
- `fontSizes`, `fontWeights` - Individual font properties

### Usage in Components

```typescript
import { colors, typography, getStyles } from '../lib/styles';

// For colors
const style = { color: colors.primary, backgroundColor: colors.bg };

// For typography
const titleStyle = getStyles('sectionTitle');

// Direct color access
const borderColor = colors.border;
```

### Tailwind Configuration
Updated `tailwind.config.ts` with custom color palette and font sizes to match the landing page:

```typescript
colors: {
  primary: {
    DEFAULT: '#1a56db',
    dark: '#1e3a8a',
    light: '#3f83f8',
    accent: '#93c5fd',
  },
  // ... other colors
}
```

## Application Guidelines

### 1. Dashboard Pages
- Use `colors.textPrimary` for main headings
- Use `colors.textSecondary` for supporting text
- Use `colors.bg` for page backgrounds
- Use `colors.border` for all borders
- Apply consistent typography using `getStyles()` helper

### 2. Navigation
- Logo: `typography.logo` style
- Nav links: `typography.nav` style
- Active state: `colors.primary` color

### 3. Cards and Components
- Background: `colors.bgCard` (white)
- Border: `colors.border`
- Shadow: `shadows.card`
- Hover: `shadows.hover`

### 4. Buttons
- Primary: `colors.primary` background, white text
- Secondary: `colors.border` border, `colors.primary` text
- Hover states with `shadows.buttonHover`

### 5. Forms
- Input borders: `colors.border`
- Focus states: `colors.primary`
- Labels: `typography.textLabel`

## Migration Steps

For each page/component:

1. **Import styles**: `import { colors, typography, getStyles } from '../lib/styles'`
2. **Replace hardcoded colors** with centralized color variables
3. **Apply consistent typography** using `getStyles()` helper
4. **Use semantic color names** (primary, text-primary, etc.)
5. **Test visual consistency** across the application

## Priority Pages for Migration

1. **Landing page** - Already consistent (source of truth)
2. **Dashboard pages** - Admin, Couple, Vendor dashboards
3. **Authentication pages** - Login, Signup
4. **Vendor pages** - Listings, profiles
5. **Settings pages** - User settings, admin settings

## Quality Assurance

- **Visual Consistency**: All pages should match the landing page's visual hierarchy
- **Typography Consistency**: Same font sizes and weights throughout
- **Color Consistency**: Same color palette applied everywhere
- **Spacing Consistency**: Use the spacing scale for consistent layouts
- **Component Consistency**: Similar components should look identical across pages

## Notes

- The Urbanist font is imported globally in `globals.css`
- All CSS custom properties are defined in `globals.css` for fallback
- Tailwind classes are available but centralized styles should be preferred for consistency
- Legacy color variables are maintained for backward compatibility but should be phased out
