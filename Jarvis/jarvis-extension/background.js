let socket = null;
let reconnectInterval = 5000;
let config = {
    url: 'wss://jarvis-ws-server-production.up.railway.app', // Placeholder, user will update via popup
    token: 'your-secret-token'
};

// Initialize config from storage
chrome.storage.local.get(['wsUrl', 'wsToken'], (result) => {
    if (result.wsUrl) config.url = result.wsUrl;
    if (result.wsToken) config.token = result.wsToken;
    connect();
});

function connect() {
    console.log(`Connecting to ${config.url}...`);
    socket = new WebSocket(config.url);

    socket.onopen = () => {
        console.log('Connected to WebSocket server');
        socket.send(JSON.stringify({
            type: 'register',
            role: 'extension',
            id: 'default',
            token: config.token
        }));
        updatePopupStatus('connected');
    };

    socket.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        console.log('Received message:', data);

        if (data.type === 'command') {
            const result = await executeCommand(data.payload);
            socket.send(JSON.stringify({
                type: 'result',
                targetId: 'default',
                requestId: data.requestId,
                payload: result,
                token: config.token
            }));
        }
    };

    socket.onclose = () => {
        console.log('Disconnected. Reconnecting...');
        updatePopupStatus('disconnected');
        setTimeout(connect, reconnectInterval);
    };

    socket.onerror = (err) => {
        console.error('WebSocket error:', err);
        socket.close();
    };
}

function updatePopupStatus(status) {
    chrome.storage.local.set({ connectionStatus: status });
    chrome.runtime.sendMessage({ type: 'STATUS_UPDATE', status });
}

async function executeCommand(command) {
    console.log('Executing action:', command.action);
    
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        switch (command.action) {
            case 'navigate':
                await chrome.tabs.update(tab.id, { url: command.url });
                return await waitForComplete(tab.id);

            case 'click':
            case 'type':
            case 'scroll':
            case 'extract':
                return await sendMessageToTab(tab.id, command);

            case 'screenshot':
                return await captureScreenshot();

            case 'wait':
                await new Promise(r => setTimeout(r, command.ms || 1000));
                return { status: 'success', message: `Waited for ${command.ms}ms` };

            default:
                return { status: 'error', message: `Unknown action: ${command.action}` };
        }
    } catch (err) {
        return { status: 'error', message: err.message };
    }
}

async function waitForComplete(tabId) {
    return new Promise((resolve) => {
        const listener = (id, info) => {
            if (id === tabId && info.status === 'complete') {
                chrome.tabs.onUpdated.removeListener(listener);
                resolve({ status: 'success', message: 'Navigation complete' });
            }
        };
        chrome.tabs.onUpdated.addListener(listener);
        // Timeout
        setTimeout(() => {
            chrome.tabs.onUpdated.removeListener(listener);
            resolve({ status: 'success', message: 'Navigation timed out but continuing' });
        }, 15000);
    });
}

async function sendMessageToTab(tabId, message) {
    return new Promise((resolve) => {
        chrome.tabs.sendMessage(tabId, message, (response) => {
            if (chrome.runtime.lastError) {
                resolve({ status: 'error', message: chrome.runtime.lastError.message });
            } else {
                resolve(response);
            }
        });
    });
}

async function captureScreenshot() {
    return new Promise((resolve) => {
        chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
            resolve({ status: 'success', screenshot: dataUrl });
        });
    });
}

// Listen for config updates from popup
chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'UPDATE_CONFIG') {
        config.url = message.url;
        config.token = message.token;
        if (socket) socket.close(); // Force reconnect
    }
});