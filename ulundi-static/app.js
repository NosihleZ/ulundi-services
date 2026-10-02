/* ============================================================
   ULUNDI SERVICES — APP.JS (homepage)
   Talks directly to your existing headless WordPress REST API.
   No plugin required — see SETUP.md for the WP-side fields.
   ============================================================ */

let allBusinesses = [];
let ratingsByPost = {};   // { postId: { avg, count } }
let activeCategory = '';
let activeTownship = '';
let searchQuery = '';

document.addEventListener('DOMContentLoaded', () => {
  if (window.emailjs && SITE_CONFIG.EMAILJS_PUBLIC_KEY.indexOf('YOUR_') === -1) {
    emailjs.init({ publicKey: SITE_CONFIG.EMAILJS_PUBLIC_KEY });
  }
  populateFilters();
  populateCategoryCards();
  populateTownshipCards();
  loadBusinesses();
  loadSpecials();
});

/* ---------------- Populate static UI from config ---------------- */

function populateFilters() {
  const catSel = document.getElementById('categoryFilter');
  const twnSel = document.getElementById('townshipFilter');
  if (catSel) SITE_CONFIG.CATEGORIES.forEach(c => catSel.insertAdjacentHTML('beforeend', `<option value="${c.slug}">${c.label}</option>`));
  if (twnSel) SITE_CONFIG.TOWNSHIPS.forEach(t => twnSel.insertAdjacentHTML('beforeend', `<option value="${t.slug}">${t.label}</option>`));
}

function populateCategoryCards() {
  const grid = document.getElementById('categoriesGrid');
  if (!grid) return;
  SITE_CONFIG.CATEGORIES.forEach(c => {
    grid.insertAdjacentHTML('beforeend', `
      <button class="cat-card" data-cat="${c.slug}" onclick="selectCategory(this,'${c.slug}')">
        <span class="cat-icon">${c.emoji}</span><span>${escHtml(c.label)}</span>
      </button>`);
  });
  document.getElementById('totalCategories').textContent = SITE_CONFIG.CATEGORIES.length;
}

function populateTownshipCards() {
  const grid = document.getElementById('townshipsGrid');
  if (!grid) return;
  SITE_CONFIG.TOWNSHIPS.forEach((t, i) => {
    grid.insertAdjacentHTML('beforeend', `
      <div class="township-card ${i === 0 ? 'active' : 'coming'}">
        <span class="township-badge ${i === 0 ? '' : 'coming'}">${i === 0 ? 'Live Now' : 'Coming Soon'}</span>
        <h3>${escHtml(t.label)}</h3>
        <span class="township-count" data-township="${t.slug}">— businesses</span>
      </div>`);
  });
  document.getElementById('totalTownships').textContent = SITE_CONFIG.TOWNSHIPS.length;
}

/* ---------------- Fetch businesses ---------------- */

async function loadBusinesses() {
  showLoading();
  try {
    const url = `${SITE_CONFIG.WP_API_BASE}${SITE_CONFIG.BUSINESSES_ENDPOINT}?per_page=${SITE_CONFIG.PER_PAGE}&_embed`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`API returned ${response.status}`);
    const posts = await response.json();
    if (!Array.isArray(posts)) throw new Error('Unexpected API response format');

    allBusinesses = posts.map(transformWordPressPost);
    await loadRatings(allBusinesses.map(b => b.id));
    renderBusinesses(allBusinesses);
    updateCounts(allBusinesses);
  } catch (err) {
    console.error('WordPress API error:', err.message);
    document.getElementById('loadingGrid').style.display = 'none';
    document.getElementById('businessesGrid').style.display = 'none';
    document.getElementById('errorState').style.display = 'block';
    document.getElementById('errorMsg').textContent = 'Unable to load listings. Please check your connection and try again.';
  }
}

