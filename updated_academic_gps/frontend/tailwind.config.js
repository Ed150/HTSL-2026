/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        midnight: "#07111f",
        glow: {
          blue: "#5ea4ff",
          teal: "#5ff3d5",
          pink: "#ff6fd8",
          violet: "#857bff"
        }
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(255,255,255,0.06), 0 22px 60px rgba(30, 64, 175, 0.24)",
        bubble: "0 10px 40px rgba(15, 23, 42, 0.36)"
      },
      backgroundImage: {
        "aurora": "radial-gradient(circle at top left, rgba(94,164,255,0.18), transparent 25%), radial-gradient(circle at top right, rgba(255,111,216,0.16), transparent 30%), radial-gradient(circle at bottom, rgba(95,243,213,0.14), transparent 28%)"
      }
    }
  },
  plugins: []
};
