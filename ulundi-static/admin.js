/* ============================================================
   ULUNDI SERVICES — ADMIN.JS (private approvals tool)
   Credentials are kept only in this tab's sessionStorage — never
   written to a file, never sent anywhere but your own WordPress site.
   ============================================================ */

let ADMIN_AUTH = null;

document.addEventListener('DOMContentLoaded', () => {
  if (window.emailjs && SITE_CONFIG.EMAILJS_PUBLIC_KEY.indexOf('YOUR_') === -1) {
    emailjs.init({ publicKey: SITE_CONFIG.EMAILJS_PUBLIC_KEY });
  }
  const saved = sessionStorage.getItem('ulsv_admin_auth');
  if (saved) { ADMIN_AUTH = saved; showPanel(); }
});

function adminLogin() {
  const user = document.getElementById('adminUsername').value.trim();
  const pass = document.getElementById('adminAppPassword').value.trim();
  if (!user || !pass) return;
  ADMIN_AUTH = btoa(`${user}:${pass}`);
  sessionStorage.setItem('ulsv_admin_auth', ADMIN_AUTH);
  showPanel();
}

function showPanel() {
  document.getElementById('adminLogin').style.display = 'none';
  document.getElementById('adminPanel').style.display = 'block';
  loadPending();
}

async function loadPending() {
  const list = document.getElementById('pendingList');
  list.innerHTML = '<p class="form-note">Loading…</p>';
  try {
    const res = await fetch(`${SITE_CONFIG.WP_API_BASE}${SITE_CONFIG.BUSINESSES_ENDPOINT}?status=pending&per_page=50&context=edit`, {
      headers: { Authorization: `Basic ${ADMIN_AUTH}` }
    });
    if (res.status === 401 || res.status === 403) {
      sessionStorage.removeItem('ulsv_admin_auth');
      document.getElementById('adminPanel').style.display = 'none';
      document.getElementById('adminLogin').style.display = 'block';
      alert('Login failed — check your username and Application Password.');
      return;
    }
    const posts = await res.json();
    document.getElementById('pendingCount').textContent = `${posts.length} pending`;

    if (!posts.length) {
      list.innerHTML = '<p class="form-note">Nothing waiting for review 🎉</p>';
      return;
    }

    list.innerHTML = posts.map(p => {
      const acf = p.acf || {};
      return `
      <div class="admin-row" id="row-${p.id}">
        <div>
          <h3>${escHtml(p.title.rendered || p.title.raw)}</h3>
          <div class="admin-meta">
            ${acf.category_slug || ''} · ${acf.township_slug || ''}<br>
            📞 ${escHtml(acf.phone_number || '—')} · 📧 ${escHtml(acf.public_email || '—')}<br>
            📍 ${escHtml(acf.business_address || '—')}
          </div>
        </div>
        <div class="admin-actions">
          <button class="btn btn-outline" style="color:var(--red);border-color:var(--red)" onclick="rejectListing(${p.id})">Decline</button>
          <button class="btn btn-solid" onclick="approveListing(${p.id}, '${escAttr(p.title.rendered || p.title.raw)}', '${escAttr(acf.public_email || '')}')">Approve &amp; Notify</button>
        </div>
      </div>`;
    }).join('');
  } catch (e) {
    list.innerHTML = '<p class="form-note">Could not load pending listings.</p>';
  }
}

async function approveListing(id, name, email) {
  const row = document.getElementById(`row-${id}`);
  row.style.opacity = '0.5';
  try {
    const res = await fetch(`${SITE_CONFIG.WP_API_BASE}${SITE_CONFIG.BUSINESSES_ENDPOINT}/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Basic ${ADMIN_AUTH}` },
      body: JSON.stringify({ status: 'publish' })
    });
    if (!res.ok) throw new Error('Could not publish this listing.');
    const post = await res.json();

    if (email && window.emailjs && SITE_CONFIG.EMAILJS_PUBLIC_KEY.indexOf('YOUR_') === -1) {
      try {
        await emailjs.send(SITE_CONFIG.EMAILJS_SERVICE_ID, SITE_CONFIG.EMAILJS_TEMPLATE_APPROVED, {
          to_email: email,
          business_name: name,
          listing_url: post.link,
          declaration_text: ulsvDeclarationText(),
        });
      } catch (e) { console.warn('Approval email failed:', e); }
    }
    row.remove();
  } catch (e) {
    alert(e.message || 'Something went wrong.');
    row.style.opacity = '1';
  }
}

async function rejectListing(id) {
  if (!confirm('Move this listing to Trash? The owner will not be notified automatically.')) return;
  const row = document.getElementById(`row-${id}`);
  try {
    const res = await fetch(`${SITE_CONFIG.WP_API_BASE}${SITE_CONFIG.BUSINESSES_ENDPOINT}/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Basic ${ADMIN_AUTH}` }
    });
    if (!res.ok) throw new Error('Could not remove this listing.');
    row.remove();
  } catch (e) {
    alert(e.message || 'Something went wrong.');
  }
}

function escHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.innerHTML = str;
  return (div.textContent || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function escAttr(str) { return String(str || '').replace(/'/g, '&#39;').replace(/"/g, '&quot;'); }
