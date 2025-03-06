## Installation

To install dependencies, run:

```
npm install
```

## Testing HTTP Transport

Start the HTTP server:

```
node http/example/http-server.js
```

In another terminal, run the HTTP client:

```
node http/example/http-client.js
```

## Testing WebSocket Transport

Start the WebSocket server:

```
node websocket/example/ws-server.js
```

In another terminal, run the WebSocket client:

```
node websocket/example/ws-client.js
```

## Testing IPC Transport

Run the parent process:

```
node ipc/example/parent.js
```

The parent process will spawn a child process automatically, so there is no need to run the child separately in the IPC example.

