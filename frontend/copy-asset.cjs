const fs = require('fs');
const path = require('path');

const srcFile = 'C:\\Users\\ADMIN\\.gemini\\antigravity-ide\\brain\\0cf7c9d1-3000-45fe-add0-846937163370\\.user_uploaded\\media_1787374066064.png';
const destPublicDir = path.resolve(__dirname, 'public');
const destAssetsDir = path.resolve(__dirname, 'src', 'assets');

if (!fs.existsSync(destPublicDir)) fs.mkdirSync(destPublicDir, { recursive: true });
if (!fs.existsSync(destAssetsDir)) fs.mkdirSync(destAssetsDir, { recursive: true });

if (fs.existsSync(srcFile)) {
  fs.copyFileSync(srcFile, path.join(destPublicDir, 'auth-hero-illustration.png'));
  fs.copyFileSync(srcFile, path.join(destAssetsDir, 'auth-hero-illustration.png'));
  console.log('Successfully copied new wide hero image to public/ and src/assets/');
}
