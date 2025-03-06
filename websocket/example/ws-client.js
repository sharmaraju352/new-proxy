const WebSocketTransport = require('../WebSocketTransport');
const ProxyClient = require('../../ProxyClient');

async function run() {
  const transport = new WebSocketTransport({ 
    clientOptions: { url: 'ws://localhost:3001' } 
  });
  await transport.connect();
  const client = new ProxyClient(transport);
  const handler = await client.connect();
  
  const greeting = await handler.hello("world");
  console.log("WebSocket Greeting:", greeting);

  await handler.on('heartbeat', (data) => {
    console.log("WebSocket heartbeat event:", data);
  });

  await handler.once('onceEvent', (data) => {
    console.log("Received onceEvent:", data);
  });

  // Trigger the onceEvent from the server
  setTimeout(async () => {
    const res = await handler.emitTestEvent("This is a one-time event");
    console.log("emitTestEvent response:", res);
  }, 3000);

  // error handling with a non-existent method
  try {
    await handler.nonExistentMethod();
  } catch (err) {
    console.error(err.message);
  }
}

run().catch(err => console.error(err));
