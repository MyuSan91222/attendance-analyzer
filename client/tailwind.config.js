/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        display: ['Syne', 'sans-serif'],
      },
      colors: {
        ink: {
          50:  '#091828',
          100: '#0c1c2e',
          200: '#122839',
          300: '#183344',
          400: '#1b3d52',
          500: '#1f4760',
          600: '#24536e',
          700: '#c8d3dc',
          800: '#e4eaf0',
          900: '#f5f7fa',
          950: '#ffffff',
        },
        accent: {
          DEFAULT: '#3d7a90',
          hover: '#2f6a7f',
          dark: '#235d72',
        },
        success: '#166534',
        warning: '#92400e',
        danger:  '#991b1b',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        slideInRight: { from: { opacity: 0, transform: 'translateX(20px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
      },
    },
  },
  plugins: [],
};
