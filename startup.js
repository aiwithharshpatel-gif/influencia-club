// Hostinger startup file for Influenzia Club
// This serves the built frontend

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

// Try multiple possible dist locations
const possibleDistPaths = [
  path.join(__dirname, 'dist'),
  path.join(__dirname, 'frontend', 'dist'),
  path.join(__dirname, 'public'),
  path.join(__dirname, 'public_html'),
];

let DIST_DIR = null;
for (const distPath of possibleDistPaths) {
  if (fs.existsSync(distPath)) {
    DIST_DIR = distPath;
    break;
  }
}

if (!DIST_DIR) {
  console.error('No dist folder found! Checked:', possibleDistPaths);
  DIST_DIR = path.join(__dirname, 'dist'); // fallback
}

console.log('Serving from:', DIST_DIR);

const server = http.createServer((req, res) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);

  // Handle API routes
  if (req.url.startsWith('/api')) {
    res.writeHead(200, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({
      status: 'ok',
      message: 'Frontend is running. Backend API should be deployed separately.',
      frontend: 'test.digiglowmarketing.in'
    }));
    return;
  }

  // Serve static files from dist
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
      console.error('Error reading file:', filePath, err.code);
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 - File Not Found</h1><p>The requested file was not found on this server.</p>');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end(`<h1>500 - Server Error</h1><p>Error code: ${err.code}</p>`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  console.log(`========================================`);
  console.log(`Influenzia Club running on port ${PORT}`);
  console.log(`Serving from: ${DIST_DIR}`);
  console.log(`URL: https://test.digiglowmarketing.in`);
  console.log(`========================================`);
});
