import { createServer } from 'node:http';
import { readFileSync, existsSync, watch } from 'node:fs';
import { extname, join, resolve } from 'node:path';

const root = process.cwd();
const port = Number(process.env.PORT || 3000);
const clients = new Set();

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
};

function sendReload() {
  for (const res of clients) {
    res.write('event: reload\ndata: update\n\n');
  }
}

function serveFile(pathname, res) {
  const filePath = resolve(root, pathname === '/' ? 'index.html' : pathname.slice(1));
  if (!existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
    return;
  }

  const data = readFileSync(filePath);
  const type = mimeTypes[extname(filePath)] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': type });
  res.end(data);
}

const server = createServer((req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

  if (url.pathname === '/__reload') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    res.write('\n');
    clients.add(res);
    req.on('close', () => clients.delete(res));
    return;
  }

  serveFile(url.pathname, res);
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Dev server running at http://127.0.0.1:${port}`);
});

watch(join(root, 'index.html'), { persistent: true }, () => {
  sendReload();
});
