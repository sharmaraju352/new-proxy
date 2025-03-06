const WebSocketTransport = require('../WebSocketTransport');
const ProxyClient = require('../../ProxyClient');

async function run() {
  const transport = new WebSocketTransport({ url: 'ws://localhost:3001' });
  await transport.start();
  const client = new ProxyClient(transport);
  const handler = await client.connect();
  
  const greeting = await handler.hello("world");
  console.log("WebSocket Greeting:", greeting);
  
  await handler.on('heartbeat', (data) => {
    console.log("WebSocket heartbeat event:", data);
  });
  
  setTimeout(() => {
    client.close();
  }, 15000);
}

run().catch(err => console.error(err));
