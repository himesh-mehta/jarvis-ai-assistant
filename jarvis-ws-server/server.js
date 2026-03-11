const WebSocket = require('ws');
require('dotenv').config();

const port = process.env.PORT || 8080;
const wss = new WebSocket.Server({ port });

const SECRET_TOKEN = process.env.WS_SECRET_TOKEN || 'your-default-secret-token';

// Store connections
const extensions = new Map();
const apps = new Map();

console.log(`WebSocket Server started on port ${port}`);

wss.on('connection', (ws, req) => {
    console.log('New connection attempt...');
    
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            
            // Authentication
            if (data.token !== SECRET_TOKEN) {
                console.log('Unauthorized connection attempt');
                ws.send(JSON.stringify({ type: 'error', message: 'Unauthorized' }));
                ws.terminate();
                return;
            }

            // Register connection type
            if (data.type === 'register') {
                if (data.role === 'extension') {
                    extensions.set(data.id || 'default', ws);
                    console.log(`Extension registered: ${data.id || 'default'}`);
                    ws.send(JSON.stringify({ type: 'status', message: 'Extension linked successfully' }));
                } else if (data.role === 'app') {
                    apps.set(data.id || 'default', ws);
                    console.log(`App registered: ${data.id || 'default'}`);
                    ws.send(JSON.stringify({ type: 'status', message: 'App linked successfully' }));
                }
                return;
            }

            // Route commands from App -> Extension
            if (data.type === 'command') {
                console.log(`Forwarding command to extension: ${data.command.action || 'task'}`);
                const extension = extensions.get(data.targetId || 'default');
                if (extension && extension.readyState === WebSocket.OPEN) {
                    extension.send(JSON.stringify({
                        type: 'command',
                        payload: data.command,
                        requestId: data.requestId
                    }));
                } else {
                    ws.send(JSON.stringify({ type: 'error', message: 'No extension connected' }));
                }
            }

            // Route results from Extension -> App
            if (data.type === 'result') {
                console.log(`Forwarding result to app for requestId: ${data.requestId}`);
                const app = apps.get(data.targetId || 'default');
                if (app && app.readyState === WebSocket.OPEN) {
                    app.send(JSON.stringify({
                        type: 'result',
                        payload: data.payload,
                        requestId: data.requestId
                    }));
                }
            }

            // Keep-alive/Heartbeat
            if (data.type === 'ping') {
                ws.send(JSON.stringify({ type: 'pong' }));
            }

        } catch (err) {
            console.error('Error processing message:', err);
        }
    });

    ws.on('close', () => {
        // Clean up maps (inefficient search, but fine for small number of clients)
        for (let [id, client] of extensions.entries()) {
            if (client === ws) {
                extensions.delete(id);
                console.log(`Extension ${id} disconnected`);
            }
        }
        for (let [id, client] of apps.entries()) {
            if (client === ws) {
                apps.delete(id);
                console.log(`App ${id} disconnected`);
            }
        }
    });
});
