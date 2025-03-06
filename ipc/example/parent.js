const { fork } = require('child_process');
const path = require('path')
const ProxyClient = require('../../ProxyClient');
const IPCTransport = require('../IPCTransport');

async function run() {

  const childScript = path.join(__dirname, 'child.js')
  const child = fork(childScript);

  const transport = new IPCTransport({
    isServer: false,
    childProcess: child
  });

  await transport.connect();
  const client = new ProxyClient(transport);
  const handler = await client.connect();

  // 1. Simple remote method
  const greeting = await handler.hello("IPC world");
  console.log("IPC greeting:", greeting);

  // 2. Subscribe to a continuous event
  await handler.on('heartbeat', (data) => {
    console.log("IPC heartbeat event:", data);
  });

  // 3. Subscribe to a one-time event
  await handler.once('onceEvent', (data) => {
    console.log("Received onceEvent:", data);
  });

  // 4. Trigger the child’s event
  setTimeout(async () => {
    const res = await handler.emitTestEvent("This is a one-time event via IPC");
    console.log("emitTestEvent response:", res);
  }, 3000);

  // 5. Nested call
  const sum = await handler.math.add(10, 5);
  console.log("Nested math.add result:", sum);

  // 6. Promise chaining
  const chainedResult = await handler.chainExample(sum)
    .then(result => handler.math.multiply(result, 2));
  console.log("Chained result (sum * 2):", chainedResult);

  // 7. Error handling for non-existent method
  try {
    await handler.nonExistentMethod();
  } catch (err) {
    console.error("Expected error for non-existent method:", err.message);
  }

  // 8. Promise chaining using .then 
  handler.hello("chained call from parent").then(result => {
    console.log("Promise chaining hello:", result);
  });

  // Close 
  setTimeout(() => {
    console.log("Parent shutting down...");
    client.close();
  }, 10000);
}

run().catch(err => console.error(err));
