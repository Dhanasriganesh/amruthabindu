# Firebase / Firestore setup for Amrutha Bindu

Create a Firebase project and enable **Authentication** (Email/Password), **Firestore**, and **Storage**.

## Firestore collections

| Collection | Document ID | Fields |
|------------|-------------|--------|
| `cms` | `products`, `homeContent`, `headerContent` | `data`, `lastUpdated`, `updatedBy` |
| `orders` | auto | `order_id`, `payment_id`, `items`, `totals`, `shipping_address`, `guest_email`, `user_id`, `shiprocket_order_id`, `shiprocket_shipment_id`, `tracking_number`, `fulfillment_status`, `created_at` |
| `contact_messages` | auto | `name`, `email`, `phone`, `subject`, `message`, `created_at` |
| `user_carts` | `{userId}` | `user_id`, `items`, `updated_at` |
| `user_favorites` | `{userId}_{productId}` | `user_id`, `product_id`, `created_at` |
| `hero_slides` | auto | `image_url`, `title`, `title_accent`, `description`, `cta_*`, `order`, `is_active` |
| `coupons` | auto | `code`, `discount_type`, `discount_value`, dates, `usage_type`, `max_uses`, `current_uses` |
| `coupon_usage` | auto | `coupon_id`, `user_id`, `user_email`, `order_id`, `discount_applied`, `used_at` |
| `email_marketing_list` | normalized email id | `email`, `name`, `source`, `created_at` |
| `admins` | user email (sanitized) or Firebase `uid` | `email`, `active` (default true) — who can access `/admin` |

## Admin access

1. Create the user in **Firebase Authentication** (Email/Password).
2. Add to `.env`: `VITE_ADMIN_EMAILS=you@example.com` (comma-separated for multiple admins).
3. **Deploy** `firestore.rules` (see below).
4. Sign in to `/admin` once — the app auto-creates:
   - `config/adminAccess` with `{ "adminEmails": [...] }` (from `VITE_ADMIN_EMAILS`)
   - `admins/{your-uid}` with `{ "email": "...", "active": true }`

**Manual fallback** (if auto-setup fails): create either document in Firestore:

| Path | Fields |
|------|--------|
| `config/adminAccess` | `{ "adminEmails": ["you@example.com"] }` |
| `admins/{YOUR_UID}` | `{ "email": "you@example.com", "active": true }` |

Without step 3–4, the admin UI may load but **Analytics**, orders, and CMS saves show **permission denied**.

CMS images (base64) are stored in Firestore at `cms/products`, `cms/homeContent`, and `cms/headerContent` in the `data` field — not in Storage.

### Product categories

Each product in `cms/products` → `data[]` uses `category`:

| Value | Label |
|-------|--------|
| `foods` | Foods |
| `naturals` | Naturals |

Legacy values (`skin-care`, `hair-care`, `oral-care`, `gift-hamper`) are migrated automatically when an admin opens **Products Management** (rewrites Firestore via `migrateProductCategoriesInFirestore`). Skin/hair/oral map to `naturals`; gift-hamper maps to `foods`.

## Deploy security rules

From project root (with [Firebase CLI](https://firebase.google.com/docs/cli) installed):

```bash
firebase login
firebase use amrutha-bindu
firebase deploy --only firestore:rules,storage
```

Or paste `firestore.rules` and `storage.rules` manually in Firebase Console → Firestore/Storage → **Rules** → Publish.

## Composite indexes (create in Firebase Console if queries fail)

- `orders`: `user_id` + `created_at` (desc)
- `orders`: `guest_email` + `created_at` (desc)
- `hero_slides`: `is_active` + `order` (asc)
- `coupon_usage`: `coupon_id` + `used_at` (desc)

## Security rules (starter — tighten for production)

Use rules that allow authenticated users their own cart/favorites and restrict admin writes to your deployment model.

## Storage folders

- `products/`
- `home/`
- `header/`
