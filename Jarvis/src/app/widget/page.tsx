'use client';

import { useState, useEffect, useRef } from 'react';

export default function WidgetPage() {
const [messages, setMessages] = useState
<
  { role: string; content: string }[]
>([]);
  const [input,   setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const [config,  setConfig]  = useState({
    name:        'JARVIS',
    color:       '#00E5FF',
    avatar:      '🤖',
    apiKey:      '',
    placeholder: 'Ask me anything...',
    systemPrompt: '',
  });
  const bottomRef = useRef<HTMLDivElement>(null);

  // Get config from URL params
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setConfig({
      name:         p.get('name')        || 'JARVIS',
      color:        p.get('color')       || '#00E5FF',
      avatar:       p.get('avatar')      || '🤖',
      apiKey:       p.get('key')         || '',
      placeholder:  p.get('placeholder') || 'Ask me anything...',
      systemPrompt: p.get('prompt')      || '',
    });

    // Welcome message
    const welcome = p.get('welcome') || `Hi! I'm ${p.get('name') || 'JARVIS'}. How can I help?`;
    setMessages([{ role: 'assistant', content: welcome }]);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');

    const newMessages = [
      ...messages,
      { role: 'user', content: userMsg },
    ];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch(
        `${window.location.origin}/api/widget`,
        {
          method:  'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key':    config.apiKey,
          },
          body: JSON.stringify({
            message:      userMsg,
            history:      messages.slice(-10),
            systemPrompt: config.systemPrompt,
          }),
        }
      );

      const data = await res.json();
      setMessages([
        ...newMessages,
        { role: 'assistant', content: data.message || data.error },
      ]);
    } catch {
      setMessages([
        ...newMessages,
        { role: 'assistant', content: 'Sorry, something went wrong.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display:        'flex',
      flexDirection:  'column',
      height:         '100vh',
      background:     '#020617',
      fontFamily:     'system-ui, sans-serif',
      margin:         0,
      padding:        0,
    }}>
      {/* Header */}
      <div style={{
        padding:      '12px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        display:      'flex',
        alignItems:   'center',
        gap:          '10px',
        background:   '#0a1628',
      }}>
        <span style={{ fontSize: 24 }}>{config.avatar}</span>
        <div>
          <div style={{
            color:      config.color,
            fontWeight: 800,
            fontSize:   14,
            letterSpacing: 1,
          }}>
            {config.name}
          </div>
          <div style={{
            color:    'rgba(255,255,255,0.3)',
            fontSize: 10,
          }}>
            AI Assistant • Online
          </div>
        </div>
        <div style={{
          marginLeft:   'auto',
          width:        8,
          height:       8,
          borderRadius: '50%',
          background:   '#22c55e',
          boxShadow:    '0 0 6px #22c55e',
        }} />
      </div>

      {/* Messages */}
      <div style={{
        flex:       1,
        overflowY:  'auto',
        padding:    '16px',
        display:    'flex',
        flexDirection: 'column',
        gap:        '10px',
      }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            display:       'flex',
            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
          }}>
            <div style={{
              maxWidth:     '80%',
              padding:      '10px 14px',
              borderRadius: msg.role === 'user'
                ? '16px 16px 4px 16px'
                : '16px 16px 16px 4px',
              background: msg.role === 'user'
                ? `${config.color}22`
                : 'rgba(255,255,255,0.05)',
              border: msg.role === 'user'
                ? `1px solid ${config.color}44`
                : '1px solid rgba(255,255,255,0.08)',
              color:      'rgba(255,255,255,0.9)',
              fontSize:   13,
              lineHeight: 1.5,
            }}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', gap: 4, padding: '8px 4px' }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width:        6,
                height:       6,
                borderRadius: '50%',
                background:   config.color,
                animation:    `bounce 1s ${i * 0.2}s infinite`,
                opacity:      0.7,
              }} />
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        padding:      '12px',
        borderTop:    '1px solid rgba(255,255,255,0.08)',
        display:      'flex',
        gap:          '8px',
        background:   '#0a1628',
      }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder={config.placeholder}
          style={{
            flex:         1,
            background:   'rgba(255,255,255,0.05)',
            border:       '1px solid rgba(255,255,255,0.1)',
            borderRadius: '10px',
            padding:      '10px 14px',
            color:        'white',
            fontSize:     13,
            outline:      'none',
          }}
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          style={{
            background:   loading ? 'rgba(255,255,255,0.1)' : config.color,
            color:        loading ? 'white' : '#000',
            border:       'none',
            borderRadius: '10px',
            padding:      '10px 16px',
            fontWeight:   800,
            cursor:       loading ? 'not-allowed' : 'pointer',
            fontSize:     13,
          }}
        >
          {loading ? '...' : '↑'}
        </button>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-4px); }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
      `}</style>
    </div>
  );
}