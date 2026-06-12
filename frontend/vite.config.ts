// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'), 
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;

          const match = id.match(/node_modules\/(?:@[^/]+\/[^^/]+|[^/]+)/);
          const pkg = match?.[0].replace('node_modules/', '');
          if (!pkg) return 'vendor-other';

          const packageName = pkg.startsWith('@') ? pkg.split('/').slice(0, 2).join('/') : pkg.split('/')[0];
          const coreVendors = new Set(['react', 'react-dom', 'react-router-dom']);
          const uiVendors = new Set(['@nextui-org/react', '@radix-ui/react-alert-dialog', '@radix-ui/react-avatar', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-hover-card', '@radix-ui/react-label', '@radix-ui/react-popover', '@radix-ui/react-slot', '@radix-ui/react-toast', 'react-toastify']);
          const motionVendors = new Set(['framer-motion', 'gsap', '@gsap/react', 'leva']);
          const threeVendors = new Set(['three', '@react-three/fiber', '@react-three/drei']);
          const videoVendors = new Set(['video.js', '@videojs/themes']);
          const editorVendors = new Set(['@lexical/react', '@lexical/utils', '@lexical/headless', '@lexical/html', '@lexical/list', '@lexical/link', '@lexical/mark', '@lexical/overflow', '@lexical/rich-text', '@lexical/selection', '@lexical/text', '@lexical/utils', '@lexical/history', '@lexical/dragon', '@lexical/hashtag', '@lexical/clipboard']);
          const utilVendors = new Set(['axios', 'date-fns', 'libphonenumber-js', 'js-cookie', 'jsonwebtoken', 'jwt-decode', 'clsx', 'tailwind-merge', 'react-hook-form']);
          const iconVendors = new Set(['lucide-react', 'react-icons', '@heroicons/react']);

          if (coreVendors.has(packageName)) return 'vendor-react';
          if (uiVendors.has(packageName)) return 'vendor-ui';
          if (motionVendors.has(packageName)) return 'vendor-motion';
          if (threeVendors.has(packageName)) return 'vendor-three';
          if (videoVendors.has(packageName)) return 'vendor-video';
          if (editorVendors.has(packageName)) return 'vendor-editor';
          if (utilVendors.has(packageName)) return `vendor-${packageName.replace('@', '').replace(/\//g, '-')}`;
          if (iconVendors.has(packageName)) return 'vendor-icons';

          return `vendor-${packageName.replace('@', '').replace(/\//g, '-')}`;
        },
      },
    },
  },
});
