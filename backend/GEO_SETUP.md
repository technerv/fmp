# GeoDjango Setup Guide

## Prerequisites

1. **Install GDAL** (macOS):
   ```bash
   brew install gdal
   ```

2. **Install PostGIS extension** (for PostgreSQL):
   ```bash
   brew install postgis
   ```

## Setup Steps

1. **Enable GeoDjango in settings.py**:
   ```python
   INSTALLED_APPS = [
       # ...
       'django.contrib.gis',  # Uncomment this line
   ]
   
   # Update database engine
   DATABASES = {
       'default': {
           'ENGINE': 'django.contrib.gis.db.backends.postgis',  # Change from postgresql
           # ... rest of config
       }
   }
   ```

2. **Create PostGIS extension in database**:
   ```sql
   CREATE EXTENSION postgis;
   ```

3. **Update models** to use PointField instead of CharField for locations:
   ```python
   from django.contrib.gis.db import models as gis_models
   from django.contrib.gis.geos import Point
   
   location = gis_models.PointField(geography=True, srid=4326)
   ```

4. **Create migrations**:
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

## Usage

Once enabled, you can use location-based queries:

```python
from django.contrib.gis.geos import Point
from django.contrib.gis.measure import D

# Find products within 50km radius
user_location = Point(longitude, latitude, srid=4326)
nearby_products = Product.objects.filter(
    location__dwithin=(user_location, D(km=50))
)
```

## API Endpoints

- `GET /api/products/nearby/?lat=-1.2921&lng=36.8219&radius=50`
  - Returns products near a location (full GeoDjango support)

## Current Status

GeoDjango is currently **disabled** for quick setup. Location matching uses county-based filtering.

To enable full location-based matching:
1. Install GDAL and PostGIS
2. Follow setup steps above
3. Update models to use PointField
4. Run migrations
