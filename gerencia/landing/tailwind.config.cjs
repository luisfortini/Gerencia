module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          navy: '#1F254B',
          navyDark: '#11152B',
          navyDarker: '#0D0F1E',
          silver: '#ABABAE',
          silverLight: '#CFCFD2',
          accent: '#38406D',
        },
      },
    },
  },
  plugins: [],
};
