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

const routesToPrerender = ['/info', '/login', '/signup', ...seoRoutes, '/'];

(async () => {
    let serverProcess;
    let browser;
    try {
        console.log('Starting pre-rendering...');

        // Launch sirv to host the built app
        const { spawn } = await import('node:child_process');

        // Using npx sirv start dist --port 4173 --single
        // --single is important for SPA fallback!
        serverProcess = spawn('npx', ['sirv', 'dist', '--port', '4173', '--single', '--host', '127.0.0.1', '--no-clear'], {
            stdio: ['ignore', 'pipe', 'inherit'],
            shell: true
        });

        const url = await new Promise((resolve, reject) => {
            let buffer = '';
            const timeout = setTimeout(() => reject(new Error('Timeout waiting for server URL')), 15000);

            serverProcess.stdout.on('data', (data) => {
                const str = data.toString();
                process.stdout.write(str);
                buffer += str;

                // Match "Local: http://localhost:PORT" or similar
                const match = str.match(/http:\/\/(?:localhost|127\.0\.0\.1):(\d+)/);
                if (match) {
                    clearTimeout(timeout);
                    resolve(`http://127.0.0.1:${match[1]}`);
                }
            });

            serverProcess.on('error', reject);
        });

        console.log(`\nServer detected at ${url}`);

        // Launch Puppeteer
        browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--proxy-server=direct://',
                '--proxy-bypass-list=*'
            ],
        });

        for (const route of routesToPrerender) {
            const page = await browser.newPage();
            try {
                // Set viewport to mobile to match some responsiveness checks if needed, or default
                await page.setViewport({ width: 1280, height: 800 });

                // Mock matchMedia
                await page.evaluateOnNewDocument(() => {
                    Object.defineProperty(window, 'matchMedia', {
                        writable: true,
                        value: window.matchMedia || function () {
                            return {
                                matches: false,
                                addListener: function () { },
                                removeListener: function () { },
                            };
                        }
                    });
                });

                // Capture logs to file
                const logFile = toAbsolute('prerender.log');
                const log = (msg) => fs.appendFileSync(logFile, msg + '\n');

                page.on('console', msg => log(`PAGE LOG [${route}]: ${msg.text()}`));
                page.on('pageerror', err => log(`PAGE ERROR [${route}]: ${err.toString()}`));

                console.log(`Prerendering: ${route}`);
                const targetUrl = `${url}${route}`;

                const response = await page.goto(targetUrl, {
                    waitUntil: 'networkidle0',
                    timeout: 30000
                });

                // Check for valid response
                if (!response || !response.ok()) {
                    throw new Error(`Failed to load ${targetUrl}: ${response ? response.status() : 'No response'}`);
                }

                // Check title to ensure it's not an error page
                const title = await page.title();
                if (title === '127.0.0.1' || title === 'localhost' || title.includes('Error')) {
                    // Verify body content doesn't look like chrome error
                    const content = await page.content();
                    if (content.includes('ERR_CONNECTION_REFUSED') || content.includes('The Chromium Authors')) {
                        throw new Error(`Loaded error page instead of content for ${targetUrl}`);
                    }
                }

                // Ensure directory exists
                const routePath = route === '/' ? '/index.html' : `${route}/index.html`;
                const filePath = toAbsolute(`dist${routePath}`);
                const dirPath = path.dirname(filePath);

                if (!fs.existsSync(dirPath)) {
                    fs.mkdirSync(dirPath, { recursive: true });
                }

                // Get HTML
                const html = await page.content();

                // Basic validation
                if (html.length < 500) {
                    console.warn(`Warning: Generated HTML for ${route} is very short (${html.length} chars).`);
                }

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
        if (serverProcess) {
            // Windows kill might need tree kill or just kill
            try {
                process.kill(serverProcess.pid); // Attempt graceful kill
                // For windows shell spawn, we might need a stronger kill if it spawned a subtree, but usually fine for simple use
            } catch (e) { /* ignore */ }
        }
        // Force exit to ensure no hanging processes
        process.exit(0);
    }
})();
