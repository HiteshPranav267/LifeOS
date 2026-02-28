import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
// Store data OUTSIDE public/ to avoid Vite file-watcher conflicts
const DATA_DIR = path.resolve(__dirname, 'data')
const DATA_FILE = path.resolve(DATA_DIR, 'lifeos_db.json')

export default defineConfig({
  server: {
    watch: {
      ignored: ['**/data/**']
    }
  },
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'lifeos-disk-sync',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          // POST: Browser → Laptop Disk
          if (req.method === 'POST' && req.url === '/api/save-data') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
              try {
                const parsed = JSON.parse(body);
                fs.mkdirSync(DATA_DIR, { recursive: true });
                fs.writeFileSync(DATA_FILE, JSON.stringify(parsed, null, 2), 'utf8');
                console.log(`[LifeOS] ✓ Synced ${body.length} bytes → ${DATA_FILE}`);
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ status: 'success', path: DATA_FILE, bytes: body.length }));
              } catch (err: any) {
                console.error(`[LifeOS] ✗ Sync Error:`, err.message);
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ status: 'error', message: err.message }));
              }
            });
            return;
          }

          // GET: Laptop Disk → Browser
          if (req.method === 'GET' && req.url === '/api/load-data') {
            try {
              if (fs.existsSync(DATA_FILE)) {
                const content = fs.readFileSync(DATA_FILE, 'utf8');
                console.log(`[LifeOS] ✓ Loaded ${content.length} bytes from disk`);
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Cache-Control', 'no-cache, no-store');
                res.end(content);
                return;
              }
            } catch (err: any) {
              console.error('[LifeOS] ✗ Load Error:', err.message);
            }
            res.statusCode = 404;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ status: 'not_found' }));
            return;
          }

          next();
        });
      }
    }
  ],
})
