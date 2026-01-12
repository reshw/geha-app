import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // VITE_DISABLE_CONSOLE 환경변수가 'true'일 때만 콘솔 제거 (main 브랜치 전용)
  const shouldDropConsole = process.env.VITE_DISABLE_CONSOLE === 'true'

  return {
    plugins: [react()],
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