function transformWordPressPost(post) {
  const acf = post.acf || {};
  const embedded = post._embedded || {};
  const terms = embedded['wp:term'] ? embedded['wp:term'].flat() : [];
  const featuredMedia = embedded['wp:featuredmedia'] ? embedded['wp:featuredmedia'][0] : null;
  const categoryTerm = terms.find(t => t.taxonomy === 'biz_category') || {};
  const catMeta = ulsvCategoryMeta(acf.category_slug || categoryTerm.slug || 'other');

  let gallery = [];
  if (acf.gallery_urls) {
    gallery = String(acf.gallery_urls).split(',').map(s => s.trim()).filter(Boolean);
  }

  return {
    id:             post.id,
    name:           post.title?.rendered || 'Unnamed Business',
    description:    stripHtml(post.content?.rendered || post.excerpt?.rendered || ''),
    category:       acf.category_slug || categoryTerm.slug || 'other',
    category_label: catMeta.label || categoryTerm.name || 'Business',
    township:       acf.township_slug || 'ulundi',
    address:        acf.business_address || '',
    phone:          acf.phone_number || '',
    whatsapp:       acf.whatsapp_number || '',
    email:          acf.public_email || '',
    hours:          acf.operating_hours || '',
    website1:       acf.website_1 || '',
    website2:       acf.website_2 || '',
    facebook:       acf.facebook_url || '',
    instagram:      acf.instagram_url || '',
    tiktok:         acf.tiktok_url || '',
    youtube:        acf.youtube_video || '',
    vimeo:          acf.vimeo_video || '',
    map_embed:      acf.map_embed_url || '',
    gallery:        gallery,
    image:          acf.featured_image_url || featuredMedia?.source_url || (gallery[0] || null),
    emoji:          catMeta.emoji,
    color:          catMeta.color,
  };
}

async function loadRatings(ids) {
  if (!ids.length) return;
  try {
    const url = `${SITE_CONFIG.WP_API_BASE}/wp/v2/comments?post=${ids.join(',')}&per_page=100&status=approve`;
    const res = await fetch(url);
    if (!res.ok) return;
    const comments = await res.json();
    ratingsByPost = {};
    comments.forEach(c => {
      const m = /rating:\s*([1-5])/i.exec(c.content?.rendered || '');
      if (!m) return;
      const r = parseInt(m[1], 10);
      const bucket = ratingsByPost[c.post] || { sum: 0, count: 0 };
      bucket.sum += r; bucket.count += 1;
      ratingsByPost[c.post] = bucket;
    });
    Object.keys(ratingsByPost).forEach(id => {
      const b = ratingsByPost[id];
      b.avg = Math.round((b.sum / b.count) * 10) / 10;
    });
  } catch (e) { /* ratings are non-critical — fail silently */ }
}

function getRating(postId) {
  const r = ratingsByPost[postId];
  return r ? { avg: r.avg, count: r.count } : { avg: 0, count: 0 };
}

/* ---------------- Render grid ---------------- */

function renderBusinesses(businesses) {
  const grid = document.getElementById('businessesGrid');
  const loading = document.getElementById('loadingGrid');
  const empty = document.getElementById('emptyState');
  const error = document.getElementById('errorState');
  const count = document.getElementById('resultsCount');

  loading.style.display = 'none';
  error.style.display = 'none';

  if (!businesses || businesses.length === 0) {
    grid.style.display = 'none';
    empty.style.display = 'block';
    count.textContent = 'No businesses found matching your search.';
    return;
  }

  empty.style.display = 'none';
  grid.style.display = 'grid';
  count.textContent = `Showing ${businesses.length} local ${businesses.length === 1 ? 'business' : 'businesses'}`;

  grid.innerHTML = businesses.map((biz, i) => {
    const rating = getRating(biz.id);
    return `
    <article class="biz-card" onclick="openModal(${biz.id})" style="animation-delay:${i * 0.05}s">
      <div class="biz-card-img" style="background:${biz.color}">
        ${biz.image ? `<img src="${biz.image}" alt="${escHtml(biz.name)}" loading="lazy" />` : `<span class="biz-card-img-placeholder">${biz.emoji}</span>`}
        <span class="biz-cat-badge">${escHtml(biz.category_label)}</span>
      </div>
      <div class="biz-card-body">
        <h3 class="biz-card-name">${escHtml(biz.name)}</h3>
        <p class="biz-card-desc">${escHtml(truncate(biz.description, 110))}</p>
        <div class="biz-card-meta">
          ${biz.address ? `<span>📍 ${escHtml(biz.address)}</span>` : ''}
          ${biz.hours ? `<span>🕐 ${escHtml(biz.hours.split('|')[0].trim())}</span>` : ''}
        </div>
      </div>
      <div class="biz-card-footer">
        <span class="biz-rating">★ ${rating.count ? rating.avg : 'New'}</span>
        ${biz.whatsapp
          ? `<a class="biz-whatsapp" href="https://wa.me/${sanitizePhone(biz.whatsapp)}" target="_blank" rel="noopener" onclick="event.stopPropagation()">💬 WhatsApp</a>`
          : biz.phone ? `<a class="biz-whatsapp" href="tel:${sanitizePhone(biz.phone)}" onclick="event.stopPropagation()" style="background:#00A550">📞 Call</a>` : ''}
      </div>
    </article>`;
  }).join('');
}

