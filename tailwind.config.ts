import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        cream: "#FFFDF1",
        bark: "#562F00",
        leaf: "#426B36",
        honey: "#FF9644",
        peach: "#FFCE99",
        pollen: "#FFD85A",
      },
      fontFamily: {
        body: ["var(--font-noto-sans)", "var(--font-shippori-antique)", "sans-serif"],
        hand: ["var(--font-klee-one)", "var(--font-shippori-antique)", "sans-serif"],
        mincho: ["var(--font-shippori-mincho)", "serif"],
        sans: ["var(--font-noto-sans)", "sans-serif"],
      },
      boxShadow: {
        paper: "0 12px 35px rgba(86, 47, 0, .10), 0 2px 7px rgba(86, 47, 0, .08)",
      },
      animation: {
        float: "float 5s ease-in-out infinite",
        "bee-wing": "bee-wing .08s linear infinite alternate",
      },
      keyframes: {
        float: { "0%, 100%": { transform: "translateY(0) rotate(-2deg)" }, "50%": { transform: "translateY(-12px) rotate(2deg)" } },
        "bee-wing": { to: { transform: "rotateX(68deg) rotateZ(25deg)" } },
      },
    },
  },
  plugins: [],
};

export default config;
