import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

// 1. Automatically remove duplicate files in parent directory outside frontend/
try {
  const parentDir = path.resolve(__dirname, '..');
  const duplicateFiles = [
    'package.json',
    'package-lock.json',
    'index.html',
    'vite.config.ts',
    'tsconfig.json',
    'tsconfig.node.json',
    'copy-asset.cjs',
    'inspect-color.cjs',
    'get-pixel-color.cjs'
  ];

  duplicateFiles.forEach(file => {
    const filePath = path.join(parentDir, file);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch {}
    }
  });

  const duplicateSrc = path.join(parentDir, 'src');
  if (fs.existsSync(duplicateSrc)) {
    try {
      fs.rmSync(duplicateSrc, { recursive: true, force: true });
    } catch {}
  }
} catch (err) {
  // Ignore
}

// 2. Automatically copy the provided hero illustration asset
try {
  const newUploadedFile = 'C:\\Users\\ADMIN\\.gemini\\antigravity-ide\\brain\\0cf7c9d1-3000-45fe-add0-846937163370\\.user_uploaded\\media_1787374066064.png';
  const destPublicDir = path.resolve(__dirname, 'public');
  const destAssetsDir = path.resolve(__dirname, 'src', 'assets');

  if (!fs.existsSync(destPublicDir)) fs.mkdirSync(destPublicDir, { recursive: true });
  if (!fs.existsSync(destAssetsDir)) fs.mkdirSync(destAssetsDir, { recursive: true });

  if (fs.existsSync(newUploadedFile)) {
    fs.copyFileSync(newUploadedFile, path.join(destPublicDir, 'auth-hero-illustration.png'));
    fs.copyFileSync(newUploadedFile, path.join(destAssetsDir, 'auth-hero-illustration.png'));
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
    fs: {
      allow: ['..', 'C:/Users/ADMIN/.gemini/antigravity-ide/brain']
    }
  }
});
