import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse
} from '@angular/ssr/node';
import express from 'express';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

// Serve static files
app.use(express.static(browserDistFolder, { maxAge: '1y' }));

// Handle dynamic routes specifically
app.get('/qcm/:author/:qcmId', (req, res, next) => {
  angularApp.handle(req)
    .then(response => response ? writeResponseToNodeResponse(response, res) : next())
    .catch(next);
});

// Fallback for all other routes
app.get('*', (req, res, next) => {
  angularApp.handle(req)
    .then(response => response ? writeResponseToNodeResponse(response, res) : next())
    .catch(next);
});

// Start server if main module
if (isMainModule(import.meta.url)) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
  });
}

export const reqHandler = createNodeRequestHandler(app);
