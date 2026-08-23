/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#14161B",
          900: "#1C1F26",
          800: "#262A33",
          700: "#343A47",
          600: "#4A5163",
        },
        paper: {
          50: "#FBFAF7",
          100: "#F7F5F0",
          200: "#ECE8DF",
        },
        scan: {
          DEFAULT: "#4C8BF5",
          dim: "#3A6BC4",
        },
        signal: {
          DEFAULT: "#F5A623",
          dim: "#C9860F",
        },
        muted: "#8B90A0",
      },
      fontFamily: {
        display: ["Source Serif 4", "ui-serif", "Georgia", "serif"],
        body: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      keyframes: {
        scanline: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
        blink: {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.3 },
        },
      },
      animation: {
        scanline: "scanline 1.8s linear infinite",
        blink: "blink 1.2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
