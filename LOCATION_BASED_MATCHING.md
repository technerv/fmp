# Location-Based Matching with Geopy (Alternative to GeoDjango)

This project uses **geopy** instead of GeoDjango for location-based matching. This approach is:
- ✅ **Easier to set up** - No GDAL/PostGIS installation required
- ✅ **Works immediately** - No system dependencies
- ✅ **Accurate** - Uses geodesic distance calculations
- ✅ **Frontend friendly** - Works with Leaflet/Mapbox for mapping

## How It Works

### Backend (Django)

Instead of using PostGIS spatial queries, we:
1. **Store coordinates** as simple `DecimalField` (latitude/longitude)
2. **Calculate distances** using `geopy.distance.geodesic`
3. **Filter in Python** - For nearby products, calculate distances and sort

### Models

All location-enabled models now use:
```python
latitude = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)
longitude = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)
```

Models with location support:
- `FarmerProfile` - Farmer location
- `BuyerProfile` - Buyer location  
- `Product` - Product location (where crop is grown)
- `CollectionPoint` - Collection center location

### API Endpoints

#### Find Products Near a Location

**Endpoint:** `GET /api/products/nearby/`

**Query Parameters:**
- `lat` (required) - Latitude
- `lng` (required) - Longitude  
- `radius` (optional) - Radius in kilometers (default: 50)

**Example:**
```bash
GET /api/products/nearby/?lat=-1.2921&lng=36.8219&radius=25
```

**Response:**
```json
{
  "count": 5,
  "results": [
    {
      "id": 1,
      "name": "Maize",
      "distance_km": 12.5,
      "latitude": "-1.3000",
      "longitude": "36.8300",
      ...
    }
  ],
  "location": {"lat": -1.2921, "lng": 36.8219},
  "radius_km": 25,
  "method": "geopy_distance_calculation"
}
```

#### Filter Products by County

**Endpoint:** `GET /api/products/?county=Nairobi`

Standard filtering still works - county-based filtering is efficient for broad searches.

### Distance Calculation Method

We use **geodesic distance** (Haversine formula), which:
- ✅ Accounts for Earth's curvature
- ✅ Accurate for distances up to thousands of kilometers
- ✅ Standard for GPS coordinate calculations

**Example in Python:**
```python
from geopy.distance import geodesic

# Nairobi coordinates
nairobi = (-1.2921, 36.8219)
# Eldoret coordinates  
eldoret = (0.5143, 35.2698)

# Calculate distance
distance = geodesic(nairobi, eldoret).kilometers
# Result: ~300 km
```

### Frontend Integration

You can use **Leaflet** or **Mapbox** for frontend mapping:

#### Leaflet Example (Recommended - Free)

```javascript
import L from 'leaflet';

// Display products on map
const map = L.map('map').setView([-1.2921, 36.8219], 7);

products.forEach(product => {
  if (product.latitude && product.longitude) {
    L.marker([product.latitude, product.longitude])
      .addTo(map)
      .bindPopup(`${product.name} - ${product.distance_km}km away`);
  }
});
```

#### Mapbox Example

```javascript
import mapboxgl from 'mapbox-gl';

// Add markers for products
products.forEach(product => {
  new mapboxgl.Marker()
    .setLngLat([product.longitude, product.latitude])
    .setPopup(new mapboxgl.Popup().setHTML(product.name))
    .addTo(map);
});
```

### Performance Considerations

For **small to medium** datasets (< 10,000 products):
- ✅ Current approach works great
- ✅ Distance calculations are fast in Python
- ✅ Can cache results

For **large** datasets (> 10,000 products):
- Consider adding a `county` filter first (already supported)
- Use pagination
- Consider database indexing on `latitude`/`longitude`
- For production at scale, might want to add PostGIS later

### Adding Location to Products

When creating a product via API:

```json
POST /api/products/
{
  "category_id": 1,
  "name": "Maize",
  "quantity": 100,
  "price_per_unit": 50,
  "harvest_date": "2024-03-01",
  "county": "Nairobi",
  "ward": "Westlands",
  "latitude": "-1.2921",
  "longitude": "36.8219"
}
```

### Geocoding (Address → Coordinates)

For converting addresses to GPS coordinates, you can use:

1. **Google Geocoding API** (requires API key)
2. **Mapbox Geocoding API** (free tier available)
3. **OpenStreetMap Nominatim** (free, rate-limited)

Example with geopy (uses Nominatim):
```python
from geopy.geocoders import Nominatim

geolocator = Nominatim(user_agent="farmer_market_pool")
location = geolocator.geocode("Westlands, Nairobi, Kenya")
print(location.latitude, location.longitude)
```

### Advantages Over GeoDjango

| Feature | GeoDjango | Geopy (Current) |
|---------|-----------|-----------------|
| Setup Complexity | High (GDAL, PostGIS) | None |
| System Dependencies | Yes | No |
| Database Requirements | PostGIS | Standard PostgreSQL |
| Distance Calculations | ✅ | ✅ |
| Spatial Queries | ✅ | ⚠️ (Python-based) |
| Frontend Integration | Same | Same |
| Performance | Excellent at scale | Good for most use cases |

### Migration Notes

If you previously had GeoDjango enabled:
- Old `location` PointField → New `latitude`/`longitude` DecimalFields
- Data migration handles conversion automatically
- No data loss

## Summary

This approach provides **location-based matching** without the complexity of GeoDjango, while still offering accurate distance calculations and easy frontend map integration with Leaflet or Mapbox.
