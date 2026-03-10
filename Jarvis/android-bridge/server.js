const http = require('http');
const { exec } = require('child_process');

const PORT = 4000;

const APP_PACKAGES = {
    'youtube': 'com.google.android.youtube',
    'whatsapp': 'com.whatsapp',
    'instagram': 'com.instagram.android',
    'spotify': 'com.spotify.music',
    'maps': 'com.google.android.apps.maps',
    'chrome': 'com.android.chrome',
    'camera': ['com.android.camera', 'com.google.android.GoogleCamera', 'com.sec.android.app.camera'],
    'settings': 'com.android.settings',
    'telegram': 'org.telegram.messenger',
    'netflix': 'com.netflix.mediaclient',
    'twitter': 'com.twitter.android',
    'facebook': 'com.facebook.katana',
    'chatgpt': ['com.openai.chatgpt', 'com.openai.chatgpt.android'],
    'canva': 'com.canva.editor'
};

const executeADB = (command) => {
    return new Promise((resolve, reject) => {
        // Try global adb first, then local fallback
        const localPath = process.platform === 'win32'
            ? '.\\android-bridge\\tools\\platform-tools\\adb.exe'
            : './android-bridge/tools/platform-tools/adb';

        exec(`adb ${command}`, (error, stdout, stderr) => {
            if (error) {
                // Try local Path
                exec(`${localPath} ${command}`, (err2, out2, ste2) => {
                    if (err2) {
                        resolve({ success: false, error: ste2 || err2.message || 'ADB not found' });
                    } else {
                        resolve({ success: true, result: out2.trim() });
                    }
                });
            } else {
                resolve({ success: true, result: stdout.trim() });
            }
        });
    });
};

const server = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    if (req.url === '/health' && req.method === 'GET') {
        const status = await executeADB('devices');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'online', adb: status.result }));
        return;
    }

    if (req.url === '/execute' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
            try {
                const { command, params } = JSON.parse(body);
                let result = { success: false, error: 'Unknown command' };

                console.log(`[ADB] Executing: ${command}`, params);

                switch (command) {
                    case 'open_app':
                        const appKey = params.app?.toLowerCase();
                        const pkgs = APP_PACKAGES[appKey] || params.app;
                        const pkgList = Array.isArray(pkgs) ? pkgs : [pkgs];

                        let lastRes;
                        for (const p of pkgList) {
                            lastRes = await executeADB(`shell monkey -p ${p} -c android.intent.category.LAUNCHER 1`);
                            if (lastRes.success) break;
                        }
                        result = lastRes;
                        if (result.success) result.result = `${params.app || 'App'} opened ✅`;
                        break;
                    case 'go_home':
                        result = await executeADB('shell input keyevent 3');
                        break;
                    case 'press_back':
                        result = await executeADB('shell input keyevent 4');
                        break;
                    case 'lock_screen':
                        result = await executeADB('shell input keyevent 26');
                        break;
                    case 'screenshot':
                        const filename = `screenshot_${Date.now()}.png`;
                        await executeADB(`shell screencap -p /sdcard/${filename}`);
                        result = await executeADB(`pull /sdcard/${filename} ./public/screenshots/`);
                        result.result = `/screenshots/${filename}`;
                        break;
                    case 'type_text':
                        const text = params.text.replace(/\s/g, '%s');
                        result = await executeADB(`shell input text "${text}"`);
                        break;
                    case 'set_volume':
                        const vol = Math.floor((params.level / 100) * 15);
                        result = await executeADB(`shell media volume --set ${vol}`);
                        break;
                    case 'set_brightness':
                        const bri = Math.floor((params.level / 100) * 255);
                        result = await executeADB(`shell settings put system screen_brightness ${bri}`);
                        break;
                    case 'wifi':
                        const state = params.state === 'enable' ? 'enable' : 'disable';
                        result = await executeADB(`shell svc wifi ${state}`);
                        break;
                    case 'battery_info':
                        result = await executeADB('shell dumpsys battery | grep level');
                        break;
                    case 'google_search':
                        const query = encodeURIComponent(params.query);
                        result = await executeADB(`shell am start -a android.intent.action.VIEW -d "https://www.google.com/search?q=${query}"`);
                        break;
                    case 'open_youtube_search':
                        const ytQuery = encodeURIComponent(params.query);
                        result = await executeADB(`shell am start -a android.intent.action.VIEW -d "https://www.youtube.com/results?search_query=${ytQuery}"`);
                        break;
                    case 'open_maps':
                        const loc = encodeURIComponent(params.location);
                        result = await executeADB(`shell am start -a android.intent.action.VIEW -d "geo:0,0?q=${loc}"`);
                        break;
                    case 'whatsapp_message':
                        const wpMsg = encodeURIComponent(params.message);
                        result = await executeADB(`shell am start -a android.intent.action.VIEW -d "whatsapp://send?text=${wpMsg}"`);
                        break;
                    case 'call':
                        result = await executeADB(`shell am start -a android.intent.action.CALL -d "tel:${params.number}"`);
                        break;
                }

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(result));
            } catch (e) {
                res.writeHead(500);
                res.end(JSON.stringify({ success: false, error: e.message }));
            }
        });
        return;
    }

    res.writeHead(404);
    res.end();
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 ADB Bridge running at http://localhost:${PORT}`);
    console.log(`📱 Connect your phone and test with: adb devices`);
});
