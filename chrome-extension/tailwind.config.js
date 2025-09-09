/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // 'SpoqaHanSansNeo' 폰트와 'Mash' 폰트를 유틸리티 클래스로 추가
        'spoqa': ['SpoqaHanSansNeo', 'sans-serif'],
        'mash': ['Mash', 'sans-serif'],
      },
    },
  },
  plugins: [],
}