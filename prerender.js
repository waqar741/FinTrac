import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';
import { preview } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const toAbsolute = (p) => path.resolve(__dirname, p);

// Load SEO targets for SSG
const seoTargets = JSON.parse(fs.readFileSync(toAbsolute('src/data/seo-targets.json'), 'utf-8'));
const seoRoutes = seoTargets.map(t => `/${t.slug}`);

const routesToPrerender = ['/', '/info', '/login', '/signup', ...seoRoutes];

(async () => {
    let previewServer;
    let browser;
    try {
        console.log('Starting pre-rendering...');

        // Launch the server to host the built app
        previewServer = await preview({
            preview: { port: 4173, open: false },
            root: toAbsolute('dist'),
            configFile: false,
        });

        const url = previewServer.resolvedUrls.local[0];
        console.log(`Server started at ${url}`);

        // Launch Puppeteer
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });

        for (const route of routesToPrerender) {
            const page = await browser.newPage();
            try {
                console.log(`Prerendering: ${route}`);
                await page.goto(`${url}${route.slice(1)}`, { waitUntil: 'networkidle0' });

                // Ensure directory exists
                const routePath = route === '/' ? '/index.html' : `${route}/index.html`;
                const filePath = toAbsolute(`dist${routePath}`);
                const dirPath = path.dirname(filePath);

                if (!fs.existsSync(dirPath)) {
                    fs.mkdirSync(dirPath, { recursive: true });
                }

                // Get HTML
                const html = await page.content();

                // Fix paths if needed or inject further scripts here
                // For now, just rewrite the file
                fs.writeFileSync(filePath, html);
                console.log(`Generated: ${filePath}`);
            } catch (e) {
                console.error(`Failed to prerender ${route}:`, e);
            } finally {
                await page.close();
            }
        }
        console.log('Pre-rendering complete.');
    } catch (e) {
        console.error('Pre-rendering failed (skipping):', e.message);
        console.log('Build will continue without pre-rendered pages.');
    } finally {
        if (browser) await browser.close();
        if (previewServer) previewServer.httpServer.close();
        process.exit(0);
    }
})();
