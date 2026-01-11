import express from 'express';
import { createServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 5173;

async function setupDevServer() {
  const app = express();

  // Create Vite server instances for both apps
  let viteMain, vitePortal;

  try {
    // Main Vite app server (root)
    viteMain = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });

    // Portal Vite app server
    vitePortal = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
      root: path.resolve(__dirname, 'portal'),
    });
  } catch (error) {
    console.error('Failed to create Vite servers:', error);
    process.exit(1);
  }

  // === PORTAL APP (mounted at /portal) ===
  // CRITICAL: Mount portal BEFORE main to ensure priority
  
  app.use('/portal', vitePortal.middlewares);

  // Portal catch-all for SPA navigation
  app.get('/portal/*', async (req, res, next) => {
    try {
      const portalIndexPath = path.resolve(__dirname, 'portal/index.html');
      let html = fs.readFileSync(portalIndexPath, 'utf-8');
      html = await vitePortal.transformIndexHtml(req.originalUrl, html);
      res.setHeader('Content-Type', 'text/html');
      res.end(html);
    } catch (error) {
      console.error('Portal error:', error);
      res.status(500).send('Error loading portal');
    }
  });

  // === MAIN APP (root) ===
  app.use(viteMain.middlewares);

  // Main catch-all for SPA navigation
  app.get('*', async (req, res, next) => {
    try {
      const mainIndexPath = path.resolve(__dirname, 'index.html');
      let html = fs.readFileSync(mainIndexPath, 'utf-8');
      html = await viteMain.transformIndexHtml(req.originalUrl, html);
      res.setHeader('Content-Type', 'text/html');
      res.end(html);
    } catch (error) {
      console.error('Main app error:', error);
      res.status(500).send('Error loading main site');
    }
  });

  // Start the server
  await new Promise(resolve => {
    app.listen(PORT, () => {
      console.log(`\n✅ Dev server running!\n`);
      console.log(`   Main site:    http://localhost:${PORT}`);
      console.log(`   Admin portal: http://localhost:${PORT}/portal\n`);
      resolve();
    });
  });

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\nShutting down...');
    await viteMain.close();
    await vitePortal.close();
    process.exit(0);
  });
}

setupDevServer().catch(error => {
  console.error('Dev server error:', error);
  process.exit(1);
});
