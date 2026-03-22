/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef2f7",
          100: "#dfe7f0",
          200: "#c8d4e2",
          500: "#475569",
          700: "#334155",
        },
      }
    }
  },
  plugins: [],
};
