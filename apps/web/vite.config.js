import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'
import react from '@vitejs/plugin-react-oxc'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 3000,
  },
  plugins: [
    tanstackRouter({
      target: 'solid',
      autoCodeSplitting: true,
    }),
    react({
      include: "**/*.react.tsx",
      exclude: ["**/*.tsx", "!**/*.react.tsx"],
      jsxImportSource: 'react',
      jsxRuntime: 'automatic',
    }),
    solid({
      exclude: "**/*.react.tsx",
    }),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Ensure React uses a single version
      "react": path.resolve(__dirname, "./node_modules/react"),
      "react-dom": path.resolve(__dirname, "./node_modules/react-dom"),
    },
  },
  optimizeDeps: {
    // Force Vite to pre-bundle React dependencies
    include: ['react', 'react-dom'],
    exclude: ['solid-js'],
  },
  define: {
    // Ensure React uses production build
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
})
