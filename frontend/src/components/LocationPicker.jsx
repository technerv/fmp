import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import { FaLocationCrosshairs } from 'react-icons/fa6'
import toast from 'react-hot-toast'
import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'

// Fix for default marker icon in Leaflet with Vite/Webpack
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

function LocationMarker({ position, setPosition, onLocationFound }) {
  const map = useMap()
  
  useMapEvents({
    click(e) {
      setPosition(e.latlng)
      onLocationFound(e.latlng)
    },
  })

  useEffect(() => {
    if (position) {
      map.flyTo(position, map.getZoom())
    }
  }, [position, map])

  return position === null ? null : (
    <Marker position={position} />
  )
}

export default function LocationPicker({ initialLat, initialLng, onLocationSelect }) {
  const [position, setPosition] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (initialLat && initialLng) {
      setPosition({ lat: parseFloat(initialLat), lng: parseFloat(initialLng) })
    }
  }, [initialLat, initialLng])

  const handleLocationFound = async (latlng) => {
    setLoading(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}`
      )
      const data = await response.json()
      
      const address = data.address || {}
      const county = address.county || address.state || address.region || ''
      const ward = address.suburb || address.village || address.town || address.city || ''
      
      onLocationSelect({
        lat: parseFloat(latlng.lat.toFixed(6)),
        lng: parseFloat(latlng.lng.toFixed(6)),
        county: county.replace(' County', ''),
        ward: ward
      })
      toast.success(`Location selected: ${ward}, ${county}`)
    } catch (error) {
      console.error('Reverse geocoding failed:', error)
      toast.error('Could not fetch address details')
      // Still update lat/lng
      onLocationSelect({
        lat: parseFloat(latlng.lat.toFixed(6)),
        lng: parseFloat(latlng.lng.toFixed(6)),
        county: '',
        ward: ''
      })
    } finally {
      setLoading(false)
    }
  }

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser')
      return
    }

    setLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latlng = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        }
        setPosition(latlng)
        handleLocationFound(latlng)
        setLoading(false)
      },
      (error) => {
        console.error(error)
        toast.error('Unable to retrieve your location')
        setLoading(false)
      }
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center mb-2">
        <label className="block text-sm font-medium text-gray-700">
          Pin Location on Map
        </label>
        <button
          type="button"
          onClick={handleGetCurrentLocation}
          disabled={loading}
          className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
        >
          <FaLocationCrosshairs /> Use My Location
        </button>
      </div>
      
      <div className="h-[300px] w-full rounded-lg overflow-hidden border border-gray-300 relative z-0">
        <MapContainer
          center={position || [-1.2921, 36.8219]} // Default to Nairobi
          zoom={13}
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker 
            position={position} 
            setPosition={setPosition} 
            onLocationFound={handleLocationFound} 
          />
        </MapContainer>
        {loading && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-[1000]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        )}
      </div>
      <p className="text-xs text-gray-500">
        Click on the map to set the product location. This will automatically fill the county and ward fields.
      </p>
    </div>
  )
}
