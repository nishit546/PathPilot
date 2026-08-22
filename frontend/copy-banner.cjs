const fs = require('fs');
const path = require('path');

const bannerSource = path.resolve(__dirname, '..', '..', 'Banner Image.png');
const publicDest = path.resolve(__dirname, 'public', 'banner-image.png');
const assetsDest = path.resolve(__dirname, 'src', 'assets', 'banner-image.png');

if (fs.existsSync(bannerSource)) {
  fs.copyFileSync(bannerSource, publicDest);
  fs.copyFileSync(bannerSource, assetsDest);
  console.log('Successfully copied new Banner Image.png (1.80 MB) to public and src/assets!');
} else {
  console.error('Source banner image not found at:', bannerSource);
}
