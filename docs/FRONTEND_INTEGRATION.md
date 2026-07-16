# Connecting the Existing Frontend to the PHP Backend

Your `frontend/script.js` currently stores everything in the browser's
`localStorage` (products are hardcoded, cart/wishlist/orders/users all live
client-side). That's perfectly fine to demo as-is — the UI already works.

To show a **real full-stack, database-backed app** for your presentation, wire
the key actions to the PHP API below. You don't have to convert everything —
even just Login/Signup + Product loading hitting the real database is enough
to prove the AWS/PHP/MySQL stack works.

## Endpoints available (all return JSON: `{success: true/false, ...}`)

| Endpoint | Method | Purpose |
|---|---|---|
| `/register.php` | POST `{name, email, password}` | Create account |
| `/login.php` | POST `{email, password}` | Sign in |
| `/logout.php` | POST | Sign out |
| `/products.php` | GET | All products (or `?category=`, `?search=`, `?id=`) |
| `/cart.php` | GET | Current user's cart with totals |
| `/cart.php` | POST `{action:'add', product_id, quantity}` | Add to cart |
| `/cart.php` | POST `{action:'update', product_id, quantity}` | Change qty |
| `/cart.php` | POST `{action:'remove', product_id}` | Remove item |
| `/cart.php` | POST `{action:'clear'}` | Empty cart |
| `/wishlist.php` | GET / POST `{action:'add'\|'remove', product_id}` | Wishlist |
| `/checkout.php` | POST `{payment_method, address, city, pincode, phone}` | Place order |
| `/orders.php` | GET | Order history |

## Minimal changes to `script.js`

**1. Replace `doLogin()` body's localStorage check with a fetch call:**
```javascript
async function doLogin(){
  const email = document.getElementById('lEmail').value;
  const pass  = document.getElementById('lPass').value;
  const res = await fetch('login.php', {
    method:'POST', credentials:'include',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({email, password: pass})
  });
  const data = await res.json();
  if(!data.success){ showToast(data.error, 'red'); return; }
  loginSuccess(data.user); // reuse your existing function
}
```

**2. Replace `doSignup()` the same way, calling `register.php`.**

**3. Load real products on page start** (replace the `const PRODUCTS = [...]` usage in render calls):
```javascript
let PRODUCTS = [];
async function loadProducts(){
  const res = await fetch('products.php');
  const data = await res.json();
  PRODUCTS = data.products.map(p => ({
    id:+p.id, name:p.name, cat:p.category, img:p.image_url,
    price:+p.price, old:p.old_price?+p.old_price:null,
    rating:+p.rating, rev:+p.review_count, badge:p.badge, desc:p.description
  }));
  renderGrid(PRODUCTS);
}
// call loadProducts() during page init instead of relying on the hardcoded array
```

**4. Cart/wishlist/checkout** follow the same pattern: call the endpoint with
`fetch(..., {credentials:'include'})` so the PHP session cookie is sent, then
update the UI with the existing `render...()` functions using the response data.

> All fetch calls need `credentials: 'include'` so the PHP session cookie
> (used to know which user is logged in) is sent with every request.

## Local testing before AWS deployment
Install XAMPP/MAMP (or just PHP + MySQL) locally, put `frontend/` + `backend/`
files together in one folder served by Apache, import `database/schema.sql`
into local MySQL, and update `db.php` with `localhost` credentials. This lets
you verify everything works before doing the AWS deployment in
`AWS_DEPLOYMENT_GUIDE.md`.
