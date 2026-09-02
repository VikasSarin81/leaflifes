# LEAFLIFE — Storefront (merged through Phase 5: Admin panel)

Next.js 14 (App Router), TypeScript, Tailwind, Prisma/Postgres. Phases so
far: catalog + cart (2), Postgres + auth (3), checkout + Razorpay (4),
admin panel (5).

## Current status

- **Real, working**: catalog, cart, NextAuth login/register, checkout +
  Razorpay, order confirmation.
- **New this phase — admin panel** at `/admin` (role-guarded to `ADMIN`/`STAFF`):
  - Dashboard with live sales/orders/stock stats pulled from Postgres.
  - Product list, create, and edit (`/admin/products`) — images are added by
    pasting a hosted URL for now; swap `ProductForm`'s `addImage` for a
    Cloudinary widget when you're ready to wire that in.
  - Category list + quick-add (`/admin/categories`).
  - Order list + detail with status update (`/admin/orders`).
- **⚠️ Needs a migration**: `Order`/`OrderItem` (from the checkout phase)
  still need their migration applied — see below.
- **Not built yet**: coupons, invoices, email notifications, wishlist,
  reviews, image upload widget, full order-status range (schema currently
  only has PENDING/CONFIRMED/CANCELLED — extend the `OrderStatus` enum with
  PROCESSING/PACKED/SHIPPED/DELIVERED/RETURNED/REFUNDED when you get to
  fulfillment tracking).
- **⚠️ Live credentials**: `.env` has a real Neon connection string and
  NextAuth secret. Keep this zip private; rotate the Neon password if it's
  ever shared outside a trusted channel.

## Run it locally

```bash
npm install
npx prisma generate
npx prisma migrate dev --name add_orders   # applies the pending Order/OrderItem tables
npm run db:seed                             # creates categories, demo products, and an admin login
npm run dev
```

