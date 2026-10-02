/* ============================================================
   ULUNDI SERVICES — SITE CONFIG
   Edit the values in this file only. Every other file reads
   from here, so you never have to touch app.js / list-business.js
   to change dates, prices, or your API keys.
   ============================================================ */

const SITE_CONFIG = {

  // ---------- Your headless WordPress ----------
  WP_API_BASE: 'https://olivedrab-scorpion-972001.hostingersite.com/wp-json',
  BUSINESSES_ENDPOINT: '/wp/v2/businesses',           // your existing "businesses" CPT
  CATEGORIES_ENDPOINT: '/wp/v2/biz_category',
  SPECIALS_ENDPOINT: '/wp/v2/specials',                // new CPT — see SETUP.md to create it (no coding, just the free "Custom Post Type UI" + "Advanced Custom Fields" plugins)
  PER_PAGE: 50,

  // A dedicated WordPress "Contributor" account used only to receive public
  // submissions (Contributors can create posts but never publish them, so
  // every submission lands as "Pending" for you to review). Log in as that
  // user → Profile → Application Passwords → create one, then paste both
  // values below. See SETUP.md for the exact steps.
  WP_SUBMIT_USERNAME: 'YOUR_CONTRIBUTOR_USERNAME',
  WP_SUBMIT_APP_PASSWORD: 'YOUR_APPLICATION_PASSWORD',

  // ---------- EmailJS (free, sends real email straight from the browser) ----------
  // Sign up free at https://www.emailjs.com — create a Service + two
  // Templates (see SETUP.md for the exact template variables used below).
  EMAILJS_PUBLIC_KEY: 'YOUR_EMAILJS_PUBLIC_KEY',
  EMAILJS_SERVICE_ID: 'YOUR_EMAILJS_SERVICE_ID',
  EMAILJS_TEMPLATE_SUBMISSION_CONFIRM: 'template_submission_confirm', // "we got your listing" -> business owner
  EMAILJS_TEMPLATE_ADMIN_ALERT: 'template_admin_alert',               // "new listing to review" -> you
  EMAILJS_TEMPLATE_APPROVED: 'template_approved',                     // "you're live!" -> business owner (sent from admin.html)
  EMAILJS_TEMPLATE_SPECIAL_REQUEST: 'template_special_request',       // "new special request" -> you
  ADMIN_EMAIL: 'you@ulundiservices.co.za',

  // ---------- Cloudinary (free image hosting, direct from the browser) ----------
  // Sign up free at https://cloudinary.com → Settings → Upload →
  // add an "Unsigned" upload preset, then paste both values below.
  CLOUDINARY_CLOUD_NAME: 'YOUR_CLOUD_NAME',
  CLOUDINARY_UPLOAD_PRESET: 'YOUR_UPLOAD_PRESET',

  // ---------- Free listing / paid listing declaration ----------
  FREE_LISTING_MONTHS: 'October and November 2026',
  PAYMENT_START_MONTH: 'December 2026',
  MONTHLY_FEE: 'R50',

  // ---------- Specials / ads pricing ----------
  BANNER_PRICE: 'R150 / month',
  POPUP_PRICE: 'R250 / month',

  // ---------- Categories (township-suitable) ----------
  CATEGORIES: [
    { slug: 'food',           label: 'Food & Restaurants',      emoji: '🍖', color: '#FFF3E0' },
    { slug: 'carwash',        label: 'Car Wash',                emoji: '🚗', color: '#E3F2FD' },
    { slug: 'hair',           label: 'Hair & Beauty',           emoji: '💇', color: '#FCE4EC' },
    { slug: 'spaza',          label: 'Spaza Shop',              emoji: '🛒', color: '#F3E5F5' },
    { slug: 'mechanic',       label: 'Auto & Mechanics',        emoji: '🔧', color: '#E8F5E9' },
    { slug: 'catering',       label: 'Catering',                emoji: '🍽️', color: '#FFF8E1' },
    { slug: 'clothing',       label: 'Clothing & Fashion',      emoji: '👗', color: '#E0F7FA' },
    { slug: 'health',         label: 'Health & Wellness',       emoji: '💊', color: '#E8F5E9' },
    { slug: 'house-building', label: 'House Building',          emoji: '🧱', color: '#EFEBE9' },
    { slug: 'house-plans',    label: 'House Plan Designs',      emoji: '📐', color: '#ECEFF1' },
    { slug: 'garden',         label: 'Garden Services',         emoji: '🌿', color: '#E6F7EE' },
    { slug: 'hire',           label: 'Items for Hire',          emoji: '🎪', color: '#FFF3E0' },
    { slug: 'sound-dj',       label: 'Sound System & DJ',       emoji: '🔊', color: '#EDE7F6' },
    { slug: 'photography',    label: 'Photography',             emoji: '📷', color: '#E1F5FE' },
    { slug: 'sand-stone',     label: 'Sand & Stone Supply',     emoji: '⛏️', color: '#FBE9E7' },
    { slug: 'bricklayer',     label: 'Brick Layer',             emoji: '🧱', color: '#EFEBE9' },
    { slug: 'paving',         label: 'Paving',                  emoji: '🪨', color: '#EFEBE9' },
    { slug: 'driving-school', label: 'Driving School',          emoji: '🚘', color: '#E3F2FD' },
    { slug: 'school',         label: 'Crèche & School',         emoji: '🎓', color: '#E8EAF6' },
    { slug: 'fitness',        label: 'Fitness Center',          emoji: '💪', color: '#E8F5E9' },
    { slug: 'aircon',         label: 'Aircon & Refrigeration',  emoji: '❄️', color: '#E1F5FE' },
    { slug: 'plumbing',       label: 'Plumbing',                emoji: '🚰', color: '#E1F5FE' },
    { slug: 'electrician',    label: 'Electrician',             emoji: '💡', color: '#FFFDE7' },
    { slug: 'funeral',        label: 'Funeral Services',        emoji: '🕊️', color: '#ECEFF1' },
    { slug: 'tavern',         label: 'Tavern & Shisanyama',     emoji: '🍺', color: '#FFF3E0' },
    { slug: 'transport',      label: 'Transport & Taxi',        emoji: '🚐', color: '#E3F2FD' },
    { slug: 'welding',        label: 'Welding & Steel Works',   emoji: '🔩', color: '#EFEBE9' },
    { slug: 'security',       label: 'Security Services',       emoji: '🛡️', color: '#ECEFF1' },
    { slug: 'tuckshop',       label: 'Tuck Shop',               emoji: '🏪', color: '#F3E5F5' },
    { slug: 'other',          label: 'Other',                   emoji: '📌', color: '#E6F7EE' },
  ],

  // ---------- Townships ----------
  TOWNSHIPS: [
    { slug: 'ulundi',     label: 'Ulundi' },
    { slug: 'mondlo',     label: 'Mondlo' },
    { slug: 'nongoma',    label: 'Nongoma' },
    { slug: 'esikhawini', label: 'eSikhawini' },
    { slug: 'ngwelezane', label: 'Ngwelezane' },
    { slug: 'nseleni',    label: 'Nseleni' },
  ],
};

