import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Amplify libraries expect a global object in the browser.
  define: { global: 'globalThis' },
});
