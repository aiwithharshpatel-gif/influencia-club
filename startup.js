// Hostinger startup file for Influenzia Club
// This serves the built frontend from root/dist

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const DIST_DIR = path.join(__dirname, 'dist');

console.log('========================================');
console.log('Influenzia Club Starting...');
console.log('Port:', PORT);
console.log('Dist Dir:', DIST_DIR);
console.log('Dist Exists:', fs.existsSync(DIST_DIR));
if (fs.existsSync(DIST_DIR)) {
  console.log('Files in dist:', fs.readdirSync(DIST_DIR));
}
console.log('========================================');

const server = http.createServer((req, res) => {
  const logPrefix = `${new Date().toISOString()} - ${req.method} ${req.url}`;
  console.log(logPrefix);

  // Handle API routes
  if (req.url.startsWith('/api')) {
    res.writeHead(200, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({
      status: 'ok',
      message: 'Frontend is running. Backend API should be deployed separately.',
      url: 'https://test.digiglowmarketing.in'
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
      console.error('Error:', err.code, filePath);
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 - File Not Found</h1>');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end(`<h1>500 - Server Error</h1><p>${err.code}</p>`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  console.log('Server listening on port', PORT);
  console.log('========================================');
});
