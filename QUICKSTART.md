# Quick Start Guide

## 🚀 Get Running in 5 Minutes

### 1. Backend Setup (3 minutes)

```bash
cd backend

# Create virtual environment (use python3 on macOS/Linux)
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env with your database credentials

# Setup database (PostgreSQL must be running)
# Option 1: Use the automated setup script
./setup_db.sh

# Option 2: Manual setup
# Create database: psql -U $(whoami) -d postgres -c "CREATE DATABASE farmer_market_pool;"
# Update .env file with your PostgreSQL username (usually your system username on macOS)

# Create migrations and run them
python manage.py makemigrations
python manage.py migrate

# Create admin user
python manage.py createsuperuser

# Run server (after activating venv, you can use 'python' instead of 'python3')
python manage.py runserver
```

Backend runs on http://localhost:8000

### 2. Frontend Setup (2 minutes)

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

Frontend runs on http://localhost:5173

### 3. Test It Out!

1. Open http://localhost:5173
2. Register as a Farmer or Buyer
3. If Farmer: Add products in dashboard
4. If Buyer: Browse and order products

## 🔧 Prerequisites

- Python 3.9+
- Node.js 18+
- PostgreSQL
- Redis (optional, for Celery)
- GDAL (optional, for location features - install with `brew install gdal` on macOS)

**Note:** GeoDjango is currently disabled in settings for quick setup. To enable location features, install GDAL and uncomment `django.contrib.gis` in `backend/config/settings.py`.

## 📝 First Steps After Setup

1. **Create Categories** (via Django admin):
   - Go to http://localhost:8000/admin
   - Add product categories (Maize, Potatoes, Tomatoes, etc.)

2. **Create Market Prices** (via Django admin):
   - Add initial market prices for categories/counties

3. **Create Collection Points** (via Django admin):
   - Add collection centers for logistics

## 🎯 Key Features to Test

- ✅ User registration (Farmer/Buyer)
- ✅ Product listing (Farmers)
- ✅ Product browsing (Buyers)
- ✅ Order placement
- ✅ Order tracking
- ✅ Pricing engine
- ✅ Payment structure (M-Pesa integration pending)

## 🐛 Troubleshooting

**Database connection error?**
- Ensure PostgreSQL is running
- Check `.env` database credentials

**Frontend can't connect to backend?**
- Ensure backend is running on port 8000
- Check CORS settings in `backend/config/settings.py`

**Migration errors?**
- Try: `python manage.py makemigrations`
- Then: `python manage.py migrate`

## 📚 Full Documentation

See `SETUP.md` for detailed setup instructions.
See `PROJECT_SUMMARY.md` for complete feature list.
