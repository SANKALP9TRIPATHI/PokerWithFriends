// ============================================================
// Vasu-Juari Poker — Socket.IO Standalone Server
// ============================================================
// Runs Socket.IO on port 3001 separately from Next.js.
// Next.js runs via `next dev --webpack` on port 3000.

import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';
import { setupSocketHandlers } from './src/server/socket-handler';

const dev = process.env.NODE_ENV !== 'production';

// In development, we run the socket server on a separate port (3001)
// In production, we run both Next.js and Socket.IO on the same port (PORT)
const port = parseInt(process.env.PORT || '3000', 10);
const socketPort = parseInt(process.env.SOCKET_PORT || '3001', 10);

async function startServer() {
  if (dev) {
    // Development mode: Only run Socket.IO server
    const httpServer = createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('🃏 Vasu-Juari Poker — Socket Server is running');
    });

    const io = new Server(httpServer, {
      cors: { origin: '*', methods: ['GET', 'POST'] },
      pingTimeout: 30000,
      pingInterval: 10000,
    });
    setupSocketHandlers(io);

    httpServer.listen(socketPort, () => {
      console.log(`\n🃏 Vasu-Juari Poker — Dev Socket Server`);
      console.log(`   WebSocket server on http://localhost:${socketPort}\n`);
    });
  } else {
    // Production mode: Run Next.js and Socket.IO on the same HTTP server
    const app = next({ dev, hostname: '0.0.0.0', port });
    const handle = app.getRequestHandler();

    await app.prepare();

    const httpServer = createServer((req, res) => {
      const parsedUrl = parse(req.url!, true);
      handle(req, res, parsedUrl);
    });

    const io = new Server(httpServer, {
      pingTimeout: 30000,
      pingInterval: 10000,
    });
    setupSocketHandlers(io);

    httpServer.listen(port, () => {
      console.log(`\n🃏 Vasu-Juari Poker — Production Server`);
      console.log(`   Listening on port ${port}\n`);
    });
  }
}

startServer();
