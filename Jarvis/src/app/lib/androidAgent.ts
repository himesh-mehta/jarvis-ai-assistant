// AI Agent — breaks complex tasks into ADB steps
export async function runAgentTask(
  task:      string,
  groqKey:   string,
  onStep:    (step: string) => void,
  onDone:    (result: string) => void,
  onError:   (error: string) => void,
) {
  try {
    // ── Ask Groq to break task into steps ────────────
    onStep('🧠 Analyzing task...');

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization:  `Bearer ${groqKey}`,
      },
      body: JSON.stringify({
        model:       'llama-3.3-70b-versatile',
        max_tokens:  1000,
        temperature: 0,
        messages: [{
          role:    'system',
          content: `You are an Android automation agent.
Break the user's task into a sequence of ADB commands.

Available commands:
- open_app: { app: "youtube|whatsapp|instagram|spotify|maps|chrome|camera|settings|chatgpt|canva" }
- type_text: { text: "..." }
- wait: { ms: 2000 }
- screenshot: {}
- go_home: {}
- press_back: {}
- google_search: { query: "..." }
- open_youtube_search: { query: "..." }
- set_volume: { level: 0-100 }
- lock_screen: {}
- copy_text: {}
- paste_text: {}

Return ONLY valid JSON array of steps, no markdown:
[
  { "command": "open_app", "params": { "app": "chatgpt" }, "description": "Opening ChatGPT" },
  { "command": "wait", "params": { "ms": 2000 }, "description": "Waiting for app to load" },
  { "command": "type_text", "params": { "text": "Give me a creative nature art prompt" }, "description": "Typing request" }
]`
        }, {
          role:    'user',
          content: `Task: ${task}`,
        }],
      }),
    });

    const data    = await res.json();
    const content = data.choices?.[0]?.message?.content || '[]';

    let steps: any[];
    try {
      steps = JSON.parse(content.replace(/```json|```/g, '').trim());
    } catch {
      throw new Error('Could not parse agent steps');
    }

    onStep(`📋 Found ${steps.length} steps to execute...`);

    // ── Execute each step ─────────────────────────────
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      onStep(`⚡ Step ${i + 1}/${steps.length}: ${step.description || step.command}`);

      if (step.command === 'wait') {
        await new Promise(r => setTimeout(r, step.params?.ms || 2000));
        continue;
      }

      // Send to ADB bridge
      const execRes = await fetch('/api/android', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          command: step.command,
          params:  step.params || {},
        }),
      });

      const execData = await execRes.json();
      if (!execData.success && !step.optional) {
        console.warn(`Step failed: ${step.command}`, execData.error);
      }

      // Wait between steps
      await new Promise(r => setTimeout(r, 1500));
    }

    onDone(`✅ Task completed! Executed ${steps.length} steps successfully.`);

  } catch (err: any) {
    onError(`❌ Agent failed: ${err.message}`);
  }
}