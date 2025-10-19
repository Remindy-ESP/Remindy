import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';

export default [
    {
        ignores: [
            'node_modules/**',
            'ios/**',
            'android/**',
            '.expo/**',
            '**/*.d.ts',
        ],
    },
    {
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
            parser: tsParser,
            ecmaVersion: 2020,
            sourceType: 'module',
            parserOptions: {
                ecmaFeatures: {
                    jsx: true,
                },
            },
            globals: {
                __DEV__: 'readonly',
                console: 'readonly',
                require: 'readonly',
                module: 'readonly',
                process: 'readonly',
            },
        },
        plugins: {
            '@typescript-eslint': tsPlugin,
        },
        rules: {
            '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
            'no-console': 'off',
            'prefer-const': 'error',
        },
    },
    {
        files: ['**/*.{js,jsx}'],
        languageOptions: {
            ecmaVersion: 2020,
            sourceType: 'module',
            parserOptions: {
                ecmaFeatures: {
                    jsx: true,
                },
            },
            globals: {
                __DEV__: 'readonly',
                console: 'readonly',
                require: 'readonly',
                module: 'readonly',
                process: 'readonly',
            },
        },
        rules: {
            'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
            'no-console': 'off',
            'prefer-const': 'error',
        },
    },
    // Configuration spécifique pour les fichiers de tests
    {
        files: ['**/*.spec.ts', '**/*.test.ts', '**/*.spec.tsx', '**/*.test.tsx', '__tests__/**/*.{ts,tsx}'],
        rules: {
            '@typescript-eslint/no-unsafe-assignment': 'off',
            '@typescript-eslint/no-unsafe-member-access': 'off',
            '@typescript-eslint/no-unsafe-call': 'off',
            '@typescript-eslint/no-unsafe-return': 'off',
            '@typescript-eslint/no-unsafe-argument': 'off',
            '@typescript-eslint/unbound-method': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-unused-vars': 'off',
            'no-console': 'off',
        },
    },
];