module.exports = {
  plugins: [
    require('postcss-flexbugs-fixes'),
    require('postcss-preset-env')({
      stage: 3,
      features: {
        'custom-properties': false,
      },
    }),
    require('tailwindcss'),
    require('autoprefixer'),
  ],
};
