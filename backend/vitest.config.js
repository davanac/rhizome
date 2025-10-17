import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.js'],
    testTimeout: 10000,
    hookTimeout: 10000,
    exclude: [
      'node_modules/**',
      'src/web3/test/**',
      'src/web3/**/*.test.js'
    ],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/web3/',
        'tests/',
        '**/*.test.js',
        '**/*.spec.js'
      ]
    }
  },
  resolve: {
    alias: {
      '#src': resolve(__dirname, './src'),
      '#routes': resolve(__dirname, './src/routes'),
      '#services': resolve(__dirname, './src/services'),
      '#controllers': resolve(__dirname, './src/controllers'),
      '#utils': resolve(__dirname, './src/utils'),
      '#database': resolve(__dirname, './src/database'),
      '#middleware': resolve(__dirname, './src/middleware'),
      '#config': resolve(__dirname, './src/config/config.js')
    }
  }
});