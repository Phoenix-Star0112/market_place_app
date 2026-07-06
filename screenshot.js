const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE = 'http://localhost:5000';
const OUT  = '/tmp/grailmarket-screenshots';
fs.mkdirSync(OUT, { recursive: true });

const PAGES = [
  { name: '01-home',            url: '/',                      wait: 2000 },
  { name: '02-browse-grails',   url: '/grails',                wait: 2500 },
  { name: '03-trending',        url: '/trending',              wait: 2000 },
  { name: '04-how-it-works',    url: '/how-it-works',          wait: 1500 },
  { name: '05-login',           url: '/login',                 wait: 1500 },
  { name: '06-register',        url: '/register',              wait: 1500 },
  { name: '07-verify',          url: '/verify',                wait: 1500 },
  { name: '08-disputes',        url: '/disputes',              wait: 1500 },
  { name: '09-not-found',       url: '/this-does-not-exist',   wait: 1500 },
];

// Authenticated pages
const AUTH_PAGES = [
  { name: '10-buyer-dashboard',  url: '/buyer/dashboard',       wait: 2500 },
  { name: '11-buyer-requests',   url: '/buyer/requests',        wait: 2000 },
  { name: '12-buyer-create',     url: '/buyer/create',          wait: 1500 },
  { name: '13-buyer-saved',      url: '/buyer/saved',           wait: 1500 },
  { name: '14-seller-dashboard', url: '/seller/dashboard',      wait: 2500 },
  { name: '15-seller-inventory', url: '/seller/inventory',      wait: 2000 },
  { name: '16-messages',         url: '/messages',              wait: 1500 },
  { name: '17-transactions',     url: '/transactions',          wait: 1500 },
  { name: '18-admin',            url: '/admin?tab=overview',    wait: 2500 },
  { name: '19-admin-users',      url: '/admin?tab=users',       wait: 2000 },
];

async function run() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });

  // Public pages
  console.log('📸 Capturing public pages…');
  for (const p of PAGES) {
    const page = await ctx.newPage();
    try {
      await page.goto(BASE + p.url, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(p.wait);
      await page.screenshot({ path: path.join(OUT, p.name + '.png'), fullPage: true });
      console.log(`  ✓ ${p.name}`);
    } catch (e) {
      console.log(`  ✗ ${p.name}: ${e.message.slice(0,60)}`);
    }
    await page.close();
  }

  // Login as ethan (seller) to capture auth pages
  console.log('🔐 Logging in as ethan@grailmarket.io…');
  const loginPage = await ctx.newPage();
  await loginPage.goto(BASE + '/login');
  await loginPage.fill('input[type="email"]', 'ethan@grailmarket.io');
  await loginPage.fill('input[type="password"]', 'password123');
  await loginPage.click('button[type="submit"]');
  await loginPage.waitForURL('**/dashboard', { timeout: 10000 }).catch(() => {});
  await loginPage.waitForTimeout(2000);
  console.log('  Current URL:', loginPage.url());
  await loginPage.close();

  // Authenticated pages
  console.log('📸 Capturing authenticated pages…');
  for (const p of AUTH_PAGES) {
    const page = await ctx.newPage();
    try {
      await page.goto(BASE + p.url, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(p.wait);
      await page.screenshot({ path: path.join(OUT, p.name + '.png'), fullPage: true });
      console.log(`  ✓ ${p.name}`);
    } catch (e) {
      console.log(`  ✗ ${p.name}: ${e.message.slice(0,60)}`);
    }
    await page.close();
  }

  // Grail detail (first grail from API)
  try {
    const r = await fetch(BASE + '/api/grails?limit=1');
    const d = await r.json();
    const id = d.grails?.[0]?.id;
    if (id) {
      const page = await ctx.newPage();
      await page.goto(BASE + '/grails/' + id, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(2500);
      await page.screenshot({ path: path.join(OUT, '20-grail-detail.png'), fullPage: true });
      console.log('  ✓ 20-grail-detail');
      await page.close();
    }
  } catch (e) { console.log('  ✗ grail detail:', e.message.slice(0,60)); }

  // Profile page
  try {
    const r = await fetch(BASE + '/api/auth/session', {
      headers: { 'Cookie': ctx.cookies ? '' : '' }
    });
    const session = await r.json();
    if (session?.user?.id) {
      const page = await ctx.newPage();
      await page.goto(BASE + '/profile/' + session.user.id, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(OUT, '21-profile.png'), fullPage: true });
      console.log('  ✓ 21-profile');
      await page.close();
    }
  } catch(e) { console.log('  ✗ profile:', e.message.slice(0,60)); }

  await browser.close();
  console.log('\n✅ Done! Screenshots in', OUT);
  console.log(fs.readdirSync(OUT).map(f => '  ' + f).join('\n'));
}

run().catch(e => { console.error(e); process.exit(1); });
