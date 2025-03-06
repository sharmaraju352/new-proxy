const express = require('express');
const BaseTransport = require('../BaseTransport');
const { v4: uuidv4 } = require('uuid');

class HTTPTransport extends BaseTransport {
  constructor({ serverOptions, clientOptions } = {}) {
    super();
    this.serverOptions = serverOptions || null;
    this.clientOptions = clientOptions || null;
    this.isServer = !!serverOptions;
    this.eventClients = [];
    this.app = null;
    this.server = null;
  }

  async start() {
    if (!this.isServer) {
      throw new Error("start() should only be called on a server transport");
    }
    this.app = express();
    this.app.use(express.json());

    this.app.post('/rpc', async (req, res) => {
      const msg = req.body;
      if (msg && msg.type && this._listeners[msg.type]) {
        if (msg.type === 'request' || msg.type === 'subscribe') {
          this._emit(msg.type, msg, (err, result) => {
            const response = {
              type: 'response',
              id: msg.id,
              error: err ? err.message : null,
              result
            };
            res.json(response);
          });
        } else {
          this._emit(msg.type, msg);
          res.sendStatus(200);
        }
      } else {
        res.sendStatus(400);
      }
    });

    this.app.get('/events', (req, res) => {
      res.set({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive'
      });
      res.flushHeaders();

      const clientId = uuidv4();
      const newClient = { id: clientId, res };
      this.eventClients.push(newClient);

      req.on('close', () => {
        this.eventClients = this.eventClients.filter(c => c.id !== clientId);
      });
    });

    const port = this.serverOptions.port;
    this.server = this.app.listen(port, () => {
      console.log(`HTTP server started on port ${port}`);
    });
  }

  async connect() {
    if (this.isServer) {
      throw new Error("connect() should only be called on a client transport");
    }
    if (!this.clientOptions || !this.clientOptions.url) {
      throw new Error("clientOptions with a valid URL must be provided for client mode");
    }
    // create an SSE connection.
    const EventSource = require('eventsource');
    const eventsUrl = this.clientOptions.url + '/events';
    this.eventSource = new EventSource(eventsUrl);
    
    this.eventSource.onopen = () => {
      console.log("SSE connection established");
    };
    
    this.eventSource.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type && this._listeners[msg.type]) {
          this._emit(msg.type, msg);
        }
      } catch (err) {}
    };
    this.eventSource.onerror = (err) => {
      console.error("EventSource error:", err);
    };
    return;
  }

  async send(message) {
    if (this.isServer) {
      if (message.type === 'event') {
        const data = `data: ${JSON.stringify(message)}\n\n`;
        this.eventClients.forEach(client => {
          client.res.write(data);
        });
      }
      return Promise.resolve();
    } else {
      const axios = require('axios');
      try {
        const response = await axios.post(this.clientOptions.url + '/rpc', message);
        this._emit('response', response.data);
        return Promise.resolve(response.data);
      } catch (err) {
        return Promise.reject(err);
      }
    }
  }

  close() {
    if (this.isServer) {
      if (this.server) {
        this.server.close();
      }
    } else {
      if (this.eventSource) {
        this.eventSource.close();
      }
    }
  }
}

module.exports = HTTPTransport;
