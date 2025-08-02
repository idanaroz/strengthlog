import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  base: './',

  // Build configuration
  build: {
    target: 'esnext',
    outDir: 'dist',
    sourcemap: true,
    minify: 'esbuild',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
      output: {
        manualChunks: {
          vendor: ['chart.js', 'date-fns'],
          core: ['./src/core/DataManager.ts', './src/core/AnalyticsEngine.ts'],
          components: ['./src/components/ProgressionChart.ts', './src/components/WorkoutForm.ts']
        }
      }
    }
  },

  // Development server
  server: {
    port: 3000,
    host: true,
    open: true
  },

  // TypeScript support
  esbuild: {
    target: 'esnext'
  },

  // PWA and service worker
  plugins: [
    {
      name: 'sw-dev',
      configureServer(server) {
        server.middlewares.use('/service-worker.js', (req, res, next) => {
          if (process.env.NODE_ENV === 'development') {
            res.setHeader('Content-Type', 'application/javascript');
            res.end(`
              // Development service worker stub
              console.log('🔧 Development mode - Service Worker disabled');
              self.addEventListener('install', () => self.skipWaiting());
              self.addEventListener('activate', () => self.clients.claim());
            `);
          } else {
            next();
          }
        });
      }
    }
  ],

  // Optimization
  optimizeDeps: {
    include: ['chart.js', 'date-fns', 'idb']
  },

  // Path resolution
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@core': resolve(__dirname, 'src/core'),
      '@types': resolve(__dirname, 'src/types')
    }
  }
});