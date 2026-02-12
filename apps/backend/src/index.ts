// ==============================================
// MAIN ENTRY POINT - Hono app
// ==============================================

import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { trimTrailingSlash } from 'hono/trailing-slash';
import chatController from './controllers/chat.controller.js';
import agentsController from './controllers/agents.controller.js';
import { errorMiddleware } from './middleware/error.middleware.js';
import prisma from './lib/prisma.js';

const app = new Hono();

// ---- GLOBAL MIDDLEWARE ----
app.use('*', logger());
app.use('*', prettyJSON());
app.use('*', trimTrailingSlash());
app.use('*', errorMiddleware);

// ---- CORS ----
app.use(
  '*',
  cors({
    origin: ['http://localhost:5173', 'http://localhost:3000', process.env.FRONTEND_URL || ''],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['X-Agent-Type', 'X-Routing-Reason', 'X-RateLimit-Remaining'],
  })
);

// ---- ROUTES ----
app.route('/api/chat', chatController);
app.route('/api/agents', agentsController);

// ---- HEALTH CHECK ----
app.get('/api/health', async (c) => {
  let dbStatus: 'connected' | 'disconnected' = 'disconnected';
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch {
    dbStatus = 'disconnected';
  }

  const aiStatus = process.env.GOOGLE_GENERATIVE_AI_API_KEY ? 'available' : 'unavailable';
  const status = dbStatus === 'connected' && aiStatus === 'available' ? 'ok' : 'degraded';

  return c.json({
    status,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: { database: dbStatus, ai: aiStatus },
  });
});

// ---- 404 ----
app.notFound((c) => {
  return c.json({ success: false, error: `Route ${c.req.method} ${c.req.path} not found` }, 404);
});

// ---- START ----
const PORT = parseInt(process.env.PORT || '3000', 10);

serve({ fetch: app.fetch, port: PORT }, (info) => {
  console.log('');
  console.log('🚀 AI Support System — Backend');
  console.log(`   http://localhost:${info.port}`);
  console.log(`   Health: http://localhost:${info.port}/api/health`);
  console.log('');
});

export default app;
export type AppType = typeof app;
