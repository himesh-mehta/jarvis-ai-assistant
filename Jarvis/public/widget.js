(function () {
  // ── Get config from script tag ──────────────────────
  const script  = document.currentScript;
  const apiKey  = script.getAttribute('data-key')         || '';
  const name    = script.getAttribute('data-name')        || 'JARVIS';
  const color   = script.getAttribute('data-color')       || '#00E5FF';
  const avatar  = script.getAttribute('data-avatar')      || '🤖';
  const welcome = script.getAttribute('data-welcome')     || '';
  const prompt  = script.getAttribute('data-prompt')      || '';
  const placeholder = script.getAttribute('data-placeholder') || 'Ask me anything...';

  const BASE_URL = 'https://jarvis-ten-gray.vercel.app';

  // ── Build iframe URL ────────────────────────────────
  const params = new URLSearchParams({
    key:         apiKey,
    name,
    color:       color.replace('#', '%23'),
    avatar,
    welcome,
    prompt,
    placeholder,
  });

  const iframeUrl = `${BASE_URL}/widget?${params}`;

  // ── Inject styles ───────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    #jarvis-bubble {
      position:      fixed;
      bottom:        24px;
      right:         24px;
      width:         56px;
      height:        56px;
      border-radius: 50%;
      background:    ${color};
      border:        none;
      cursor:        pointer;
      font-size:     24px;
      display:       flex;
      align-items:   center;
      justify-content: center;
      box-shadow:    0 4px 24px ${color}66;
      z-index:       999999;
      transition:    transform 0.2s, box-shadow 0.2s;
    }
    #jarvis-bubble:hover {
      transform:  scale(1.1);
      box-shadow: 0 4px 32px ${color}99;
    }
    #jarvis-bubble.open {
      transform:  scale(0.9);
    }
    #jarvis-container {
      position:      fixed;
      bottom:        96px;
      right:         24px;
      width:         380px;
      height:        580px;
      border-radius: 20px;
      overflow:      hidden;
      box-shadow:    0 8px 48px rgba(0,0,0,0.5);
      z-index:       999998;
      border:        1px solid ${color}33;
      transform:     scale(0.8) translateY(20px);
      opacity:       0;
      pointer-events: none;
      transition:    transform 0.3s cubic-bezier(0.34,1.56,0.64,1),
                     opacity 0.2s ease;
      transform-origin: bottom right;
    }
    #jarvis-container.open {
      transform:      scale(1) translateY(0);
      opacity:        1;
      pointer-events: all;
    }
    #jarvis-iframe {
      width:   100%;
      height:  100%;
      border:  none;
    }
    #jarvis-badge {
      position:      absolute;
      top:           -2px;
      right:         -2px;
      width:         14px;
      height:        14px;
      background:    #22c55e;
      border-radius: 50%;
      border:        2px solid white;
      display:       none;
    }
    #jarvis-badge.show { display: block; }

    @media (max-width: 480px) {
      #jarvis-container {
        width:         100vw;
        height:        85vh;
        bottom:        0;
        right:         0;
        border-radius: 20px 20px 0 0;
      }
    }
  `;
  document.head.appendChild(style);

  // ── Create bubble button ────────────────────────────
  const bubble = document.createElement('button');
  bubble.id = 'jarvis-bubble';
  bubble.innerHTML = `
    <span id="jarvis-bubble-icon">${avatar}</span>
    <span id="jarvis-badge"></span>
  `;

  // ── Create chat container ───────────────────────────
  const container = document.createElement('div');
  container.id = 'jarvis-container';
  container.innerHTML = `
    <iframe 
      id="jarvis-iframe"
      src="${iframeUrl}"
      title="${name} Chat"
      allow="microphone"
    ></iframe>
  `;

  document.body.appendChild(container);
  document.body.appendChild(bubble);

  // ── Toggle open/close ───────────────────────────────
  let isOpen = false;

  bubble.addEventListener('click', () => {
    isOpen = !isOpen;

    if (isOpen) {
      container.classList.add('open');
      bubble.classList.add('open');
      bubble.innerHTML = `<span style="font-size:20px;color:#000;">✕</span>`;
    } else {
      container.classList.remove('open');
      bubble.classList.remove('open');
      bubble.innerHTML = `
        <span id="jarvis-bubble-icon">${avatar}</span>
      `;
    }
  });

  // ── Auto open after 3 seconds (optional) ───────────
  // setTimeout(() => { if (!isOpen) bubble.click(); }, 3000);

  console.log(`✅ JARVIS Widget loaded — powered by ${BASE_URL}`);
})();