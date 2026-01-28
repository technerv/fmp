import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../stores/authStore'
import api from '../services/api'
import toast from 'react-hot-toast'
import LocationPicker from '../components/LocationPicker'

// Helper to check if file is video
const isVideoFile = (file) => {
  const videoExtensions = ['mp4', 'mov', 'avi', 'webm', 'mkv']
  const ext = file.name.split('.').pop().toLowerCase()
  return videoExtensions.includes(ext)
}

export default function AddProduct() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get('/products/categories/')
      return response.data.results || response.data
    },
  })

  const { data: profile } = useQuery({
    queryKey: ['farmer-profile'],
    queryFn: async () => {
      const response = await api.get('/farmers/profile/farmer/')
      return response.data
    },
    enabled: user?.user_type === 'farmer',
  })

  const [formData, setFormData] = useState({
    category_id: '',
    name: '',
    description: '',
    quantity: '',
    unit: 'kg',
    price_per_unit: '',
    harvest_date: new Date().toISOString().split('T')[0],
    expiry_date: '',
    quality_grade: 'standard',
    county: profile?.county || '',
    ward: profile?.ward || '',
    latitude: '',
    longitude: '',
  })

  const [selectedFiles, setSelectedFiles] = useState([])
  const [previews, setPreviews] = useState([])

  const handleLocationSelect = (location) => {
    setFormData(prev => ({
      ...prev,
      latitude: location.lat,
      longitude: location.lng,
      county: location.county || prev.county,
      ward: location.ward || prev.ward
    }))
  }

  const productMutation = useMutation({
    mutationFn: async ({ productData, files }) => {
      // First create the product
      const productResponse = await api.post('/products/', productData)
      const product = productResponse.data

      // Then upload files if any
      if (files && files.length > 0) {
        const formData = new FormData()
        files.forEach(file => {
          formData.append('files', file)
        })

        try {
          await api.post(`/products/${product.uuid}/upload-media/`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          })
        } catch (uploadError) {
          console.error('Upload error:', uploadError)
          toast.error('Product created but some files failed to upload')
        }
      }

      return product
    },
    onSuccess: () => {
      toast.success('Product added successfully!')
      queryClient.invalidateQueries(['my-products'])
      navigate('/farmer/dashboard')
    },
    onError: (error) => {
      const errorMsg = error.response?.data || 'Failed to add product'
      toast.error(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg))
    },
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validation
    if (!formData.category_id) {
      toast.error('Please select a category')
      return
    }
    if (!formData.name.trim()) {
      toast.error('Please enter product name')
      return
    }
    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      toast.error('Please enter a valid quantity')
      return
    }
    if (!formData.price_per_unit || parseFloat(formData.price_per_unit) <= 0) {
      toast.error('Please enter a valid price')
      return
    }
    if (!formData.county.trim()) {
      toast.error('Please enter your county')
      return
    }

    productMutation.mutate({
      productData: {
        category_id: parseInt(formData.category_id),
        name: formData.name.trim(),
        description: formData.description.trim(),
        quantity: parseFloat(formData.quantity),
        unit: formData.unit,
        price_per_unit: parseFloat(formData.price_per_unit),
        harvest_date: formData.harvest_date,
        expiry_date: formData.expiry_date || null,
        quality_grade: formData.quality_grade,
        county: formData.county.trim(),
        ward: formData.ward.trim(),
        latitude: formData.latitude ? parseFloat(formData.latitude).toFixed(6) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude).toFixed(6) : null,
      },
      files: selectedFiles,
    })
  }

  // Update form when profile loads
  useEffect(() => {
    if (profile) {
      setFormData(prev => ({
        ...prev,
        county: profile.county || prev.county,
        ward: profile.ward || prev.ward,
      }))
    }
  }, [profile])

  // Handle file selection
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files)
    setSelectedFiles(prev => [...prev, ...files])

    // Create previews
    files.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviews(prev => [...prev, {
          file,
          preview: reader.result,
          isVideo: isVideoFile(file),
        }])
      }
      if (isVideoFile(file)) {
        // For videos, use a placeholder or the file name
        setPreviews(prev => [...prev, {
          file,
          preview: null,
          isVideo: true,
        }])
      } else {
        reader.readAsDataURL(file)
      }
    })
  }

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
    setPreviews(prev => prev.filter((_, i) => i !== index))
  }

  const units = ['kg', 'liters', 'pieces', 'bags', 'tons', 'crates']

  if (categoriesLoading) {
    return <div className="text-center py-12">Loading categories...</div>
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Add New Product</h1>
        <p className="text-gray-600 mt-2">List your produce for buyers to discover</p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-6">
        {/* Category */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            id="category"
            required
            className="input"
            value={formData.category_id}
            onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
          >
            <option value="">Select a category</option>
            {categories?.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Product Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Product Name <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            type="text"
            required
            className="input"
            placeholder="e.g., Fresh Maize, Potatoes, Tomatoes"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            id="description"
            rows="3"
            className="input"
            placeholder="Describe your product, quality, special features..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        {/* Quantity and Unit */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
              Quantity <span className="text-red-500">*</span>
            </label>
            <input
              id="quantity"
              type="number"
              step="0.01"
              min="0"
              required
              className="input"
              placeholder="0.00"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-2">
              Unit <span className="text-red-500">*</span>
            </label>
            <select
              id="unit"
              required
              className="input"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
            >
              {units.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Price */}
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
            Price per Unit (KES) <span className="text-red-500">*</span>
          </label>
          <input
            id="price"
            type="number"
            step="0.01"
            min="0"
            required
            className="input"
            placeholder="0.00"
            value={formData.price_per_unit}
            onChange={(e) => setFormData({ ...formData, price_per_unit: e.target.value })}
          />
          <p className="text-sm text-gray-500 mt-1">
            Example: 50 KES per kg means buyers pay 50 KES for each kg they order
          </p>
        </div>

        {/* Quality Grade */}
        <div>
          <label htmlFor="quality" className="block text-sm font-medium text-gray-700 mb-2">
            Quality Grade
          </label>
          <select
            id="quality"
            className="input"
            value={formData.quality_grade}
            onChange={(e) => setFormData({ ...formData, quality_grade: e.target.value })}
          >
            <option value="standard">Standard</option>
            <option value="premium">Premium</option>
            <option value="fair">Fair</option>
          </select>
        </div>

        {/* Harvest Date */}
        <div>
          <label htmlFor="harvest_date" className="block text-sm font-medium text-gray-700 mb-2">
            Harvest Date <span className="text-red-500">*</span>
          </label>
          <input
            id="harvest_date"
            type="date"
            required
            className="input"
            value={formData.harvest_date}
            onChange={(e) => setFormData({ ...formData, harvest_date: e.target.value })}
          />
        </div>

        {/* Expiry Date */}
        <div>
          <label htmlFor="expiry_date" className="block text-sm font-medium text-gray-700 mb-2">
            Expiry Date (Optional)
          </label>
          <input
            id="expiry_date"
            type="date"
            className="input"
            value={formData.expiry_date}
            onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
          />
          <p className="text-sm text-gray-500 mt-1">
            Leave blank if product doesn't expire
          </p>
        </div>

        {/* Media Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Product Images/Videos
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            <input
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center justify-center"
            >
              <svg
                className="w-12 h-12 text-gray-400 mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <span className="text-sm text-gray-600">
                Click to upload images or videos
              </span>
              <span className="text-xs text-gray-500 mt-1">
                Supported: JPG, PNG, GIF, MP4, MOV, AVI, WEBM
              </span>
            </label>
          </div>

          {/* Preview selected files */}
          {previews.length > 0 && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              {previews.map((preview, index) => (
                <div key={index} className="relative group">
                  {preview.isVideo ? (
                    <div className="w-full h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <svg
                          className="w-8 h-8 text-gray-400 mx-auto mb-1"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                        </svg>
                        <p className="text-xs text-gray-600 truncate px-2">
                          {preview.file.name}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <img
                      src={preview.preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Location */}
        <div className="border-t pt-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Product Location</h3>
            
            <div className="mb-6">
                <LocationPicker 
                    initialLat={formData.latitude} 
                    initialLng={formData.longitude} 
                    onLocationSelect={handleLocationSelect} 
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="county" className="block text-sm font-medium text-gray-700 mb-2">
                    County <span className="text-red-500">*</span>
                    </label>
                    <input
                    id="county"
                    type="text"
                    required
                    className="input"
                    placeholder="e.g., Uasin Gishu"
                    value={formData.county}
                    onChange={(e) => setFormData({ ...formData, county: e.target.value })}
                    />
                </div>
                <div>
                    <label htmlFor="ward" className="block text-sm font-medium text-gray-700 mb-2">
                    Ward
                    </label>
                    <input
                    id="ward"
                    type="text"
                    className="input"
                    placeholder="e.g., Eldoret"
                    value={formData.ward}
                    onChange={(e) => setFormData({ ...formData, ward: e.target.value })}
                    />
                </div>
                <div>
                <label htmlFor="latitude" className="block text-sm font-medium text-gray-700 mb-2">
                    Latitude
                </label>
                <input
                    id="latitude"
                    type="number"
                    step="0.000001"
                    className="input bg-gray-50"
                    placeholder="e.g. -1.2921"
                    value={formData.latitude || ''}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                />
                </div>
                <div>
                <label htmlFor="longitude" className="block text-sm font-medium text-gray-700 mb-2">
                    Longitude
                </label>
                <input
                    id="longitude"
                    type="number"
                    step="0.000001"
                    className="input bg-gray-50"
                    placeholder="e.g. 36.8219"
                    value={formData.longitude || ''}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                />
                </div>
            </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4 pt-4 border-t">
          <button
            type="button"
            onClick={() => navigate('/farmer/dashboard')}
            className="btn btn-secondary"
            disabled={productMutation.isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={productMutation.isLoading}
            className="btn btn-primary"
          >
            {productMutation.isLoading ? 'Adding Product...' : 'Add Product'}
          </button>
        </div>
      </form>
    </div>
  )
}
