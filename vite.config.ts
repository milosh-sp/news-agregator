import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Data Cube AI API. The browser calls /data-cube-api/* on our own origin and
// the request is forwarded to this host (no CORS needed). The same mapping
// lives in netlify.toml for the deployed site.
const DATA_CUBE_TARGET = 'https://api-production-3ee5.up.railway.app'

const dataCubeProxy = {
  '/data-cube-api': {
    target: DATA_CUBE_TARGET,
    changeOrigin: true,
    secure: true,
    rewrite: (path: string) => path.replace(/^\/data-cube-api/, ''),
  },
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // TODO: Use env for host and port
    port: 8080,
    host: '0.0.0.0',
    proxy: dataCubeProxy,
  },
  preview: {
    port: 8080,
    host: '0.0.0.0',
    // Needed too: the Docker image serves the build with `vite preview`
    proxy: dataCubeProxy,
  },

  css: {
    modules: {
      generateScopedName:
        'production' === process.env.NODE_ENV
          ? `[hash:base64:5]`
          : // CSS File names are only hashed in production/staging
            `[local]`,
    },
  },

  build: {
    sourcemap: 'production' !== process.env.NODE_ENV,
    rollupOptions: {
      output: {
        assetFileNames: '[hash:10].[ext]',
        chunkFileNames: '[hash:10].js',
        //independent chunk, for example `ibantools` is loaded independently
        manualChunks: {
          react: ['react'],
          'react-dom': ['react-dom'],
          'react-redux': ['react-redux'],
          redux: ['redux', '@reduxjs/toolkit'],
          axios: ['axios'],
        },
      },
    },
  },
})