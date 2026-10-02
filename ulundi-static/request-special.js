/* ============================================================
   ULUNDI SERVICES — REQUEST-SPECIAL.JS
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  if (window.emailjs && SITE_CONFIG.EMAILJS_PUBLIC_KEY.indexOf('YOUR_') === -1) {
    emailjs.init({ publicKey: SITE_CONFIG.EMAILJS_PUBLIC_KEY });
  }
  document.getElementById('specialIntro').textContent =
    `Tell us about your promotion. Homepage banners are ${SITE_CONFIG.BANNER_PRICE}, popups are ${SITE_CONFIG.POPUP_PRICE} — ` +
    `we'll email you an invoice and switch it live once it's paid.`;

  document.getElementById('specialImage').addEventListener('change', e => {
    const wrap = document.getElementById('specialImagePreview');
    wrap.innerHTML = '';
    if (e.target.files[0]) {
      const img = document.createElement('img');
      img.src = URL.createObjectURL(e.target.files[0]);
      wrap.appendChild(img);
    }
  });
});

async function submitSpecial(e) {
  e.preventDefault();
  const btn = document.getElementById('specialSubmitBtn');
  const status = document.getElementById('specialStatus');

  if (document.querySelector('[name=website_hp]').value) return false;

  const data = {
    business: document.getElementById('specialBusiness').value.trim(),
    title: document.getElementById('specialTitle').value.trim(),
    desc: document.getElementById('specialDesc').value.trim(),
    start: document.getElementById('specialStart').value,
    end: document.getElementById('specialEnd').value,
    placement: document.getElementById('specialPlacement').value,
    link: document.getElementById('specialLink').value.trim(),
    email: document.getElementById('specialEmail').value.trim(),
  };

  if (!data.business || !data.title || !data.email) {
    status.style.color = 'var(--red)';
    status.textContent = '⚠️ Please fill in the business name, title and email.';
    return false;
  }

  btn.disabled = true;
  btn.textContent = 'Submitting…';
  status.textContent = '';

  try {
    let imageUrl = '';
    const file = document.getElementById('specialImage').files[0];
    if (file) imageUrl = await uploadToCloudinary(file);

    const price = data.placement === 'banner' ? SITE_CONFIG.BANNER_PRICE : SITE_CONFIG.POPUP_PRICE;

    if (window.emailjs && SITE_CONFIG.EMAILJS_PUBLIC_KEY.indexOf('YOUR_') === -1) {
      await emailjs.send(SITE_CONFIG.EMAILJS_SERVICE_ID, SITE_CONFIG.EMAILJS_TEMPLATE_SPECIAL_REQUEST, {
        to_email: SITE_CONFIG.ADMIN_EMAIL,
        business_name: data.business,
        special_title: data.title,
        description: data.desc,
        placement: data.placement,
        price: price,
        start_date: data.start,
        end_date: data.end,
        link: data.link,
        image_url: imageUrl,
        owner_email: data.email,
      });

      // confirmation copy to the business owner, reusing the same template
      // with a different "to" — duplicate the template in EmailJS if you'd
      // like separate wording for this one (see SETUP.md).
      await emailjs.send(SITE_CONFIG.EMAILJS_SERVICE_ID, SITE_CONFIG.EMAILJS_TEMPLATE_SPECIAL_REQUEST, {
        to_email: data.email,
        business_name: data.business,
        special_title: data.title,
        description: data.desc,
        placement: data.placement,
        price: price,
        start_date: data.start,
        end_date: data.end,
        link: data.link,
        image_url: imageUrl,
        owner_email: data.email,
      });
    }

    document.getElementById('specialForm').style.display = 'none';
    document.getElementById('successMsg').style.display = 'block';
  } catch (err) {
    console.error(err);
    status.style.color = 'var(--red)';
    status.textContent = '⚠️ ' + (err.message || 'Something went wrong — please try again.');
    btn.disabled = false;
    btn.textContent = 'Submit Special →';
  }
  return false;
}
