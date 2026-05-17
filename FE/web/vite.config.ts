import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiProxyTarget = env.VITE_DEV_API_PROXY_TARGET?.trim()
  const apiProxyOrigin = env.VITE_DEV_API_PROXY_ORIGIN?.trim()

  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      allowedHosts: [
        '10.0.2.2',
        '127.0.0.1',
        'localhost',
        '.trycloudflare.com',
        '.ngrok-free.app',
      ],
      proxy: apiProxyTarget
        ? {
            '/api': {
              target: apiProxyTarget,
              changeOrigin: true,
              configure: apiProxyOrigin
                ? (proxy) => {
                    proxy.on('proxyReq', (proxyReq) => {
                      proxyReq.setHeader('Origin', apiProxyOrigin)
                    })
                  }
                : undefined,
              rewrite: (path) => path.replace(/^\/api/, ''),
            },
          }
        : undefined,
    },
  }
})
