// Unified startup for Influenzia Club (ES Module version)
// Serves both frontend (static) and backend (API) using Express

import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = process.env.PORT || 3000;

// Paths
const DIST_DIR = path.join(__dirname, 'dist');
const BACKEND_APP = (await import('./backend/src/app.js')).default;

const app = express();

console.log('========================================');
console.log('Influenzia Club Starting...');
console.log('Port:', PORT);
console.log('Frontend Dist:', DIST_DIR);
console.log('Backend: Mounted from ./backend/src/app.js');
console.log('========================================');

// Parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount backend API routes
app.use('/api', BACKEND_APP);

// Serve static frontend files from dist
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  console.log('✓ Frontend dist folder found');
} else {
  console.warn('⚠ Frontend dist folder NOT found - build may have failed');
  console.warn('  Checked:', DIST_DIR);
}

// Handle SPA routing - return index.html for unknown routes
app.get('*', (req, res) => {
  const indexPath = path.join(DIST_DIR, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Frontend not found - run npm run build');
  }
});

// Start unified server
app.listen(PORT, () => {
  console.log('========================================');
  console.log('✓ Server running on port', PORT);
  console.log('✓ Frontend: http://localhost:' + PORT);
  console.log('✓ API: http://localhost:' + PORT + '/api');
  console.log('✓ Health: http://localhost:' + PORT + '/api/health');
  console.log('========================================');
});
