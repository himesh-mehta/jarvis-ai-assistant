require('dotenv').config({ path: '.env.local' });

async function testGroq() {
    const apiKey = process.env.GROQ_API_KEY;
    const url = 'https://api.groq.com/openai/v1/chat/completions';
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [{ role: 'user', content: 'hi' }],
                max_tokens: 10,
            }),
        });
        console.log('Groq status:', res.status);
        if (!res.ok) console.log('Groq error:', await res.text());
    } catch (e) {
        console.log('Groq fetch failed:', e.message);
    }
}

async function testGemini() {
    const apiKey = process.env.GEMINI_API_KEY;
    const url = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'gemini-2.0-flash',
                messages: [{ role: 'user', content: 'hi' }],
                max_tokens: 10,
            }),
        });
        console.log('Gemini status:', res.status);
        if (!res.ok) console.log('Gemini error:', await res.text());
    } catch (e) {
        console.log('Gemini fetch failed:', e.message);
    }
}

testGroq();
testGemini();
