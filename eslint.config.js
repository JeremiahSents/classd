// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', '.expo/*', 'functions/lib/*'],
  },
  {
    rules: {
      // React Compiler lints (new in eslint-config-expo 58). The compiler is
      // switched off in this project and these flag existing, working patterns
      // (e.g. prefilling a form in an effect), so they warn instead of fail.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/refs': 'warn',
      // TypeScript already checks namespace members, and this rule can't follow
      // `export *` re-exports of enums (false positive on expo-notifications).
      'import/namespace': 'off',
    },
  },
]);
