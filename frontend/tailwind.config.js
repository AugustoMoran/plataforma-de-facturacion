/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        surface: {
          0: '#ffffff',
          1: '#f8fbff',
          2: '#eef6ff',
          3: '#dbeafe',
          4: '#bfdbfe',
        },
        brand: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '0.85' },
          '50%': { opacity: '1' },
        },
      },
      boxShadow: {
        'glow-sm': '0 0 24px rgba(37,99,235,0.18)',
        'glow-md': '0 0 40px rgba(37,99,235,0.22)',
        'glow-lg': '0 0 80px rgba(37,99,235,0.28)',
        'inner-top': 'inset 0 1px 0 rgba(255,255,255,0.8)',
      },
      backgroundImage: {
        'oso-gradient': 'radial-gradient(circle at 30% 20%, #ffffff 0%, #dbeafe 45%, #2563eb 100%)',
        'oso-panel': 'linear-gradient(135deg, #ffffff 0%, #eff6ff 50%, #dbeafe 100%)',
      },
    },
  },
  plugins: [],
}
