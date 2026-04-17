import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Wedding Design System Colors
        primary: {
          DEFAULT: '#4B47A5',  // Dark Purple for cards
          dark: '#3D3A8C',     // Deep Indigo/Purple
          light: '#6B6BC7',    // Lighter Purple
          accent: '#E8EAFF',   // Soft Lavender
          hover: '#5A56B5',    // Hover state
        },
        accent: {
          DEFAULT: '#F5A623',  // Golden-Yellow for CTAs
          dark: '#F8A800',     // Alternative Gold
          light: '#FFEAA7',    // Light Amber
        },
        heading: {
          DEFAULT: '#1A1A4E',  // Dark Navy for headings
          dark: '#2B2870',     // Alternative Navy
        },
        background: {
          DEFAULT: '#E8EAFF',  // Soft Lavender page background
          card: '#4B47A5',     // Dark Purple card background
          progress: '#E5E7EB', // Light gray progress bar background
        },
        text: {
          primary: '#FFFFFF',   // White text on dark backgrounds
          secondary: '#E8EAFF', // Soft Lavender text
          muted: '#B8B5D1',    // Muted purple text
          heading: '#1A1A4E',   // Dark Navy headings
        },
        border: {
          DEFAULT: '#D1D0E8',  // Soft light purple borders
          card: '#6B6BC7',     // Purple card borders
        },
        // Status Colors
        success: {
          DEFAULT: '#4CAF50',  // Light Green for checkmarks
          bg: '#E8F5E8',       // Light green background
        },
        warning: {
          DEFAULT: '#F5A623',  // Orange-Yellow for progress
          bg: '#FFF4E6',       // Light orange background
        },
        danger: {
          DEFAULT: '#E74C3C',  // Red for hearts/errors
          bg: '#FDEDEC',       // Light red background
        },
        // Legacy support
        foreground: "var(--foreground)"
      },
      fontFamily: {
        // Wedding Design System Fonts
        'playfair': ['Playfair Display', 'serif'],  // Bold serif for headings
        'poppins': ['Poppins', 'sans-serif'],        // Clean sans-serif for body
        'urbanist': ['Urbanist', 'sans-serif'],     // Legacy support
        'heading': ['Playfair Display', 'serif'],   // Main heading font
        'body': ['Poppins', 'sans-serif'],          // Body text font
      },
      fontSize: {
        'xs': ['11px', { lineHeight: '1.5' }],
        'sm': ['12px', { lineHeight: '1.5' }],
        'base': ['14px', { lineHeight: '1.6' }],
        'lg': ['15px', { lineHeight: '1.6' }],
        'xl': ['16px', { lineHeight: '1.5' }],
        '2xl': ['18px', { lineHeight: '1.4' }],
        '3xl': ['20px', { lineHeight: '1.3' }],
        '4xl': ['22px', { lineHeight: '1.2' }],
        '5xl': ['28px', { lineHeight: '1.2' }],
        '6xl': ['36px', { lineHeight: '1.15' }],
        '7xl': ['48px', { lineHeight: '1.1' }],
        '8xl': ['60px', { lineHeight: '1.1' }],
      },
      fontWeight: {
        'light': '300',
        'normal': '400',
        'medium': '500',
        'semibold': '600',
        'bold': '700',
        'extrabold': '800',
        'black': '900',
      },
      borderRadius: {
        'card': '12px',
        'btn': '8px',
        'badge': '6px',
        'pill': '50px',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
        'hover': '0 4px 12px rgba(26,86,219,0.1)',
        'button-hover': '0 4px 12px rgba(26,86,219,0.3)',
      },
    },
  },
  plugins: [],
};
export default config;
