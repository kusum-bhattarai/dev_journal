module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'matrix-green': '#008F11',
        'matrix-black': '#000000',
        'matrix-gray': '#1a1a1a',
      },
      spacing: {
        '128': '32rem',
      },
      animation: {
        glitch: 'glitch 1s linear infinite',
        fadeIn: 'fadeIn 0.5s ease-in',
      },
      keyframes: {
        glitch: {
          '2%, 64%': { transform: 'translate(2px, 0) skew(0deg)' },
          '4%, 60%': { transform: 'translate(-2px, 0) skew(0deg)' },
          '62%': { transform: 'translate(0,0) skew(5deg)' },
        },
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
      },
    },
  },
  plugins: [],
};