/* ---------------- Modal / detail view ---------------- */

function openModal(id) {
  const biz = allBusinesses.find(b => b.id === id);
  if (!biz) return;
  const rating = getRating(id);

  document.getElementById('modalContent').innerHTML = `
    <div class="modal-img" style="background:${biz.color}">
      ${biz.image ? `<img src="${biz.image}" alt="${escHtml(biz.name)}">` : biz.emoji}
    </div>
    <div class="modal-body">
      <span class="modal-category">${escHtml(biz.category_label)}</span>
      <h2 class="modal-name">${escHtml(biz.name)}</h2>
      <p class="modal-desc">${escHtml(biz.description)}</p>

      ${biz.gallery.length ? `<div class="modal-gallery">${biz.gallery.map(u => `<img src="${u}" loading="lazy" />`).join('')}</div>` : ''}
      ${youtubeEmbed(biz.youtube)}
      ${vimeoEmbed(biz.vimeo)}

      <div class="modal-details">
        ${biz.address ? row('📍', escHtml(biz.address)) : ''}
        ${biz.phone ? row('📞', escHtml(biz.phone)) : ''}
        ${biz.hours ? row('🕐', escHtml(biz.hours)) : ''}
        ${biz.email ? row('📧', escHtml(biz.email)) : ''}
        ${biz.website1 ? row('🌐', `<a href="${biz.website1}" target="_blank" rel="noopener">${escHtml(biz.website1)}</a>`) : ''}
        ${biz.website2 ? row('🌐', `<a href="${biz.website2}" target="_blank" rel="noopener">${escHtml(biz.website2)}</a>`) : ''}
      </div>

      ${(biz.facebook || biz.instagram || biz.tiktok) ? `<div class="modal-socials">
        ${biz.facebook ? `<a href="${biz.facebook}" target="_blank" rel="noopener">📘</a>` : ''}
        ${biz.instagram ? `<a href="${biz.instagram}" target="_blank" rel="noopener">📸</a>` : ''}
        ${biz.tiktok ? `<a href="${biz.tiktok}" target="_blank" rel="noopener">🎵</a>` : ''}
      </div>` : ''}

      ${biz.map_embed ? `<div class="modal-map"><iframe src="${biz.map_embed}" height="220" loading="lazy"></iframe></div>` : ''}

      <div class="modal-actions">
        ${biz.whatsapp ? `<a href="https://wa.me/${sanitizePhone(biz.whatsapp)}" target="_blank" rel="noopener" class="btn btn-solid" style="background:#25D366;border-color:#25D366">💬 WhatsApp</a>` : ''}
        ${biz.phone ? `<a href="tel:${sanitizePhone(biz.phone)}" class="btn btn-outline" style="color:var(--green);border-color:var(--green)">📞 Call Now</a>` : ''}
      </div>

      ${renderReviewsBlock(biz.id, rating)}
    </div>
  `;
  document.getElementById('modalOverlay').classList.add('open');
  document.getElementById('businessModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
  document.getElementById('businessModal').classList.remove('open');
  document.body.style.overflow = '';
}

function row(icon, html) { return `<div class="modal-detail-row"><span>${icon}</span><span>${html}</span></div>`; }

function youtubeEmbed(url) {
  if (!url) return '';
  const m = /(?:youtu\.be\/|v=)([A-Za-z0-9_-]{11})/.exec(url);
  return m ? `<div class="modal-video"><iframe src="https://www.youtube.com/embed/${m[1]}" allowfullscreen loading="lazy"></iframe></div>` : '';
}
function vimeoEmbed(url) {
  if (!url) return '';
  const m = /vimeo\.com\/(\d+)/.exec(url);
  return m ? `<div class="modal-video"><iframe src="https://player.vimeo.com/video/${m[1]}" allowfullscreen loading="lazy"></iframe></div>` : '';
}

/* ---------------- Reviews (stored as native WP comments) ---------------- */

function renderReviewsBlock(postId, rating) {
  return `
  <div class="ulsv-reviews" id="reviews-${postId}">
    <div class="ulsv-reviews-head">
      <h3>★ ${rating.count ? rating.avg : '—'} out of 5 <span>(${rating.count} reviews)</span></h3>
      <button class="btn btn-outline" style="color:var(--green);border-color:var(--green)" onclick="document.getElementById('reviewForm-${postId}').classList.toggle('open')">Write a Review</button>
    </div>
    <form class="ulsv-review-form" id="reviewForm-${postId}" onsubmit="return submitReview(event, ${postId})">
      <div class="ulsv-star-input">
        ${[5,4,3,2,1].map(n => `<input type="radio" name="rating" id="star${n}_${postId}" value="${n}" ${n===5?'checked':''}/><label for="star${n}_${postId}">★</label>`).join('')}
      </div>
      <input type="text" class="form-control" name="author_name" placeholder="Your name" required />
      <textarea class="form-control" name="review_text" placeholder="Share your experience…" required></textarea>
      <button type="submit" class="btn btn-solid">Submit Review</button>
      <span class="review-status" style="font-size:0.85rem"></span>
    </form>
    <div class="ulsv-review-list" id="reviewList-${postId}"><p class="form-note">Loading reviews…</p></div>
  </div>`;
}

async function loadReviewList(postId) {
  const el = document.getElementById(`reviewList-${postId}`);
  if (!el) return;
  try {
    const res = await fetch(`${SITE_CONFIG.WP_API_BASE}/wp/v2/comments?post=${postId}&status=approve&per_page=50`);
    const comments = await res.json();
    if (!comments.length) { el.innerHTML = '<p class="form-note">No reviews yet — be the first!</p>'; return; }
    el.innerHTML = comments.map(c => {
      const m = /rating:\s*([1-5])/i.exec(c.content.rendered);
      const r = m ? parseInt(m[1], 10) : 0;
      const text = c.content.rendered.replace(/rating:\s*[1-5]/i, '').replace(/<[^>]+>/g, '').trim();
      return `<div class="ulsv-review">
        <div class="ulsv-review-top"><strong>${escHtml(c.author_name)}</strong><span class="ulsv-review-stars">${'★'.repeat(r)}${'☆'.repeat(5-r)}</span></div>
        <p>${escHtml(text)}</p>
      </div>`;
    }).join('');
  } catch (e) { el.innerHTML = '<p class="form-note">Could not load reviews.</p>'; }
}

async function submitReview(e, postId) {
  e.preventDefault();
  const form = e.target;
  const status = form.querySelector('.review-status');
  const rating = form.querySelector('input[name=rating]:checked').value;
  const author = form.author_name.value.trim();
  const text = form.review_text.value.trim();
  status.textContent = 'Submitting…';

  try {
    const res = await fetch(`${SITE_CONFIG.WP_API_BASE}/wp/v2/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        post: postId,
        author_name: author,
        author_email: `reviewer-${Date.now()}@ulundiservices.co.za`, // WP requires an email for anonymous comments — this keeps the form itself to just a name
        content: `Rating: ${rating}\n\n${text}`
      })
    });
    if (!res.ok) throw new Error('failed');
    status.style.color = 'var(--green)';
    status.textContent = '✅ Thanks! Your review is awaiting approval.';
    form.reset();
  } catch (err) {
    status.style.color = 'var(--red)';
    status.textContent = '⚠️ Could not submit — please try again.';
  }
  return false;
}

// Load the review list the first time a review section becomes visible in the modal
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[onclick*="reviewForm-"]');
  if (btn) {
    const id = btn.getAttribute('onclick').match(/reviewForm-(\d+)/)[1];
    loadReviewList(id);
  }
});
// Also load reviews as soon as the modal opens (not just when the button is clicked)
const _origOpenModal = openModal;
openModal = function (id) { _origOpenModal(id); loadReviewList(id); };

/* ---------------- Filtering ---------------- */

function filterBusinesses() {
  searchQuery = document.getElementById('searchInput').value.toLowerCase().trim();
  activeCategory = document.getElementById('categoryFilter').value;
  activeTownship = document.getElementById('townshipFilter').value;

  const filtered = allBusinesses.filter(biz => {
    const matchCat = !activeCategory || biz.category === activeCategory;
    const matchTwn = !activeTownship || biz.township === activeTownship;
    const matchSearch = !searchQuery ||
      biz.name.toLowerCase().includes(searchQuery) ||
      biz.description.toLowerCase().includes(searchQuery) ||
      biz.address.toLowerCase().includes(searchQuery);
    return matchCat && matchTwn && matchSearch;
  });
  renderBusinesses(filtered);
}

function selectCategory(el, cat) {
  activeCategory = cat;
  document.querySelectorAll('.cat-card').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('categoryFilter').value = cat;
  filterBusinesses();
  document.getElementById('businesses').scrollIntoView({ behavior: 'smooth' });
}

/* ---------------- Specials: banner + popup ---------------- */

async function loadSpecials() {
  try {
    const res = await fetch(`${SITE_CONFIG.WP_API_BASE}${SITE_CONFIG.SPECIALS_ENDPOINT}?per_page=10&_embed`);
    if (!res.ok) return; // specials CPT may not exist yet — fail silently
    const posts = await res.json();
    const active = posts.filter(p => (p.acf || {}).status === 'active');

    const banners = active.filter(p => p.acf.placement === 'banner');
    if (banners.length) {
      document.getElementById('specialsBannerWrap').style.display = 'block';
      document.getElementById('specialsBanner').innerHTML = banners.map(p => {
        const img = p._embedded?.['wp:featuredmedia']?.[0]?.source_url || p.acf.image_url || '';
        return `<a class="ulsv-banner-slide" href="${p.acf.link || '#'}" target="_blank" rel="noopener">
          ${img ? `<img src="${img}" />` : ''}
          <div class="ulsv-banner-text"><strong>${escHtml(p.title.rendered)}</strong><span>${escHtml(p.acf.business_name || '')}</span></div>
        </a>`;
      }).join('');
    }

    const popups = active.filter(p => p.acf.placement === 'popup');
    if (popups.length) renderPopup(popups[0]);
  } catch (e) { /* non-critical */ }
}

function renderPopup(special) {
  const key = 'ulsv_popup_dismissed_' + special.id;
  let dismissedAt = 0;
  try { dismissedAt = parseInt(localStorage.getItem(key) || '0', 10); } catch (e) {}
  if (dismissedAt && (Date.now() - dismissedAt) < 24 * 60 * 60 * 1000) return;

  const img = special._embedded?.['wp:featuredmedia']?.[0]?.source_url || special.acf.image_url || '';
  document.getElementById('popupSpecialWrap').innerHTML = `
    <div class="ulsv-popup-overlay open" id="ulsvPopupOverlay">
      <div class="ulsv-popup">
        <button class="ulsv-popup-close" id="ulsvPopupClose">✕</button>
        ${img ? `<img src="${img}" />` : ''}
        <h3>${escHtml(special.title.rendered)}</h3>
        <p>${escHtml(stripHtml(special.acf.description || ''))}</p>
        <a class="btn btn-solid" href="${special.acf.link || '#'}" target="_blank" rel="noopener">View Offer</a>
      </div>
    </div>`;
  setTimeout(() => {
    document.getElementById('ulsvPopupClose')?.addEventListener('click', () => {
      document.getElementById('ulsvPopupOverlay').classList.remove('open');
      try { localStorage.setItem(key, Date.now().toString()); } catch (e) {}
    });
  }, 0);
}

/* ---------------- Helpers ---------------- */

function toggleMenu() { document.getElementById('mobileMenu').classList.toggle('open'); }

function showLoading() {
  document.getElementById('loadingGrid').style.display = 'grid';
  document.getElementById('businessesGrid').style.display = 'none';
  document.getElementById('emptyState').style.display = 'none';
  document.getElementById('errorState').style.display = 'none';
}

function updateCounts(businesses) {
  document.getElementById('totalBusinesses').textContent = businesses.length;
  const byTownship = {};
  businesses.forEach(b => { byTownship[b.township] = (byTownship[b.township] || 0) + 1; });
  document.querySelectorAll('[data-township]').forEach(el => {
    const slug = el.getAttribute('data-township');
    el.textContent = `${byTownship[slug] || 0} businesses`;
  });
}

function stripHtml(html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  return (div.textContent || div.innerText || '').trim();
}

function truncate(str, len) { return str.length > len ? str.slice(0, len).trim() + '…' : str; }

function escHtml(str) {
  if (!str) return '';
  const doc = new DOMParser().parseFromString(String(str), 'text/html');
  const decoded = doc.documentElement.textContent;
  return decoded.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function sanitizePhone(phone) { return String(phone).replace(/\D/g, ''); }
