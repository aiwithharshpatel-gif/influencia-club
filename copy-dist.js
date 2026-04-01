// Copy dist folder from frontend/dist to root/dist
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
