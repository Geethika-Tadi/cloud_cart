# CloudCart — Quick Start

## What's in this zip
```
frontend/   your existing HTML/CSS/JS (unchanged, works as a standalone demo)
backend/    PHP API — auth, products, cart, wishlist, checkout, orders
database/   schema.sql — MySQL schema + 16 seed products
docs/
  PROJECT_DOCUMENTATION.md   for your written submission
  AWS_DEPLOYMENT_GUIDE.md    step-by-step EC2 / RDS / S3 / IAM / VPC setup
  FRONTEND_INTEGRATION.md    how to wire script.js to the PHP API
```

## Fastest path to a working demo tonight

**Option A — just present the frontend as-is.** `frontend/index.html` already
works standalone (data lives in the browser). Good if you're short on time and
mainly need the UI + documentation for the module-distribution grading.

**Option B — show the real full stack (recommended for marks on "AWS
deployment" and "database integration"):**
1. Install XAMPP (Windows/Mac) or `sudo apt install apache2 php php-mysql mysql-server` (Linux) to test locally first.
2. Import `database/schema.sql` into MySQL:
   `mysql -u root -p < database/schema.sql`
3. Copy `frontend/*` and `backend/*` into your web server's root folder
   (e.g. `htdocs/cloudcart/`).
4. Edit `backend/db.php` with your local MySQL username/password.
5. Open `http://localhost/cloudcart/` — sign up, browse, add to cart, checkout.
6. Once it works locally, follow `docs/AWS_DEPLOYMENT_GUIDE.md` to put it on
   EC2 + RDS + S3 for the real deployment (or just screenshot/describe the
   steps if you're tight on time before submission).

## For the write-up
Use `docs/PROJECT_DOCUMENTATION.md` directly — it already maps each of the 8
member roles to a concrete deliverable in this zip, includes the architecture
diagram, database schema summary, and the AWS services table from your brief.
