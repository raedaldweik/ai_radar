// Standalone Node server for hosts other than Vercel (e.g. Railway).
// Serves the built Vite app from dist/ and mounts the same handlers that
// Vercel runs from api/ as serverless functions.
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

import chat from './api/chat.js';
import customTask from './api/agents/custom-task.js';
import memoOnDemand from './api/agents/memo-on-demand.js';
import morningBrief from './api/agents/morning-brief.js';
import opportunityScout from './api/agents/opportunity-scout.js';
import peerBenchmark from './api/agents/peer-benchmark.js';
import policyWatch from './api/agents/policy-watch.js';

type Handler = (req: any, res: any) => unknown;

const routes: Record<string, Handler> = {
  '/api/chat': chat,
  '/api/agents/custom-task': customTask,
  '/api/agents/memo-on-demand': memoOnDemand,
  '/api/agents/morning-brief': morningBrief,
  '/api/agents/opportunity-scout': opportunityScout,
  '/api/agents/peer-benchmark': peerBenchmark,
  '/api/agents/policy-watch': policyWatch,
};

const app = express();
app.use(express.json({ limit: '10mb' }));

for (const [route, handler] of Object.entries(routes)) {
  app.all(route, async (req, res, next) => {
    try {
      await handler(req, res);
    } catch (err) {
      next(err);
    }
  });
}

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

const distDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'dist');
app.use(express.static(distDir));
app.get('*', (_req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

const port = Number(process.env.PORT) || 3000;
app.listen(port, '0.0.0.0', () => {
  console.log(`Server listening on port ${port}`);
});
