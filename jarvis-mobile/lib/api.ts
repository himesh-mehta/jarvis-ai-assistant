import { auth } from './firebase';
import { API_URL } from '../constants/config';

async function getToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}

export async function sendMessage(
  message:   string,
  sessionId: string,
  history:   { role: string; content: string }[],
  onChunk:   (text: string) => void,
): Promise<void> {
  const token = await getToken();
  if (!token) throw new Error('Not authenticated');

  const res = await fetch(`${API_URL}/api/chat`, {
    method:  'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization:  `Bearer ${token}`,
    },
    body: JSON.stringify({ message, sessionId, history }),
  });

  if (!res.ok) throw new Error(`API error: ${res.status}`);

  const reader  = res.body!.getReader();
  const decoder = new TextDecoder();
  let   buffer  = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      if (!line.startsWith('data:')) continue;
      const data = line.replace('data: ', '').trim();
      if (data === '[DONE]') continue;
      try {
        const parsed = JSON.parse(data);
        if (parsed.content) onChunk(parsed.content);
      } catch {}
    }
  }
}

export async function getChatHistory() {
  const token = await getToken();
  if (!token) return { sessions: [] };
  const res = await fetch(`${API_URL}/api/history`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function deleteChat(sessionId: string) {
  const token = await getToken();
  if (!token) return;
  await fetch(`${API_URL}/api/history`, {
    method:  'DELETE',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify({ sessionId }),
  });
}

export async function executeAndroidCommand(
  command: string,
  params:  Record<string, any> = {}
) {
  const token = await getToken();
  if (!token) throw new Error('Not authenticated');
  const res = await fetch(`${API_URL}/api/android`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body:    JSON.stringify({ command, params }),
  });
  return res.json();
}