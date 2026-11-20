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
    base: '/',
    build: {
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
          crm: resolve(__dirname, 'crm/index.html')
        },
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('lucide-react')) return 'vendor-icons';
              if (id.includes('recharts') || id.includes('d3-')) return 'vendor-charts';
              if (id.includes('xlsx')) return 'vendor-xlsx';
              if (id.includes('exceljs') || id.includes('file-saver')) return 'vendor-exceljs';
              if (id.includes('@dnd-kit')) return 'vendor-dnd';
              if (id.includes('@google/genai')) return 'vendor-ai';
              if (/[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/.test(id)) {
                return 'vendor-react';
              }
              if (id.includes('framer-motion')) return 'vendor-motion';
            }
            return undefined;
          }
        }
      }
    }
  };
})
