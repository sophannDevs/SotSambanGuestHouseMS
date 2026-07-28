import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-bg))",
          foreground: "hsl(var(--sidebar-fg))",
          active: "hsl(var(--sidebar-active))",
          activeFg: "hsl(var(--sidebar-active-fg))",
          hover: "hsl(var(--sidebar-hover))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "var(--font-khmer)",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      ringWidth: {
        3: "3px",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    // shadcn/ui's current component templates target Tailwind v4's built-in
    // `data-open`/`data-closed`/etc. custom variants (mapped from Radix's real
    // `data-state`/`data-orientation` attributes). Tailwind v3 has no such
    // mapping built in, so it's added once here rather than per component.
    plugin(({ addVariant }) => {
      addVariant("data-open", '&[data-state="open"]');
      addVariant("data-closed", '&[data-state="closed"]');
      addVariant("data-checked", '&[data-state="checked"]');
      addVariant("data-unchecked", '&[data-state="unchecked"]');
      addVariant("data-active", '&[data-state="active"]');
      addVariant("data-selected", '&[data-selected="true"]');
      addVariant("data-disabled", '&[data-disabled="true"]');
      addVariant("data-horizontal", '&[data-orientation="horizontal"]');
      addVariant("data-vertical", '&[data-orientation="vertical"]');
    }),
  ],
};

export default config;
