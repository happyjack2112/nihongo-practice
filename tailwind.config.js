/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#FAF7F0",
        surface: "#FFFFFF",
        sage: { DEFAULT: "#6B7F66", dark: "#4A5C46", soft: "#E7ECE3" },
        beige: "#F0E9DA",
        accentRed: { DEFAULT: "#C1443C", soft: "#F6E3E1" },
        ink: "#2B2A26",
        muted: "#7A756C",
        line: "#E4DFD2",
      },
      fontFamily: {
        voice: ["'Shippori Mincho'", "serif"],
        ui: ["'Inter'", "sans-serif"],
      },
    },
  },
  plugins: [],
};
