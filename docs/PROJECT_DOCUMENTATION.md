# CloudCart — AWS-Based Mini E-Commerce Platform
## Project Documentation

---

### 1. Overview
CloudCart is a mini e-commerce platform where users can browse products, manage
a cart and wishlist, sign up/log in, and check out. The frontend is a
responsive HTML/CSS/JS single-page app; the backend is PHP with a MySQL
database, deployable on AWS using EC2 (hosting), RDS (database), S3 (product
images) IAM (access control), and a VPC (network security).

### 2. Architecture

```
                     ┌───────────────────────────┐
   Browser  ───────▶ │   EC2 (Apache + PHP)      │
  (HTML/CSS/JS)      │   /var/www/html           │
                      └─────────────┬─────────────┘
                                    │ PDO/MySQL (port 3306)
                                    ▼
                      ┌───────────────────────────┐
                      │   RDS — MySQL Database    │
                      │   users / products /      │
                      │   cart / orders           │
                      └───────────────────────────┘
                                    ▲
                     product image URLs
                                    │
                      ┌───────────────────────────┐
                      │   S3 — product images     │
                      └───────────────────────────┘

     IAM governs who/what can access the S3 bucket.
     A VPC + security groups control network access
     between the browser, EC2, and RDS.
```

### 3. Team Responsibilities & Deliverables

| Member | Module | Deliverable in this package |
|---|---|---|
| 1 | Homepage & UI Design | `frontend/index.html`, `frontend/style.css` |
| 2 | Product Catalog | `frontend/script.js` (grid/detail rendering), `backend/products.php` |
| 3 | User Authentication | `backend/register.php`, `backend/login.php`, `backend/logout.php` |
| 4 | Shopping Cart | `backend/cart.php`, `backend/checkout.php` |
| 5 | Database Design | `database/schema.sql` |
| 6 | EC2 Deployment | `docs/AWS_DEPLOYMENT_GUIDE.md` (§1–3) |
| 7 | S3 & IAM | `docs/AWS_DEPLOYMENT_GUIDE.md` (§4–5) |
| 8 | Testing & Docs | This file + `docs/FRONTEND_INTEGRATION.md` |

### 4. Database Schema (summary)
- **users** — id, full_name, email, password_hash, created_at
- **products** — id, name, category, image_url, price, old_price, rating, review_count, badge, description
- **cart** — user_id, product_id, quantity
- **wishlist** — user_id, product_id
- **orders** — user_id, total_amount, payment_method, address, city, pincode, phone, status
- **order_items** — order_id, product_id, quantity, price

Full DDL in `database/schema.sql`, including the 16 seed products already used
in the frontend demo.

### 5. AWS Services Used

| Service | Purpose | Where configured |
|---|---|---|
| EC2 | Hosts the Apache/PHP web application | `AWS_DEPLOYMENT_GUIDE.md` §3 |
| RDS (MySQL) | Managed relational database | `AWS_DEPLOYMENT_GUIDE.md` §2 |
| S3 | Stores and serves product images | `AWS_DEPLOYMENT_GUIDE.md` §4 |
| IAM | Controls who/what can access S3 | `AWS_DEPLOYMENT_GUIDE.md` §5 |
| VPC | Network isolation/security groups for EC2 ⇄ RDS | `AWS_DEPLOYMENT_GUIDE.md` §1 |

### 6. Testing performed (fill in with your actual results before submitting)
- [ ] Signup with a Gmail address creates a row in `users`
- [ ] Login rejects wrong password, accepts correct one
- [ ] Product grid loads all items from the database
- [ ] Search/category filter returns correct subset
- [ ] Add to cart / change quantity / remove all persist to `cart` table
- [ ] Checkout creates an `orders` row and clears the cart
- [ ] Order history page lists past orders

### 7. Known limitations / future work
- Password reset is a demo placeholder (no real email sending).
- Payment gateway (Card/UPI/Net Banking) is simulated — no real payment
  provider is integrated.
- Social login (Google/Facebook) buttons are placeholders.
- For production use, RDS public access should be disabled and only the EC2
  security group should be allowed to connect (see guide §2, step 11).

### 8. Expected outcome (per project brief)
This build demonstrates full-stack web development (HTML/CSS/JS + PHP/MySQL),
AWS cloud deployment (EC2/RDS/S3/IAM/VPC), database integration, cloud storage
management, and a real-world e-commerce workflow from browsing to checkout.
