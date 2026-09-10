import tailwindcss from '@tailwindcss/postcss';
import vinext from 'vinext';
import { defineConfig } from 'vite';

// The simulator runs entirely in the browser. No hosted services are required.
export default defineConfig({
  css: { postcss: { plugins: [tailwindcss()] } },
  server: {
    host: '127.0.0.1',
    watch: { useFsEvents: false, usePolling: true },
  },
  plugins: [vinext()],
});
