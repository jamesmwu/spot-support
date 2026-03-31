import puppeteer from 'puppeteer';

const MAX_PAGES = 10;
const PAGE_TIMEOUT_MS = 15_000;
const MAX_CONTENT_LENGTH = 8_000;

const CONSENT_OVERLAY_SELECTORS = [
  '#CybotCookiebotDialog',
  '#CybotCookiebotDialogBody',
  '#CookiebotWidget',
  '#onetrust-consent-sdk',
  '#onetrust-banner-sdk',
  '#ot-sdk-cookie-policy',
  '.cc-window',
  '.cc-banner',
  '#cookie-notice',
  '#cookie-law-info-bar',
  '#cookie-law-info-again',
  '#gdpr-consent-tool',
  '.gdpr-banner',
  '#qc-cmp2-container',
  '.evidon-banner',
  '#truste-consent-track',
  'dialog[open]',
  '[role="dialog"]',
  '[aria-modal="true"]',
];

const CONSENT_ACCEPT_SELECTORS = [
  '#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll',
  '#CybotCookiebotDialogBodyButtonAccept',
  '[data-cookiebot-response="accept"]',
  '#onetrust-accept-btn-handler',
  '.cc-accept',
  '.cc-allow',
  '.cc-dismiss',
  'button[id*="cookie-accept" i]',
  'button[id*="accept-cookie" i]',
  'button[class*="cookie-accept" i]',
];

const BOILERPLATE_MARKERS = [
  '#iabv2settings',
  'maximum storage duration',
  'necessary cookies enable',
  'preference cookies enable',
  'statistics cookies collect',
  'marketing cookies are used',
  'stores the user\u2019s cookie consent state',
  "stores the user's cookie consent state",
  "used to check if the user's browser supports cookies",
  'used to distinguish between humans and bots',
  'registers statistical data on users',
  'collects statistics on the visitor',
  'cookie is a part of the services provided by cloudflare',
];

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

        await dismissConsentBanners(page);

        const result = await page.evaluate(
          (overlaySelectors, boilerplateMarkers) => {
            for (const sel of overlaySelectors) {
              try {
                document.querySelectorAll(sel).forEach((el) => el.remove());
              } catch {}
            }

            document
              .querySelectorAll('script, style, noscript, iframe')
              .forEach((el) => el.remove());

            const skipAncestors =
              'nav, footer, header, [role="navigation"], [role="banner"], ' +
              '[role="dialog"], [aria-modal="true"], dialog';

            const selectors =
              'h1, h2, h3, h4, h5, h6, p, li, td, th, blockquote, figcaption, summary';

            const mainEl = document.querySelector(
              'main, [role="main"], article',
            );
            const root = mainEl || document.body;

            const elements = root.querySelectorAll(selectors);
            const seen = new Set();
            const parts = [];

            for (const el of elements) {
              if (el.closest(skipAncestors)) continue;
              const text = el.innerText?.trim();
              if (!text || text.length <= 10 || seen.has(text)) continue;

              const lower = text.toLowerCase();
              if (boilerplateMarkers.some((m) => lower.includes(m))) continue;

              seen.add(text);
              parts.push(text);
            }

            const links = [...document.querySelectorAll('a[href]')]
              .map((a) => a.href)
              .filter((href) => href.startsWith(window.location.origin));

            return {
              title: document.title,
              content: parts.join('\n\n'),
              links,
            };
          },
          CONSENT_OVERLAY_SELECTORS,
          BOILERPLATE_MARKERS,
        );

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

async function dismissConsentBanners(page) {
  for (const sel of CONSENT_ACCEPT_SELECTORS) {
    try {
      const btn = await page.$(sel);
      if (btn) {
        await btn.click();
        await new Promise((r) => setTimeout(r, 1000));
        return;
      }
    } catch {}
  }
}

function normalizeUrl(raw) {
  const u = new URL(raw);
  u.hash = '';
  u.search = '';
  return u.href.replace(/\/+$/, '');
}
