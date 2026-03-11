export interface ParsedCommand {
  command:   string;
  params:    Record<string, any>;
  isCommand: boolean;
  steps?:    any[];      // for multi-step agent tasks
}

export function parseCommand(message: string): ParsedCommand {
  const msg = message.toLowerCase().trim();

  // ── YouTube search ────────────────────────────────
  const ytSearch = msg.match(/open youtube.*?search\s+(.+)/i)
                || msg.match(/search (.+) on youtube/i)
                || msg.match(/youtube search (.+)/i);
  if (ytSearch) return {
    command: 'open_youtube_search',
    params:  { query: ytSearch[1] },
    isCommand: true,
  };

  // ── Open app ──────────────────────────────────────
  const openApp = msg.match(/^open (.+?)(?:\s+app)?$/i)
               || msg.match(/^launch (.+?)(?:\s+app)?$/i);
  if (openApp) return {
    command: 'open_app',
    params:  { app: openApp[1].trim() },
    isCommand: true,
  };

  // ── Google search ─────────────────────────────────
  const gSearch = msg.match(/^(?:google|search for|search)\s+(.+)/i);
  if (gSearch) return {
    command: 'google_search',
    params:  { query: gSearch[1] },
    isCommand: true,
  };

  // ── Volume ────────────────────────────────────────
  const vol = msg.match(/(?:set )?volume\s+(?:to\s+)?(\d+)/i);
  if (vol) return {
    command: 'set_volume',
    params:  { level: parseInt(vol[1]) },
    isCommand: true,
  };

  // ── Brightness ────────────────────────────────────
  const bright = msg.match(/(?:set )?brightness\s+(?:to\s+)?(\d+)/i);
  if (bright) return {
    command: 'set_brightness',
    params:  { level: parseInt(bright[1]) },
    isCommand: true,
  };

  // ── Screenshot ────────────────────────────────────
  if (/take (?:a )?screenshot|screenshot/i.test(msg)) return {
    command: 'screenshot',
    params:  {},
    isCommand: true,
  };

  // ── WiFi ──────────────────────────────────────────
  const wifi = msg.match(/(?:turn |switch )?(on|off|enable|disable) wifi/i);
  if (wifi) return {
    command: 'wifi',
    params:  { state: ['on','enable'].includes(wifi[1]) ? 'enable' : 'disable' },
    isCommand: true,
  };

  // ── Maps ──────────────────────────────────────────
  const maps = msg.match(/navigate to (.+)/i)
            || msg.match(/(.+?) on maps/i);
  if (maps) return {
    command: 'open_maps',
    params:  { location: maps[1] },
    isCommand: true,
  };

  // ── Call ──────────────────────────────────────────
  const call = msg.match(/call\s+(\+?[\d\s]+)/i);
  if (call) return {
    command: 'call',
    params:  { number: call[1].replace(/\s/g, '') },
    isCommand: true,
  };

  // ── WhatsApp ──────────────────────────────────────
  const wa = msg.match(/(?:send|whatsapp)\s+(.+?)\s+(?:to|message)\s+(.+)/i);
  if (wa) return {
    command: 'whatsapp_message',
    params:  { message: wa[1], contact: wa[2] },
    isCommand: true,
  };

  // ── Spotify ───────────────────────────────────────
  const spotify = msg.match(/play (.+?) on spotify/i)
               || msg.match(/spotify (.+)/i);
  if (spotify) return {
    command: 'spotify_search',
    params:  { query: spotify[1] },
    isCommand: true,
  };

  // ── Lock/Home/Back ────────────────────────────────
  if (/lock (?:the )?(?:screen|phone)/i.test(msg))
    return { command: 'lock_screen',  params: {}, isCommand: true };
  if (/go (?:to )?home|home screen/i.test(msg))
    return { command: 'go_home',      params: {}, isCommand: true };
  if (/go back|press back/i.test(msg))
    return { command: 'press_back',   params: {}, isCommand: true };
  if (/battery|charge/i.test(msg))
    return { command: 'battery_info', params: {}, isCommand: true };

  // ── Browser Automation detection ───────────────────
  const isBrowserTask = /open\s+.+\s+and\s+(?:do|click|type|generate|search|find)|go\s+to\s+.+\s+and\s+(?:click|type|search)|automate\s+.+|generate\s+.+\s+on\s+lovable|search\s+.+\s+on\s+google/i.test(msg);
  if (isBrowserTask) return {
    command:   'browser_task',
    params:    { task: message },
    isCommand: true,
  };

  // ── Multi-step detection ──────────────────────────
  const isMultiStep = /and then|after that|then |first |finally|generate.*and|open.*and/i.test(msg);
  if (isMultiStep) return {
    command:   'agent_task',
    params:    { task: message },
    isCommand: true,
  };

  return { command: '', params: {}, isCommand: false };
}