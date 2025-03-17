import { heroui } from "@heroui/theme"

/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./index.html",
        "./src/layouts/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
        // single component styles
        "./node_modules/@heroui/theme/dist/components/button.js",
        // or you can use a glob pattern (multiple component styles)
        "./node_modules/@heroui/theme/dist/components/(button|snippet|code|input).js",
    ],
    theme: {
        extend: {
            keyframes: {
                "float-slow": {
                    "0%, 100%": { transform: "translateY(0)" },
                    "50%": { transform: "translateY(-15px)" },
                },
                slideDown: {
                    "0%": {
                        transform: "translateY(-100%)",
                        opacity: "0",
                    },
                    "100%": {
                        transform: "translateY(0)",
                        opacity: "1",
                    },
                },
            },
            animation: {
                "float-slow": "float-slow 4s ease-in-out infinite",
                slideDown: "slideDown 0.5s ease-out forwards",
            },
            backgroundImage: {
                "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
                "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
            },
        },
    },
    darkMode: "class",
    plugins: [
        heroui({
            themes: {
                light: {
                    colors: {
                        background: "#FFFFFF",
                        codeBackground: "#FFFFFF",
                        content2: "#f4f4f5",
                        content3: "#e4e4e7",
                        content4: "#d4d4d8",
                    },
                },
                dark: {
                    colors: {
                        background: "#000000",
                        codeBackground: "#1E1E1E",
                        content2: "#2D2D2D",
                        content3: "#3D3D3D",
                        content4: "#4D4D4D",
                    },
                },
            },
        }),
    ],
};