/** Serve a production export with Node's standard library. No extra dependency. */
import { createServer } from 'node:http';
import { stat, readFile } from 'node:fs/promises';
import { dirname, resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../dist/client');
try {
  await stat(resolve(root, 'index.html'));
} catch {
  console.error('Build the app first with: pnpm build');
  process.exit(1);
}
const port = Number(process.env.PORT || 3000);
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};
createServer(async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD' });
    res.end();
    return;
  }
  try {
    const pathname = decodeURIComponent(
      new URL(req.url, 'http://localhost').pathname,
    );
    let file = resolve(root, `.${pathname}`);
    if (file !== root && !file.startsWith(root + sep)) {
      res.writeHead(403);
      res.end();
      return;
    }
    let info = await stat(file).catch(() => null);
    if (info?.isDirectory()) {
      file = resolve(file, 'index.html');
      info = await stat(file).catch(() => null);
    }
    if (!info?.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
      return;
    }
    res.writeHead(200, {
      'Content-Type': types[extname(file)] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff',
    });
    res.end(req.method === 'HEAD' ? undefined : await readFile(file));
  } catch {
    res.writeHead(400);
    res.end('Bad request');
  }
}).listen(port, '127.0.0.1', () =>
  console.log(`Packet Lab is ready at http://127.0.0.1:${port}/`),
);
