import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    // Keep stable asset names so manifest.json / sw.js cache paths stay valid.
    rollupOptions: {
      output: {
        entryFileNames: 'assets/calculator.js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: (assetInfo) =>
          assetInfo.name && assetInfo.name.endsWith('.css')
            ? 'assets/theme.css'
            : 'assets/[name]-[hash][extname]'
      }
    }
  }
});
