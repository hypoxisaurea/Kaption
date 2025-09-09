// .eslintrc.js

module.exports = {
    extends: [
        // 프로젝트의 기본 ESLint 설정
        // 예: 'react-app'
    ],
    plugins: [
        'tailwindcss',
    ],
    rules: {
        // Tailwind CSS 규칙을 비활성화하거나 수정할 수 있습니다.
        // 예를 들어, 아래와 같이 설정하면 ESLint가 @tailwind를 무시합니다.
        'tailwindcss/no-custom-classnames': 'off',
    },
};