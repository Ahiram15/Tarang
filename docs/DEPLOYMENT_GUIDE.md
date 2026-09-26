# 🚀 TARANG — Production Deployment Guide

This guide provides end-to-end instructions for deploying the **TARANG Multi-Mission Ocean Intelligence & Oil Spill Forensics Platform** to production environments.

---

## 🏗️ Architecture Overview

TARANG consists of two decoupled services:
1. **Frontend**: Vite + React 19 + TypeScript + Leaflet GIS + Three.js 3D Globe, compiled to static assets and served by Nginx.
2. **Backend**: FastAPI + Uvicorn ASGI server powering deep learning inference (U-Net), hydrodynamic drift hindcasting (OpenDrift), AIS dark vessel correlation, and automated PDF dossier generation.

---

## 🐳 Option 1: Docker Compose (Recommended for VPS / Cloud VM)

The fastest and most reliable way to deploy TARANG to any cloud virtual machine (AWS EC2, DigitalOcean Droplet, Linode, Google Compute Engine, Azure VM, or on-premise Linux server).

### Prerequisites
- Docker Engine $\ge 24.0$
- Docker Compose $\ge 2.20$

### 1. Clone & Configure Environment
```bash
git clone https://github.com/Ahiram15/Tarang.git
cd Tarang

# Copy sample environment configuration
cp .env.example .env
```

Edit `.env` with your API credentials (optional for offline benchmark verification):
```env
AISSTREAM_API_KEY=your_aisstream_api_key
CDSE_CLIENT_ID=your_copernicus_oauth_client_id
CDSE_CLIENT_SECRET=your_copernicus_oauth_secret
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=alerts@yourdomain.com
SMTP_PASSWORD=your_app_password
```

### 2. Build & Launch Containers
```bash
docker compose up -d --build
```

### 3. Verify Health & Logs
```bash
# Check running containers
docker compose ps

# View backend real-time logs
docker compose logs -f backend

# View frontend access logs
docker compose logs -f frontend
```

The application is now live:
- **Web Dashboard**: `http://<your-server-ip>/` (Port 80)
- **FastAPI OpenAPI Docs**: `http://<your-server-ip>:8000/docs`

---

## ☁️ Option 2: Cloud PaaS (Serverless / Managed)

If you prefer managed cloud platforms without administering a Linux server:

### Part A: Deploy Backend (Render / Railway / Fly.io)

#### Using Render (Docker Web Service):
1. Connect your GitHub repository to [Render](https://render.com).
2. Create a new **Web Service**.
3. Select **Docker** environment:
   - **Root Directory**: `.`
   - **Dockerfile Path**: `backend/Dockerfile`
   - **Plan**: Standard (at least 2 GB RAM recommended for TensorFlow & Shapely geospatial operations).
4. Add Environment Variables from `.env`.
5. Deploy. You will receive a URL such as `https://tarang-backend.onrender.com`.

#### Using Railway / Fly.io:
```bash
# Deploy with Fly.io
fly launch --dockerfile backend/Dockerfile
```

---

### Part B: Deploy Frontend (Vercel / Netlify / Cloudflare Pages)

#### Using Vercel:
1. Import repository on [Vercel](https://vercel.com).
2. Configure project settings:
   - **Root Directory**: `frontend`
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Add Rewrite Rule for API calls:
   Create `frontend/vercel.json`:
   ```json
   {
     "rewrites": [
       {
         "source": "/api/:path*",
         "destination": "https://your-backend-service.onrender.com/api/:path*"
       },
       {
         "source": "/(.*)",
         "destination": "/index.html"
       }
     ]
   }
   ```
4. Deploy!

---

## 🐧 Option 3: Native Linux VPS (Ubuntu 22.04 / 24.04 LTS)

For maximum performance on dedicated hardware or budget VPS ($5/mo):

### 1. Install System Packages
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3-pip python3-venv nodejs npm nginx certbot python3-certbot-nginx libgl1 libglib2.0-0
```

### 2. Set Up Backend Service
```bash
cd /opt
sudo git clone https://github.com/Ahiram15/Tarang.git
cd /opt/Tarang

# Create Python virtual environment
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# Run pytest to verify all models and algorithms
python -m pytest tests/
```

Create Systemd Service `/etc/systemd/system/tarang-backend.service`:
```ini
[Unit]
Description=TARANG FastAPI Maritime Intelligence Backend
After=network.target

[Service]
User=www-data
WorkingDirectory=/opt/Tarang
Environment="PATH=/opt/Tarang/venv/bin"
ExecStart=/opt/Tarang/venv/bin/uvicorn backend.api:app --host 127.0.0.1 --port 8000 --workers 2
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start the service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable tarang-backend
sudo systemctl start tarang-backend
```

### 3. Build Frontend
```bash
cd /opt/Tarang/frontend
npm ci
npm run build
```

### 4. Configure Nginx Reverse Proxy & SSL
Edit `/etc/nginx/sites-available/tarang`:
```nginx
server {
    server_name yourdomain.com www.yourdomain.com;
    root /opt/Tarang/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site & configure free Let's Encrypt SSL:
```bash
sudo ln -s /etc/nginx/sites-available/tarang /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Install HTTPS certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## 🔒 Security & Performance Tuning Checklist

- [x] **CORS Locked**: In production, frontend and API reside behind the same reverse proxy domain (`/api/`), eliminating cross-origin security overhead.
- [x] **Large File Uploads**: Nginx `client_max_body_size 64M` configured for high-res GeoTIFF and SAR raster ingestion.
- [x] **Keep-Alive & Timeout**: `proxy_read_timeout 300s` configured for long-running Lagrangian reverse-drift Monte Carlo trajectories.
- [x] **Static Asset Caching**: 30-day cache headers enabled for video background loops and satellite layers.
