#!/bin/bash

# Setup script for Farmer Market Pool database
# This script automatically detects PostgreSQL user and creates the database

set -e

echo "🌾 Farmer Market Pool - Database Setup"
echo "========================================"

# Detect PostgreSQL user (try current user first)
DB_USER="${DB_USER:-$(whoami)}"
echo "📋 Detected PostgreSQL user: $DB_USER"

# Check if PostgreSQL is running
if ! psql -U "$DB_USER" -d postgres -c "SELECT 1" > /dev/null 2>&1; then
    echo "❌ Error: Cannot connect to PostgreSQL"
    echo "   Make sure PostgreSQL is running: brew services start postgresql"
    exit 1
fi

echo "✅ PostgreSQL is running"

# Database name
DB_NAME="farmer_market_pool"

# Check if database exists
if psql -U "$DB_USER" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" | grep -q 1; then
    echo "ℹ️  Database '$DB_NAME' already exists"
else
    echo "📦 Creating database '$DB_NAME'..."
    psql -U "$DB_USER" -d postgres -c "CREATE DATABASE $DB_NAME;"
    echo "✅ Database created successfully!"
fi

# Update .env file
ENV_FILE=".env"
if [ ! -f "$ENV_FILE" ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example "$ENV_FILE"
fi

# Update database user in .env if needed
if grep -q "DB_USER=postgres" "$ENV_FILE"; then
    echo "📝 Updating .env file with correct database user..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/DB_USER=postgres/DB_USER=$DB_USER/" "$ENV_FILE"
        sed -i '' "s/DB_PASSWORD=postgres/DB_PASSWORD=/" "$ENV_FILE"
    else
        # Linux
        sed -i "s/DB_USER=postgres/DB_USER=$DB_USER/" "$ENV_FILE"
        sed -i "s/DB_PASSWORD=postgres/DB_PASSWORD=/" "$ENV_FILE"
    fi
    echo "✅ .env file updated"
fi

echo ""
echo "✅ Database setup complete!"
echo ""
echo "Next steps:"
echo "  1. Activate virtual environment: source venv/bin/activate"
echo "  2. Create migrations: python manage.py makemigrations"
echo "  3. Run migrations: python manage.py migrate"
echo "  4. Create superuser: python manage.py createsuperuser"
