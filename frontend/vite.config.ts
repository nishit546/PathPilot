import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

// Force sync latest Banner Image.png (1.80 MB)
try {
  const rootWorkspace = path.resolve(__dirname, '..', '..');
  const destPublicDir = path.resolve(__dirname, 'public');
  const destAssetsDir = path.resolve(__dirname, 'src', 'assets');

  if (!fs.existsSync(destPublicDir)) fs.mkdirSync(destPublicDir, { recursive: true });
  if (!fs.existsSync(destAssetsDir)) fs.mkdirSync(destAssetsDir, { recursive: true });

  const bannerSource = path.join(rootWorkspace, 'Banner Image.png');
  if (fs.existsSync(bannerSource)) {
    fs.copyFileSync(bannerSource, path.join(destPublicDir, 'banner-image.png'));
    fs.copyFileSync(bannerSource, path.join(destAssetsDir, 'banner-image.png'));
    console.log('[Vite] Updated Banner Image.png (1.80 MB) synchronized.');
  }
} catch (err) {
  // Ignore
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    },
    fs: {
      allow: ['..', 'C:/Users/ADMIN/.gemini/antigravity-ide/brain']
    }
  }
});