function ulsvCategoryMeta(slug) {
  return SITE_CONFIG.CATEGORIES.find(c => c.slug === slug) || { emoji: '🏪', color: '#E6F7EE', label: 'Business' };
}

/**
 * Uploads a single image straight from the browser to Cloudinary (free tier)
 * and returns its public URL. Used by list-business.js and request-special.js.
 */
async function uploadToCloudinary(file) {
  if (SITE_CONFIG.CLOUDINARY_CLOUD_NAME.indexOf('YOUR_') !== -1) {
    throw new Error('Image hosting is not configured yet (see SETUP.md → Cloudinary).');
  }
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', SITE_CONFIG.CLOUDINARY_UPLOAD_PRESET);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${SITE_CONFIG.CLOUDINARY_CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: formData
  });
  if (!res.ok) throw new Error('Image upload failed');
  const data = await res.json();
  return data.secure_url;
}

function ulsvDeclarationText() {
  return `I understand that listing my business on Ulundi Services is free during ${SITE_CONFIG.FREE_LISTING_MONTHS}. ` +
    `From ${SITE_CONFIG.PAYMENT_START_MONTH}, a listing fee of ${SITE_CONFIG.MONTHLY_FEE} per month applies to keep my ` +
    `business live on the directory. I will be contacted by email beforehand to arrange payment.`;
}
