const EventEmitter = require('events');
const ProxyServer = require('../../ProxyServer');
const IPCTransport = require('../IPCTransport');

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
const transport = new IPCTransport({ isServer: true });
const server = new ProxyServer(transport);

server.exposeHandler(handler);

transport.start().then(() => {
  console.log("Child: IPC Server started, waiting for requests...");
});

// emit 'heartbeat' every second so parent can subscribe
setInterval(() => {
  handler.emit('heartbeat', Date.now());
}, 1000);