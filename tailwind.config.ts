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
        // Landing Page Colors
        primary: {
          DEFAULT: '#1a56db',
          dark: '#1e3a8a',
          light: '#3f83f8',
          accent: '#93c5fd',
          hover: '#2563eb',
        },
        neutral: {
          white: '#ffffff',
          50: '#f0f4ff',
          100: '#e5edff',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#64748b',
          500: '#475569',
          600: '#334155',
          700: '#1e293b',
          800: '#0f172a',
          900: '#020617',
        },
        text: {
          primary: '#111928',
          secondary: '#6b7280',
          muted: '#9ca3af',
        },
        backgroundColor: {
          primary: '#f0f4ff',
          card: '#ffffff',
          sidebar: '#1e3a8a',
        },
        border: '#e5edff',
        // Status Colors
        success: {
          DEFAULT: '#057a55',
          bg: '#def7ec',
        },
        warning: {
          WARNING: '#c27803',
          bg: '#fdf6b2',
        },
        danger: {
          DANGER: '#c81e1e',
          bg: '#fde8e8',
        },
        // Legacy support
        background: "var(--background)",
        foreground: "var(--foreground)"
      },
      fontFamily: {
        urbanist: ['Urbanist', 'sans-serif'],
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
