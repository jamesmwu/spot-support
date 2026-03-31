const API_BASE = '/api';

export async function healthCheck() {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Server unreachable');
  return res.json();
}

export async function crawlWebsite(url) {
  const res = await fetch(`${API_BASE}/crawl`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Crawl failed' }));
    throw new Error(err.message);
  }
  return res.json();
}

export async function getKnowledgeBases() {
  const res = await fetch(`${API_BASE}/crawl/status`);
  if (!res.ok) throw new Error('Failed to fetch knowledge bases');
  return res.json();
}

export async function sendMessage(prompt, knowledgeBaseId, history, signal) {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, knowledgeBaseId, history }),
    signal,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Chat request failed' }));
    throw new Error(err.message);
  }
  return res;
}

export async function getChatHistory() {
  const res = await fetch(`${API_BASE}/history`);
  if (!res.ok) throw new Error('Failed to fetch history');
  return res.json();
}

export async function getChatSession(id) {
  const res = await fetch(`${API_BASE}/history/${id}`);
  if (!res.ok) throw new Error('Failed to fetch session');
  return res.json();
}

export async function saveChatSession(session) {
  const res = await fetch(`${API_BASE}/history`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(session),
  });
  if (!res.ok) throw new Error('Failed to save session');
  return res.json();
}

export async function clearHistory() {
  const res = await fetch(`${API_BASE}/history`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to clear history');
  return res.json();
}

export async function deleteSession(id) {
  const res = await fetch(`${API_BASE}/history/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete session');
  return res.json();
}
