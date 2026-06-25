const fs = require('fs');
const path = require('path');

const read = (file) => {
  try { return JSON.parse(fs.readFileSync(path.join(__dirname, 'content', file), 'utf8')); }
  catch(e) { return null; }
};

const settings = read('settings.json') || {};
const hero = read('hero.json') || {};
const seo = read('seo.json') || {};
const features = read('features.json') || {};
const reviews = read('reviews.json') || {};
const faq = read('faq.json') || {};
const contact = read('contact.json') || {};
const footer = read('footer.json') || {};
const moreCard = read('more_card.json') || {};

// Read categories
let categories = [];
const catDir = path.join(__dirname, 'content', 'categories');
if (fs.existsSync(catDir)) {
  fs.readdirSync(catDir).forEach(f => {
    const fp = path.join(catDir, f);
    try {
      if (f.endsWith('.json')) {
        categories.push(JSON.parse(fs.readFileSync(fp, 'utf8')));
      } else if (f.endsWith('.md')) {
        // Parse frontmatter from markdown
        const raw = fs.readFileSync(fp, 'utf8');
        const match = raw.match(/^---\n([\s\S]*?)\n---/);
        if (match) {
          const obj = {};
          match[1].split('\n').forEach(line => {
            const idx = line.indexOf(':');
            if (idx > -1) {
              const k = line.substring(0, idx).trim();
              let v = line.substring(idx + 1).trim();
              v = v.replace(/^["']|["']$/g, '');
              if (v === 'true') v = true;
              else if (v === 'false') v = false;
              else if (!isNaN(v) && v !== '') v = Number(v);
              obj[k] = v;
            }
          });
          categories.push(obj);
        }
      }
    } catch(e) { console.warn('Bad category file:', f, e.message); }
  });
}
categories.sort((a,b) => (a.order||10) - (b.order||10));

let html = fs.readFileSync(path.join(__dirname, 'template.html'), 'utf8');

// Helper: replace template markers
const rep = (tag, val) => {
  if (val !== undefined && val !== null) {
    html = html.replace(new RegExp(`<!--${tag}-->[\\s\\S]*?<!--\\/${tag}-->`, 'g'), `<!--${tag}-->${val}<!--/${tag}-->`);
  }
};

// SVGs
const phoneSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>';

const phone = settings.phone || '607 347 096';
const phoneClean = phone.replace(/\s/g, '');

// === SEO ===
if (seo.meta_title) html = html.replace(/<title>[^<]*<\/title>/, `<title>${seo.meta_title}</title>`);
if (seo.meta_description) {
  html = html.replace(/(<meta name="description" content=")[^"]*"/, `$1${seo.meta_description}"`);
  html = html.replace(/(<meta property="og:description" content=")[^"]*"/, `$1${seo.meta_description}"`);
}

// === PHONE (global replace) ===
if (settings.phone) {
  html = html.replace(/607\s*347\s*096/g, phone);
  html = html.replace(/\+48607347096/g, `+48${phoneClean}`);
}

// === HERO ===
rep('HERO_BADGE', hero.badge);
rep('HERO_TITLE', hero.title);
rep('HERO_SUBTITLE', hero.subtitle);
rep('HERO_LOCATION', hero.location);
rep('HERO_DESC', hero.description);
rep('HERO_CTA', hero.cta_text);

// === FEATURES ===
rep('FEATURES_TITLE', features.section_title);
if (features.items && features.items.length) {
  const h = features.items.map(f =>
    `<div class="feature-card"><div class="feature-icon">${f.icon}</div><h3>${f.title}</h3><p>${f.description}</p></div>`
  ).join('\n');
  rep('FEATURES_GRID', h);
}

// === CATEGORIES ===
if (categories.length) {
  const catHtml = categories.map(c =>
    `<article class="cat-card"><div class="cat-img"><img src="${c.image||''}" alt="${c.title}" loading="lazy"></div><div class="cat-body"><h3>${c.title}</h3><p>${c.description}</p><a href="tel:+48${phoneClean}" class="cat-link">${phoneSvg} Zadzwoń i zapytaj</a></div></article>`
  ).join('\n');

  let moreHtml = '';
  if (moreCard.show !== false) {
    const mt = moreCard.title || 'I wiele więcej!';
    const md = moreCard.description || 'To tylko część naszego sprzętu. Zadzwoń i zapytaj o pełną ofertę!';
    moreHtml = `\n<article class="cat-card" style="display:flex;align-items:center;justify-content:center;text-align:center;background:linear-gradient(135deg,var(--card),oklch(0.24 0.03 60));border-color:oklch(0.78 0.17 65 / 0.3)"><div class="cat-body" style="padding:40px 24px"><div style="width:64px;height:64px;margin:0 auto 20px;background:oklch(0.78 0.17 65 / 0.15);border-radius:16px;display:flex;align-items:center;justify-content:center"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:32px;height:32px"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg></div><h3 style="font-size:20px">${mt}</h3><p style="margin-top:8px;font-size:15px;color:var(--muted)">${md}</p><a href="tel:+48${phoneClean}" style="margin-top:20px;display:inline-flex;align-items:center;gap:10px;background:var(--accent);color:var(--accent-fg);padding:14px 28px;border-radius:14px;font-weight:700;font-size:16px;box-shadow:0 8px 24px oklch(0.78 0.17 65 / 0.25);white-space:nowrap">${phoneSvg} ${phone}</a></div></article>`;
  }
  rep('CATEGORIES_GRID', catHtml + moreHtml);
}

// === REVIEWS ===
rep('REVIEWS_TITLE', reviews.section_title);
rep('REVIEWS_RATING', reviews.rating);
if (reviews.items && reviews.items.length) {
  const h = reviews.items.map(r =>
    `<figure class="review-card"><div class="review-stars">${'★'.repeat(r.rating||5)}</div><blockquote class="review-text">„${r.text}"</blockquote><figcaption class="review-name">— ${r.name}</figcaption></figure>`
  ).join('\n');
  rep('REVIEWS_GRID', h);
}

// === FAQ ===
rep('FAQ_TITLE', faq.section_title);
if (faq.items && faq.items.length) {
  const plus = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>';
  const minus = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/></svg>';
  const h = faq.items.map((q,i) =>
    `<div class="faq-item${i===0?' open':''}"><button class="faq-btn" onclick="toggleFaq(this)"><span>${q.question}</span><span class="faq-icon">${i===0?minus:plus}</span></button><div class="faq-answer">${q.answer}</div></div>`
  ).join('\n');
  rep('FAQ_LIST', h);
}

// === CONTACT ===
rep('CONTACT_TITLE', contact.section_title);

// === HOURS ===
if (settings.hours && settings.hours.length) {
  const h = settings.hours.map(x => `<div class="hours-row"><dt>${x.days}</dt><dd>${x.time}</dd></div>`).join('');
  rep('HOURS', h);
}

// === FOOTER ===
if (footer.description) rep('FOOTER_DESC', footer.description);
if (footer.copyright) rep('FOOTER_COPYRIGHT', footer.copyright);

// ========== OUTPUT ==========
const dist = path.join(__dirname, 'dist');
if (!fs.existsSync(dist)) fs.mkdirSync(dist, {recursive: true});
fs.writeFileSync(path.join(dist, 'index.html'), html);

// Copy static files
['robots.txt','sitemap.xml','favicon.ico','apple-touch-icon.png','og-image.png','polityka-prywatnosci.html','_redirects','googleb127e07b4869d65a.html'].forEach(f => {
  const s = path.join(__dirname, f);
  if (fs.existsSync(s)) fs.copyFileSync(s, path.join(dist, f));
});

// Copy admin
const ad = path.join(dist, 'admin');
if (!fs.existsSync(ad)) fs.mkdirSync(ad, {recursive: true});
['index.html','config.yml'].forEach(f => {
  const s = path.join(__dirname, 'admin', f);
  if (fs.existsSync(s)) fs.copyFileSync(s, path.join(ad, f));
});

// Copy images
const copyDir = (src, dst) => {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dst)) fs.mkdirSync(dst, {recursive: true});
  fs.readdirSync(src).forEach(f => {
    const sp = path.join(src, f), dp = path.join(dst, f);
    if (fs.statSync(sp).isDirectory()) copyDir(sp, dp);
    else fs.copyFileSync(sp, dp);
  });
};
copyDir(path.join(__dirname, 'images'), path.join(dist, 'images'));

console.log(`✅ Build OK: ${categories.length} categories, ${(reviews.items||[]).length} reviews, ${(faq.items||[]).length} FAQ`);
