const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const OUT  = '/tmp/grailmarket-screenshots';
const BASE = 'http://localhost:5000';
fs.mkdirSync(OUT, { recursive: true });

async function shot(page, name, waitMs = 3000) {
  await page.waitForTimeout(waitMs);
  // If we got redirected to login, wait a bit more for session
  if (page.url().includes('/login') || page.url().includes('/api/auth')) {
    await page.waitForTimeout(3000);
  }
  await page.screenshot({ path: path.join(OUT, name + '.png'), fullPage: true });
  console.log(`✓ ${name}  [${page.url().replace(BASE,'')}]`);
}

async function loginAs(ctx, email) {
  const page = await ctx.newPage();
  await page.goto(BASE + '/login', { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  // Wait for dashboard redirect
  try {
    await page.waitForURL('**/dashboard', { timeout: 8000 });
  } catch {
    await page.waitForTimeout(4000);
  }
  console.log(`  Logged in as ${email}, at: ${page.url()}`);
  return page;
}

async function run() {
  const browser = await chromium.launch({ headless: true });

  // ── Public pages ────────────────────────────────────────────────────────
  console.log('\n── Public pages ──');
  const pubCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  for (const [name, url] of [
    ['01-home',       '/'],
    ['02-browse',     '/grails'],
    ['03-trending',   '/trending'],
    ['04-howitworks', '/how-it-works'],
    ['05-login',      '/login'],
    ['06-register',   '/register'],
    ['07-verify',     '/verify'],
    ['09-404',        '/does-not-exist'],
  ]) {
    const p = await pubCtx.newPage();
    await p.goto(BASE + url, { waitUntil: 'networkidle', timeout: 20000 });
    await shot(p, name);
    await p.close();
  }
  await pubCtx.close();

  // ── Alice as BUYER ──────────────────────────────────────────────────────
  console.log('\n── Buyer (alice) ──');
  const buyerCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const buyerPage = await loginAs(buyerCtx, 'alice@grailmarket.io');

  for (const [name, url] of [
    ['10-buyer-dashboard', '/buyer/dashboard'],
    ['11-buyer-requests',  '/buyer/requests'],
    ['12-buyer-create',    '/buyer/create'],
    ['13-buyer-saved',     '/buyer/saved'],
    ['16-messages',        '/messages'],
    ['08-disputes',        '/disputes'],
    ['17-transactions',    '/transactions'],
  ]) {
    await buyerPage.goto(BASE + url, { waitUntil: 'networkidle', timeout: 20000 });
    await shot(buyerPage, name, 4000);
  }

  // Grail detail
  const apiRes = await fetch(BASE + '/api/grails?limit=1');
  const apiData = await apiRes.json();
  const grailId = apiData.grails?.[0]?.id;
  if (grailId) {
    await buyerPage.goto(BASE + '/grails/' + grailId, { waitUntil: 'networkidle', timeout: 20000 });
    await shot(buyerPage, '20-grail-detail', 4000);
  }
  await buyerCtx.close();

  // ── Ethan as SELLER ─────────────────────────────────────────────────────
  console.log('\n── Seller (ethan) ──');
  const sellerCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const sellerPage = await loginAs(sellerCtx, 'ethan@grailmarket.io');
  for (const [name, url] of [
    ['14-seller-dashboard', '/seller/dashboard'],
    ['15-seller-inventory', '/seller/inventory'],
    ['22-seller-onboarding','/seller/onboarding'],
    ['21-profile',          '/profile/me'],
  ]) {
    await sellerPage.goto(BASE + url, { waitUntil: 'networkidle', timeout: 20000 });
    await shot(sellerPage, name, 4000);
  }
  await sellerCtx.close();

  // ── Admin (alice promoted) ───────────────────────────────────────────────
  console.log('\n── Admin (alice) ──');
  const adminCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const adminPage = await loginAs(adminCtx, 'alice@grailmarket.io');
  for (const [name, url] of [
    ['18-admin-overview', '/admin?tab=overview'],
    ['19-admin-users',    '/admin?tab=users'],
    ['23-admin-disputes', '/admin?tab=disputes'],
  ]) {
    await adminPage.goto(BASE + url, { waitUntil: 'networkidle', timeout: 20000 });
    await shot(adminPage, name, 4000);
  }
  await adminCtx.close();

  await browser.close();

  const files = fs.readdirSync(OUT).filter(f => f.endsWith('.png')).sort();
  console.log(`\n✅ ${files.length} screenshots in ${OUT}:\n` + files.map(f => '  '+f).join('\n'));
}

run().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
