'use client';
import { useState, useEffect, useRef } from 'react';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    provider?: string;
}

const SESSION_ID = 'jarvis-' + Math.random().toString(36).slice(2, 9);

const PROVIDER_COLORS: Record<string, string> = {
    groq: 'text-orange-400',
    gemini: 'text-green-400',
    cohere: 'text-yellow-400',
    huggingface: 'text-pink-400',
};

const PROVIDER_ICONS: Record<string, string> = {
    groq: '⚡',
    gemini: '🤖',
    cohere: '🧠',
    huggingface: '🤗',
};

export default function Chatbot() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        fetch(`/api/history?sessionId=${SESSION_ID}`)
            .then(r => r.json())
            .then(data => setMessages(data.messages || []));
    }, []);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    async function sendMessage() {
        if (!input.trim() || loading) return;

        const currentInput = input;
        const userMsg: Message = { role: 'user', content: currentInput };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        const aiMsg: Message = { role: 'assistant', content: '', provider: undefined };
        setMessages(prev => [...prev, aiMsg]);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: currentInput,
                    sessionId: SESSION_ID,
                    history: messages.slice(-10),
                }),
            });

            if (!res.ok) throw new Error('Failed to fetch');

            const reader = res.body!.getReader();
            const decoder = new TextDecoder();
            let accumulatedData = '';
            let winnerProvider: string | undefined;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                accumulatedData += decoder.decode(value, { stream: true });
                const lines = accumulatedData.split('\n');
                accumulatedData = lines.pop() || '';

                for (const line of lines) {
                    if (!line.trim() || !line.startsWith('data:')) continue;
                    const data = line.replace('data: ', '').trim();
                    if (data === '[DONE]') continue;

                    try {
                        const parsed = JSON.parse(data);
                        if (parsed.content) {
                            if (parsed.provider) winnerProvider = parsed.provider;
                            setMessages(prev => {
                                const newMsgs = [...prev];
                                const last = newMsgs[newMsgs.length - 1];
                                if (last && last.role === 'assistant') {
                                    newMsgs[newMsgs.length - 1] = {
                                        ...last,
                                        content: last.content + parsed.content,
                                        provider: winnerProvider,
                                    };
                                }
                                return newMsgs;
                            });
                        }
                    } catch (e) {
                        console.error('Error parsing chunk:', e);
                    }
                }
            }
        } catch (err) {
            console.error('Chat Error:', err);
            setMessages(prev => {
                const newMsgs = [...prev];
                newMsgs[newMsgs.length - 1] = {
                    role: 'assistant',
                    content: 'Sorry, I encountered an error. Please check your connection or try again later.',
                };
                return newMsgs;
            });
        } finally {
            setLoading(false);
        }
    }

    if (!mounted) return null;

    return (
        <>
            {/* Toggle Button */}
            <button
                onClick={() => setOpen(!open)}
                className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center transform hover:rotate-12"
            >
                {open ? '✕' : '🤖'}
            </button>

            {/* Chat Window */}
            {open && (
                <div className="fixed bottom-24 right-6 z-50 w-[380px] h-[550px] bg-gray-900 rounded-3xl shadow-2xl border border-gray-700 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
                    {/* Header */}
                    <div className="p-4 bg-gray-800 border-b border-gray-700 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">J</div>
                        <div className="flex-1">
                            <div className="text-white text-sm font-bold tracking-wide">JARVIS AI</div>
                            <div className="text-xs text-blue-400 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                4 AI Engines Active
                            </div>
                        </div>
                        <div className="flex gap-1 text-sm">
                            <span title="Groq">⚡</span>
                            <span title="Gemini">🤖</span>
                            <span title="Cohere">🧠</span>
                            <span title="HuggingFace">🤗</span>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-700">
                        {messages.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-gray-500 text-center space-y-3 p-6">
                                <div className="text-4xl">🤖</div>
                                <div className="text-sm">Hello! I'm JARVIS. How can I help you today?</div>
                                <div className="text-xs text-gray-600 bg-gray-800 rounded-xl p-3 border border-gray-700">
                                    Powered by <span className="text-orange-400">⚡ Groq</span>, <span className="text-green-400">🤖 Gemini</span>, <span className="text-yellow-400">🧠 Cohere</span> & <span className="text-pink-400">🤗 HuggingFace</span>
                                </div>
                            </div>
                        )}
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                                    msg.role === 'user'
                                        ? 'bg-blue-600 text-white rounded-tr-none shadow-md'
                                        : 'bg-gray-800 text-gray-200 border border-gray-700 rounded-tl-none shadow-sm'
                                }`}>
                                    {msg.content || (
                                        <div className="flex gap-1 py-1 items-center">
                                            <span className="text-xs text-gray-500 mr-1">Racing AIs</span>
                                            <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" />
                                            <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                                            <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                                        </div>
                                    )}
                                </div>
                                {/* Winner badge */}
                                {msg.role === 'assistant' && msg.provider && msg.content && (
                                    <div className={`mt-1 text-[10px] flex items-center gap-1 ${PROVIDER_COLORS[msg.provider] || 'text-gray-500'}`}>
                                        <span>{PROVIDER_ICONS[msg.provider] || '🤖'}</span>
                                        <span className="capitalize">{msg.provider} won</span>
                                    </div>
                                )}
                            </div>
                        ))}
                        <div ref={bottomRef} />
                    </div>

                    {/* Input Area */}
                    <form
                        onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
                        className="p-3 border-t border-gray-700 flex gap-2 bg-gray-900"
                    >
                        <input
                            className="flex-1 bg-gray-800 text-white text-sm rounded-xl px-4 py-2.5 outline-none border border-gray-700 focus:border-blue-500 transition-colors"
                            placeholder="Type a message..."
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            disabled={loading}
                            autoFocus
                        />
                        <button
                            type="submit"
                            disabled={loading || !input.trim()}
                            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90"
                        >
                            {loading ? (
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <span className="text-xl">↑</span>
                            )}
                        </button>
                    </form>
                </div>
            )}
        </>
    );
}