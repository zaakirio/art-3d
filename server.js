// Simple server with CORS image proxy for the 3D Art Gallery
// Usage: node server.js
// Then open http://localhost:3000

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 4200;

const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
};

function proxyImage(imageUrl, res) {
    const parsed = new URL(imageUrl);
    const options = {
        hostname: parsed.hostname,
        path: parsed.pathname + parsed.search,
        method: 'GET',
        headers: { 'User-Agent': 'Mozilla/5.0 (Art Gallery Proxy)' },
    };

    const proxy = https.request(options, (proxyRes) => {
        // Handle redirects
        if (proxyRes.statusCode >= 300 && proxyRes.statusCode < 400 && proxyRes.headers.location) {
            return proxyImage(proxyRes.headers.location, res);
        }

        res.writeHead(proxyRes.statusCode, {
            'Content-Type': proxyRes.headers['content-type'] || 'image/jpeg',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=86400',
        });
        proxyRes.pipe(res);
    });

    proxy.on('error', () => {
        res.writeHead(502);
        res.end('Proxy error');
    });
    proxy.end();
}

const server = http.createServer((req, res) => {
    const parsed = url.parse(req.url, true);

    // CORS image proxy endpoint
    if (parsed.pathname === '/proxy' && parsed.query.url) {
        return proxyImage(parsed.query.url, res);
    }

    // Static file serving
    let filePath = parsed.pathname === '/' ? '/index.html' : parsed.pathname;
    filePath = path.join(__dirname, filePath);

    const ext = path.extname(filePath);
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404);
            res.end('Not found');
            return;
        }
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    });
});

server.listen(PORT, () => {
    console.log(`\n  🎨 Modern Art Gallery`);
    console.log(`  ────────────────────`);
    console.log(`  Open: http://localhost:${PORT}\n`);
});
