let ADMIN_KEY = null;

document.addEventListener('DOMContentLoaded', () => {
  const saved = sessionStorage.getItem('ulsv_admin_key');
  if (saved) { ADMIN_KEY = saved; showPanel(); }
});

function adminLogin() {
  const key = document.getElementById('adminKeyInput').value.trim();
  if (!key) return;
  ADMIN_KEY = key;
  sessionStorage.setItem('ulsv_admin_key', ADMIN_KEY);
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
    const res = await fetch(`${SITE_CONFIG.WP_API_BASE}/ulundi/v1/pending-businesses?admin_key=${encodeURIComponent(ADMIN_KEY)}`);
    if (res.status === 403) {
      sessionStorage.removeItem('ulsv_admin_key');
      document.getElementById('adminPanel').style.display = 'none';
      document.getElementById('adminLogin').style.display = 'block';
      alert('Wrong admin key.');
      return;
    }
    const posts = await res.json();
    document.getElementById('pendingCount').textContent = `${posts.length} pending`;
    if (!posts.length) { list.innerHTML = '<p class="form-note">Nothing waiting for review 🎉</p>'; return; }
    list.innerHTML = posts.map(p => {
      const acf = p.acf || {};
      return `<div class="admin-row" id="row-${p.id}">
        <div><h3>${escHtml(p.title)}</h3>
          <div class="admin-meta">${acf.category_slug || ''} · ${acf.township_slug || ''}<br>
            📞 ${escHtml(acf.phone_number || '—')} · 📧 ${escHtml(acf.public_email || '—')}<br>
            📍 ${escHtml(acf.business_address || '—')}</div></div>
        <div class="admin-actions">
          <button class="btn btn-outline" style="color:var(--red);border-color:var(--red)" onclick="rejectListing(${p.id})">Decline</button>
          <button class="btn btn-solid" onclick="approveListing(${p.id})">Approve &amp; Notify</button>
        </div></div>`;
    }).join('');
  } catch (e) { list.innerHTML = '<p class="form-note">Could not load pending listings.</p>'; }
}

async function approveListing(id) {
  const row = document.getElementById(`row-${id}`);
  row.style.opacity = '0.5';
  try {
    const res = await fetch(`${SITE_CONFIG.WP_API_BASE}/ulundi/v1/approve-business/${id}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ admin_key: ADMIN_KEY })
    });
    if (!res.ok) throw new Error('Could not publish this listing.');
    row.remove(); // WordPress sends the "you're live" email automatically now
  } catch (e) { alert(e.message || 'Something went wrong.'); row.style.opacity = '1'; }
}

async function rejectListing(id) {
  if (!confirm('Move this listing to Trash?')) return;
  try {
    const res = await fetch(`${SITE_CONFIG.WP_API_BASE}/ulundi/v1/reject-business/${id}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ admin_key: ADMIN_KEY })
    });
    if (!res.ok) throw new Error('Could not remove this listing.');
    document.getElementById(`row-${id}`).remove();
  } catch (e) { alert(e.message || 'Something went wrong.'); }
}

function escHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.innerHTML = str;
  return (div.textContent || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}