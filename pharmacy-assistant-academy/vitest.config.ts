import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'

export default defineConfig({
    plugins: [vue()],
    test: {
        globals: true,
        environment: 'node',
        setupFiles: ['./src/tests/setup.ts'],
        include: ['src/tests/**/*.test.ts'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: [
                'node_modules/',
                'src/tests/',
                '**/*.d.ts',
                '**/*.config.*',
                '**/mockData',
                'dist/'
            ]
        }
    },
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        }
    }
})
