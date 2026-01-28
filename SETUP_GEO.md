# GeoDjango Setup for Location-Based Matching

## Quick Setup

### 1. Install GDAL (Required for GeoDjango)

**macOS:**
```bash
brew install gdal
```

**Ubuntu/Debian:**
```bash
sudo apt-get install gdal-bin libgdal-dev python3-gdal
```

### 2. Install PostGIS (PostgreSQL Extension)

**macOS:**
```bash
brew install postgis
```

**Ubuntu/Debian:**
```bash
sudo apt-get install postgis postgresql-14-postgis-3
```

### 3. Enable PostGIS in PostgreSQL

```bash
psql -U your_user -d farmer_market_pool -c "CREATE EXTENSION IF NOT EXISTS postgis;"
```

### 4. Update Django Settings

Edit `backend/config/settings.py`:

```python
INSTALLED_APPS = [
    # ... other apps
    'django.contrib.gis',  # Uncomment this line
]

DATABASES = {
    'default': {
        'ENGINE': 'django.contrib.gis.db.backends.postgis',  # Change from postgresql
        'NAME': env('DB_NAME', default='farmer_market_pool'),
        'USER': env('DB_USER', default='postgres'),
        'PASSWORD': env('DB_PASSWORD', default='postgres'),
        'HOST': env('DB_HOST', default='localhost'),
        'PORT': env('DB_PORT', default='5432'),
    }
}
```

### 5. Update Models to Use PointField

Update the models in `backend/apps/farmers/models.py`, `backend/apps/products/models.py`, etc.:

```python
from django.contrib.gis.db import models as gis_models

class FarmerProfile(models.Model):
    # Replace location_coordinates with:
    location = gis_models.PointField(geography=True, srid=4326, blank=True, null=True)
```

### 6. Create and Run Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

## Usage

Once enabled, location-based queries work automatically:

### API Endpoints

1. **Find nearby products:**
   ```
   GET /api/products/nearby/?lat=-1.2921&lng=36.8219&radius=50
   ```

2. **Filter products by county (current, works without GeoDjango):**
   ```
   GET /api/products/?county=Uasin Gishu
   ```

### Frontend Integration

Location-based matching can be added to the buyer dashboard:

```javascript
// Get user location
navigator.geolocation.getCurrentPosition((position) => {
  const { latitude, longitude } = position.coords
  // Fetch nearby products
  api.get(`/products/nearby/?lat=${latitude}&lng=${longitude}&radius=50`)
})
```

## Current Status

- ✅ County-based filtering (works now)
- ⏳ Full GeoDjango distance queries (requires GDAL + PostGIS setup)
- ✅ Location coordinate storage ready
- ✅ API endpoints prepared

## Troubleshooting

**Error: "Could not find the GDAL library"**
- Make sure GDAL is installed: `brew install gdal` (macOS)
- Verify: `gdalinfo --version`

**Error: "Extension postgis does not exist"**
- Install PostGIS: `brew install postgis` (macOS)
- Enable in database: `CREATE EXTENSION postgis;`

**For production deployment:**
- Ensure GDAL and PostGIS are installed on the server
- Update production settings accordingly
- Run migrations on production database
