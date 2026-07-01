/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ide: {
          bg: '#04070D',
          panel: 'rgba(15,20,35,.65)',
          border: 'rgba(0,255,255,.12)',
          accent: '#00F5FF',
          accentHover: '#0099FF',
          fg: '#ffffff',
          fgMuted: '#6e7681',
        },
        scifi: {
          cyan: '#00F5FF',
          blue: '#0099FF',
          purple: '#7B61FF',
          magenta: '#FF4DFF',
          green: '#00FFA3',
          warning: '#FFB547',
          danger: '#FF3E6C',
          glass: 'rgba(15,20,35,.65)',
        }
      }
    },
  },
  plugins: [],
}
