#!/usr/bin/env bash
# =============================================================================
#  Guest House Manager — AWS EC2 Initial Server Setup Script
#  Run this script on a fresh Ubuntu 22.04 / 24.04 EC2 Instance (t2.micro/t3.micro)
# =============================================================================

set -e

echo "============================================================"
echo "🚀 Starting AWS EC2 Setup for Guest House Manager..."
echo "============================================================"

# 1. Update system packages
echo "📦 Updating system package repositories..."
sudo apt-get update -y && sudo apt-get upgrade -y
sudo apt-get install -y curl wget git ufw ca-certificates gnupg lsb-release

# 2. Configure 2GB Swap Space (CRITICAL FOR AWS FREE TIER 1GB RAM)
if free | grep -i swap | grep -q '0'; then
    echo "💾 Creating 2GB Swap Space to prevent Memory (OOM) issues..."
    sudo fallocate -l 2G /swapfile || sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    sudo sysctl vm.swappiness=20
    echo 'vm.swappiness=20' | sudo tee -a /etc/sysctl.conf
    echo "✅ 2GB Swap space created successfully!"
else
    echo "ℹ️ Swap space is already configured."
fi

# 3. Install Docker & Docker Compose
if ! command -v docker &> /dev/null; then
    echo "🐳 Installing Docker Engine..."
    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    sudo apt-get update -y
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

    # Enable Docker to start on boot
    sudo systemctl enable docker
    sudo systemctl start docker

    # Add current user to docker group
    sudo usermod -aG docker $USER
    echo "✅ Docker installed successfully!"
else
    echo "ℹ️ Docker is already installed."
fi

# 4. Configure UFW Firewall
echo "🛡️ Configuring Firewall (UFW)..."
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
echo "y" | sudo ufw enable || true
echo "✅ Firewall configured."

echo "============================================================"
echo "🎉 AWS EC2 Initial Setup Complete!"
echo "⚠️  Important: If this is your first run, log out and log back in so your user joins the 'docker' group."
echo "👉 Next step: Run ./scripts/deploy.sh to build and start the application."
echo "============================================================"
