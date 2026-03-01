#!/bin/bash
# Database Setup Script for MariaDB

set -e

echo "=========================================="
echo "MariaDB Database Setup Script"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DB_HOST="localhost"
DB_PORT=3306
DB_USER="root"
DB_PASSWORD="root"
DB_NAME="app_db"

echo -e "${YELLOW}Step 1: Checking MariaDB Connection${NC}"
echo "Host: $DB_HOST:$DB_PORT"
echo "User: $DB_USER"
echo ""

# Test connection
if mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" -e "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Connected to MariaDB successfully${NC}"
else
    echo -e "${RED}✗ Failed to connect to MariaDB${NC}"
    echo "Please ensure:"
    echo "  1. MariaDB service is running"
    echo "  2. Username and password are correct"
    echo "  3. MariaDB is listening on $DB_HOST:$DB_PORT"
    exit 1
fi

echo ""
echo -e "${YELLOW}Step 2: Creating Database${NC}"

# Create database
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" <<EOF
CREATE DATABASE IF NOT EXISTS $DB_NAME DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
SHOW DATABASES;
EOF

echo -e "${GREEN}✓ Database created successfully${NC}"

echo ""
echo -e "${YELLOW}Step 3: Generating Prisma Client${NC}"

npx prisma generate

echo -e "${GREEN}✓ Prisma client generated${NC}"

echo ""
echo -e "${YELLOW}Step 4: Running Database Migrations${NC}"

npx prisma migrate deploy

echo -e "${GREEN}✓ Migrations completed${NC}"

echo ""
echo -e "${YELLOW}Step 5: Seeding Database (Optional)${NC}"
echo "To seed the database with initial data, run:"
echo "  npx prisma db seed"
echo ""

echo "=========================================="
echo -e "${GREEN}✓ Database setup completed!${NC}"
echo "=========================================="
echo ""
echo "Next steps:"
echo "  1. Start the server: npm run dev"
echo "  2. View data: npx prisma studio"
echo "  3. Run tests: npm test"
