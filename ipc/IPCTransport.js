const BaseTransport = require('../BaseTransport');

class IPCTransport extends BaseTransport {
  constructor({ isServer = false, childProcess = null } = {}) {
    super();
    this.isServer = isServer;
    this.childProcess = childProcess;
  }

  
  async start() {
    if (!this.isServer) {
        throw new Error("start() should only be called on a server transport");
    }

    process.on('message', (msg) => {
      if (!msg || !msg.type) return;

      if (this._listeners[msg.type]) {
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
  }

  async connect() {
    if (this.isServer) {
        throw new Error("connect() should only be called on a client transport");
    }
    if (!this.childProcess) {
      throw new Error("No childProcess provided for the IPC client.");
    }

    this.childProcess.on('message', (msg) => {
      if (!msg || !msg.type) return;
      if (this._listeners[msg.type]) {
        this._emit(msg.type, msg);
      }
    });
  }

  async send(message) {
    if (this.isServer) {
      if (!process.send) {
        throw new Error("Child process cannot send message");
      }
      process.send(message);
    } else {
      if (!this.childProcess) {
        throw new Error("Cannot send message: childProcess is null.");
      }
      this.childProcess.send(message);
    }
    return Promise.resolve();
  }

  close() {
    if (!this.isServer && this.childProcess) {
      this.childProcess.kill();
    }
  }
}

module.exports = IPCTransport;
