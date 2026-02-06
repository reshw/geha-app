import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // VITE_DISABLE_CONSOLE 환경변수가 'true'일 때만 콘솔 제거 (main 브랜치 전용)
  const shouldDropConsole = process.env.VITE_DISABLE_CONSOLE === 'true'

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        manifest: false, // public/manifest.json 사용
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // 1년
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'cdn-cache',
                expiration: {
                  maxEntries: 20,
                  maxAgeSeconds: 60 * 60 * 24 * 30 // 30일
                }
              }
            },
            {
              urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'firestore-cache',
                networkTimeoutSeconds: 10,
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 5 // 5분
                }
              }
            }
          ]
        },
        devOptions: {
          enabled: false // 개발 중에는 비활성화
        }
      })
    ],
    server: {
      host: '0.0.0.0', // 모든 네트워크 인터페이스에서 접속 가능
      port: 5173,
    },
    css: {
      postcss: './postcss.config.js',
    },
    esbuild: shouldDropConsole ? {
      // main 브랜치에서만 console과 debugger 제거
      drop: ['console', 'debugger'],
    } : {}
  }
})
