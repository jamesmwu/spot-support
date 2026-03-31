import { Router } from 'express';
import * as storage from '../lib/storage.js';

const COLLECTION = 'chat-history';
const router = Router();

router.get('/', async (_req, res) => {
  try {
    const ids = await storage.list(COLLECTION);
    const sessions = await Promise.all(ids.map((id) => storage.read(COLLECTION, id)));
    sessions.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const session = await storage.read(COLLECTION, req.params.id);
    res.json(session);
  } catch {
    res.status(404).json({ message: 'Session not found' });
  }
});

router.post('/', async (req, res) => {
  const { id, knowledgeBaseId, messages } = req.body;
  if (!id || !knowledgeBaseId || !Array.isArray(messages)) {
    return res.status(400).json({ message: 'id, knowledgeBaseId, and messages[] are required' });
  }
  const session = { id, knowledgeBaseId, messages, updatedAt: new Date().toISOString() };
  try {
    await storage.write(COLLECTION, id, session);
    res.json(session);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/', async (_req, res) => {
  try {
    await storage.removeAll(COLLECTION);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await storage.remove(COLLECTION, req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
