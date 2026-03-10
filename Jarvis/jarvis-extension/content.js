// Content script — runs on every page

// Listen for direct page commands
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "GET_PAGE_TEXT") {
        sendResponse({ text: document.body.innerText.slice(0, 5000) });
    }

    if (message.type === "TYPE_TEXT") {
        const el = document.querySelector(message.selector);
        if (el) {
            el.focus();
            // Handle React controlled inputs
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                window.HTMLTextAreaElement.prototype, 'value'
            )?.set;
            nativeInputValueSetter?.call(el, message.text);
            el.dispatchEvent(new Event('input', { bubbles: true }));
            sendResponse({ success: true });
        } else {
            sendResponse({ success: false, error: "Element not found" });
        }
    }

    if (message.type === "CLICK_ELEMENT") {
        const el = document.querySelector(message.selector);
        if (el) {
            el.click();
            sendResponse({ success: true });
        } else {
            sendResponse({ success: false });
        }
    }

    return true;
});