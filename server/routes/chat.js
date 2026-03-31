import { Router } from 'express';
import OpenAI from 'openai';
import * as storage from '../lib/storage.js';

const COLLECTION = 'knowledge-bases';
const router = Router();

function buildContext(kb) {
  return kb.pages
    .map((p) => `--- ${p.title} (${p.url}) ---\n${p.content}`)
    .join('\n\n');
}

router.post('/', async (req, res) => {
  const { prompt, knowledgeBaseId, history } = req.body;

  if (!prompt) {
    return res.status(400).json({ message: 'Prompt is required' });
  }
  if (!knowledgeBaseId) {
    return res.status(400).json({ message: 'Knowledge base ID is required' });
  }
  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ message: 'OPENAI_API_KEY is not configured on the server' });
  }

  let kb;
  try {
    kb = await storage.read(COLLECTION, knowledgeBaseId);
  } catch {
    return res.status(404).json({ message: 'Knowledge base not found' });
  }

  const context = buildContext(kb);

  const messages = [
    {
      role: 'system',
      content: [
        `You are a helpful support assistant for ${kb.url}.`,
        'Answer questions using ONLY the knowledge base content below.',
        'If the answer is not in the knowledge base, say so honestly.',
        'Be concise and helpful.\n',
        context,
      ].join(' '),
    },
  ];

  if (Array.isArray(history)) {
    for (const msg of history) {
      messages.push({ role: msg.role, content: msg.content });
    }
  }

  messages.push({ role: 'user', content: prompt });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const stream = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    console.error('OpenAI error:', err);
    if (!res.headersSent) {
      res.status(500).json({ message: `OpenAI error: ${err.message}` });
    } else {
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    }
  }
});

export default router;
