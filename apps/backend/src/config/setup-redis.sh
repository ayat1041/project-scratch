#!/bin/bash

# Redis Server Setup Script
# Run this once on your server before starting Redis

set -e

echo "=== Redis Server Optimization Setup ==="

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "This script must be run as root (use sudo)"
   exit 1
fi

# Create Redis kernel optimizations
echo "Configuring kernel parameters for Redis..."
tee /etc/sysctl.d/99-redis.conf << EOF
# Redis optimizations
vm.overcommit_memory = 1
net.core.somaxconn = 65535
EOF

# Apply settings immediately
echo "Applying kernel settings..."
sysctl -p /etc/sysctl.d/99-redis.conf

# Disable transparent huge pages (optional but recommended)
echo "Disabling transparent huge pages..."
echo never > /sys/kernel/mm/transparent_hugepage/enabled

# Make transparent huge pages setting permanent
if ! grep -q "transparent_hugepage" /etc/rc.local 2>/dev/null; then
    echo 'echo never > /sys/kernel/mm/transparent_hugepage/enabled' >> /etc/rc.local
    chmod +x /etc/rc.local
fi

# Verify settings
echo "=== Current Settings ==="
echo "vm.overcommit_memory = $(sysctl -n vm.overcommit_memory)"
echo "net.core.somaxconn = $(sysctl -n net.core.somaxconn)"
echo "transparent_hugepage = $(cat /sys/kernel/mm/transparent_hugepage/enabled)"

echo "=== Setup Complete ==="
echo "You can now run: docker-compose up -d"
echo "Redis warnings should be resolved."



# chmod +x setup-redis.sh
# sudo ./setup-redis.sh