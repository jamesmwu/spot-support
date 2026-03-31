import puppeteer from 'puppeteer';

const MAX_PAGES = 10;
const PAGE_TIMEOUT_MS = 15_000;
const MAX_CONTENT_LENGTH = 8_000;

export async function crawl(startUrl) {
  const { origin } = new URL(startUrl);
  const visited = new Set();
  const pages = [];
  const queue = [startUrl];

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    while (queue.length > 0 && pages.length < MAX_PAGES) {
      const url = queue.shift();
      const normalized = normalizeUrl(url);

      if (visited.has(normalized)) continue;
      visited.add(normalized);

      const page = await browser.newPage();
      try {
        await page.goto(url, {
          waitUntil: 'networkidle2',
          timeout: PAGE_TIMEOUT_MS,
        });

        const result = await page.evaluate(() => {
          const selectors =
            'h1, h2, h3, h4, h5, h6, p, li, td, th, blockquote, figcaption, summary';
          const elements = document.querySelectorAll(selectors);
          const seen = new Set();
          const parts = [];

          for (const el of elements) {
            if (el.closest('nav, footer, header, [role="navigation"], [role="banner"]'))
              continue;
            const text = el.innerText?.trim();
            if (text && text.length > 10 && !seen.has(text)) {
              seen.add(text);
              parts.push(text);
            }
          }

          const links = [...document.querySelectorAll('a[href]')]
            .map((a) => a.href)
            .filter((href) => href.startsWith(window.location.origin));

          return { title: document.title, content: parts.join('\n\n'), links };
        });

        if (result.content) {
          pages.push({
            url,
            title: result.title,
            content: result.content.slice(0, MAX_CONTENT_LENGTH),
          });
        }

        for (const link of result.links) {
          const norm = normalizeUrl(link);
          if (!visited.has(norm) && norm.startsWith(origin)) {
            queue.push(link);
          }
        }
      } catch (err) {
        console.warn(`Skipping ${url}: ${err.message}`);
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }

  return pages;
}

function normalizeUrl(raw) {
  const u = new URL(raw);
  u.hash = '';
  u.search = '';
  return u.href.replace(/\/+$/, '');
}
