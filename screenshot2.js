const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE = 'http://localhost:5000';
const OUT  = '/tmp/grailmarket-screenshots';
fs.mkdirSync(OUT, { recursive: true });

async function run() {
  const browser = await chromium.launch({ headless: true });

  // ── PUBLIC PAGES ─────────────────────────────────────────────────────────
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const PUBLIC = [
      { name: '01-home',       url: '/' },
      { name: '02-browse',     url: '/grails' },
      { name: '03-trending',   url: '/trending' },
      { name: '04-howitworks', url: '/how-it-works' },
      { name: '05-login',      url: '/login' },
      { name: '06-register',   url: '/register' },
      { name: '07-verify',     url: '/verify' },
      { name: '09-404',        url: '/does-not-exist' },
    ];
    for (const p of PUBLIC) {
      const page = await ctx.newPage();
      await page.goto(BASE + p.url, { waitUntil: 'networkidle', timeout: 20000 });
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(OUT, p.name + '.png'), fullPage: true });
      console.log(`✓ ${p.name}`);
      await page.close();
    }
    await ctx.close();
  }

  // ── BUYER SESSION (alice) ─────────────────────────────────────────────────
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();

    // Login
    await page.goto(BASE + '/login', { waitUntil: 'networkidle' });
    await page.fill('input[type="email"]',    'alice@grailmarket.io');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    console.log('Alice logged in, at:', page.url());

    const BUYER = [
      { name: '10-buyer-dashboard', url: '/buyer/dashboard' },
      { name: '11-buyer-requests',  url: '/buyer/requests' },
      { name: '12-buyer-create',    url: '/buyer/create' },
      { name: '13-buyer-saved',     url: '/buyer/saved' },
      { name: '16-messages',        url: '/messages' },
      { name: '17-transactions',    url: '/transactions' },
      { name: '08-disputes',        url: '/disputes' },
    ];
    for (const p of BUYER) {
      await page.goto(BASE + p.url, { waitUntil: 'networkidle', timeout: 20000 });
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(OUT, p.name + '.png'), fullPage: true });
      console.log(`✓ ${p.name}`);
    }

    // Grail detail — first grail
    const r = await fetch(BASE + '/api/grails?limit=1');
    const d = await r.json();
    const grailId = d.grails?.[0]?.id;
    if (grailId) {
      await page.goto(BASE + '/grails/' + grailId, { waitUntil: 'networkidle', timeout: 20000 });
      await page.waitForTimeout(3000);
      await page.screenshot({ path: path.join(OUT, '20-grail-detail.png'), fullPage: true });
      console.log('✓ 20-grail-detail');
    }

    // Alice's profile
    await page.goto(BASE + '/profile/me', { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(OUT, '21-profile.png'), fullPage: true });
    console.log('✓ 21-profile');

    await ctx.close();
  }

  // ── SELLER SESSION (ethan) ────────────────────────────────────────────────
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();

    await page.goto(BASE + '/login', { waitUntil: 'networkidle' });
    await page.fill('input[type="email"]',    'ethan@grailmarket.io');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    const SELLER = [
      { name: '14-seller-dashboard', url: '/seller/dashboard' },
      { name: '15-seller-inventory', url: '/seller/inventory' },
      { name: '22-seller-onboarding',url: '/seller/onboarding' },
    ];
    for (const p of SELLER) {
      await page.goto(BASE + p.url, { waitUntil: 'networkidle', timeout: 20000 });
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(OUT, p.name + '.png'), fullPage: true });
      console.log(`✓ ${p.name}`);
    }
    await ctx.close();
  }

  // ── ADMIN: promote a user then capture ───────────────────────────────────
  {
    // Promote alice to admin via DB
    const { execSync } = require('child_process');
    execSync(`node -e "
      const {PrismaClient}=require('@prisma/client');
      const {PrismaBetterSqlite3}=require('@prisma/adapter-better-sqlite3');
      const path=require('path');
      const a=new PrismaBetterSqlite3({url:path.resolve('/home/ubuntu/new/prisma/dev.db')});
      const p=new PrismaClient({adapter:a});
      p.user.update({where:{email:'alice@grailmarket.io'},data:{role:'ADMIN'}}).then(u=>{console.log('Admin set:',u.role);p.\$disconnect()})
    "`, { stdio: 'inherit' });

    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(BASE + '/login', { waitUntil: 'networkidle' });
    await page.fill('input[type="email"]',    'alice@grailmarket.io');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    const ADMIN = [
      { name: '18-admin-overview', url: '/admin?tab=overview' },
      { name: '19-admin-users',    url: '/admin?tab=users' },
      { name: '23-admin-disputes', url: '/admin?tab=disputes' },
    ];
    for (const p of ADMIN) {
      await page.goto(BASE + p.url, { waitUntil: 'networkidle', timeout: 20000 });
      await page.waitForTimeout(2500);
      await page.screenshot({ path: path.join(OUT, p.name + '.png'), fullPage: true });
      console.log(`✓ ${p.name}`);
    }
    await ctx.close();

    // Restore alice to BUYER
    execSync(`node -e "
      const {PrismaClient}=require('@prisma/client');
      const {PrismaBetterSqlite3}=require('@prisma/adapter-better-sqlite3');
      const path=require('path');
      const a=new PrismaBetterSqlite3({url:path.resolve('/home/ubuntu/new/prisma/dev.db')});
      const p=new PrismaClient({adapter:a});
      p.user.update({where:{email:'alice@grailmarket.io'},data:{role:'BUYER'}}).then(()=>p.\$disconnect())
    "`, { stdio: 'inherit' });
  }

  await browser.close();
  const files = fs.readdirSync(OUT).sort();
  console.log(`\n✅ ${files.length} screenshots in ${OUT}`);
  files.forEach(f => console.log('  ' + f));
}

run().catch(e => { console.error(e); process.exit(1); });
