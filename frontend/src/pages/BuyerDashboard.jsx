import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../stores/authStore'
import api from '../services/api'

export default function BuyerDashboard() {
  const { user } = useAuthStore()
  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  const { data: orders } = useQuery({
    queryKey: ['my-orders'],
    queryFn: async () => {
      const response = await api.get('/orders/')
      return response.data.results || response.data
    },
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Welcome, {user?.first_name || user?.phone_number || 'Buyer'}</h1>
        <p className="text-gray-600 mt-2">{formattedDate}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <h3 className="text-lg font-semibold mb-2">Total Orders</h3>
          <p className="text-3xl font-bold text-primary-600">
            {orders?.length || 0}
          </p>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold mb-2">Pending Orders</h3>
          <p className="text-3xl font-bold text-primary-600">
            {orders?.filter(o => ['pending', 'confirmed', 'paid'].includes(o.status)).length || 0}
          </p>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold mb-2">Total Spent</h3>
          <p className="text-3xl font-bold text-primary-600">
            KES {orders?.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0).toLocaleString() || 0}
          </p>
        </div>
      </div>

      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold">Recent Orders</h2>
        <Link to="/products" className="btn btn-primary">
          Browse Products
        </Link>
      </div>

      {orders?.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-600 mb-4">You haven't placed any orders yet.</p>
          <Link to="/products" className="btn btn-primary">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders?.map((order) => (
            <div key={order.id} className="card">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold">{order.product?.name}</h3>
                  <p className="text-gray-600">Order #{order.order_number}</p>
                  <p className="mt-2">
                    <span className="font-semibold">Quantity:</span> {order.quantity}
                  </p>
                  <p>
                    <span className="font-semibold">Total:</span> KES {order.total_amount}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    order.status === 'completed' ? 'bg-green-100 text-green-800' :
                    order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                    order.status === 'delivered' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
