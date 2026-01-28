import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { FaCheck, FaXmark, FaEye, FaTrash } from 'react-icons/fa6'

export default function AdminProducts() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('pending_approval')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', statusFilter, page],
    queryFn: async () => {
      const response = await api.get('/products/', {
        params: {
          status: statusFilter,
          page: page
        }
      })
      return response.data
    }
  })

  const approveMutation = useMutation({
    mutationFn: async (uuid) => {
      const response = await api.post(`/products/${uuid}/approve/`)
      return response.data
    },
    onSuccess: () => {
      toast.success('Product approved successfully')
      queryClient.invalidateQueries(['admin-products'])
    },
    onError: () => {
      toast.error('Failed to approve product')
    }
  })

  const rejectMutation = useMutation({
    mutationFn: async (uuid) => {
      const response = await api.post(`/products/${uuid}/reject/`)
      return response.data
    },
    onSuccess: () => {
      toast.success('Product rejected')
      queryClient.invalidateQueries(['admin-products'])
    },
    onError: () => {
      toast.error('Failed to reject product')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (uuid) => {
      await api.delete(`/products/${uuid}/`)
    },
    onSuccess: () => {
      toast.success('Product deleted successfully')
      queryClient.invalidateQueries(['admin-products'])
    },
    onError: () => {
      toast.error('Failed to delete product')
    }
  })

  const handleApprove = (uuid) => {
    if (window.confirm('Are you sure you want to approve this product?')) {
      approveMutation.mutate(uuid)
    }
  }

  const handleReject = (uuid) => {
    if (window.confirm('Are you sure you want to reject this product?')) {
      rejectMutation.mutate(uuid)
    }
  }

  const handleDelete = (uuid) => {
    if (window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      deleteMutation.mutate(uuid)
    }
  }

  const products = data?.results || []

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Product Management</h1>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 mb-6 border-b">
        <button
          onClick={() => { setStatusFilter('pending_approval'); setPage(1); }}
          className={`px-4 py-2 border-b-2 font-medium transition-colors ${
            statusFilter === 'pending_approval'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Pending Approval
        </button>
        <button
          onClick={() => { setStatusFilter('available'); setPage(1); }}
          className={`px-4 py-2 border-b-2 font-medium transition-colors ${
            statusFilter === 'available'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Approved / Available
        </button>
        <button
          onClick={() => { setStatusFilter('rejected'); setPage(1); }}
          className={`px-4 py-2 border-b-2 font-medium transition-colors ${
            statusFilter === 'rejected'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Rejected
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No products found in this category.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Farmer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price/Qty</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product.uuid} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          <img
                            className="h-10 w-10 rounded-full object-cover"
                            src={product.images?.[0]?.file || 'https://via.placeholder.com/40'}
                            alt=""
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          <div className="text-xs text-gray-500">{product.category?.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{product.farmer?.first_name} {product.farmer?.last_name}</div>
                      <div className="text-xs text-gray-500">{product.farmer?.phone_number}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div>KES {product.price_per_unit} / {product.unit}</div>
                      <div>Qty: {product.quantity}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {product.ward}, {product.county}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        product.status === 'available' ? 'bg-green-100 text-green-800' :
                        product.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {product.status === 'available' ? 'Active' : 
                         product.status === 'pending_approval' ? 'Pending' : 
                         product.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      {product.status !== 'available' && (
                        <button
                          onClick={() => handleApprove(product.uuid)}
                          disabled={approveMutation.isPending}
                          className="text-green-600 hover:text-green-900 bg-green-50 px-2 py-1 rounded-md hover:bg-green-100 transition-colors"
                          title="Approve"
                        >
                          <FaCheck className="inline" />
                        </button>
                      )}
                      {product.status !== 'rejected' && (
                        <button
                          onClick={() => handleReject(product.uuid)}
                          disabled={rejectMutation.isPending}
                          className="text-orange-600 hover:text-orange-900 bg-orange-50 px-2 py-1 rounded-md hover:bg-orange-100 transition-colors"
                          title="Reject"
                        >
                          <FaXmark className="inline" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(product.uuid)}
                        disabled={deleteMutation.isPending}
                        className="text-red-600 hover:text-red-900 bg-red-50 px-2 py-1 rounded-md hover:bg-red-100 transition-colors"
                        title="Delete"
                      >
                        <FaTrash className="inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination Controls */}
        {data?.count > 10 && (
            <div className="px-6 py-4 border-t flex justify-between items-center">
                <button 
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={!data.previous}
                    className="btn btn-sm btn-outline"
                >
                    Previous
                </button>
                <span className="text-sm text-gray-600">
                    Page {page} of {Math.ceil(data.count / 10)}
                </span>
                <button 
                    onClick={() => setPage(p => p + 1)}
                    disabled={!data.next}
                    className="btn btn-sm btn-outline"
                >
                    Next
                </button>
            </div>
        )}
      </div>
    </div>
  )
}
