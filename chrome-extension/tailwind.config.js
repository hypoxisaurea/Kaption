/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 실제 사용되는 커스텀 색상들
        'dark-bg': '#1b1b1b',     // 메인 배경색
        'light-gray': '#cccccc',   // 연한 회색 텍스트
        'card-bg': '#f4f4f4',      // 카드 배경색
        'hint-bg': '#f9fafb',      // 힌트 배경색
        'secondary': '#2EC4B6',    // 보조 색상 (실제 사용됨)
        'text-dark': '#6C757D',    // 어두운 텍스트 색상 (실제 사용됨)
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