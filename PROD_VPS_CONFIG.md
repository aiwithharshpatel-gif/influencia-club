# Hostinger KVM VPS Deployment Guide - Influenzia Club

## 1. Server Preparation
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MySQL
sudo apt install mysql-server -y

# Install PM2 and Nginx
sudo npm install -g pm2
sudo apt install nginx -y
```

## 2. Database Setup
```bash
sudo mysql
# Inside MySQL:
CREATE DATABASE influenzia_db;
CREATE USER 'influ_user'@'localhost' IDENTIFIED BY 'your_strong_password';
GRANT ALL PRIVILEGES ON influenzia_db.* TO 'influ_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## 3. Deployment Steps

### A. Backend
1. Upload the `backend` folder.
2. Run `npm install --production`.
3. Run `npx prisma generate`.
4. Run `npx prisma migrate deploy`.
5. Start with PM2:
   ```bash
   pm2 start src/app.js --name influenzia-api
   pm2 save
   ```

### B. Frontend
1. On your local machine, run `npm run build` in the `frontend` folder.
2. Upload the `frontend/dist` folder to `/var/www/influenzia/frontend`.

## 4. Nginx Configuration
Create a config file: `sudo nano /etc/nginx/sites-available/influenzia`

Paste this:
```nginx
server {
    listen 80;
    server_name yourdomain.com; # Change to your domain

    # Frontend Static Files
    location / {
        root /var/www/influenzia/frontend;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API Proxy
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```
Enable it:
```bash
sudo ln -s /etc/nginx/sites-available/influenzia /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 5. SSL (HTTPS)
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com
```
