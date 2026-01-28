import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../stores/authStore'
import api from '../services/api'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'

export default function FarmerOrders() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  const { data: ordersResponse, isLoading } = useQuery({
    queryKey: ['orders', 'farmer'],
    queryFn: async () => {
      const response = await api.get('/orders/')
      // Handle both paginated (results) and non-paginated responses
      return response.data
    },
  })

  // Extract orders from response (handle pagination)
  const orders = ordersResponse?.results || (Array.isArray(ordersResponse) ? ordersResponse : []) || []

  const confirmMutation = useMutation({
    mutationFn: async (orderId) => {
      const response = await api.post(`/orders/${orderId}/confirm/`)
      return response.data
    },
    onSuccess: () => {
      toast.success('Order confirmed!')
      queryClient.invalidateQueries(['orders'])
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to confirm order')
    },
  })

  const handleConfirm = (orderId) => {
    if (window.confirm('Confirm this order?')) {
      confirmMutation.mutate(orderId)
    }
  }

  if (isLoading) {
    return <div className="text-center py-12">Loading orders...</div>
  }

  const pendingOrders = orders?.filter(o => ['pending', 'confirmed'].includes(o.status)) || []
  const completedOrders = orders?.filter(o => ['completed', 'delivered'].includes(o.status)) || []
  const cancelledOrders = orders?.filter(o => o.status === 'cancelled') || []

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">My Product Orders</h1>
        <p className="text-gray-600 mt-2">Manage orders from buyers for your products</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="card">
          <h3 className="text-sm font-medium text-gray-600 mb-1">Total Orders</h3>
          <p className="text-2xl font-bold text-primary-600">{orders?.length || 0}</p>
        </div>
        <div className="card">
          <h3 className="text-sm font-medium text-gray-600 mb-1">Pending</h3>
          <p className="text-2xl font-bold text-yellow-600">{pendingOrders.length}</p>
        </div>
        <div className="card">
          <h3 className="text-sm font-medium text-gray-600 mb-1">Completed</h3>
          <p className="text-2xl font-bold text-green-600">{completedOrders.length}</p>
        </div>
        <div className="card">
          <h3 className="text-sm font-medium text-gray-600 mb-1">Total Revenue</h3>
          <p className="text-2xl font-bold text-primary-600">
            KES {orders?.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0).toLocaleString() || 0}
          </p>
        </div>
      </div>

      {orders?.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-600">No orders yet. Keep listing products to attract buyers!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Pending Orders */}
          {pendingOrders.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Pending Orders</h2>
              <div className="space-y-4">
                {pendingOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onConfirm={handleConfirm}
                    isConfirming={confirmMutation.isLoading}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Completed Orders */}
          {completedOrders.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Completed Orders</h2>
              <div className="space-y-4">
                {completedOrders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            </div>
          )}

          {/* Cancelled Orders */}
          {cancelledOrders.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Cancelled Orders</h2>
              <div className="space-y-4">
                {cancelledOrders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function OrderCard({ order, onConfirm, isConfirming }) {
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    paid: 'bg-purple-100 text-purple-800',
    'in_transit': 'bg-indigo-100 text-indigo-800',
    delivered: 'bg-green-100 text-green-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  }

  return (
    <div className="card">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-semibold">{order.product?.name}</h3>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}`}>
              {order.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>
          <p className="text-gray-600 mb-2">Order #{order.order_number}</p>
          <p className="text-sm text-gray-500">
            {order.created_at && formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-600">Quantity</p>
          <p className="font-semibold">{order.quantity} {order.product?.unit}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Unit Price</p>
          <p className="font-semibold">KES {order.unit_price?.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Commission</p>
          <p className="font-semibold">KES {order.commission?.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Total Amount</p>
          <p className="font-semibold text-primary-600">KES {order.total_amount?.toLocaleString()}</p>
        </div>
      </div>

      <div className="border-t pt-4 space-y-2">
        <div>
          <p className="text-sm font-medium text-gray-700">Buyer Information</p>
          <p className="text-gray-600">{order.buyer?.phone_number}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700">Delivery Address</p>
          <p className="text-gray-600">{order.delivery_address}</p>
          <p className="text-sm text-gray-500">{order.delivery_county}</p>
        </div>
        {order.notes && (
          <div>
            <p className="text-sm font-medium text-gray-700">Notes</p>
            <p className="text-gray-600">{order.notes}</p>
          </div>
        )}
      </div>

      {order.status === 'pending' && onConfirm && (
        <div className="mt-4 pt-4 border-t">
          <button
            onClick={() => onConfirm(order.id)}
            disabled={isConfirming}
            className="btn btn-primary"
          >
            {isConfirming ? 'Confirming...' : 'Confirm Order'}
          </button>
        </div>
      )}
    </div>
  )
}
