-- ============================================================
-- CloudCart Database Schema
-- Target: MySQL 8.0 on Amazon RDS
-- ============================================================

CREATE DATABASE IF NOT EXISTS cloudcart CHARACTER SET utf8mb4;
USE cloudcart;

-- ------------------------------------------------------------
-- USERS  (Member 3 - Authentication Module)
-- ------------------------------------------------------------
CREATE TABLE users (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    full_name     VARCHAR(100)  NOT NULL,
    email         VARCHAR(150)  NOT NULL UNIQUE,
    password_hash VARCHAR(255)  NOT NULL,
    created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- PRODUCTS  (Member 2 - Product Catalog Module)
-- image_url points to an Amazon S3 object URL (Member 7)
-- ------------------------------------------------------------
CREATE TABLE products (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(200)   NOT NULL,
    category    VARCHAR(50)    NOT NULL,
    image_url   VARCHAR(500),
    price       DECIMAL(10,2)  NOT NULL,
    old_price   DECIMAL(10,2)  DEFAULT NULL,
    rating      DECIMAL(2,1)   DEFAULT 0,
    review_count INT           DEFAULT 0,
    badge       VARCHAR(20)    DEFAULT NULL,
    description TEXT,
    created_at  TIMESTAMP      DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- CART  (Member 4 - Shopping Cart Module)
-- One row per user per product; qty updated in place
-- ------------------------------------------------------------
CREATE TABLE cart (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT NOT NULL,
    product_id  INT NOT NULL,
    quantity    INT NOT NULL DEFAULT 1,
    added_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_product (user_id, product_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- WISHLIST
-- ------------------------------------------------------------
CREATE TABLE wishlist (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT NOT NULL,
    product_id  INT NOT NULL,
    added_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_wish (user_id, product_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- ORDERS  (created at checkout / payment)
-- ------------------------------------------------------------
CREATE TABLE orders (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    user_id       INT NOT NULL,
    total_amount  DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(30)  NOT NULL,
    address       VARCHAR(255),
    city          VARCHAR(100),
    pincode       VARCHAR(10),
    phone         VARCHAR(20),
    status        VARCHAR(20)  DEFAULT 'Placed',
    created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE order_items (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    order_id    INT NOT NULL,
    product_id  INT NOT NULL,
    quantity    INT NOT NULL,
    price       DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- ============================================================
-- SEED DATA — the 16 demo products already used in script.js
-- Replace image_url values with your own Amazon S3 bucket URLs,
-- e.g. https://your-bucket.s3.amazonaws.com/products/1.jpg
-- ============================================================
INSERT INTO products (id, name, category, image_url, price, old_price, rating, review_count, badge, description) VALUES
(1,  'Wireless Noise-Cancelling Headphones', 'Electronics', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80', 4999,  7999, 4.8, 2341,  'Sale', '30-hour battery, premium ANC, cushioned ear cups. Compatible with all Bluetooth 5.0 devices.'),
(2,  'Classic White Sneakers',               'Fashion',     'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80', 2999,  4500, 4.6, 1234,  'Sale', 'Lightweight breathable canvas upper with cushioned sole. Available in 6 sizes.'),
(3,  'Smart LED Desk Lamp with USB',         'Home',        'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500&q=80', 2199,  2999, 4.7, 543,   'Sale', '5 colour modes, auto-dimming, USB-A charging port and 1hr memory function.'),
(4,  'Pro Running Shoes – Lightweight',      'Sports',      'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=500&q=80', 3799,  5200, 4.9, 1120,  'Sale', 'Engineered mesh with dual-density foam midsole. Reflective strips for safety.'),
(5,  'Vitamin C Brightening Face Serum',     'Beauty',      'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500&q=80', 899,   NULL, 4.5, 2987,  'New',  '20% stabilised Vitamin C + hyaluronic acid. Dermatologist-tested. Visible glow in 4 weeks.'),
(6,  'Atomic Habits – James Clear',          'Books',       'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=500&q=80', 399,   599,  4.9, 15230, 'Sale', '#1 NYT Bestseller. Tiny habits compound into life-changing results.'),
(7,  '4K Smart Android TV 43"',              'Electronics', 'https://images.unsplash.com/photo-1461151304267-38535e780c79?w=500&q=80', 32999, 42000,4.7, 441,   'Sale', '4K HDR Dolby Vision & Atmos. Built-in voice assistant, 60Hz, 3xHDMI.'),
(8,  'Leather Crossbody Handbag',            'Fashion',     'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500&q=80', 1899,  NULL, 4.4, 633,   'New',  'Full-grain vegan leather, adjustable strap, interior zip pocket, magnetic snap.'),
(9,  'Digital Air Fryer 4.5L',               'Home',        'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=500&q=80', 5499,  7200, 4.8, 2108,  'Sale', '95% less oil, 8 presets, digital touchscreen, dishwasher-safe basket.'),
(10, 'Premium Non-Slip Yoga Mat',            'Sports',      'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=500&q=80', 999,   NULL, 4.6, 789,   'New',  '6mm thick TPE with alignment markings, moisture-wicking surface and carry strap.'),
(11, 'Luxury Skincare Gift Set',             'Beauty',      'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=500&q=80', 2499,  3500, 4.7, 1456,  'Sale', '5-piece routine: cleanser, toner, serum, moisturiser and eye cream. Dermatologist approved.'),
(12, 'Sapiens – Yuval Noah Harari',          'Books',       'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500&q=80', 349,   499,  4.8, 8900,  'Sale', 'The landmark history of humankind. From foragers to space-farers.'),
(13, 'Mechanical RGB Gaming Keyboard',       'Electronics', 'https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=500&q=80', 6499,  8500, 4.7, 992,   'Sale', 'Per-key RGB, aluminium body, tactile brown switches, N-key rollover, USB-C.'),
(14, "Men's Casual Denim Jacket",            'Fashion',     'https://images.unsplash.com/photo-1551537482-f2075a1d41f2?w=500&q=80', 2199,  NULL, 4.5, 321,   'New',  'Classic stonewash denim, button-front, chest pockets, relaxed fit. S-XXL.'),
(15, 'Indoor Potted Plant – Peace Lily',     'Home',        'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=500&q=80', 799,   NULL, 4.6, 214,   'New',  'Air-purifying Peace Lily in a ceramic pot. Low maintenance, indirect light.'),
(16, 'Stainless Steel Water Bottle 1L',      'Sports',      'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500&q=80', 599,   899,  4.4, 1867,  'Sale', 'Double-wall insulated, cold 24h / hot 12h. BPA-free, leak-proof lid.');
