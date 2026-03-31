# SpotSupport

SpotSupport is an AI-powered support chat tool. Point it at any website, and it will crawl and index the site's content into a knowledge base. You can then ask questions about the site and get answers grounded in the indexed content, powered by OpenAI.

## Tech Stack

- **Frontend:** React + Vite
- **Backend:** Express, Puppeteer (web crawling), OpenAI API (chat)
- **Storage:** JSON files on disk (no database required)

## Setup

1. **Install dependencies:**

   ```sh
   npm install
   ```

2. **Configure environment variables:**

   Copy `.env.example` to `.env` and add your OpenAI API key:

   ```sh
   cp .env.example .env
   ```

   Then edit `.env`:

   ```
   OPENAI_API_KEY=sk-...
   PORT=3001
   ```

3. **Start the dev server:**

   ```sh
   npm run dev
   ```

   This launches both the Vite frontend (port 5173) and the Express backend (port 3001) concurrently.

## Usage

1. Enter a website URL and click **Index Site** to crawl it.
2. Once indexing completes, ask questions in the chat and get answers based on the site's content.
3. Switch between indexed knowledge bases in the sidebar.
