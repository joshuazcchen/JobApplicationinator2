import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  eslint.configs.recommended,

  ...tseslint.configs.recommended,
  prettier,

  {
    rules: {
      'no-console': 'off',

      '@typescript-eslint/no-explicit-any': 'warn',

      '@typescript-eslint/no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      }],

      '@typescript-eslint/explicit-function-return-type': 'off',

      '@typescript-eslint/no-require-imports': 'off',
    },
  },

  {
    ignores: ['dist/**', 'release/**', 'node_modules/**', 'scripts/**'],
  },
);
