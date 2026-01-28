# Farmer Market Pool - Setup Guide

## Prerequisites

- Python 3.9+
- Node.js 18+
- PostgreSQL 12+
- Redis (for Celery)
- GDAL (for GeoDjango location features - optional for MVP)

### Installing GDAL (macOS)

For GeoDjango location features:
```bash
brew install gdal
```

**Note:** If you don't need location features initially, you can skip GDAL installation and comment out `django.contrib.gis` in `INSTALLED_APPS` in `settings.py`. The app will work without it, just without geographic location queries.

## Backend Setup

1. **Create virtual environment:**
```bash
cd backend
python3 -m venv venv  # Use python3 on macOS/Linux, python on Windows
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. **Install dependencies:**
```bash
pip install -r requirements.txt
```

3. **Set up PostgreSQL:**
```bash
# Create database
createdb farmer_market_pool

# Or using psql:
psql -U postgres
CREATE DATABASE farmer_market_pool;
```

4. **Configure environment:**
```bash
cp .env.example .env
# Edit .env with your database credentials and settings
```

5. **Run migrations:**
```bash
python manage.py migrate
```

6. **Create superuser:**
```bash
python manage.py createsuperuser
```

7. **Load initial data (categories, etc.):**
```bash
python manage.py loaddata initial_data  # If you create fixtures
```

8. **Run development server:**
```bash
python manage.py runserver
```

## Frontend Setup

1. **Install dependencies:**
```bash
cd frontend
npm install
```

2. **Run development server:**
```bash
npm run dev
```

Frontend will be available at http://localhost:5173

## Celery Setup (Optional, for background tasks)

1. **Start Redis:**
```bash
redis-server
```

2. **Start Celery worker:**
```bash
cd backend
celery -A config worker -l info
```

3. **Start Celery beat (for scheduled tasks):**
```bash
celery -A config beat -l info
```

## Database Schema

The app creates the following main tables:
- `users` - User accounts (farmers/buyers)
- `farmer_profiles` - Farmer extended profiles
- `buyer_profiles` - Buyer extended profiles
- `categories` - Product categories
- `products` - Product listings
- `orders` - Orders placed by buyers
- `payments` - Payment records
- `escrow` - Escrow accounts
- `wallets` - User wallets
- `market_prices` - Market price data
- `collection_points` - Collection centers
- `deliveries` - Delivery tracking

## API Endpoints

### Authentication
- `POST /api/auth/register/` - Register new user
- `POST /api/auth/login/` - Login
- `GET /api/auth/me/` - Get current user

### Products
- `GET /api/products/` - List products
- `POST /api/products/` - Create product (farmer only)
- `GET /api/products/{id}/` - Product detail
- `GET /api/products/categories/` - List categories

### Orders
- `GET /api/orders/` - List orders
- `POST /api/orders/` - Create order
- `GET /api/orders/{id}/` - Order detail

### Payments
- `POST /api/payments/initiate/` - Initiate payment
- `GET /api/payments/` - List payments
- `POST /api/payments/escrow/{id}/release/` - Release escrow

### Pricing
- `GET /api/pricing/market-prices/` - Market prices
- `GET /api/pricing/alerts/` - Price alerts

## Testing

### Backend
```bash
python manage.py test
```

### Frontend
```bash
npm run test  # If tests are set up
```

## Production Deployment

1. Set `DEBUG=False` in settings
2. Set strong `SECRET_KEY`
3. Configure proper `ALLOWED_HOSTS`
4. Set up static file serving
5. Use production database
6. Configure M-Pesa production credentials
7. Set up SSL/HTTPS
8. Configure CORS for production domain

## M-Pesa Integration

1. Register at https://developer.safaricom.co.ke/
2. Get Consumer Key and Secret
3. Get Shortcode and Passkey
4. Update `.env` with credentials
5. Implement STK Push callback handler in `apps/payments/views.py`

## Troubleshooting

### Python Version Issues (macOS/Linux)
If you get `No module named venv` error:
- Use `python3` instead of `python` on macOS/Linux
- Check version: `python3 --version` (should be 3.9+)
- Install Python 3 if needed: `brew install python3` (macOS) or use your system's package manager

**Python 3.13 Compatibility:**
- Python 3.13 is supported, but some packages require newer versions
- If you encounter build errors, upgrade pip first: `pip install --upgrade pip setuptools wheel`
- Pillow and psycopg2-binary have been updated in requirements.txt for Python 3.13 support

### Database Connection Error
- Ensure PostgreSQL is running: `brew services start postgresql` (macOS) or `sudo systemctl start postgresql` (Linux)
- **On macOS with Homebrew:** The default PostgreSQL user is your system username (not "postgres")
- **Quick fix:** Run `./setup_db.sh` in the backend directory - it auto-detects your PostgreSQL user and creates the database
- Or manually: Update `.env` file - change `DB_USER=postgres` to `DB_USER=$(whoami)` (your username)
- Create database: `psql -U $(whoami) -d postgres -c "CREATE DATABASE farmer_market_pool;"`

### Migration Errors
- Try: `python manage.py makemigrations` (or `python3 manage.py makemigrations`)
- Then: `python manage.py migrate` (or `python3 manage.py migrate`)
- If issues persist, check database connection and permissions

### Frontend Can't Connect to Backend
- Ensure backend is running on port 8000
- Check CORS settings in `backend/config/settings.py`
- Verify API proxy in `frontend/vite.config.js`

## Next Steps

1. Add product image upload functionality
2. Implement M-Pesa STK Push integration
3. Add email notifications
4. Implement SMS notifications (Twilio/africastalking)
5. Add USSD support for feature phones
6. Implement admin dashboard
7. Add analytics and reporting
8. Set up CI/CD pipeline
