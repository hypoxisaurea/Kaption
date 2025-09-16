/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#3A86FF',  // 주요 색상
        'secondary': '#2EC4B6', // 보조 색상
        'accent': '#FF8C7A',   // 강조 색상
        'light-beige': '#FAF3E0', // 베이지
        'text-dark': '#6C757D', // 어두운 텍스트 색상
      },
      fontFamily: {
        'spoqa': ['SpoqaHanSansNeo', 'sans-serif'],
        'mash': ['Mash', 'sans-serif'],
      },
    },
  },
  corePlugins: {
    preflight: false,
  },
  plugins: [],
}