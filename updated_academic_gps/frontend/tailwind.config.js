/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ficus: {
          plum: "#4b2c42",
          forest: "#2d4330",
          coral: "#d98b82",
          cream: "#f5e8d3",
          lilac: "#c8a8c8"
        }
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(255,255,255,0.06), 0 22px 60px rgba(75, 44, 66, 0.24)",
        bubble: "0 10px 40px rgba(45, 67, 48, 0.36)"
      },
      backgroundImage: {
        "ficus-gradient": "radial-gradient(circle at top left, rgba(217,139,130,0.18), transparent 25%), radial-gradient(circle at top right, rgba(200,168,200,0.16), transparent 30%), radial-gradient(circle at bottom, rgba(45,67,48,0.14), transparent 28%)"
      }
    }
  },
  plugins: []
};
