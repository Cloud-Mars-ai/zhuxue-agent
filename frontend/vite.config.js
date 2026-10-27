import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import { viteSingleFile } from 'vite-plugin-singlefile'

// https://vite.dev/config/

/**
 * 两种构建模式
 *   npm run build          常规构建 → dist/，多文件，交给 Nginx 部署
 *   npm run build:offline  离线构建 → dist-offline/，单个 HTML，双击即可演示
 *
 * mode 为 offline 时启用单文件内联：JS/CSS 全部塞进 index.html，
 * 规避 file:// 协议下 ES Module 被 CORS 拦截导致白屏的问题。
 */
export default defineConfig(({ mode }) => {
  const isOffline = mode === 'offline'

  return {
    plugins: [vue(), ...(isOffline ? [viteSingleFile()] : [])],
    // 相对路径：产物既能由 Nginx 部署，也能直接双击打开
    base: './',
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      host: '0.0.0.0',
      // 公网部署时端口由沙箱注入 PORT 环境变量
      port: Number(process.env.PORT) || 5173,
      // 公网部署时请求经反向代理域名进来，需放行代理主机
      allowedHosts: true,
      // 手机连同一局域网时可用 http://<本机IP>:5173/m/ 访问 H5 端
      proxy: {
        // 前端所有请求走 /api 前缀，由 Vite 转发到 FastAPI，避免跨域
        '/api': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true,
        },
      },
    },
    preview: {
      // 公网部署：预览服务监听 $PORT 并放行反向代理域名（否则 Vite 报 Blocked request）
      host: '0.0.0.0',
      port: Number(process.env.PORT) || 4173,
      allowedHosts: true,
    },
    build: {
      outDir: isOffline ? 'dist-offline' : 'dist',
      sourcemap: false,
      ...(isOffline
        ? {
            // 单文件模式：禁止分包，把动态导入也一并内联
            assetsInlineLimit: 100000000,
            chunkSizeWarningLimit: 100000000,
            cssCodeSplit: false,
            rollupOptions: {
              output: {
                inlineDynamicImports: true,
              },
            },
          }
        : {}),
    },
  }
})
