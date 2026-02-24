/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./contexts/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#007bff",
        secondary: "#28a745",
        accent: "#ffc107",
        background: "#e8f0e8",
        foreground: "#212529",
        muted: "#6c757d",
        danger: "#dc3545",
        border: "#dee2e6",
      },
      fontFamily: {
        sans: ["System"],
      },
    },
  },
  plugins: [],
};
