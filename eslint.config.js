// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', 'build/*', 'android/*', 'ios/*', '.expo/*'],
  },
  {
    // Les scripts d'outillage tournent sous Node, pas dans React Native :
    // sans ça, ESLint signale `Buffer` et `__dirname` comme indéfinis.
    files: ['scripts/**/*.js', '*.config.js', 'public/sw.js'],
    languageOptions: {
      globals: {
        __dirname: 'readonly',
        Buffer: 'readonly',
        console: 'readonly',
        module: 'writable',
        process: 'readonly',
        require: 'readonly',
        // Contexte du service worker.
        self: 'readonly',
        caches: 'readonly',
        fetch: 'readonly',
        Response: 'readonly',
        URL: 'readonly',
      },
    },
  },
]);
