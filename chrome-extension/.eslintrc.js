// .eslintrc.js

module.exports = {
    extends: [
        'react-app',
        'react-app/jest',
        'plugin:tailwindcss/recommended'
    ],
    plugins: [
        'tailwindcss',
    ],
    rules: {
        'tailwindcss/no-custom-classnames': 'off',
        // 상위 상대경로(../, ../../ 등) 사용 금지
        'no-restricted-imports': [
            'error',
            {
                patterns: [
                    '../*',
                    '../../*',
                    '../../../*',
                    '../../../../*'
                ]
            }
        ]
    }
};