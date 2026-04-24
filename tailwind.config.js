/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#202124',
        cloud: '#f6f8fb',
        mint: '#1f9d7a',
        coral: '#ef6f5e',
        lemon: '#f6c85f',
      },
      boxShadow: {
        soft: '0 18px 50px rgba(32, 33, 36, 0.08)',
      },
    },
  },
  plugins: [],
};
