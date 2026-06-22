/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        dark: {
          950: "#09090b", // Deepest black-zinc
          900: "#0e0e11", // Sleek dark panel
          850: "#141419", // Dark card
          800: "#1b1b22", // Border / highlight dark
          700: "#2d2d3a", // Light borders
          600: "#52526b", // Muted text
          500: "#71718a", // Secondary text
        },
        brand: {
          50: "#f3f0ff",
          100: "#e9e3ff",
          200: "#d5caff",
          300: "#b5a3ff",
          400: "#9170ff",
          500: "#7047eb", // Premium brand violet
          600: "#5a31cf",
          700: "#4825ab",
          800: "#371b87",
          900: "#24105c",
        }
      },
      fontFamily: {
        sans: ["Outfit", "Inter", "sans-serif"],
        mono: ["Fira Code", "JetBrains Mono", "monospace"],
      },
      backgroundImage: {
        "grid-pattern": "linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)",
      },
      animation: {
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in-up": "fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "shimmer": "shimmer 2s infinite linear",
      },
      keyframes: {
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        }
      }
    },
  },
  plugins: [],
}
