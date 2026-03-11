console.log('JARVIS Content Script Active');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Content script received action:', request.action);
    
    handleAction(request)
        .then(sendResponse)
        .catch(err => sendResponse({ status: 'error', message: err.message }));
        
    return true; // Keep message channel open for async response
});

async function handleAction(action) {
    switch (action.action) {
        case 'click':
            return await clickElement(action.selector);
        case 'type':
            return await typeText(action.selector, action.text);
        case 'scroll':
            window.scrollBy(0, action.amount || 500);
            return { status: 'success' };
        case 'extract':
            return { status: 'success', data: document.body.innerText.substring(0, 5000) };
        default:
            throw new Error('Unknown action: ' + action.action);
    }
}

async function findElement(selector) {
    // Try primary selector
    let element = document.querySelector(selector);
    if (element) return element;

    // Fallback: search by text if selector looks like text
    if (selector.length > 0 && !selector.startsWith('.') && !selector.startsWith('#') && !selector.startsWith('[')) {
        const buttons = Array.from(document.querySelectorAll('button, a, input[type="button"], input[type="submit"]'));
        element = buttons.find(b => b.innerText.toLowerCase().includes(selector.toLowerCase()) || 
                                   b.getAttribute('aria-label')?.toLowerCase().includes(selector.toLowerCase()));
        if (element) return element;
    }

    throw new Error(`Element not found: ${selector}`);
}

async function clickElement(selector) {
    const element = await findElement(selector);
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Simulate natural click
    const rect = element.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    
    element.click();
    return { status: 'success', message: `Clicked ${selector}` };
}

async function typeText(selector, text) {
    const element = await findElement(selector);
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    element.focus();
    
    // Clear and type
    if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
        element.value = '';
        // Natural typing simulation could be added here
        element.value = text;
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
        
        // Handle enter key if requested or if it's a search box
        if (text.endsWith('\n')) {
            element.value = text.trim();
            element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
        }
    } else {
        element.innerText = text;
    }
    
    return { status: 'success', message: `Typed text into ${selector}` };
}