Log into `/admin` with:
- **Email:** admin@leaflife.com
- **Password:** ChangeMe123! — change this immediately after first login (there's no
  "change password" UI yet, so update it directly via `prisma studio` or a
  quick script until that's built).

Add your Razorpay test keys to `.env` (see `.env.example`) to test payment.

## Product image gallery + quick stock edit

- **Storefront product pages now show all uploaded images**, not just the
  primary one — a main image with clickable thumbnails below
  (`components/ProductGallery.tsx`). Previously only `images[0]` ever
  rendered, so uploading 6 images and seeing only 1 on the live page was
  expected behavior, not a bug — this closes that gap.
- **Admin product list now has an "Update stock" popover** per row
  (`components/admin/StockQuickEdit.tsx`) — edit stock for every variant of
  a product without opening the full edit page.

## Two things to know when adding products

1. **Every product needs at least one variant** (e.g. Label: "100ml", any
   SKU, a price, and stock quantity) — without one, the storefront product
   page has nowhere to get a price/stock from, so it silently hides the
   "Add to cart"/"Buy now" buttons entirely rather than showing an error.
   The admin form now blocks Publish (not Draft) until at least one variant
   exists, with a message explaining why.
2. **Multi-image upload** now fetches a fresh signature per file and reports
   every failure individually (e.g. "2 of 6 image(s) failed — photo3.png:
   over 5MB; photo5.png: unsupported file type") instead of silently losing
   images or overwriting one error with the next.

## Rich text product descriptions

Product descriptions now use a proper editor (Tiptap) with bold, italic,
headings, bullet/numbered lists, links, line breaks, and inline image
insertion — images inserted into the description upload straight to
Cloudinary, same as product photos.

After unzipping this update, just run `npm install` to pick up the new
packages (`@tiptap/*`, `@tailwindcss/typography`) — no migration needed,
since descriptions were already a plain text field and now just store HTML
in that same field.

## About Us, Contact Us, and Footer (new)

- **`/about`** — brand story page matching your existing site voice.
- **`/contact`** — a real form (name, email, phone, subject, message) that
  saves to the database, not a mailto link.
- **`/admin/enquiries`** — see every contact form submission, mark as
  resolved.
- **Footer added** — the site had no footer at all before this, so About/
  Contact/Shop/Account links now live there on every page (this is also
  just generally expected on any e-commerce site, so worth having
  regardless).
- **Migration needed** (adds the `ContactEnquiry` table):
  ```bash
  npx prisma migrate dev --name add_contact_enquiries
  ```

## Branding: logo + favicon (this update)

- Your logo (`public/logo.jpeg`) now appears in the storefront header and
  the admin sidebar, replacing the plain text wordmark.
- The browser tab now shows your leaf mark instead of the default Next.js
  icon (`app/icon.png`, `app/apple-icon.png` — Next.js auto-detects these,
  no config needed).
- If you'd rather use a version of the logo with a transparent background
  (so it doesn't show as a dark green rectangle against the header), send
  me that file and I'll swap it in — same process either way.

## On the "slowness" — what I found and fixed

- Several images using `fill` were missing the `sizes` prop, which forces
  the browser to download a full-resolution image even for a small
  thumbnail (e.g. a 64px cart thumbnail pulling the same file size as the
  full product photo). Fixed across the homepage, product cards, product
  gallery, and cart.
- **The bigger factor is very likely `next dev` itself.** Next.js compiles
  each route the *first* time you visit it in development — that's the
  1–3 second delays you've been seeing, and it's normal, not a sign of a
  real problem. It does NOT happen in production. To see actual
  performance, run:
  ```bash
  npm run build
  npm run start
  ```
  and click around — this is what real customers would experience. If
  it's still slow there, that's a genuine issue worth investigating
  further (and worth telling me about specifically).

## Coupon / discount system (new)

- **Admin**: `/admin/coupons` — create coupons with code, percentage or
  fixed discount, minimum order value, max discount cap, usage limits
  (total and per-customer), and a validity date range. Activate/deactivate
  anytime.
- **Checkout**: customers enter a code, see the discount applied to the
  order summary before paying.
- **Security**: the discount is always recalculated server-side at both
  the "preview" step and the moment the order is actually created —a
  discount amount is never trusted from the browser. Usage counts
  (`CouponUsage`) are only recorded once a payment is confirmed (via
  `verify` or the webhook), so an abandoned checkout never burns through a
  customer's per-use limit.
- **Migration needed**:
  ```bash
  npx prisma migrate dev --name add_coupons
  ```

## Setting up image uploads (Cloudinary)

The admin product form now uploads directly to Cloudinary (drag-and-drop or
browse), instead of pasting a URL.

1. Sign up free at cloudinary.com.
2. From your dashboard, copy **Cloud name**, **API Key**, and **API Secret**.
3. Add them to `.env`:
   ```
   CLOUDINARY_CLOUD_NAME="your-cloud-name"
   CLOUDINARY_API_KEY="your-api-key"
   CLOUDINARY_API_SECRET="your-api-secret"
   ```
4. Run the new migration (adds `publicId` to `ProductImage`):
   ```bash
   npx prisma migrate dev --name add_image_public_id
   ```
5. Restart `npm run dev`.

Until you add real Cloudinary keys, uploads will fail with a 401 — that's
expected, not a bug.

## Known open issues (not yet fixed)

- **Only the seeded product page loads; other product slugs don't.** Worth
  checking directly in Prisma Studio whether those other products actually
  exist with valid slugs/categories — if the demo data only ever had one
  fully-formed product, that would explain it.
- **Login/cart header only appears on `localhost:3000`, not other routes/hosts.**
  Needs the header/nav component checked for hardcoded conditions.
- **General slowness navigating.** In dev mode this is often just Next.js
  compiling each route on first visit — worth comparing against `npm run build && npm run start` (production mode) before assuming something's wrong.

## Suggested next phases

## Design notes

Palette and type are picked for the "unfussy natural goods" brand voice, not
a generic template: warm parchment background, deep moss green as the
primary action color, ochre/clay as sparing accent colors, Fraunces for
display type paired with Public Sans for body/UI text. Adjust
`tailwind.config.ts` if the actual brand guidelines differ.
