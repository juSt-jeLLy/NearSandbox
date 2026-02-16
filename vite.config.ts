import { defineConfig } from 'vite';
import react from "@vitejs/plugin-react-swc";
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      buffer: 'buffer',
    },
  },
  define: {
    'process.env': {},
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ['buffer'],
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },
  },
  server: {
    proxy: {
      // Proxy for NOVA SDK API
      '/api': {
        target: 'https://nova-sdk.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path,
      },
      // Proxy for NOVA MCP API
      '/mcp-api': {
        target: 'https://nova-mcp.fastmcp.app',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/mcp-api/, ''),
      },
      '/near-api': {
        target: 'https://cloud-api.near.ai',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/near-api/, ''),
      },
    },
  },
});