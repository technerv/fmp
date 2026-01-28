import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'
import { useAuthStore } from '../stores/authStore'
import toast from 'react-hot-toast'
import { useState } from 'react'
import { FaWhatsapp, FaPhone, FaCommentDots, FaCircleCheck } from 'react-icons/fa6'
import ProductMap from '../components/ProductMap'

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuthStore()
  const queryClient = useQueryClient()
  const [quantity, setQuantity] = useState(1)
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [deliveryMethod, setDeliveryMethod] = useState('delivery')
  const [selectedCollectionPoint, setSelectedCollectionPoint] = useState('')

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const response = await api.get(`/products/${id}/`)
      return response.data
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/products/${id}/`)
    },
    onSuccess: () => {
      toast.success('Product deleted')
      navigate('/farmer/dashboard')
    },
    onError: () => {
      toast.error('Failed to delete product')
    }
  })

  const { data: collectionPoints } = useQuery({
    queryKey: ['collectionPoints'],
    queryFn: async () => {
      const response = await api.get('/logistics/collection-points/')
      return response.data.results || response.data
    },
    enabled: deliveryMethod === 'pickup'
  })

  const orderMutation = useMutation({
    mutationFn: async (orderData) => {
      const response = await api.post('/orders/', orderData)
      return response.data
    },
    onSuccess: () => {
      toast.success('Order placed successfully! Proceed to payment.')
      queryClient.invalidateQueries(['orders'])
      navigate('/orders')
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to place order')
    },
  })

  const handleOrder = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to place an order')
      navigate('/login')
      return
    }

    if (user?.user_type !== 'buyer') {
      toast.error('Only buyers can place orders')
      return
    }

    if (deliveryMethod === 'delivery' && !deliveryAddress.trim()) {
      toast.error('Please enter delivery address')
      return
    }

    if (deliveryMethod === 'pickup' && !selectedCollectionPoint) {
        toast.error('Please select a collection point')
        return
    }

    if (quantity > product.quantity) {
      toast.error('Quantity exceeds available stock')
      return
    }

    orderMutation.mutate({
      product_id: product.id,
      quantity: parseFloat(quantity),
      delivery_method: deliveryMethod,
      delivery_address: deliveryMethod === 'delivery' ? deliveryAddress : undefined,
      collection_point_id: deliveryMethod === 'pickup' ? selectedCollectionPoint : undefined,
      delivery_county: product.county,
    })
  }

  if (isLoading) {
    return <div className="text-center py-12">Loading...</div>
  }

  if (!product) {
    return <div className="text-center py-12">Product not found</div>
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          {product.images?.[0] ? (
            <img
              src={product.images[0].file_url || product.images[0].file}
              alt={product.name}
              className="w-full h-96 object-cover rounded-lg"
            />
          ) : (
            <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center text-8xl">
              🌾
            </div>
          )}
        </div>
        
        <div>
          <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
          <p className="text-lg text-gray-600 mb-4">{product.category?.name}</p>

          {user?.id === product.farmer?.id && (
            <div className="flex space-x-3 mb-6">
              <button 
                  onClick={() => navigate(`/products/edit/${id}`)}
                  className="btn btn-secondary text-sm py-1"
              >
                  Edit Product
              </button>
              <button 
                  onClick={() => {
                      if(window.confirm('Are you sure you want to delete this product?')) {
                          deleteMutation.mutate()
                      }
                  }}
                  className="btn bg-red-600 text-white hover:bg-red-700 text-sm py-1"
                  disabled={deleteMutation.isLoading}
              >
                  {deleteMutation.isLoading ? 'Deleting...' : 'Delete Product'}
              </button>
            </div>
          )}
          
          <div className="mb-6 space-y-2">
            <p>
              <span className="font-semibold">Price:</span> KES {product.price_per_unit}/{product.unit}
            </p>
            <p>
              <span className="font-semibold">Available:</span> {product.quantity} {product.unit}
            </p>
            <p>
              <span className="font-semibold">Location:</span> {product.county}, {product.ward}
            </p>
            <p>
              <span className="font-semibold">Quality:</span> {product.quality_grade}
            </p>
            <p>
              <span className="font-semibold">Harvest Date:</span> {new Date(product.harvest_date).toLocaleDateString()}
            </p>
          </div>

          {product.description && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-gray-600">{product.description}</p>
            </div>
          )}

          {/* Contact Farmer Section */}
          <div className="mb-6">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              Contact Farmer
              {product.farmer?.is_verified && (
                <span className="text-blue-500 flex items-center gap-1 text-sm bg-blue-50 px-2 py-0.5 rounded-full" title="Verified Farmer">
                    <FaCircleCheck /> Verified
                </span>
              )}
            </h3>
            <div className="flex space-x-3">
              <a 
                href={`https://wa.me/${product.farmer?.phone_number?.replace('+', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn bg-[#25D366] text-white hover:bg-[#128C7E] flex items-center space-x-2"
              >
                <FaWhatsapp className="text-xl" />
                <span>WhatsApp</span>
              </a>
              <a 
                href={`tel:${product.farmer?.phone_number}`}
                className="btn bg-blue-500 text-white hover:bg-blue-600 flex items-center space-x-2"
              >
                <FaPhone />
                <span>Call</span>
              </a>
              <a 
                href={`sms:${product.farmer?.phone_number}`}
                className="btn bg-gray-500 text-white hover:bg-gray-600 flex items-center space-x-2"
              >
                <FaCommentDots />
                <span>SMS</span>
              </a>
            </div>
          </div>
          
          {/* Location Map */}
          {product.latitude && product.longitude && (
            <div className="mb-6">
                <h3 className="font-semibold mb-2">Location</h3>
                <ProductMap 
                    products={[product]} 
                    center={[parseFloat(product.latitude), parseFloat(product.longitude)]} 
                    zoom={13}
                />
            </div>
          )}

          {user?.user_type === 'buyer' && product.status === 'available' && (
            <div className="card space-y-4">
              <h3 className="text-xl font-semibold">Place Order</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity ({product.unit})
                </label>
                <input
                  type="number"
                  min="1"
                  max={product.quantity}
                  className="input"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delivery Method
                </label>
                <div className="flex space-x-4 mb-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      value="delivery"
                      checked={deliveryMethod === 'delivery'}
                      onChange={(e) => setDeliveryMethod(e.target.value)}
                      className="text-primary focus:ring-primary"
                    />
                    <span>Home Delivery</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      value="pickup"
                      checked={deliveryMethod === 'pickup'}
                      onChange={(e) => setDeliveryMethod(e.target.value)}
                      className="text-primary focus:ring-primary"
                    />
                    <span>Self Pickup</span>
                  </label>
                </div>
              </div>

              {deliveryMethod === 'delivery' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Delivery Address
                  </label>
                  <textarea
                    className="input"
                    rows="3"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Enter your delivery address..."
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Collection Point
                  </label>
                  <select
                    className="input"
                    value={selectedCollectionPoint}
                    onChange={(e) => setSelectedCollectionPoint(e.target.value)}
                  >
                    <option value="">Select a collection point...</option>
                    {collectionPoints?.map((point) => (
                      <option key={point.id} value={point.id}>
                        {point.name} - {point.county}, {point.ward}
                      </option>
                    ))}
                  </select>
                  {selectedCollectionPoint && (
                     <p className="text-sm text-gray-500 mt-1">
                       Operating Hours: {collectionPoints?.find(p => p.id === parseInt(selectedCollectionPoint))?.operating_hours}
                     </p>
                  )}
                </div>
              )}

              <div className="pt-4 border-t">
                <p className="mb-4">
                  <span className="font-semibold">Total:</span>{' '}
                  KES {(quantity * product.price_per_unit).toLocaleString()}
                </p>
                <button
                  onClick={handleOrder}
                  disabled={orderMutation.isLoading}
                  className="w-full btn btn-primary"
                >
                  {orderMutation.isLoading ? 'Placing Order...' : 'Place Order'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
