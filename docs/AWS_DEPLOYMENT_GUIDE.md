# CloudCart — AWS Deployment Guide

This guide walks through deploying CloudCart using the AWS services listed in the
project brief: **EC2, RDS (MySQL), S3, IAM, and VPC**. Follow it in order — each
part builds on the one before it. Screenshots aren't included, but every console
screen name is called out so it's easy to follow along in the AWS Console.

Estimated time: 45–60 minutes if you already have an AWS account (free tier is enough).

---

## 0. Before you start
- Create/log in to an AWS account: https://aws.amazon.com
- Pick one region and stay in it for every step (e.g. `ap-south-1` — Mumbai).
- Keep this project inside the **AWS Free Tier** where possible: `t2.micro` / `t3.micro` EC2, `db.t3.micro` RDS.

---

## 1. VPC & Networking (Member 6 / Member 7)

Most AWS accounts already have a **Default VPC** — you can use that instead of
creating a new one, which saves time.

1. Go to **VPC console → Your VPCs** and confirm a default VPC exists in your region.
2. Note it has at least 2 subnets in different Availability Zones (needed for RDS).
3. **Security Groups** (created in step 2 & 3) live inside this VPC — that's the
   "network security" piece for the presentation.

---

## 2. Amazon RDS — MySQL Database (Member 5)

1. Go to **RDS console → Create database**.
2. Choose **Standard create → MySQL** (version 8.0).
3. Templates: **Free tier**.
4. Settings:
   - DB instance identifier: `cloudcart-db`
   - Master username: `admin`
   - Master password: set and remember it.
5. Instance configuration: `db.t3.micro`.
6. Storage: default (20 GiB gp2) is fine.
7. Connectivity:
   - VPC: default VPC.
   - Public access: **Yes** (simplifies grading/demo; for production you'd set this to "No" and only allow the EC2 security group).
   - VPC security group: **Create new** → name it `cloudcart-db-sg`.
8. Additional configuration → Initial database name: `cloudcart`.
9. Click **Create database** (takes ~5–10 minutes).
10. Once available, copy the **Endpoint** (e.g. `cloudcart-db.xxxx.ap-south-1.rds.amazonaws.com`) — you'll paste this into `backend/db.php`.
11. Edit the `cloudcart-db-sg` security group → **Inbound rules** → add rule:
    - Type: MySQL/Aurora (port 3306), Source: your EC2 instance's security group (add after step 3) or `0.0.0.0/0` for quick testing (not recommended beyond the demo).

### Load the schema
From your local machine (needs the `mysql` client) or from the EC2 instance once it's up:
```bash
mysql -h <RDS-ENDPOINT> -u admin -p cloudcart < database/schema.sql
```
This creates all tables and inserts the 16 demo products.

---

## 3. Amazon EC2 — Hosting the Web App (Member 6)

1. Go to **EC2 console → Launch instance**.
2. Name: `cloudcart-web`.
3. AMI: **Ubuntu Server 22.04 LTS** (Free tier eligible).
4. Instance type: `t2.micro`.
5. Key pair: create a new one, download the `.pem` file (needed to SSH in).
6. Network settings → Security group `cloudcart-web-sg`, allow inbound:
   - SSH (22) — Source: My IP
   - HTTP (80) — Source: Anywhere
   - HTTPS (443) — Source: Anywhere (optional, for TLS)
7. Launch the instance. Note its **Public IPv4 address**.

### Connect and install the stack
```bash
ssh -i cloudcart-key.pem ubuntu@<EC2-PUBLIC-IP>

sudo apt update && sudo apt upgrade -y
sudo apt install -y apache2 php php-mysql mysql-client
sudo systemctl enable apache2 --now
```

### Deploy the code
From your local machine:
```bash
scp -i cloudcart-key.pem -r frontend/* backend/* ubuntu@<EC2-PUBLIC-IP>:/tmp/cloudcart/
```
On the EC2 instance:
```bash
sudo rm -rf /var/www/html/*
sudo cp -r /tmp/cloudcart/* /var/www/html/
sudo chown -R www-data:www-data /var/www/html
```

### Point PHP at RDS
Edit `/var/www/html/db.php` on the server and set `DB_HOST`, `DB_USER`, `DB_PASS`
to the RDS values from Step 2.

### Allow EC2 → RDS traffic
Go back to the `cloudcart-db-sg` security group (Step 2.11) and change the MySQL
inbound rule's source to the `cloudcart-web-sg` security group instead of `0.0.0.0/0`.

Visit `http://<EC2-PUBLIC-IP>/` in a browser — the site should load and
sign-up/login should now write to RDS instead of the browser's localStorage.

---

## 4. Amazon S3 — Product Image Storage (Member 7)

1. Go to **S3 console → Create bucket**.
2. Bucket name: `cloudcart-product-images-<yourname>` (must be globally unique).
3. Region: same as EC2/RDS.
4. Uncheck "Block all public access" **only** if you want images to be directly
   public (simplest for a demo); otherwise use a bucket policy scoped to `GetObject`.
5. Create folders `products/` and upload your product photos there.
6. For each image, copy its **Object URL** (Properties tab) and update the
   `image_url` column in the `products` table (or re-run inserts in `schema.sql`
   with your own URLs).
7. (Optional, for the presentation) Enable **Static website hosting** on the
   bucket to show a second way S3 can serve content directly.

---

## 5. IAM — Access Management (Member 7)

1. Go to **IAM console → Users → Create user**: `cloudcart-admin`.
2. Attach policy: `AmazonS3FullAccess` (for demo) — in production you'd write a
   scoped custom policy limited to just the one bucket and actions
   (`s3:GetObject`, `s3:PutObject` on `arn:aws:s3:::cloudcart-product-images-*/*`).
3. Create an **Access key** for this user if you plan to upload images
   programmatically (e.g. via AWS CLI or SDK) rather than through the console.
4. This satisfies the "IAM — Access management" row in your AWS services table
   and gives you something concrete to show: Users → Permissions → Policy JSON.

---

## 6. Quick verification checklist (for your demo)

- [ ] EC2 public IP loads the site over HTTP
- [ ] Sign up creates a row in the RDS `users` table
- [ ] Login works and product grid loads from `products.php` (RDS `products` table)
- [ ] Add to cart writes to the RDS `cart` table
- [ ] Checkout creates rows in `orders` + `order_items`
- [ ] Product images load from your S3 bucket URL
- [ ] IAM console shows the `cloudcart-admin` user and its S3 policy
- [ ] Security groups show restricted inbound rules (not open to the world on 3306)

## 7. Cleaning up after submission (avoid surprise charges)
```
EC2 console      → Instances → Terminate instance
RDS console      → Databases → Delete (uncheck "create final snapshot" for a class project)
S3 console       → Empty bucket → Delete bucket
IAM console      → Delete the demo user/keys if no longer needed
```
