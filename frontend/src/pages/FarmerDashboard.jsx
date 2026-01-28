import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../stores/authStore'
import api from '../services/api'
import toast from 'react-hot-toast'

export default function FarmerDashboard() {
  const { user } = useAuthStore()
  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  const queryClient = useQueryClient()
  const { data: products, isLoading } = useQuery({
    queryKey: ['my-products'],
    queryFn: async () => {
      // Farmers get all their products (including pending, sold, etc.)
      const response = await api.get('/products/?mine=true')
      return response.data.results || response.data
    },
  })

  const { data: orders } = useQuery({
    queryKey: ['my-orders'],
    queryFn: async () => {
      const response = await api.get('/orders/')
      return response.data.results || response.data
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      // Use UUID for deletion if possible, or ID if backend expects ID. 
      // The backend viewset lookup_field is 'uuid', so we should use UUID.
      await api.delete(`/products/${id}/`)
    },
    onSuccess: () => {
      toast.success('Product deleted')
      queryClient.invalidateQueries(['my-products'])
    },
    onError: () => {
      toast.error('Failed to delete product')
    }
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Welcome, {user?.first_name || user?.phone_number || 'Farmer'}</h1>
        <p className="text-gray-600 mt-2">{formattedDate}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <h3 className="text-lg font-semibold mb-2">Total Products</h3>
          <p className="text-3xl font-bold text-primary-600">
            {products?.length || 0}
          </p>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold mb-2">Active Orders</h3>
          <p className="text-3xl font-bold text-primary-600">
            {orders?.filter(o => !['completed', 'cancelled'].includes(o.status)).length || 0}
          </p>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold mb-2">Total Sales</h3>
          <p className="text-3xl font-bold text-primary-600">
            KES {orders?.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0).toLocaleString() || 0}
          </p>
        </div>
      </div>

      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold">My Products</h2>
        <div className="flex space-x-3">
          <Link to="/farmer/payments" className="btn btn-secondary">
            Payments & Earnings
          </Link>
          <Link to="/farmer/orders" className="btn btn-outline">
            View Orders
          </Link>
          <Link to="/products/new" className="btn btn-primary">
            + Add Product
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">Loading...</div>
      ) : products?.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-600 mb-4">You haven't listed any products yet.</p>
          <Link to="/products/new" className="btn btn-primary">
            List Your First Product
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {products?.map((product) => (
            <div key={product.id} className="card">
              <h3 className="text-xl font-semibold mb-2">{product.name}</h3>
              <p className="text-gray-600 mb-2">{product.category?.name}</p>
              <p className="mb-2">
                <span className="font-semibold">Quantity:</span> {product.quantity} {product.unit}
              </p>
              <p className="mb-4">
                <span className="font-semibold">Price:</span> KES {product.price_per_unit}/{product.unit}
              </p>
              <div className="flex justify-between items-center">
                <span className={`px-3 py-1 rounded-full text-sm ${
                  product.status === 'available' ? 'bg-green-100 text-green-800' :
                  product.status === 'sold' ? 'bg-gray-100 text-gray-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {product.status}
                </span>
                <div className="flex space-x-3">
                  <Link to={`/products/${product.uuid}`} className="text-gray-600 hover:text-gray-900 text-sm">
                    View
                  </Link>
                  <Link to={`/products/edit/${product.uuid}`} className="text-blue-600 hover:text-blue-900 text-sm">
                    Edit
                  </Link>
                  <button 
                    onClick={() => {
                        if(window.confirm('Are you sure you want to delete this product?')) {
                            deleteMutation.mutate(product.uuid)
                        }
                    }}
                    className="text-red-600 hover:text-red-900 text-sm"
                    disabled={deleteMutation.isLoading}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
