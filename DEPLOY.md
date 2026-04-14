# Deploying FunMarket to an Ubuntu VPS

## Prerequisites

- A VPS running Ubuntu 22.04 or 24.04
- SSH access to the server
- A git remote (GitHub, GitLab, Gitea, etc.) with the project pushed to it

## Step 1 — Push your code to a git remote

From your local machine:

```bash
git remote add origin <your-repo-url>
git push -u origin master
```

## Step 2 — Install Docker on the VPS

SSH into your server and run:

```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh

# Add your user to the docker group so you don't need sudo
sudo usermod -aG docker $USER

# Apply the group change (or log out and back in)
newgrp docker
```

Verify Docker is working:

```bash
docker --version
docker compose version
```

## Step 3 — Clone and configure

```bash
# Clone the repo
git clone <your-repo-url> funmarket
cd funmarket

# Create your production environment file
cp .env.example .env
```

Edit `.env` and set a strong secret:

```bash
nano .env
```

Replace the placeholder with a real secret:

```env
AUTH_SECRET=<paste a random string here>
DAILY_ALLOWANCE=1000
```

Generate a random secret with:

```bash
openssl rand -base64 32
```

## Step 4 — Build and run

```bash
docker compose up -d --build
```

This single command:
- Builds the Docker image (installs deps, builds Next.js, creates minimal production image)
- Starts the container on port 3000
- Creates a persistent volume for the SQLite database

Check that it's running:

```bash
docker compose ps
docker compose logs -f
```

The app is now live at `http://your-vps-ip:3000`.

## Step 5 — (Optional) Add HTTPS with a domain

### Option A: Caddy (recommended — automatic HTTPS)

Create `Caddyfile` in the project directory:

```
yourdomain.com {
    reverse_proxy localhost:3000
}
```

Then add Caddy to your `docker-compose.yml`:

```yaml
services:
  caddy:
    image: caddy:2
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config
    restart: unless-stopped
    depends_on:
      - app

  app:
    build: .
    environment:
      - AUTH_SECRET=${AUTH_SECRET}
      - DAILY_ALLOWANCE=${DAILY_ALLOWANCE:-1000}
      - DATABASE_URL=file:/data/funmarket.db
    volumes:
      - db-data:/data
    restart: unless-stopped
    # Remove the ports line — only Caddy needs to be public
    expose:
      - "3000"

volumes:
  db-data:
  caddy_data:
  caddy_config:
```

Run:

```bash
docker compose up -d --build
```

Caddy will automatically provision an SSL certificate via Let's Encrypt.

### Option B: Nginx + Certbot

```bash
sudo apt install nginx certbot python3-certbot-nginx -y
```

Create `/etc/nginx/sites-available/funmarket`:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the site and get a certificate:

```bash
sudo ln -s /etc/nginx/sites-available/funmarket /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d yourdomain.com
```

## Migrating existing data

If you have a local `funmarket.db` you want to use on the server:

```bash
# Find the volume path on the VPS
docker volume inspect funmarket_db-data

# Copy your database into the volume (replace the path from above)
# For Docker Compose volumes it's typically:
sudo cp funmarket.db /var/lib/docker/volumes/funmarket_db-data/_data/funmarket.db

# Restart to pick up the new database
docker compose restart
```

## Updating the app

After pushing changes to git:

```bash
cd funmarket
git pull
docker compose up -d --build
```

Zero downtime is not guaranteed with this setup. For true zero-downtime, consider running two containers behind Caddy with a rolling deploy.

## Useful commands

| Command | Description |
|---|---|
| `docker compose logs -f` | Follow live logs |
| `docker compose logs -f app` | App logs only |
| `docker compose restart` | Restart the app |
| `docker compose down` | Stop and remove containers |
| `docker compose down -v` | Stop and remove containers **and volumes** (deletes database) |
| `docker compose exec app sh` | Shell into the running container |

## Troubleshooting

**Port 3000 already in use:**
Change the port mapping in `docker-compose.yml`:
```yaml
ports:
  - "3001:3000"
```

**Database permission errors:**
The container runs as user `nextjs` (uid 1001). The volume directory is created with correct permissions automatically. If you manually copied a database file, fix ownership:
```bash
sudo chown 1001:1001 /var/lib/docker/volumes/funmarket_db-data/_data/funmarket.db
```

**App not reachable:**
Check firewall rules:
```bash
sudo ufw allow 3000
# Or for HTTPS setup:
sudo ufw allow 80
sudo ufw allow 443
```

**View container resource usage:**
```bash
docker stats
```
