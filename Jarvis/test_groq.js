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
        else {
            const data = await res.json();
            console.log('Groq response:', data.choices[0].message.content);
        }
    } catch (e) {
        console.log('Groq fetch failed:', e.message);
    }
}

testGroq();
