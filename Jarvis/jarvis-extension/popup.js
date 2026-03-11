document.addEventListener('DOMContentLoaded', () => {
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    const wsUrlInput = document.getElementById('wsUrl');
    const wsTokenInput = document.getElementById('wsToken');
    const saveBtn = document.getElementById('saveBtn');

    // Load saved settings
    chrome.storage.local.get(['wsUrl', 'wsToken', 'connectionStatus'], (result) => {
        if (result.wsUrl) wsUrlInput.value = result.wsUrl;
        if (result.wsToken) wsTokenInput.value = result.wsToken;
        if (result.connectionStatus) updateStatusUI(result.connectionStatus);
    });

    saveBtn.addEventListener('click', () => {
        const url = wsUrlInput.value;
        const token = wsTokenInput.value;
        
        chrome.storage.local.set({ wsUrl: url, wsToken: token }, () => {
            chrome.runtime.sendMessage({ type: 'UPDATE_CONFIG', url, token });
            saveBtn.innerText = 'Saved!';
            setTimeout(() => { saveBtn.innerText = 'Save & Connect'; }, 2000);
        });
    });

    // Listen for status updates from background
    chrome.runtime.onMessage.addListener((message) => {
        if (message.type === 'STATUS_UPDATE') {
            updateStatusUI(message.status);
        }
    });

    function updateStatusUI(status) {
        statusDot.className = `dot ${status}`;
        statusText.innerText = status.charAt(0).toUpperCase() + status.slice(1);
    }
});