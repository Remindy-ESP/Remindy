import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import react from 'eslint-plugin-react';
import reactNative from 'eslint-plugin-react-native';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default [
    {
        ignores: ['node_modules/**', 'ios/**', 'android/**', '.expo/**'],
    },

    {
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
            globals: {
                ...globals.browser,
                __DEV__: 'readonly',
            },
            parser: tsparser,
            parserOptions: {
                ecmaFeatures: { jsx: true },
                sourceType: 'module',
            },
        },
        plugins: {
            '@typescript-eslint': tseslint,
            'react': react,
            'react-hooks': reactHooks,
            'react-native': reactNative,
            'prettier': prettier,
        },
        settings: {
            react: { version: 'detect' },
        },
        rules: {
            ...js.configs.recommended.rules,

            '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
            '@typescript-eslint/no-explicit-any': 'warn',

            'react/react-in-jsx-scope': 'off',
            'react/prop-types': 'off',

            ...reactHooks.configs.recommended.rules,

            'react-native/no-unused-styles': 'error',
            'react-native/no-inline-styles': 'warn',
            'react-native/no-raw-text': 'error',

            'no-console': 'off',
            'prefer-const': 'error',

            'prettier/prettier': 'error',
        },
    },

    prettierConfig,
];