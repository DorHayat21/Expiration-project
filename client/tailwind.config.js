/** @type {import('tailwindcss').Config} */
export default {
  content: [
    // CRITICAL: Tells Tailwind to scan all HTML and React components for utility classes
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", 
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}