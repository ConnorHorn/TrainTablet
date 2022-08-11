module.exports = {
  daisyui: {
    themes: [
      //  DaisyUI Theme manager
      "corporate"
    ],
  },
  content: ['./public/index.html', './src/**/*.svelte'],
  plugins: [require('daisyui')],
};
