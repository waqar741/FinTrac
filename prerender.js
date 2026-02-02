import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const toAbsolute = (p) => path.resolve(__dirname, p);

// Load SEO targets for SSG
const seoTargets = JSON.parse(fs.readFileSync(toAbsolute('src/data/seo-targets.json'), 'utf-8'));
const seoRoutes = seoTargets.map(t => `/${t.slug}`);

const routesToPrerender = ['/info', '/login', '/signup', ...seoRoutes, '/'];

// Detect if running in serverless environment (Vercel)
const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;

async function getBrowser() {
    if (isServerless) {
        // Use puppeteer-core with @sparticuz/chromium for serverless
        console.log('Serverless environment detected, using @sparticuz/chromium...');
        const puppeteerCore = await import('puppeteer-core');
        const chromium = await import('@sparticuz/chromium');

        return await puppeteerCore.default.launch({
            args: chromium.default.args,
            defaultViewport: chromium.default.defaultViewport,
            executablePath: await chromium.default.executablePath(),
            headless: chromium.default.headless,
        });
    } else {
        // Use standard puppeteer for local development
        console.log('Local environment detected, using standard puppeteer...');
        const puppeteer = await import('puppeteer');
        return await puppeteer.default.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--proxy-server=direct://',
                '--proxy-bypass-list=*'
            ],
        });
    }
}

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

        // Launch browser (auto-detects environment)
        browser = await getBrowser();

        for (const route of routesToPrerender) {
            const page = await browser.newPage();
            try {
                // Set viewport
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

                // Capture logs (console only)
                page.on('console', msg => console.log('PAGE LOG:', msg.text()));
                page.on('pageerror', err => console.error('PAGE ERROR:', err.toString()));

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
                    const content = await page.content();
                    if (content.includes('ERR_CONNECTION_REFUSED') || content.includes('The Chromium Authors')) {
                        throw new Error(`Loaded error page instead of content for ${targetUrl}`);
                    }
                }

                // Generate flat file path
                // / -> /index.html
                // /login -> /login.html
                const routePath = route === '/' ? '/index.html' : `${route}.html`;
                const filePath = toAbsolute(`dist${routePath}`);

                // Ensure directory exists
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
            try {
                process.kill(serverProcess.pid);
            } catch (e) { /* ignore */ }
        }
        // Force exit to ensure no hanging processes
        process.exit(0);
    }
})();
