const fs = require('fs');
const path = require('path');

const imgPath = path.resolve(__dirname, 'public', 'auth-hero-illustration.png');
const buf = fs.readFileSync(imgPath);

// Let's check PNG header & signature
console.log('PNG file size:', buf.length);
