/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Adicionei a cor oficial da F1 para facilitar o uso no código
      colors: {
        f1red: '#FF001D',
      }
    },
  },
  plugins: [],
}