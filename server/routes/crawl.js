import { Router } from 'express';
import { crawl } from '../lib/crawler.js';
import * as storage from '../lib/storage.js';

const COLLECTION = 'knowledge-bases';
const router = Router();

router.post('/', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ message: 'URL is required' });
  }

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return res.status(400).json({ message: 'Invalid URL' });
  }

  try {
    const pages = await crawl(parsed.href);
    const id = parsed.hostname.replace(/[^a-z0-9]/gi, '-');

    const kb = {
      id,
      url: parsed.origin,
      crawledAt: new Date().toISOString(),
      pageCount: pages.length,
      pages,
    };

    await storage.write(COLLECTION, id, kb);

    res.json({
      id,
      url: parsed.origin,
      pageCount: pages.length,
      crawledAt: kb.crawledAt,
    });
  } catch (err) {
    console.error('Crawl failed:', err);
    res.status(500).json({ message: `Crawl failed: ${err.message}` });
  }
});

router.get('/status', async (_req, res) => {
  try {
    const ids = await storage.list(COLLECTION);
    const knowledgeBases = await Promise.all(
      ids.map(async (id) => {
        const kb = await storage.read(COLLECTION, id);
        return {
          id: kb.id,
          url: kb.url,
          pageCount: kb.pageCount,
          crawledAt: kb.crawledAt,
        };
      }),
    );
    res.json(knowledgeBases);
  } catch (err) {
    console.error('Status fetch failed:', err);
    res.status(500).json({ message: 'Failed to fetch knowledge bases' });
  }
});

export default router;
