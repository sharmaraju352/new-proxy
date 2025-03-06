const WebSocketTransport = require('../WebSocketTransport');
const ProxyServer = require('../../ProxyServer');
const { EventEmitter } = require('events');

class Handler extends EventEmitter {
  async hello(name) {
    return `Hello ${name}`;
  }
}

const handler = new Handler();
const transport = new WebSocketTransport({ server: true, port: 3001 });
const server = new ProxyServer(transport);

server.exposeHandler(handler);
transport.start().then(() => {
  console.log('WebSocket server started on port 3001');
});

// Optionally, emit an event periodically
setInterval(() => {
  transport.send({ type: 'event', event: 'heartbeat', data: Date.now() });
}, 5000);
