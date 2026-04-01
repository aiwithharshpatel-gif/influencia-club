// Copy dist folder from frontend/dist to root/dist
const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'frontend', 'dist');
const destDir = path.join(__dirname, 'dist');

console.log('Copying dist folder...');
console.log('From:', srcDir);
console.log('To:', destDir);

// Remove existing dist folder
if (fs.existsSync(destDir)) {
  fs.rmSync(destDir, { recursive: true, force: true });
  console.log('Removed existing dist folder');
}

// Copy frontend/dist to root/dist
fs.cpSync(srcDir, destDir, { recursive: true });
console.log('Dist folder copied successfully!');
console.log('Files in dist:', fs.readdirSync(destDir).length);
