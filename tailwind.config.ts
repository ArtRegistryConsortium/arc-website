import { fontFamily } from "tailwindcss/defaultTheme";
import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
	darkMode: ["class"],
	content: ["./src/**/*.{html,js,svelte,ts}"],
	safelist: ["dark"],
	theme: {
		container: {
			center: true,
			padding: "2rem",
			screens: {
				"2xl": "1400px"
			}
		},
		extend: {
			colors: {
				border: "hsl(var(--border) / <alpha-value>)",
				input: "hsl(var(--input) / <alpha-value>)",
				ring: "hsl(var(--ring) / <alpha-value>)",
				background: "hsl(var(--background) / <alpha-value>)",
				foreground: "hsl(var(--foreground) / <alpha-value>)",
				primary: {
					DEFAULT: "hsl(var(--primary) / <alpha-value>)",
					foreground: "hsl(var(--primary-foreground) / <alpha-value>)"
				},
				secondary: {
					DEFAULT: "hsl(var(--secondary) / <alpha-value>)",
					foreground: "hsl(var(--secondary-foreground) / <alpha-value>)"
				},
				destructive: {
					DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
					foreground: "hsl(var(--destructive-foreground) / <alpha-value>)"
				},
				muted: {
					DEFAULT: "hsl(var(--muted) / <alpha-value>)",
					foreground: "hsl(var(--muted-foreground) / <alpha-value>)"
				},
				accent: {
					DEFAULT: "hsl(var(--accent) / <alpha-value>)",
					foreground: "hsl(var(--accent-foreground) / <alpha-value>)"
				},
				popover: {
					DEFAULT: "hsl(var(--popover) / <alpha-value>)",
					foreground: "hsl(var(--popover-foreground) / <alpha-value>)"
				},
				card: {
					DEFAULT: "hsl(var(--card) / <alpha-value>)",
					foreground: "hsl(var(--card-foreground) / <alpha-value>)"
				},
				sidebar: {
					DEFAULT: "hsl(var(--sidebar-background))",
					foreground: "hsl(var(--sidebar-foreground))",
					primary: "hsl(var(--sidebar-primary))",
					"primary-foreground": "hsl(var(--sidebar-primary-foreground))",
					accent: "hsl(var(--sidebar-accent))",
					"accent-foreground": "hsl(var(--sidebar-accent-foreground))",
					border: "hsl(var(--sidebar-border))",
					ring: "hsl(var(--sidebar-ring))",
        		},
			},
			borderRadius: {
				xl: "calc(var(--radius) + 4px)",
				lg: "var(--radius)",
				md: "calc(var(--radius) - 2px)",
				sm: "calc(var(--radius) - 4px)"
			},
			fontFamily: {
				sans: [...fontFamily.sans],
				'dm-sans': ['DM Sans', ...fontFamily.sans],
				'inter': ['Inter', ...fontFamily.sans],
				'space-grotesk': ['Space Grotesk', ...fontFamily.sans],
				'montserrat': ['Montserrat', ...fontFamily.sans],
				'roboto': ['Roboto', ...fontFamily.sans],
				'outfit': ['Outfit', ...fontFamily.sans],
				'bricolage-grotesque': ['Bricolage Grotesque', ...fontFamily.sans],
				'urbanist': ['Urbanist', ...fontFamily.sans],
				'plus-jakarta-sans': ['Plus Jakarta Sans', ...fontFamily.sans],
				'libre-baskerville': ['Libre Baskerville', ...fontFamily.serif],
				'libre-franklin': ['Libre Franklin', ...fontFamily.sans],
				'cormorant': ['Cormorant', ...fontFamily.serif],
				'dm-serif-display': ['DM Serif Display', ...fontFamily.serif]
			},
			keyframes: {
				"accordion-down": {
					from: { height: "0" },
					to: { height: "var(--bits-accordion-content-height)" },
				},
				"accordion-up": {
					from: { height: "var(--bits-accordion-content-height)" },
					to: { height: "0" },
				},
				"caret-blink": {
					"0%,70%,100%": { opacity: "1" },
					"20%,50%": { opacity: "0" },
				},
				"blob": {
					"0%": { transform: "translate(0px, 0px) scale(1)" },
					"33%": { transform: "translate(30px, -50px) scale(1.1)" },
					"66%": { transform: "translate(-20px, 20px) scale(0.9)" },
					"100%": { transform: "translate(0px, 0px) scale(1)" },
				},
				"gradient-slow": {
					"0%": { backgroundPosition: "0% 50%" },
					"50%": { backgroundPosition: "100% 50%" },
					"100%": { backgroundPosition: "0% 50%" },
				},
			},
			animation: {
        		"accordion-down": "accordion-down 0.2s ease-out",
        		"accordion-up": "accordion-up 0.2s ease-out",
       			"caret-blink": "caret-blink 1.25s ease-out infinite",
				"blob": "blob 7s infinite",
				"gradient-slow": "gradient-slow 15s ease infinite",
      		},
		},
	},
	plugins: [
		tailwindcssAnimate,
		function({ addUtilities }) {
			const newUtilities = {
				'.animation-delay-2000': {
					'animation-delay': '2s',
				},
				'.animation-delay-4000': {
					'animation-delay': '4s',
				},
			};
			addUtilities(newUtilities);
		},
	],
};

export default config;
