/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'dr-paul': {
          'blue': '#3B82F6',
          'purple': '#8B5CF6',
          'green': '#10B981',
          'red': '#EF4444',
          'yellow': '#F59E0B',
          'teal': '#14B8A6',
        },
        'chart': {
          'primary': '#3B82F6',
          'secondary': '#8B5CF6',
          'success': '#10B981',
          'warning': '#F59E0B',
          'danger': '#EF4444',
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
      },
      fontFamily: {
        'mono': ['Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
      },
      boxShadow: {
        'glow': '0 0 20px rgba(59, 130, 246, 0.5)',
        'glow-green': '0 0 20px rgba(16, 185, 129, 0.5)',
        'glow-red': '0 0 20px rgba(239, 68, 68, 0.5)',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}