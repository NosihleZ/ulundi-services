# Ulundi Services — Setup Guide

This is a **plain HTML / CSS / JavaScript** site (no plugin, no build step,
no server-side code to maintain). It talks to three free services, each
just a checkbox/plugin away — no coding required for any of them:

1. **Your existing WordPress** (headless — just its REST API) → stores businesses & specials
2. **EmailJS** (free) → sends real emails straight from the browser (confirmations, admin alerts, approval notices)
3. **Cloudinary** (free) → hosts uploaded photos

Everything you'd ever want to change (dates, prices, categories, API keys)
lives in **`config.js`** — you never need to touch the other files.

---

## 1. WordPress side (10 minutes, no code)

Install two free plugins: **Custom Post Type UI** and **Advanced Custom
Fields (ACF)**, plus **ACF to REST API** (lets the fields below be read
*and written* over the REST API — without it, submissions from
`list-business.html` won't save).

### Post types (Custom Post Type UI → Add New Post Type)
- `businesses` — Public: true, Show in REST API: true, REST API base slug: `businesses`, Capability type: **post** (this is what lets a Contributor account create pending listings — see step 2).
- `specials` — same settings, REST API base slug: `specials`.

### Fields (ACF → Field Groups) — create one group for each post type, with a field for every name below (all "Text" type unless noted; set the group to show in REST API):

**Businesses:**
`category_slug`, `township_slug`, `business_address`, `phone_number`,
`whatsapp_number`, `public_email` (Email field), `operating_hours`,
`map_embed_url` (URL), `website_1` (URL), `website_2` (URL),
`facebook_url` (URL), `instagram_url` (URL), `tiktok_url` (URL),
`youtube_video` (URL), `vimeo_video` (URL), `owner_name`,
`featured_image_url` (URL), `gallery_urls` (Text — stores a comma-separated
list of image URLs), `declaration_accepted` (True/False)

**Specials:**
`business_name`, `description` (Textarea), `placement` (Text: `banner` or
`popup`), `status` (Text: `pending_payment` / `active` / `expired`),
`image_url` (URL), `link` (URL), `start_date`, `end_date`

### Comments (for ratings & reviews — no extra plugin needed)
Settings → Discussion → make sure **"Allow people to submit comments on
new posts"** is ticked and no login is required to comment. Reviews are
just WordPress comments where the rating is written as the first line of
the comment ("Rating: 5"); the site hides that line and shows stars
instead.

### Two WordPress accounts (Users → Add New)
- **A "Contributor" account** just for public submissions. Contributors can
  create posts but never publish them — every public submission
  automatically lands as **Pending**, safely, however many spam bots find
  the form. Log in as this user → Profile → Application Passwords → create
  one → paste the username + password into `config.js`
  (`WP_SUBMIT_USERNAME` / `WP_SUBMIT_APP_PASSWORD`).
- **Your own Editor/Administrator account**, for `admin.html` (the private
  approvals page). Create a *separate* Application Password for this one
  too — you'll type it into `admin.html` itself (kept only in that browser
  tab, never saved to a file).

---

## 2. EmailJS (free — real emails, no server) — 10 minutes

1. Sign up at https://www.emailjs.com
2. Add an **Email Service** (connect your Gmail/Outlook/etc.)
3. Add **four templates** with exactly these variable names (EmailJS lets
   you write the subject/body however you like — just use these
   `{{variable}}` placeholders):

   | Template ID (paste into config.js) | Variables it needs |
   |---|---|
   | `template_submission_confirm` | to_email, business_name, owner_name, declaration_text |
   | `template_admin_alert` | to_email, business_name, owner_email, owner_phone, category, township |
   | `template_approved` | to_email, business_name, listing_url, declaration_text |
   | `template_special_request` | to_email, business_name, special_title, description, placement, price, start_date, end_date, link, image_url, owner_email |

4. Copy your **Public Key** and **Service ID** from the EmailJS dashboard.
5. Paste all of the above into `config.js`.

Until these are filled in, the site still works — it just skips sending
emails silently (submissions and specials still save to WordPress).

---

## 3. Cloudinary (free image hosting) — 5 minutes

1. Sign up at https://cloudinary.com
2. Settings → Upload → Add upload preset → set **Signing Mode: Unsigned**
   → copy its name.
3. Paste your **Cloud Name** and the **preset name** into `config.js`.

---

## 4. Fill in `config.js`

Open `config.js` and replace every `YOUR_...` placeholder with the real
values from steps 1–3. This is the *only* file with settings in it.

---

## 5. Upload the files

Upload every file in this folder (keeping them all in the same folder —
don't put them in subfolders) to your web host exactly as they are — no
build step, no npm install. This works on Hostinger, Netlify, GitHub
Pages, or literally any static file host.

- `index.html` — homepage / directory
- `list-business.html` — "List Your Business" form
- `request-special.html` — "Advertise a Special" form
- `admin.html` — **your private approvals page** — don't link to it from
  anywhere public; just bookmark it yourself
- `style.css`, `app.js`, `config.js`, `list-business.js`,
  `request-special.js`, `admin.js` — supporting files, don't rename them

---

## How the pieces fit together

- A visitor fills in **list-business.html** → photos upload to Cloudinary
  → the listing saves to WordPress as **Pending** → they get a
  confirmation email, and you get an alert email.
- You open **admin.html**, log in with your Editor/Admin Application
  Password, and see every pending listing with an **Approve & Notify** or
  **Decline** button. Approving publishes it *and* emails the owner that
  they're live — in one click.
- The homepage declaration text, and every email, pull the free-period
  dates and fee from `config.js` — change `FREE_LISTING_MONTHS`,
  `PAYMENT_START_MONTH` and `MONTHLY_FEE` there and every page updates.
- **Specials**: an owner fills in **request-special.html** → you get
  emailed → invoice them however you like → once paid, open the special
  post in wp-admin, set its ACF `status` field to `active`, and it appears
  automatically as a homepage banner or popup depending on the
  `placement` they chose.
- **Ratings & reviews** open from each business's detail modal (click any
  business card) — reviews save as WordPress comments (awaiting your
  approval in wp-admin like any comment), and the star average updates
  automatically once approved.
- The two **website links** each business can add render as normal,
  follow-able links — nothing marks them `nofollow`.

## Editing categories or townships

Both live as plain arrays at the top of `config.js` — add, rename, or
remove entries there and every dropdown, category tile, and township card
across the whole site updates automatically.
