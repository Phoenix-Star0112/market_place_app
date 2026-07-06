const { chromium } = require('playwright');
const path = require('path');
const fs   = require('fs');
const OUT  = '/tmp/grailmarket-screenshots';
const BASE = 'http://localhost:5000';

async function shot(page, name) {
  await page.waitForTimeout(2500);
  await page.screenshot({ path: path.join(OUT, name + '.png'), fullPage: true });
  console.log('✓', name);
}

async function run() {
  const browser = await chromium.launch({ headless: true });

  // Admin pages (alice is ADMIN)
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/login', { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]',    'alice@grailmarket.io');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  console.log('Logged in as alice (ADMIN), at:', page.url());

  for (const [name, url] of [
    ['18-admin-overview', '/admin?tab=overview'],
    ['19-admin-users',    '/admin?tab=users'],
    ['23-admin-disputes', '/admin?tab=disputes'],
    ['16-messages',       '/messages'],
    ['08-disputes',       '/disputes'],
    ['13-buyer-saved',    '/buyer/saved'],
    ['17-transactions',   '/transactions'],
    ['21-profile',        '/profile/me'],
  ]) {
    await page.goto(BASE + url, { waitUntil: 'networkidle', timeout: 20000 });
    await shot(page, name);
  }

  // Grail detail with offers visible (alice is buyer for LeBron grail)
  const r = await fetch(BASE + '/api/grails?limit=1');
  const d = await r.json();
  const grailId = d.grails?.[0]?.id;
  if (grailId) {
    await page.goto(BASE + '/grails/' + grailId, { waitUntil: 'networkidle', timeout: 20000 });
    await shot(page, '20-grail-detail');
  }

  await ctx.close();
  await browser.close();
  console.log('\n✅ Done');
}

run().catch(e => { console.error(e.message); process.exit(1); });
