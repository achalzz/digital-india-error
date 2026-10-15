# 🚀 Digital India Error Decoder — FREE Deployment Guide

## 💰 Total Cost: ₹0 (Everything Free!)

| Component | Free Solution | Cost |
|---|---|---|
| **VPS Server** | Oracle Cloud Always Free Tier (2 OCPU, 12GB RAM, 200GB) | ₹0 forever |
| **Domain** | GitHub Student Developer Pack → `.me` / `.tech` domain (1 year free) | ₹0 |
| **DNS/CDN** | Cloudflare Free Plan | ₹0 |
| **SSL** | Let's Encrypt (auto-renew) | ₹0 |
| **WordPress** | Open source | ₹0 |
| **Web Server** | Nginx | ₹0 |

---

## 📋 Pre-requisites (Pehle Yeh Ready Rakho)

- [ ] GitHub account with **Student Developer Pack** (apply at https://education.github.com — college email `.ac.in` use karo)
- [ ] Oracle Cloud account (https://signup.cloud.oracle.com — credit/debit card verify ke liye chahiye, charge nahi hoga)
- [ ] Cloudflare account (https://dash.cloudflare.com/sign-up)
- [ ] PuTTY ya Windows Terminal (SSH ke liye)

---

## Step 1: Get Free Domain (GitHub Student Pack)

### 1.1 Apply for GitHub Student Developer Pack
1. Go to https://education.github.com/pack
2. Click **"Get your Pack"**
3. Verify using your **Bennett University email** (`.ac.in`)
4. Upload your student ID if asked
5. Wait for approval (usually 1-3 days, sometimes instant)

### 1.2 Claim Free Domain
Once approved, you get:
- **Namecheap**: Free `.me` domain for 1 year → e.g., `error-decoder.me`
- **.TECH Domains**: Free `.tech` domain for 1 year → e.g., `error-decoder.tech`
- **Name.com**: Free `.live` domain → e.g., `error-decoder.live`

**Recommended**: Claim `error-decoder.tech` or `indiaerror.tech`

### Steps on Namecheap (example):
1. Go to Namecheap through GitHub Student Pack link
2. Search for your desired domain name
3. Add to cart → Apply GitHub coupon → Checkout for ₹0
4. 📸 **SCREENSHOT**: Namecheap dashboard showing domain ownership

> [!TIP]
> Agar GitHub Student Pack approve hone mein time lage, toh temporarily `duckdns.org` se free subdomain le sakte ho (e.g., `error-decoder.duckdns.org`). But proper domain better lagta hai report mein.

---

## Step 2: Create Oracle Cloud Free VPS

### 2.1 Sign Up
1. Go to https://signup.cloud.oracle.com
2. Fill details, choose **Home Region**: `India South (Hyderabad)` ya `India West (Mumbai)`
3. Card verify hoga — ₹1 temporary charge → auto refund
4. **IMPORTANT**: "Always Free" tier pe raho, "Upgrade" button KABHI mat dabaana

### 2.2 Create Compute Instance (Your Server)
1. Login to Oracle Cloud Console
2. Click ☰ Menu → **Compute** → **Instances** → **Create Instance**
3. Fill these settings:

| Setting | Value |
|---|---|
| **Name** | `error-decoder-vps` |
| **Image** | Ubuntu 22.04 (Canonical) |
| **Shape** | `VM.Standard.A1.Flex` (Ampere ARM) |
| **OCPUs** | 2 |
| **Memory** | 12 GB |
| **Boot Volume** | 50 GB (default is fine) |
| **Network** | Create new VCN + Assign public IPv4 ✅ |
| **SSH Keys** | Generate key pair → **Download BOTH keys** |

4. Click **Create** → Wait 2-5 min for "Running" status
5. Note your **Public IP Address** (e.g., `129.154.xx.xx`)
6. 📸 **SCREENSHOT**: VPS dashboard showing running instance

### 2.3 Open Firewall Ports (IMPORTANT!)
Oracle blocks ports 80/443 by default:

1. Go to Instance → **Primary VNIC** → Click on **Subnet**
2. Click **Default Security List**
3. Click **Add Ingress Rules** and add:

| Source CIDR | Protocol | Dest Port |
|---|---|---|
| `0.0.0.0/0` | TCP | `80` |
| `0.0.0.0/0` | TCP | `443` |

---

## Step 3: Connect to VPS via SSH

### Windows (PowerShell / WSL):
```powershell
# If using the downloaded .key file from Oracle
ssh -i C:\path\to\ssh-key.key ubuntu@YOUR_PUBLIC_IP
```

### First time login → accept fingerprint → you're in!

---

## Step 4: Install LEMP Stack (Linux + Nginx + MySQL + PHP)

Copy-paste these commands one section at a time:

### 4.1 Update System
```bash
sudo apt update && sudo apt upgrade -y
```

### 4.2 Install Nginx
```bash
sudo apt install nginx -y
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 4.3 Open Ubuntu Firewall (iptables)
```bash
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save
```

### 4.4 Install PHP 8.3
```bash
sudo add-apt-repository ppa:ondrej/php -y
sudo apt update
sudo apt install php8.3-fpm php8.3-mysql php8.3-xml php8.3-mbstring php8.3-curl php8.3-zip php8.3-gd php8.3-intl php8.3-imagick php8.3-bcmath -y
```

### 4.5 Install MariaDB
```bash
sudo apt install mariadb-server -y
sudo systemctl enable mariadb
sudo systemctl start mariadb
```

### 4.6 Secure MariaDB + Create WordPress Database
```bash
# Secure installation (set root password, remove test db, etc.)
sudo mysql_secure_installation
# Answer: Enter → Y → set password → Y → Y → Y → Y

# Create WordPress database and user
sudo mysql -u root -p
```

Inside MySQL shell, run:
```sql
CREATE DATABASE wordpress_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'wp_user'@'localhost' IDENTIFIED BY 'YourStrongPassword123!';
GRANT ALL PRIVILEGES ON wordpress_db.* TO 'wp_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

> [!CAUTION]
> Report mein KABHI password ya credentials mat dalna! Template mein bhi likha hai.

---

## Step 5: Install WordPress

### 5.1 Download & Extract
```bash
cd /tmp
wget https://wordpress.org/latest.tar.gz
tar -xzf latest.tar.gz
sudo mv wordpress /var/www/error-decoder
sudo chown -R www-data:www-data /var/www/error-decoder
sudo chmod -R 755 /var/www/error-decoder
```

### 5.2 Configure wp-config.php
```bash
cd /var/www/error-decoder
sudo cp wp-config-sample.php wp-config.php
sudo nano wp-config.php
```

Edit these lines:
```php
define( 'DB_NAME', 'wordpress_db' );
define( 'DB_USER', 'wp_user' );
define( 'DB_PASSWORD', 'YourStrongPassword123!' );
define( 'DB_HOST', 'localhost' );
define( 'DB_CHARSET', 'utf8mb4' );
```

Also replace the salt/key section — go to https://api.wordpress.org/secret-key/1.1/salt/ and paste the generated keys.

Save: `Ctrl+O`, Enter, `Ctrl+X`

---

## Step 6: Configure Nginx for WordPress

### 6.1 Create Nginx Config
```bash
sudo nano /etc/nginx/sites-available/error-decoder
```

Paste this config (your existing `nginx-wordpress.conf` ka simplified version):
```nginx
server {
    listen 80;
    server_name YOUR_DOMAIN_HERE www.YOUR_DOMAIN_HERE;

    root /var/www/error-decoder;
    index index.php index.html;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # WordPress permalinks
    location / {
        try_files $uri $uri/ /index.php?$args;
    }

    # PHP processing
    location ~ \.php$ {
        include snippets/fastcgi-params.conf;
        fastcgi_pass unix:/run/php/php8.3-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }

    # Block sensitive files
    location ~ /\.ht { deny all; }
    location ~ /\.git { deny all; }
    location = /wp-config.php { deny all; }
    location = /xmlrpc.php { deny all; }

    # Block PHP execution in uploads
    location ~* /wp-content/uploads/.*\.php$ { deny all; }

    # Static file caching
    location ~* \.(css|js|jpg|jpeg|png|gif|ico|svg|woff|woff2)$ {
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    client_max_body_size 64M;
}
```

### 6.2 Enable Site
```bash
sudo ln -s /etc/nginx/sites-available/error-decoder /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

---

## Step 7: Setup Cloudflare DNS

### 7.1 Add Domain to Cloudflare
1. Login to https://dash.cloudflare.com
2. Click **"Add a site"** → Enter your domain
3. Select **Free plan**
4. Cloudflare will give you 2 nameservers, e.g.:
   - `isla.ns.cloudflare.com`
   - `kent.ns.cloudflare.com`

### 7.2 Change Nameservers at Registrar (Namecheap)
1. Go to Namecheap → Domain List → Manage
2. Under Nameservers → Select **"Custom DNS"**
3. Enter Cloudflare's nameservers
4. Save
5. 📸 **SCREENSHOT**: Namecheap nameserver settings

### 7.3 Configure DNS Records in Cloudflare
Add these records:

| Type | Name | Content | Proxy |
|---|---|---|---|
| A | `@` | `YOUR_ORACLE_VPS_IP` | Proxied (orange cloud) ☁️ |
| CNAME | `www` | `YOUR_DOMAIN.tech` | Proxied (orange cloud) ☁️ |

### 7.4 SSL/TLS Settings
1. Go to **SSL/TLS** → Set mode to **Full (Strict)**
2. 📸 **SCREENSHOT**: SSL/TLS mode page

### 7.5 Caching Rules
1. Go to **Caching** → **Configuration**
2. Set Browser Cache TTL to **4 hours**
3. Purge cache if needed

📸 **SCREENSHOTS needed**:
- Cloudflare DNS page with records
- SSL/TLS mode setting
- DNS propagation check (use https://dnschecker.org)

---

## Step 8: Install SSL Certificate (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d YOUR_DOMAIN -d www.YOUR_DOMAIN
```

Follow prompts → Enter email → Agree to terms → Certificate installed!

Verify auto-renewal:
```bash
sudo certbot renew --dry-run
```

---

## Step 9: Complete WordPress Setup

### 9.1 Web Installation
1. Open browser → Go to `https://YOUR_DOMAIN`
2. WordPress setup wizard will appear:
   - **Language**: English
   - **Site Title**: Digital India Error Decoder
   - **Username**: (your admin username — DON'T use "admin")
   - **Password**: (strong password)
   - **Email**: (your email)
3. Click Install WordPress
4. 📸 **SCREENSHOT**: WordPress admin dashboard

### 9.2 Essential Settings
1. **Settings → Permalinks** → Select **"Post name"** (`/%postname%/`)
2. **Settings → General** → Set Site Title and Tagline
3. **Settings → Reading** → Set homepage to static page

### 9.3 Install Theme
- Go to **Appearance → Themes → Add New**
- Search for **"flavor"** or **"flavor starter"** or install **flavstarter Theme** (lightweight block theme)
- OR use **flavor starter Theme**: fast, minimal, SEO-friendly

### 9.4 Install Essential Plugins
- **Yoast SEO** — for on-page SEO optimization
- **WP Fastest Cache** — for caching and performance
- **WordPress Importer** — for importing your WXR content

### 9.5 Import Your Content
1. Go to **Tools → Import → WordPress**
2. Install the WordPress Importer plugin
3. Upload your `export/wordpress-export.xml` file
4. Map authors → Import
5. Verify all 25 pages/posts imported correctly

---

## Step 10: Verify & Take Screenshots

### Required Screenshots for Report (Sections 7 & 8):

| # | Screenshot | Section |
|---|---|---|
| 1 | Registrar nameserver settings (Namecheap) | 7.2 |
| 2 | Cloudflare DNS page with A and CNAME records | 7.2 |
| 3 | Cloudflare SSL/TLS mode (Full Strict) | 7.2 |
| 4 | DNS propagation check (dnschecker.org) | 7.2 |
| 5 | Oracle Cloud VPS dashboard (instance running) | 8.3 |
| 6 | Live site homepage over HTTPS | 8.3 |
| 7 | WordPress admin dashboard | 8.3 |
| 8 | Browser certificate details (padlock → certificate info) | 8.3 |

---

## ⏱️ Estimated Time

| Step | Time |
|---|---|
| GitHub Student Pack approval | 1-3 days (apply ASAP!) |
| Oracle Cloud signup + VPS creation | 30 min |
| SSH + LEMP stack install | 45 min |
| WordPress install + config | 30 min |
| Cloudflare DNS + SSL | 20 min |
| Content import + Yoast SEO | 1 hour |
| Screenshots + verification | 30 min |
| **Total (after approvals)** | **~3-4 hours hands-on** |

---

## 🔥 Quick Reference: All SSH Commands in Order

```bash
# === STEP 4: LEMP STACK ===
sudo apt update && sudo apt upgrade -y
sudo apt install nginx -y
sudo systemctl enable nginx && sudo systemctl start nginx
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save
sudo add-apt-repository ppa:ondrej/php -y && sudo apt update
sudo apt install php8.3-fpm php8.3-mysql php8.3-xml php8.3-mbstring php8.3-curl php8.3-zip php8.3-gd php8.3-intl php8.3-imagick php8.3-bcmath -y
sudo apt install mariadb-server -y
sudo systemctl enable mariadb && sudo systemctl start mariadb
sudo mysql_secure_installation

# === STEP 5: WORDPRESS ===
cd /tmp && wget https://wordpress.org/latest.tar.gz
tar -xzf latest.tar.gz
sudo mv wordpress /var/www/error-decoder
sudo chown -R www-data:www-data /var/www/error-decoder
sudo chmod -R 755 /var/www/error-decoder
cd /var/www/error-decoder
sudo cp wp-config-sample.php wp-config.php
sudo nano wp-config.php  # Edit DB credentials

# === STEP 6: NGINX CONFIG ===
sudo nano /etc/nginx/sites-available/error-decoder  # Paste config
sudo ln -s /etc/nginx/sites-available/error-decoder /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

# === STEP 8: SSL ===
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d YOUR_DOMAIN -d www.YOUR_DOMAIN
sudo certbot renew --dry-run
```

> [!IMPORTANT]
> Yeh commands Appendix A mein paste karna hai report mein — but **passwords aur keys remove karke**!
