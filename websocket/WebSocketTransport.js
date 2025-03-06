const WebSocket = require('ws');
const BaseTransport = require('../BaseTransport');

class WebSocketTransport extends BaseTransport {
  constructor({ serverOptions, clientOptions } = {}) {
    super();
    this.serverOptions = serverOptions || null;
    this.clientOptions = clientOptions || null;
    this.isServer = !!serverOptions;
    this.ws = null;
    this.server = null;
    this.pendingMessages = [];
  }

  async start() {
    if (!this.isServer) {
      throw new Error("start() should only be called on a server transport");
    }
    this.server = new WebSocket.Server(this.serverOptions);
    this.server.on('connection', (socket) => {
      this.ws = socket;
      socket.on('message', (data) => {
        let msg;
        try {
          msg = JSON.parse(data);
        } catch (err) {
          return;
        }
        if (msg.type && this._listeners[msg.type]) {
          if (msg.type === 'request' || msg.type === 'subscribe') {
            this._emit(msg.type, msg, (err, result) => {
              const response = {
                type: 'response',
                id: msg.id,
                error: err ? err.message : null,
                result
              };
              this.send(response);
            });
          } else {
            this._emit(msg.type, msg);
          }
        }
      });
    });
  }

  async connect() {
    if (this.isServer) {
      throw new Error("connect() should only be called on a client transport");
    }
    if (!this.clientOptions || !this.clientOptions.url) {
      throw new Error("clientOptions with a valid URL must be provided for client mode");
    }
    this.ws = new WebSocket(this.clientOptions.url);
    this.ws.on('message', (data) => {
      let msg;
      try {
        msg = JSON.parse(data);
      } catch (err) {
        return;
      }
      if (msg.type && this._listeners[msg.type]) {
        this._emit(msg.type, msg);
      }
    });
    await new Promise((resolve, reject) => {
      this.ws.on('open', resolve);
      this.ws.on('error', reject);
    });
  }

  async send(message) {
    const data = JSON.stringify(message);
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(data);
    } else {
      this.pendingMessages.push(data);
    }
    return Promise.resolve();
  }

  close() {
    if (this.ws) {
      this.ws.close();
    }
    if (this.server) {
      this.server.close();
    }
  }
}

module.exports = WebSocketTransport;
