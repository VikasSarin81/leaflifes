import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        parchment: "#F7F3E7",
        ink: "#1F2B1D",
        moss: {
          DEFAULT: "#35492E",
          light: "#4A6140",
          dark: "#233021",
        },
        turmeric: "#C17A2E",
        clay: "#8B4A3B",
        line: "#DCD3B8",
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      maxWidth: {
        prose: "68ch",
      },
    },
  },
  plugins: [typography],
};

export default config;
