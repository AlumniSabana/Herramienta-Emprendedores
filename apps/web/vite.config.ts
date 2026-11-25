import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // El .env vive en la raíz del monorepo (lo comparten la web y la API).
  envDir: fileURLToPath(new URL('../..', import.meta.url)),
  resolve: {
    // shortcut: este repo vive dentro de OneDrive, donde la resolución por enlace simbólico de Vite 8
    // falla al importar paquetes (react, zod…); con preserveSymlinks y el alias directo a core funciona.
    // Quitar ambas líneas si el repo se mueve fuera de OneDrive y el build pasa sin ellas.
    preserveSymlinks: true,
    alias: { '@emprendedor/core': fileURLToPath(new URL('../../packages/core/src/index.ts', import.meta.url)) },
  },
  server: { proxy: { '/api': 'http://localhost:3001' } },
});
