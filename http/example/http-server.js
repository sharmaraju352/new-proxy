const HTTPTransport = require('../HTTPTransport');
const ProxyServer = require('../../ProxyServer');
const EventEmitter = require('events');

class MathHandler {
  async add(a, b) {
    return a + b;
  }
  
  async multiply(a, b) {
    return a * b;
  }
}

class Handler extends EventEmitter {
  constructor() {
    super();
    this.math = new MathHandler();
  }

  async hello(name) {
    return `Hello ${name}`;
  }

  async emitTestEvent(data) {
    this.emit('onceEvent', data);
    return "onceEvent emitted";
  }
  
  async chainExample(value) {
    return value;
  }
}

const handler = new Handler();
const transport = new HTTPTransport({ 
  serverOptions: { port: 3002 } 
});
const server = new ProxyServer(transport);

server.exposeHandler(handler);

transport.start();

// Emit heartbeat events via the handler every second.
setInterval(() => {
  handler.emit('heartbeat', Date.now());
}, 1000);
