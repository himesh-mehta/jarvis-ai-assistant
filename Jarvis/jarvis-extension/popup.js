// Update popup with current task status
chrome.storage.local.get(['currentTask', 'jarvisResult'], (data) => {
    if (data.currentTask) {
        document.getElementById('currentTask').style.display = 'block';
        document.getElementById('taskText').textContent = data.currentTask;
    }

    if (data.jarvisResult) {
        document.getElementById('statusText').textContent = 'Last task completed ✅';
        document.getElementById('statusDot').style.background = '#22c55e';
    }
});