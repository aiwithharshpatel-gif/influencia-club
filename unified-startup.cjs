// Unified startup for Influenzia Club
// Serves both frontend (static) and backend (API)

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

// Paths
const DIST_DIR = path.join(__dirname, 'dist');
const BACKEND_APP = require('./backend/src/app.js');

console.log('========================================');
console.log('Influenzia Club Starting...');
console.log('Port:', PORT);
console.log('Frontend Dist:', DIST_DIR);
console.log('Backend Root: ./backend/src/app.js');
console.log('========================================');

// Create HTTP server
const server = http.createServer((req, res) => {
  const logPrefix = `${new Date().toISOString()} - ${req.method} ${req.url}`;
  console.log(logPrefix);

  // Handle API routes - proxy to Express backend
  if (req.url.startsWith('/api')) {
    // Use Express app for API routes
    BACKEND_APP(req, res);
    return;
  }

  // Serve static frontend files
  let filePath = path.join(DIST_DIR, req.url === '/' ? 'index.html' : req.url);

  // Handle SPA routing - return index.html for unknown routes
  if (!fs.existsSync(filePath)) {
    filePath = path.join(DIST_DIR, 'index.html');
  }

  const ext = path.extname(filePath);
  const contentTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject'
  };

  const contentType = contentTypes[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      console.error('Error:', err.code, filePath);
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 - File Not Found</h1>');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end(`<h1>500 - Server Error</h1><p>${err.code}</p>`);
      }
    } else {
      // Add CORS headers for API compatibility
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  console.log('Server listening on port', PORT);
  console.log('Frontend: http://localhost:' + PORT);
  console.log('API: http://localhost:' + PORT + '/api');
  console.log('========================================');
});
