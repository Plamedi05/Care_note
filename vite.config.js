import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // Use login.html as the main entry point instead of index.html
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'login.html'),
      },
    },
  },
});
