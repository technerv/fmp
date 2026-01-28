import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import L from 'leaflet'
import { FaMagnifyingGlass } from 'react-icons/fa6'
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

function MapUpdater({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
    map.invalidateSize();
  }, [center, zoom, map]);
  return null;
}

function MapSearch() {
  const map = useMap()
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!query.trim()) return

    setSearching(true)
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=ke`)
      const data = await response.json()
      
      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0]
        map.flyTo([lat, lon], 12)
        toast.success(`Found: ${display_name.split(',')[0]}`, { id: 'map-search' })
        setQuery('')
      } else {
        toast.error('Location not found in Kenya', { id: 'map-search' })
      }
    } catch (error) {
      console.error(error)
      toast.error('Search failed', { id: 'map-search' })
    } finally {
      setSearching(false)
    }
  }

  // Prevent map clicks from propagating when interacting with search
  const stopPropagation = (e) => {
    e.stopPropagation()
  }

  return (
    <div className="leaflet-top leaflet-right" style={{ pointerEvents: 'none' }}>
       <div className="leaflet-control mt-4 mr-4 pointer-events-auto" onMouseDown={stopPropagation} onDoubleClick={stopPropagation}>
         <form onSubmit={handleSearch} className="flex bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search location..."
              className="px-4 py-2 text-sm outline-none w-56 text-gray-700 placeholder-gray-400"
            />
            <button 
              type="submit" 
              className="bg-primary-600 text-white px-4 hover:bg-primary-700 transition-colors flex items-center justify-center" 
              disabled={searching}
            >
               <FaMagnifyingGlass />
            </button>
         </form>
       </div>
    </div>
  )
}

function Legend({ categories }) {
   if (!categories || categories.length === 0) return null
   
   const stopPropagation = (e) => {
     e.stopPropagation()
   }
   
   return (
     <div className="leaflet-bottom leaflet-left" style={{ pointerEvents: 'none' }}>
       <div 
         className="leaflet-control mb-8 ml-4 pointer-events-auto bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-gray-200 max-h-[200px] overflow-y-auto min-w-[150px]"
         onMouseDown={stopPropagation}
         onDoubleClick={stopPropagation}
       >
         <h4 className="font-bold text-xs uppercase tracking-wider text-gray-500 mb-2 border-b pb-1">Product Key</h4>
         <div className="space-y-2">
           {categories.map(cat => (
             <div key={cat.id} className="flex items-center gap-2 text-sm">
                <span className="flex items-center justify-center w-6 h-6 bg-gray-100 rounded-full text-sm">
                  {cat.icon || '🌾'}
                </span>
                <span className="font-medium text-gray-700">{cat.name}</span>
             </div>
           ))}
         </div>
       </div>
     </div>
   )
}

const createCustomIcon = (iconChar, color = '#22c55e') => {
  return L.divIcon({
    className: 'custom-marker-icon',
    html: `<div style="
      background-color: rgba(255, 255, 255, 0.95);
      border-radius: 50%;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 3px 6px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.12);
      border: 2px solid #fff;
    ">
      <span style="
        color: ${color}; 
        font-size: 1.5rem; 
        line-height: 1; 
        display: block;
        transform: translateY(1px);
      ">${iconChar}</span>
    </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -22]
  })
}

export default function ProductMap({ products, center = [0.0236, 37.9062], zoom = 6 }) { // Default to Kenya center approx
  // Filter products with valid coordinates
  const validProducts = products?.filter(p => p.latitude && p.longitude) || []

  // Extract unique categories for Legend
  const categoriesMap = new Map();
  validProducts.forEach(p => {
    if (p.category && !categoriesMap.has(p.category.id)) {
        categoriesMap.set(p.category.id, p.category);
    }
  });
  const uniqueCategories = Array.from(categoriesMap.values());

  return (
    <div className="h-[600px] w-full rounded-xl overflow-hidden shadow-xl border border-gray-200 z-0 relative">
      <MapContainer 
        center={center} 
        zoom={zoom} 
        scrollWheelZoom={false} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <MapUpdater center={center} zoom={zoom} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapSearch />
        <Legend categories={uniqueCategories} />
        
        {validProducts.map(product => (
          <Marker 
            key={product.id} 
            position={[parseFloat(product.latitude), parseFloat(product.longitude)]}
            icon={createCustomIcon(product.category?.icon || '🌾')}
          >
            <Popup className="custom-popup">
              <div className="min-w-[240px] p-2">
                <div className="flex items-start justify-between mb-3 border-b border-gray-100 pb-2">
                   <h3 className="font-bold text-gray-800 text-lg leading-tight pr-2">{product.name}</h3>
                   <span className="text-2xl">{product.category?.icon || '🌾'}</span>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="text-sm text-gray-600 flex items-center gap-2">
                    <span className="text-gray-400">📍</span> 
                    <span className="font-medium">{product.ward}, {product.county}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">Price</span>
                    <div className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-sm font-bold border border-emerald-100">
                      KES {product.price_per_unit} <span className="text-xs font-normal text-emerald-600">/{product.unit}</span>
                    </div>
                  </div>
                </div>

                <Link 
                  to={`/products/${product.uuid}`} 
                  className="block w-full text-center bg-gray-900 hover:bg-black text-white py-2 rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow-md"
                >
                  View Details
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
