import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { useState } from 'react'
import { FaWhatsapp, FaPhone, FaLocationDot, FaMapLocationDot, FaList, FaCircleCheck } from 'react-icons/fa6'
import ProductMap from '../components/ProductMap'
import toast from 'react-hot-toast'

export default function Products() {
  const [filters, setFilters] = useState({})
  const [viewMode, setViewMode] = useState('list') // 'list' or 'map'
  const [userLocation, setUserLocation] = useState(null)
  
  const { data, isLoading } = useQuery({
    queryKey: ['products', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.category) params.append('category', filters.category)
      if (filters.county) params.append('county', filters.county)
      if (filters.search) params.append('search', filters.search)
      if (filters.lat) params.append('lat', filters.lat)
      if (filters.lng) params.append('lng', filters.lng)
      if (filters.radius) params.append('radius', filters.radius)
      
      const response = await api.get(`/products/?${params.toString()}`)
      return response.data.results || response.data
    },
  })

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get('/products/categories/')
      return response.data.results || response.data
    },
  })

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser')
      return
    }

    toast.loading('Getting your location...', { id: 'geo' })
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setUserLocation([latitude, longitude])
        setFilters(prev => ({
          ...prev,
          lat: latitude,
          lng: longitude,
          radius: 50 // Default radius 50km
        }))
        toast.success('Found nearby products!', { id: 'geo' })
      },
      (error) => {
        console.error(error)
        toast.error('Unable to retrieve your location', { id: 'geo' })
      }
    )
  }

  const clearLocation = () => {
    setUserLocation(null)
    const newFilters = { ...filters }
    delete newFilters.lat
    delete newFilters.lng
    delete newFilters.radius
    setFilters(newFilters)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold">Browse Products</h1>
          <p className="text-gray-600 mt-2">Find fresh produce from local farmers</p>
        </div>
        <div className="flex gap-2">
            <button
                onClick={() => setViewMode('list')}
                className={`btn ${viewMode === 'list' ? 'btn-primary' : 'btn-outline'} flex items-center gap-2`}
            >
                <FaList /> List
            </button>
            <button
                onClick={() => setViewMode('map')}
                className={`btn ${viewMode === 'map' ? 'btn-primary' : 'btn-outline'} flex items-center gap-2`}
            >
                <FaMapLocationDot /> Map
            </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <input
              type="text"
              className="input"
              placeholder="Search products..."
              value={filters.search || ''}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              className="input"
              value={filters.category || ''}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            >
              <option value="">All Categories</option>
              {categories?.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              County
            </label>
            <input
              type="text"
              className="input"
              placeholder="Enter county..."
              value={filters.county || ''}
              onChange={(e) => setFilters({ ...filters, county: e.target.value })}
            />
          </div>
          <div className="flex items-end">
            {!filters.lat ? (
                <button 
                    onClick={handleUseLocation}
                    className="btn btn-secondary w-full flex items-center justify-center gap-2"
                >
                    <FaLocationDot /> Find Near Me
                </button>
            ) : (
                <button 
                    onClick={clearLocation}
                    className="btn btn-outline text-red-600 hover:bg-red-50 border-red-200 w-full"
                >
                    Clear Location Filter
                </button>
            )}
          </div>
        </div>
        {filters.lat && (
            <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-gray-600 mb-2">
                    Showing products within {filters.radius || 50}km of your location.
                </p>
                <input 
                    type="range" 
                    min="5" 
                    max="500" 
                    value={filters.radius || 50} 
                    onChange={(e) => setFilters({...filters, radius: e.target.value})}
                    className="w-full max-w-md"
                />
                <div className="text-xs text-gray-500 mt-1">{filters.radius || 50} km radius</div>
            </div>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="text-center py-12">Loading...</div>
      ) : data?.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-600">No products found matching your criteria.</p>
        </div>
      ) : viewMode === 'map' ? (
          <ProductMap 
            products={data} 
            center={userLocation || undefined} 
            zoom={userLocation ? 12 : 6}
          />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {data?.map((product) => (
            <div key={product.id} className="card hover:shadow-lg transition-shadow relative">
              <Link to={`/products/${product.uuid}`} className="block">
                <div className="mb-4">
                  {product.images?.[0] ? (
                    <img
                      src={product.images[0].file_url || product.images[0].file}
                      alt={product.name}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center text-4xl">
                      🌾
                    </div>
                  )}
                </div>
                <h3 className="text-xl font-semibold mb-2 flex items-center justify-between">
                  {product.name}
                  {product.farmer?.is_verified && (
                     <span className="text-blue-500 text-sm flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-full" title="Verified Farmer">
                       <FaCircleCheck /> <span className="text-xs">Verified</span>
                     </span>
                   )}
                </h3>
                <p className="text-gray-600 mb-2">{product.category?.name}</p>
                <p className="mb-2">
                  <span className="font-semibold">Quantity:</span> {product.quantity} {product.unit}
                </p>
                <p className="mb-2">
                  <span className="font-semibold">Price:</span> KES {product.price_per_unit}/{product.unit}
                </p>
                {product.distance_km !== undefined && (
                    <p className="text-sm text-green-600 font-medium mb-2">
                        📍 {product.distance_km} km away
                    </p>
                )}
              </Link>
              
              <div className="mt-4 pt-3 border-t flex justify-between items-center">
                <p className="text-sm text-gray-500">{product.county}</p>
                <div className="flex space-x-2">
                  {product.farmer?.phone_number && (
                    <>
                      <a 
                        href={`https://wa.me/${product.farmer.phone_number.replace('+', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#25D366] hover:text-[#128C7E] text-xl"
                        title="WhatsApp"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <FaWhatsapp />
                      </a>
                      <a 
                        href={`tel:${product.farmer.phone_number}`}
                        className="text-blue-600 hover:text-blue-800 text-lg"
                        title="Call"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <FaPhone />
                      </a>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
