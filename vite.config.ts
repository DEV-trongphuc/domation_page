import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { ragChatApiPlugin } from './lib/viteChatMiddleware'
import { autodataBridgePlugin } from './lib/viteAutodataMiddleware'
import { seoPrerenderPlugin } from './lib/viteSeoPrerenderPlugin'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(),
      ragChatApiPlugin(env.GEMINI_API_KEY),
      autodataBridgePlugin(env.AUTODATA_API_URL),
      seoPrerenderPlugin(),
    ],
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '2.6.0'),
    },
    base: '/',
    build: {
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
          crm: resolve(__dirname, 'crm/index.html')
        }
      }
    }
  };
})
