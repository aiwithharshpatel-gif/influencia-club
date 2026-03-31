#!/bin/bash

# INFLUENZIA CLUB - Automated Deployment Script
# For Hostinger VPS or similar Ubuntu/Debian servers

set -e  # Exit on error

echo "========================================"
echo "  INFLUENZIA CLUB - Production Deploy"
echo "========================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    log_error "Please run as root (use sudo)"
    exit 1
fi

# Configuration
APP_DIR="/var/www/influenzia-club"
DOMAIN="influenziaclub.in"
WWW_DOMAIN="www.influenziaclub.in"
API_PORT=5000
DB_NAME="influenzia"
DB_USER="influenzia_user"

echo ""
log_info "Configuration:"
echo "  App Directory: $APP_DIR"
echo "  Domain: $DOMAIN"
echo "  API Port: $API_PORT"
echo ""

# Step 1: Update System
log_info "Step 1/10: Updating system packages..."
apt update && apt upgrade -y
log_info "System updated!"

# Step 2: Install Node.js
log_info "Step 2/10: Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
NODE_VERSION=$(node -v)
NPM_VERSION=$(npm -v)
log_info "Installed Node.js $NODE_VERSION and npm $NPM_VERSION"

# Step 3: Install MySQL
log_info "Step 3/10: Installing MySQL..."
apt install -y mysql-server
mysql_secure_installation
log_info "MySQL installed!"

# Step 4: Install Nginx
log_info "Step 4/10: Installing Nginx..."
apt install -y nginx
systemctl enable nginx
systemctl start nginx
log_info "Nginx installed and running!"

# Step 5: Install Git and PM2
log_info "Step 5/10: Installing Git and PM2..."
apt install -y git
npm install -g pm2
log_info "Git and PM2 installed!"

# Step 6: Setup Database
log_info "Step 6/10: Setting up database..."
read -sp "Enter MySQL root password: " MYSQL_ROOT_PASSWORD
echo ""
read -sp "Enter password for Influenzia DB user: " DB_PASSWORD
echo ""

mysql -u root -p"$MYSQL_ROOT_PASSWORD" <<EOF
CREATE DATABASE IF NOT EXISTS $DB_NAME;
CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';
FLUSH PRIVILEGES;
EOF

log_info "Database created!"

# Step 7: Clone Repository
log_info "Step 7/10: Cloning repository..."
read -p "Enter GitHub repository URL: " GITHUB_REPO
read -p "Enter GitHub username: " GITHUB_USER

mkdir -p $APP_DIR
cd $APP_DIR

if [ -d ".git" ]; then
    log_warn "Repository already exists. Pulling latest changes..."
    git pull origin main
else
    git clone $GITHUB_REPO .
fi

log_info "Repository ready!"

# Step 8: Install Dependencies
log_info "Step 8/10: Installing dependencies..."
npm run install:all
log_info "Dependencies installed!"

# Step 9: Configure Environment
log_info "Step 9/10: Configuring environment..."

echo ""
log_warn "Please enter your environment variables:"
read -p "JWT Secret (generate a random 32+ char string): " JWT_SECRET
read -p "JWT Refresh Secret: " JWT_REFRESH_SECRET
read -p "Cloudinary Cloud Name: " CLOUDINARY_NAME
read -p "Cloudinary API Key: " CLOUDINARY_KEY
read -p "Cloudinary API Secret: " CLOUDINARY_SECRET
read -p "Brevo SMTP Username: " SMTP_USER
read -p "Brevo SMTP Password: " SMTP_PASS
read -p "Razorpay Key ID: " RAZORPAY_KEY
read -p "Razorpay Key Secret: " RAZORPAY_SECRET

# Create backend .env
cat > backend/.env <<EOF
# Server
PORT=$API_PORT
NODE_ENV=production

# JWT
JWT_SECRET=$JWT_SECRET
JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET

# Database
DATABASE_URL=mysql://$DB_USER:$DB_PASSWORD@localhost:3306/$DB_NAME

# Cloudinary
CLOUDINARY_CLOUD_NAME=$CLOUDINARY_NAME
CLOUDINARY_API_KEY=$CLOUDINARY_KEY
CLOUDINARY_API_SECRET=$CLOUDINARY_SECRET

# Brevo SMTP
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=$SMTP_USER
SMTP_PASS=$SMTP_PASS
EMAIL_FROM=hello@influenziaclub.in

# Razorpay
RAZORPAY_KEY_ID=$RAZORPAY_KEY
RAZORPAY_KEY_SECRET=$RAZORPAY_SECRET

# Cashfree
CASHFREE_APP_ID=your_app_id
CASHFREE_SECRET_KEY=your_secret_key

# App
FRONTEND_URL=https://$DOMAIN
REFERRAL_BASE_URL=https://$DOMAIN/join?ref=
EOF

# Create frontend .env
cat > frontend/.env <<EOF
VITE_API_URL=https://api.$DOMAIN/api
EOF

log_info "Environment configured!"

# Step 10: Build and Migrate
log_info "Step 10/10: Running migrations and building..."

cd backend
npx prisma migrate deploy
npx prisma generate

cd ../frontend
npm run build

cd ..

log_info "Build complete!"

# Configure Nginx
log_info "Configuring Nginx..."

cat > /etc/nginx/sites-available/influenzia <<EOF
server {
    listen 80;
    server_name $DOMAIN $WWW_DOMAIN;

    # Frontend
    location / {
        root $APP_DIR/frontend/dist;
        try_files \$uri \$uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:$API_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;
}
EOF

ln -sf /etc/nginx/sites-available/influenzia /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx

log_info "Nginx configured!"

# Start Backend with PM2
log_info "Starting backend with PM2..."

cd $APP_DIR/backend
pm2 start src/app.js --name influenzia-api
pm2 save
pm2 startup | tail -1 | bash  # Auto-enable on boot

log_info "Backend running!"

# Setup SSL with Let's Encrypt
log_info "Setting up SSL with Let's Encrypt..."

apt install -y certbot python3-certbot-nginx
certbot --nginx -d $DOMAIN -d $WWW_DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN

log_info "SSL configured!"

# Configure Firewall
log_info "Configuring firewall..."

ufw allow 'Nginx Full'
ufw allow OpenSSH
ufw --force enable

log_info "Firewall configured!"

# Final Summary
echo ""
echo "========================================"
echo "  ${GREEN}DEPLOYMENT COMPLETE!${NC}"
echo "========================================"
echo ""
echo "  Frontend: https://$DOMAIN"
echo "  Backend:  https://api.$DOMAIN"
echo "  API Health: https://api.$DOMAIN/api/health"
echo ""
echo "  Next Steps:"
echo "  1. Visit https://$DOMAIN"
echo "  2. Test registration flow"
echo "  3. Create admin user in database"
echo "  4. Configure Razorpay live keys"
echo "  5. Setup UptimeRobot monitoring"
echo ""
echo "  PM2 Commands:"
echo "  - pm2 status (check backend status)"
echo "  - pm2 logs influenzia-api (view logs)"
echo "  - pm2 restart influenzia-api (restart)"
echo ""
echo "========================================"
echo ""

log_info "Deployment successful! 🚀"
