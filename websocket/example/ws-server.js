const WebSocketTransport = require('../WebSocketTransport');
const ProxyServer = require('../../ProxyServer');
const EventEmitter = require('events');

class Handler extends EventEmitter {
  async hello(name) {
    return `Hello ${name}`;
  }

  async emitTestEvent(data) {
    this.emit('onceEvent', data);
    return "onceEvent emitted";
  }
}

const handler = new Handler();

const transport = new WebSocketTransport({ 
  serverOptions: { port: 3001 } 
});
const server = new ProxyServer(transport);

server.exposeHandler(handler);
transport.start().then(() => {
  console.log('WebSocket server started on port 3001');
});

setInterval(() => {
  handler.emit('heartbeat', Date.now());
}, 1000);
