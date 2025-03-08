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
            },
            animation: {
                "float-slow": "float-slow 4s ease-in-out infinite",
            },
        },
    },
    darkMode: "class",
    plugins: [heroui()],
};