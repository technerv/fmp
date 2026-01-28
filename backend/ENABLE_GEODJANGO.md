# Enable GeoDjango - Step by Step

Once GDAL and PostGIS are installed, follow these steps:

## Step 1: Install Dependencies

### macOS (with Xcode installed):
```bash
brew install gdal
brew install postgis
```

### Install GDAL Python bindings:
```bash
pip install GDAL==$(gdal-config --version 2>/dev/null || echo "3.8.0")
# Or if that fails:
pip install --global-option=build_ext --global-option="-I/usr/local/include" GDAL
```

## Step 2: Enable PostGIS Extension

```bash
psql -U Macbook -d farmer_market_pool -c "CREATE EXTENSION IF NOT EXISTS postgis;"
```

Verify:
```bash
psql -U Macbook -d farmer_market_pool -c "\dx postgis"
```

## Step 3: Update Django Settings

Edit `backend/config/settings.py`:

1. Uncomment GeoDjango in INSTALLED_APPS:
   ```python
   'django.contrib.gis',  # Uncomment this line
   ```

2. Update database engine:
   ```python
   'ENGINE': 'django.contrib.gis.db.backends.postgis',  # Change from postgresql
   ```

## Step 4: Update Models

The models are already updated with conditional GeoDjango support. Once you enable it in settings, they'll automatically use PointField.

## Step 5: Create Migrations

```bash
cd backend
source venv/bin/activate
python manage.py makemigrations
python manage.py migrate
```

## Step 6: Test

```bash
python manage.py check
python manage.py runserver
```

## Step 7: Verify Location Queries

Test the nearby products endpoint:
```bash
curl "http://localhost:8000/api/products/nearby/?lat=-1.2921&lng=36.8219&radius=50"
```

## Current Status

✅ Models updated with PointField (conditional)
✅ API endpoints prepared for distance queries  
✅ Settings configured (commented out until GDAL installed)
⏳ Waiting for GDAL + PostGIS installation

Once GDAL is installed, just uncomment the lines in settings.py and run migrations!
