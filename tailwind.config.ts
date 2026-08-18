import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Cores dinâmicas do estabelecimento, aplicadas via CSS vars
        // (ver lib/theme/applyTheme.ts). Fallback = emerald, igual ao mock.
        primaria: "var(--cor-primaria, #047857)",
        secundaria: "var(--cor-secundaria, #ecfdf5)",
      },
    },
  },
  plugins: [],
};

export default config;
