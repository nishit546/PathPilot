const fs = require('fs');
const path = require('path');

const parentDir = path.resolve(__dirname, '..');
const filesToRemove = [
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

filesToRemove.forEach(file => {
  const filePath = path.join(parentDir, file);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      console.log('Removed duplicate file:', file);
    } catch (e) {
      console.warn('Could not remove file:', file, e.message);
    }
  }
});

const srcDir = path.join(parentDir, 'src');
if (fs.existsSync(srcDir)) {
  try {
    fs.rmSync(srcDir, { recursive: true, force: true });
    console.log('Removed duplicate src/ directory in parent.');
  } catch (e) {
    console.warn('Could not remove src/ directory:', e.message);
  }
}

console.log('Cleaned up duplicate codebase successfully!');
