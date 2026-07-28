# AWS Free Tier Deployment Guide

This guide provides step-by-step instructions to deploy the **Guest House Manager** application to **AWS Free Tier** using an **AWS EC2 instance** (`t2.micro` / `t3.micro`) with **Docker Compose**, **Spring Boot**, **Next.js**, **PostgreSQL**, and **Nginx**.

---

## 1. AWS Free Tier Requirements & Costs

The deployment uses resources covered by the **AWS 12-Month Free Tier**:

| Resource | AWS Free Tier Allocation | Used by This Project | Cost |
|---|---|---|---|
| **AWS EC2** | 750 hours/month of `t2.micro` or `t3.micro` (Linux) | 1 Instance (`t3.micro` or `t2.micro`) | **$0.00** |
| **EBS Storage** | 30 GB General Purpose SSD (gp2/gp3) | 30 GB Root Volume | **$0.00** |
| **Data Transfer** | 100 GB Outbound Data per month | Application HTTP Traffic | **$0.00** |

> [!IMPORTANT]
> **1 GB RAM Optimization**: Because `t2.micro` / `t3.micro` instances have **1 GB RAM**, running Java Spring Boot + Next.js + PostgreSQL simultaneously requires **Swap Space**. Our setup script automatically creates a **2 GB Swap file**, limiting memory pressure and preventing OOM (Out of Memory) crashes.

---

## 2. Launching your AWS EC2 Instance

### Step 2.1: Open AWS Console
1. Log in to the [AWS Management Console](https://aws.amazon.com/console/).
2. In the top-right corner, choose your preferred Region (e.g., `ap-southeast-1` Singapore or `us-east-1` N. Virginia).
3. Search for **EC2** and navigate to the EC2 Dashboard.

### Step 2.2: Launch Instance
1. Click **Launch Instance**.
2. **Name**: `guesthouse-server`
3. **Application and OS Image (AMI)**:
   - Select **Ubuntu** (Ubuntu Server 24.04 LTS or 22.04 LTS - 64-bit x86).
4. **Instance Type**:
   - Select **`t3.micro`** or **`t2.micro`** (*Free tier eligible*).
5. **Key Pair (SSH Login)**:
   - Click **Create new key pair**.
   - Key pair name: `guesthouse-key`
   - Key pair type: `RSA`, Private key file format: `.pem`.
   - Click **Create key pair** and download `guesthouse-key.pem` to your computer.
6. **Network Settings (Security Group)**:
   - Click **Edit** network settings.
   - Auto-assign Public IP: **Enable**.
   - Create Security Group: `guesthouse-sg`
   - Add Inbound Security Group Rules:
     - **Rule 1 (SSH)**: Type `SSH`, Port `22`, Source `Anywhere` (`0.0.0.0/0` or `My IP`)
     - **Rule 2 (HTTP)**: Type `HTTP`, Port `80`, Source `Anywhere` (`0.0.0.0/0`)
     - **Rule 3 (HTTPS)**: Type `HTTPS`, Port `443`, Source `Anywhere` (`0.0.0.0/0`)
7. **Configure Storage**:
   - Set size to **`30` GiB** `gp3` or `gp2` (*Free Tier limit is 30 GiB*).
8. Click **Launch Instance**.

---

## 3. Connecting to your EC2 Instance

### On Linux / macOS Terminal:
1. Open terminal and navigate to your downloaded key file:
   ```bash
   cd ~/Downloads
   chmod 400 guesthouse-key.pem
   ```
2. Connect using your EC2 instance's **Public IPv4 Address** (found in AWS EC2 Console):
   ```bash
   ssh -i guesthouse-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
   ```

---

## 4. Cloning Code & Setting Up Server

Once logged into your EC2 terminal (`ubuntu@ip-...`):

### Step 4.1: Clone Repository
```bash
git clone https://github.com/YOUR_GITHUB_USERNAME/SotSambanGuestHouseMS.git
cd SotSambanGuestHouseMS
```
*(If repository is private, upload code using `scp` or a Git Personal Access Token).*

### Step 4.2: Run One-Time EC2 Initialization Script
Run the automated setup script to configure 2GB Swap space, Docker, Docker Compose, and firewall:
```bash
chmod +x scripts/setup-ec2.sh scripts/deploy.sh
./scripts/setup-ec2.sh
```

### Step 4.3: Configure Production Environment Variables
Create your production `.env` file from the example template:
```bash
cp .env.production.example .env
nano .env
```
Update database passwords and secret key:
- `POSTGRES_PASSWORD`: Choose a strong password.
- `JWT_SECRET`: Random 64-character secret string.

Save and exit (`Ctrl+O`, `Enter`, `Ctrl+X`).

---

## 5. Deploying the Application

Run the 1-command production deployment script:
```bash
./scripts/deploy.sh
```

This script will:
1. Build the Spring Boot API multi-stage Docker container (with memory limits).
2. Build the Next.js standalone frontend Docker container.
3. Start PostgreSQL 15 database container with persistent data volume.
4. Launch Nginx reverse proxy routing port 80/443 traffic seamlessly.

---

## 6. Accessing your Live Application

1. Open your web browser and navigate to:
   ```text
   http://YOUR_EC2_PUBLIC_IP
   ```
2. Log in with initial credentials:
   - **Username**: `admin`
   - **Password**: `Admin@123`

---

## 7. Adding a Custom Domain & Free SSL (HTTPS)

If you own a domain name (e.g. `guesthouse.example.com`):

1. **Configure DNS**:
   - Add an **A Record** pointing your domain `guesthouse.example.com` to `YOUR_EC2_PUBLIC_IP`.
2. **Issue Free SSL Certificate (Certbot / Let's Encrypt)**:
   ```bash
   sudo apt-get install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d guesthouse.example.com
   ```
3. Certbot will automatically issue an SSL certificate and configure HTTPS redirection.

---

## 8. Common Operations & Maintenance

### View Application Logs
```bash
# View all logs in real-time
docker compose logs -f

# View API backend logs only
docker compose logs -f api

# View Web frontend logs only
docker compose logs -f web
```

### Restart Application
```bash
./scripts/deploy.sh
```

### Check Server Resource Usage
```bash
# Check memory & swap usage
free -m

# Check live container CPU/Memory usage
docker stats
```

---

## Troubleshooting FAQ

- **Database Connection Error on startup**:
  Spring Boot automatically waits for PostgreSQL health checks before starting. If DB fails to start, check `docker compose logs db`.

- **Out of Memory Error (OOM)**:
  Ensure `free -m` shows at least 2000MB in `Swap`. If swap is missing, re-run `./scripts/setup-ec2.sh`.

- **Cannot Access via IP in Browser**:
  Check AWS EC2 Security Group inbound rules to verify Port 80 (HTTP) is open to `0.0.0.0/0`.
