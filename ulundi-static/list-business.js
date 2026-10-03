/* ============================================================
   ULUNDI SERVICES — LIST-BUSINESS.JS
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  if (window.emailjs && SITE_CONFIG.EMAILJS_PUBLIC_KEY.indexOf('YOUR_') === -1) {
    emailjs.init({ publicKey: SITE_CONFIG.EMAILJS_PUBLIC_KEY });
  }

  const catSel = document.getElementById('bizCategory');
  SITE_CONFIG.CATEGORIES.forEach(c => catSel.insertAdjacentHTML('beforeend', `<option value="${c.slug}">${c.label}</option>`));

  const twnSel = document.getElementById('bizTownship');
  SITE_CONFIG.TOWNSHIPS.forEach(t => twnSel.insertAdjacentHTML('beforeend', `<option value="${t.slug}">${t.label}</option>`));

  document.getElementById('formIntro').innerHTML =
    `Fill in your business details and we'll get you listed within 24–48 hours. <strong>Listing is completely free during ${SITE_CONFIG.FREE_LISTING_MONTHS}.</strong>`;
  document.getElementById('declarationText').textContent = ulsvDeclarationText();

  document.getElementById('bizFeatured').addEventListener('change', e => previewImages(e.target.files, 'featuredPreview'));
  document.getElementById('bizGallery').addEventListener('change', e => previewImages(e.target.files, 'galleryPreview'));
});

function previewImages(files, targetId) {
  const wrap = document.getElementById(targetId);
  wrap.innerHTML = '';
  Array.from(files).slice(0, 6).forEach(file => {
    const img = document.createElement('img');
    img.src = URL.createObjectURL(file);
    wrap.appendChild(img);
  });
}

async function submitBusiness(e) {
  e.preventDefault();
  const btn = document.getElementById('submitBtn');
  const status = document.getElementById('submitStatus');
  const progress = document.getElementById('uploadProgress');

  if (document.querySelector('[name=website_hp]').value) return false; // bot caught by honeypot

  if (!document.getElementById('declarationCheck').checked) {
    status.style.color = 'var(--red)';
    status.textContent = '⚠️ Please accept the listing declaration.';
    return false;
  }

  const data = {
    name: document.getElementById('bizName').value.trim(),
    category: document.getElementById('bizCategory').value,
    township: document.getElementById('bizTownship').value,
    description: document.getElementById('bizDesc').value.trim(),
    address: document.getElementById('bizAddress').value.trim(),
    phone: document.getElementById('bizPhone').value.trim(),
    whatsapp: document.getElementById('bizWhatsApp').value.trim(),
    hours: document.getElementById('bizHours').value.trim(),
    map_embed: document.getElementById('bizMapEmbed').value.trim(),
    website1: document.getElementById('bizWebsite1').value.trim(),
    website2: document.getElementById('bizWebsite2').value.trim(),
    facebook: document.getElementById('bizFacebook').value.trim(),
    instagram: document.getElementById('bizInstagram').value.trim(),
    tiktok: document.getElementById('bizTiktok').value.trim(),
    youtube: document.getElementById('bizYoutube').value.trim(),
    vimeo: document.getElementById('bizVimeo').value.trim(),
    owner_name: document.getElementById('ownerName').value.trim(),
    email: document.getElementById('ownerEmail').value.trim(),
  };

  if (!data.name || !data.category || !data.township || !data.description || !data.address || !data.phone || !data.email) {
    status.style.color = 'var(--red)';
    status.textContent = '⚠️ Please fill in all required fields.';
    return false;
  }

  btn.disabled = true;
  btn.textContent = 'Submitting…';
  status.style.color = 'var(--text-muted)';
  status.textContent = '';

  try {
    // 1. Upload images (if any) straight to Cloudinary from the browser
    const featuredFile = document.getElementById('bizFeatured').files[0];
    const galleryFiles = Array.from(document.getElementById('bizGallery').files).slice(0, 6);
    let featuredUrl = '';
    let galleryUrls = [];

    if (featuredFile || galleryFiles.length) {
      progress.textContent = `Uploading photos… (0/${(featuredFile ? 1 : 0) + galleryFiles.length})`;
      let done = 0;
      const total = (featuredFile ? 1 : 0) + galleryFiles.length;
      if (featuredFile) {
        featuredUrl = await uploadToCloudinary(featuredFile);
        done++; progress.textContent = `Uploading photos… (${done}/${total})`;
      }
      for (const f of galleryFiles) {
        galleryUrls.push(await uploadToCloudinary(f));
        done++; progress.textContent = `Uploading photos… (${done}/${total})`;
      }
      progress.textContent = '';
    }

    // 2. Create the business listing in WordPress (status: pending — awaiting your review)
    await createBusinessPost(data, featuredUrl, galleryUrls);

    // 3. Email confirmations (business owner + you) via EmailJS
    await sendSubmissionEmails(data);

    document.getElementById('bizForm').style.display = 'none';
    document.getElementById('successMsg').style.display = 'block';

  } catch (err) {
    console.error(err);
    status.style.color = 'var(--red)';
    status.textContent = '⚠️ ' + (err.message || 'Something went wrong — please try again.');
    btn.disabled = false;
    btn.textContent = 'Submit My Business →';
  }
  return false;
}

async function createBusinessPost(data, featuredUrl, galleryUrls) {
  // Submits to the custom "/ulundi/v1/submit-business" endpoint added via
  // the Code Snippets plugin in wp-admin — a shared secret key (ULSV_SUBMIT_KEY)
  // sent as a normal field, instead of an Authorization header. It only ever
  // creates a PENDING post, so it's safe to keep in this public config.js.
  // NOTE: the fields below are sent FLAT (no "acf" wrapper) — this must match
  // how ulsv_submit_business() in the WordPress snippet reads $req->get_param(...).
  if (!SITE_CONFIG.ULSV_SUBMIT_KEY || SITE_CONFIG.ULSV_SUBMIT_KEY.indexOf('YOUR_') !== -1 || SITE_CONFIG.ULSV_SUBMIT_KEY.indexOf('change-me') !== -1) {
    throw new Error('The website is not fully connected to WordPress yet (see SETUP.md → ULSV_SUBMIT_KEY).');
  }

  const body = {
    api_key: SITE_CONFIG.ULSV_SUBMIT_KEY,
    name: data.name,
    description: data.description,
    category: data.category,
    township: data.township,
    address: data.address,
    phone: data.phone,
    whatsapp: data.whatsapp,
    email: data.email,
    hours: data.hours,
    map_embed: data.map_embed,
    website1: data.website1,
    website2: data.website2,
    facebook: data.facebook,
    instagram: data.instagram,
    tiktok: data.tiktok,
    youtube: data.youtube,
    vimeo: data.vimeo,
    owner_name: data.owner_name,
    featured_image_url: featuredUrl,
    gallery_urls: galleryUrls.join(','),
  };

  const res = await fetch(`${SITE_CONFIG.WP_API_BASE}/ulundi/v1/submit-business`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error('WP error:', errText);
    throw new Error('We could not save your listing — please try again or contact us directly.');
  }
  return res.json();
}

async function sendSubmissionEmails(data) {
  if (!window.emailjs || SITE_CONFIG.EMAILJS_PUBLIC_KEY.indexOf('YOUR_') !== -1) return; // not configured — skip silently

  try {
    await emailjs.send(SITE_CONFIG.EMAILJS_SERVICE_ID, SITE_CONFIG.EMAILJS_TEMPLATE_SUBMISSION_CONFIRM, {
      to_email: data.email,
      business_name: data.name,
      owner_name: data.owner_name || data.name,
      declaration_text: ulsvDeclarationText(),
    });
  } catch (e) { console.warn('Confirmation email failed:', e); }

  try {
    await emailjs.send(SITE_CONFIG.EMAILJS_SERVICE_ID, SITE_CONFIG.EMAILJS_TEMPLATE_ADMIN_ALERT, {
      to_email: SITE_CONFIG.ADMIN_EMAIL,
      business_name: data.name,
      owner_email: data.email,
      owner_phone: data.phone,
      category: data.category,
      township: data.township,
    });
  } catch (e) { console.warn('Admin alert email failed:', e); }
}