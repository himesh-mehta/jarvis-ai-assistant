// Background service worker — listens for commands from JARVIS

let taskQueue = [];
let isExecuting = false;

// Listen for messages from JARVIS website
chrome.runtime.onMessageExternal.addListener(async (message, sender, sendResponse) => {
    if (message.type === "JARVIS_COMMAND") {
        console.log("[JARVIS] Received command:", message.command);
        taskQueue.push(message);
        if (!isExecuting) {
            executeNext();
        }
        sendResponse({ status: "received" });
    }
    return true;
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "TASK_DONE") {
        console.log("[JARVIS] Task done:", message.result);
        notifyJARVIS(message.result);
        isExecuting = false;
        executeNext();
    }
    return true;
});

async function executeNext() {
    if (taskQueue.length === 0) return;
    isExecuting = true;
    const task = taskQueue.shift();
    await executeTask(task);
}

async function executeTask(task) {
    const steps = task.steps;

    for (const step of steps) {
        await executeStep(step);
        await sleep(2000); // wait between steps
    }
}

async function executeStep(step) {
    switch (step.action) {
        case "open_url":
            const tab = await chrome.tabs.create({ url: step.url });
            await waitForTab(tab.id);
            break;

        case "type_text":
            const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
            await chrome.scripting.executeScript({
                target: { tabId: activeTab.id },
                func: typeInElement,
                args: [step.selector, step.text]
            });
            break;

        case "click":
            const [tab2] = await chrome.tabs.query({ active: true, currentWindow: true });
            await chrome.scripting.executeScript({
                target: { tabId: tab2.id },
                func: clickElement,
                args: [step.selector]
            });
            break;

        case "wait":
            await sleep(step.duration || 3000);
            break;

        case "copy_text":
            const [tab3] = await chrome.tabs.query({ active: true, currentWindow: true });
            const result = await chrome.scripting.executeScript({
                target: { tabId: tab3.id },
                func: copyText,
                args: [step.selector]
            });
            // Store copied text for next step
            await chrome.storage.local.set({ copiedText: result[0].result });
            break;
    }
}

// Injected functions
function typeInElement(selector, text) {
    const el = document.querySelector(selector);
    if (el) {
        el.focus();
        el.value = text;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
    }
    return false;
}

function clickElement(selector) {
    const el = document.querySelector(selector);
    if (el) { el.click(); return true; }
    return false;
}

function copyText(selector) {
    const el = document.querySelector(selector);
    if (el) return el.innerText || el.value;
    return document.body.innerText.slice(0, 5000);
}

function waitForTab(tabId) {
    return new Promise(resolve => {
        chrome.tabs.onUpdated.addListener(function listener(id, info) {
            if (id === tabId && info.status === 'complete') {
                chrome.tabs.onUpdated.removeListener(listener);
                setTimeout(resolve, 1500);
            }
        });
    });
}

function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

function notifyJARVIS(result) {
    // Send result back to JARVIS website
    chrome.storage.local.set({
        jarvisResult: {
            result,
            timestamp: Date.now()
        }
    });
}