import { fastify } from 'fastify';
import { fastifyWebsocket } from '@fastify/websocket';
import { initDb } from './database/index.js';
import { initTools, shutdownBrowser } from './tools/index.js';
import { registerRoutes } from './api/routes.js';
import { WebSocketManager } from './websocket/ws-manager.js';

// Initialize dotenv manually or rely on standard load
import 'dotenv/config';

const server = fastify({
  logger: false // Keep test output clean and standard
});

// Register WebSocket support
await server.register(fastifyWebsocket);

// Register routes
registerRoutes(server);

// WebSocket endpoint /ws
server.route({
  method: 'GET',
  url: '/ws',
  handler: (req, reply) => {
    reply.status(400).send({ error: 'Use WebSocket connection' });
  },
  wsHandler: (ws: any) => {
    WebSocketManager.getInstance().register(ws);
  }
});

const port = Number(process.env.SERVER_PORT) || 3777;
const host = process.env.SERVER_HOST || '127.0.0.1';

async function start() {
  try {
    initDb();
    initTools();

    await server.listen({ port, host });
    console.log(`🦅 ClawForge Server running at http://${host}:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

// Support graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Cleaning up...');
  await shutdownBrowser();
  await server.close();
  process.exit(0);
});

if (process.env.NODE_ENV !== 'test') {
  start();
}

export { server };
