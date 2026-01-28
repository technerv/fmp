import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'
import { useAuthStore } from '../stores/authStore'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { FaTrash } from 'react-icons/fa6'

export default function Orders() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [payingOrder, setPayingOrder] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('mpesa')
  const [phoneNumber, setPhoneNumber] = useState('')

  const { data: wallet } = useQuery({
    queryKey: ['wallet'],
    queryFn: async () => {
      const response = await api.get('/payments/wallet/')
      return response.data.results?.[0] || response.data[0] || response.data
    },
    enabled: !!user
  })

  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const response = await api.get('/orders/')
      return response.data.results || response.data
    },
    refetchInterval: 5000, // Poll every 5s to check for payment updates
  })

  const paymentMutation = useMutation({
    mutationFn: async ({ orderId, phoneNumber, method }) => {
      const response = await api.post('/payments/initiate/', {
        order_id: orderId,
        phone_number: method === 'mpesa' ? phoneNumber : undefined,
        method: method
      })
      return response.data
    },
    onSuccess: () => {
      if (paymentMethod === 'mpesa') {
        toast.success('Payment initiated! Please check your phone.')
      } else {
        toast.success('Payment successful!')
      }
      setPayingOrder(null)
      queryClient.invalidateQueries(['orders'])
      queryClient.invalidateQueries(['wallet'])
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Payment initiation failed')
    }
  })

  const confirmDeliveryMutation = useMutation({
    mutationFn: async (escrowId) => {
      const response = await api.post(`/escrow/${escrowId}/release/`)
      return response.data
    },
    onSuccess: () => {
      toast.success('Delivery confirmed! Funds released to farmer.')
      queryClient.invalidateQueries(['orders'])
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to confirm delivery')
    }
  })

  const cancelOrderMutation = useMutation({
    mutationFn: async (orderId) => {
      const response = await api.post(`/orders/${orderId}/cancel/`)
      return response.data
    },
    onSuccess: () => {
      toast.success('Order cancelled successfully')
      queryClient.invalidateQueries(['orders'])
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to cancel order')
    }
  })

  const deleteOrderMutation = useMutation({
    mutationFn: async (orderId) => {
      await api.delete(`/orders/${orderId}/`)
    },
    onSuccess: () => {
      toast.success('Order deleted successfully')
      queryClient.invalidateQueries(['orders'])
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to delete order')
    }
  })

  const handlePay = (e) => {
    e.preventDefault()
    if (paymentMethod === 'mpesa' && !phoneNumber) return
    paymentMutation.mutate({ 
        orderId: payingOrder.id, 
        phoneNumber,
        method: paymentMethod 
    })
  }

  if (isLoading) {
    return <div className="text-center py-12">Loading...</div>
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">My Orders</h1>

      {orders?.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-600">You have no orders yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders?.map((order) => (
            <div key={order.id} className="card">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold">{order.product?.name}</h3>
                  <p className="text-gray-600">Order #{order.order_number}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm ${
                    order.status.toLowerCase() === 'completed' ? 'bg-green-100 text-green-800' :
                    order.status.toLowerCase() === 'cancelled' ? 'bg-red-100 text-red-800' :
                    order.status.toLowerCase() === 'delivered' ? 'bg-blue-100 text-blue-800' :
                    order.status.toLowerCase() === 'paid' ? 'bg-indigo-100 text-indigo-800' :
                    'bg-yellow-100 text-yellow-800'
                    }`}>
                    {order.status.toUpperCase()}
                    </span>
                    
                    {user?.user_type === 'buyer' && (
                        <>
                            {order.status.toLowerCase() === 'pending' && (
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => {
                                            if(window.confirm('Are you sure you want to cancel this order?')) {
                                                cancelOrderMutation.mutate(order.id)
                                            }
                                        }}
                                        className="btn bg-red-100 text-red-700 hover:bg-red-200 text-sm py-1"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={() => {
                                            setPayingOrder(order)
                                            setPhoneNumber(user.phone_number || '')
                                        }}
                                        className="btn btn-primary text-sm py-1"
                                    >
                                        Pay Now
                                    </button>
                                </div>
                            )}
                            
                            {(order.status.toLowerCase() === 'delivered' || order.status.toLowerCase() === 'in_transit') && order.escrow_id && (
                                <button 
                                    onClick={() => {
                                        if(window.confirm('Confirm you have received the products? This will release funds to the farmer.')) {
                                            confirmDeliveryMutation.mutate(order.escrow_id)
                                        }
                                    }}
                                    className="btn bg-green-600 hover:bg-green-700 text-white text-sm py-1"
                                >
                                    Confirm Receipt
                                </button>
                            )}

                            {['completed', 'cancelled', 'rejected'].includes(order.status.toLowerCase()) && (
                                <button 
                                    onClick={() => {
                                        if(window.confirm('Are you sure you want to delete this order history?')) {
                                            deleteOrderMutation.mutate(order.id)
                                        }
                                    }}
                                    className="btn bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm py-1 ml-2 flex items-center gap-1"
                                    title="Delete Order History"
                                >
                                    <FaTrash /> Delete
                                </button>
                            )}
                        </>
                    )}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {/* ... existing fields ... */}
                <div>
                  <p className="text-sm text-gray-600">Quantity</p>
                  <p className="font-semibold">{order.quantity} {order.product?.unit}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Unit Price</p>
                  <p className="font-semibold">KES {order.unit_price}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="font-semibold">KES {order.total_amount}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Delivery Method</p>
                  <p className="font-semibold capitalize">{order.delivery_method || 'Delivery'}</p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600 mb-1">Delivery Address</p>
                <p className="font-medium">{order.delivery_address}</p>
              </div>

              {user?.user_type === 'farmer' && order.status === 'pending' && (
                <div className="mt-4">
                  <button className="btn btn-primary mr-2">
                    Confirm Order
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Payment Modal */}
      {payingOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Pay for Order</h2>
            <p className="mb-4">Order Total: <span className="font-bold">KES {payingOrder.total_amount}</span></p>
            
            <form onSubmit={handlePay}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method
                </label>
                <div className="flex flex-col space-y-2 mb-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      value="mpesa"
                      checked={paymentMethod === 'mpesa'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="form-radio"
                    />
                    <span>M-Pesa</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      value="wallet"
                      checked={paymentMethod === 'wallet'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="form-radio"
                    />
                    <span>Wallet Balance</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      value="card"
                      checked={paymentMethod === 'card'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="form-radio"
                    />
                    <span>Credit/Debit Card</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      value="bitcoin"
                      checked={paymentMethod === 'bitcoin'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="form-radio"
                    />
                    <span>Bitcoin</span>
                  </label>
                </div>
              </div>

              {paymentMethod === 'mpesa' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    M-Pesa Phone Number
                  </label>
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="input"
                    placeholder="2547..."
                    required
                  />
                </div>
              )}

              {paymentMethod === 'wallet' && (
                <div className="mb-4 p-4 bg-gray-50 rounded-md">
                   <p className="text-sm text-gray-600 mb-1">Your Wallet Balance</p>
                   <p className={`font-bold text-lg ${wallet?.balance < payingOrder.total_amount ? 'text-red-600' : 'text-green-600'}`}>
                     KES {wallet?.balance || '0.00'}
                   </p>
                   {wallet?.balance < payingOrder.total_amount && (
                     <p className="text-xs text-red-500 mt-1">Insufficient funds. Please top up or use M-Pesa.</p>
                   )}
                </div>
              )}

              {paymentMethod === 'card' && (
                 <div className="mb-4">
                    <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
                        <input type="text" placeholder="0000 0000 0000 0000" className="input w-full" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="mb-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                            <input type="text" placeholder="MM/YY" className="input w-full" />
                        </div>
                        <div className="mb-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
                            <input type="text" placeholder="123" className="input w-full" />
                        </div>
                    </div>
                    <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name on Card</label>
                        <input type="text" placeholder="John Doe" className="input w-full" />
                    </div>
                 </div>
              )}

              {paymentMethod === 'bitcoin' && (
                 <div className="mb-4">
                    <div className="p-4 bg-gray-100 rounded-lg text-center mb-3">
                        <p className="text-sm text-gray-600 mb-2">Send <span className="font-bold">{(payingOrder.total_amount / 5000000).toFixed(6)} BTC</span> to:</p>
                        <div className="bg-white p-2 border rounded break-all text-xs font-mono select-all">
                            bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Rate: 1 BTC ≈ 5,000,000 KES</p>
                    </div>
                    <p className="text-xs text-gray-500 text-center">
                        Payment will be automatically detected on the blockchain.
                    </p>
                 </div>
              )}
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setPayingOrder(null)}
                  className="btn bg-gray-200 text-gray-800 hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paymentMutation.isLoading || (paymentMethod === 'wallet' && (wallet?.balance || 0) < payingOrder.total_amount)}
                  className="btn btn-primary"
                >
                  {paymentMutation.isLoading ? 'Processing...' : 
                   paymentMethod === 'mpesa' ? 'Pay Now' : 
                   paymentMethod === 'wallet' ? 'Deduct Amount' :
                   'Proceed to Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
