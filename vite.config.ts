import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig(({ command, mode }) => ({
  plugins: [
    react(),
    dts({
      insertTypesEntry: true,
    })
  ],
  define: {
    __DEV__: JSON.stringify(command === 'serve' || mode === 'development'),
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'NMEAWidgets',
      fileName: 'index',
      formats: ['es']
    },
    sourcemap: true,
    minify: mode === 'production',
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'tailwindcss'
      ],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'ReactJSXRuntime',
          tailwindcss: 'Tailwindcss'
        }
      }
    }
  }
}));