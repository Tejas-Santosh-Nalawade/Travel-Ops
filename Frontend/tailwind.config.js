/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./component/**/*.{js,jsx,ts,tsx}", "./screens/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#2beede",
        "background-light": "#f6f8f8",
        "background-dark": "#102220",
        secondary: {
          light: "#A855F7", // Purple 500
          DEFAULT: "#9333EA", // Purple 600
          dark: "#7E22CE",   // Purple 700
        },
        health: {
          light: "#22C55E", // Green 500
          DEFAULT: "#16A34A", // Green 600
          dark: "#15803D",   // Green 700
        },
        background: "#F9FAFB", // light background
        card: "#FFFFFF",       // card background
        text: {
          primary: "#111827",  // headings
          secondary: "#374151", // body text
          muted: "#6B7280",    // lighter gray
        },
        accent: {
          yellow: "#FACC15",
          red: "#EF4444",
          cyan: "#06B6D4",
        },
      },
      fontFamily: {
        display: ["Manrope", "sans-serif"],
        heading: ["Poppins-Bold"],
        body: ["Inter-Regular"],
        medium: ["Inter-Medium"],
      },
      borderRadius: {
        DEFAULT: "1rem",
        lg: "2rem",
        xl: "3rem",
        full: "9999px",
      },
    },
  },
  plugins: [],
}