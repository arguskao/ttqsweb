import { fileURLToPath, URL } from 'node:url'

import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueDevTools()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'esbuild',
    reportCompressedSize: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-vue': ['vue', 'vue-router'],
          'vendor-utils': ['axios'],
          admin: [
            './src/views/admin/AnalyticsDashboardView.vue',
            './src/views/admin/InstructorApplicationsView.vue',
            './src/views/admin/TrainingPlansView.vue',
            './src/views/admin/TTQSDashboardView.vue'
          ],
          auth: [
            './src/views/auth/LoginView.vue',
            './src/views/auth/RegisterView.vue',
            './src/services/auth-service-enhanced.ts'
          ],
          courses: [
            './src/views/courses/CoursesView.vue',
            './src/views/courses/CourseDetailView.vue',
            './src/views/courses/LearningProgressView.vue'
          ],
          instructors: [
            './src/views/instructor/InstructorsView.vue',
            './src/views/instructor/InstructorDetailView.vue',
            './src/views/instructor/InstructorProfileView.vue'
          ],
          jobs: [
            './src/views/jobs/JobsView.vue',
            './src/views/jobs/JobDetailView.vue',
            './src/views/jobs/EmployerJobsView.vue'
          ]
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: assetInfo => {
          const info = assetInfo.name?.split('.') || []
          const extType = info[info.length - 1]

          if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(assetInfo.name || '')) {
            return 'assets/images/[name]-[hash].[ext]'
          }

          if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name || '')) {
            return 'assets/fonts/[name]-[hash].[ext]'
          }

          if (extType === 'css') {
            return 'assets/css/[name]-[hash].[ext]'
          }

          return 'assets/[ext]/[name]-[hash].[ext]'
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8788',
        changeOrigin: true,
        rewrite: (path) => path,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        },
      }
    }
  },
  preview: {
    port: 4173,
    host: true
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['vue', 'vue-router', 'axios'],
    exclude: ['@vite/client', '@vite/env']
  },
  // CSS optimization
  css: {
    devSourcemap: false
  }
})
