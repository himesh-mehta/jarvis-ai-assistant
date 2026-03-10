// Simple polyfills for browser-only APIs to prevent SSR and Serverless Function crashes
if (typeof window === 'undefined') {
    if (typeof global.DOMMatrix === 'undefined') {
        (global as any).DOMMatrix = class DOMMatrix {
            constructor() { }
        };
    }
    if (typeof global.ImageData === 'undefined') {
        (global as any).ImageData = class ImageData {
            constructor() { }
        };
    }
    if (typeof global.Path2D === 'undefined') {
        (global as any).Path2D = class Path2D {
            constructor() { }
        };
    }
}
export { };
