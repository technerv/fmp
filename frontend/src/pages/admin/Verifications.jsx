import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import { toast } from 'react-hot-toast'
import { format } from 'date-fns'

export default function AdminVerifications() {
  const queryClient = useQueryClient()
  const [selectedDoc, setSelectedDoc] = useState(null)
  const [reviewNotes, setReviewNotes] = useState('')

  const { data: documents, isLoading } = useQuery({
    queryKey: ['admin-verifications'],
    queryFn: async () => {
      const response = await api.get('/farmers/verification/')
      return response.data.results || response.data
    },
  })

  const reviewMutation = useMutation({
    mutationFn: async ({ id, status, notes }) => {
      await api.post(`/farmers/verification/${id}/review/`, 
        {
          status,
          admin_notes: notes
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    },
    onSuccess: () => {
      toast.success('Document reviewed successfully')
      queryClient.invalidateQueries(['admin-verifications'])
      setSelectedDoc(null)
      setReviewNotes('')
    },
    onError: () => {
      toast.error('Failed to review document')
    }
  })

  const handleReview = (status) => {
    if (!selectedDoc) return
    reviewMutation.mutate({
      id: selectedDoc.id,
      status,
      notes: reviewNotes
    })
  }

  if (isLoading) return <div>Loading verifications...</div>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Document Verification</h1>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {documents?.map((doc) => (
              <tr key={doc.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {doc.user_details?.username || doc.user_details?.phone_number || 'Unknown User'}
                  </div>
                  <div className="text-xs text-gray-500">{doc.user_details?.user_type}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 capitalize">{doc.document_type.replace('_', ' ')}</div>
                  <a 
                    href={doc.document_file} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-primary-600 hover:text-primary-900 underline"
                  >
                    View File
                  </a>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    doc.status === 'approved' ? 'bg-green-100 text-green-800' :
                    doc.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {doc.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {format(new Date(doc.submitted_at), 'MMM d, yyyy')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {doc.status === 'pending' && (
                    <button
                      onClick={() => setSelectedDoc(doc)}
                      className="text-primary-600 hover:text-primary-900"
                    >
                      Review
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Review Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Review Document</h3>
            <p className="mb-2"><strong>User:</strong> {selectedDoc.user_details?.phone_number}</p>
            <p className="mb-4"><strong>Type:</strong> {selectedDoc.document_type}</p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Admin Notes</label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                className="w-full border rounded-md p-2"
                rows="3"
                placeholder="Reason for approval or rejection..."
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setSelectedDoc(null)
                  setReviewNotes('')
                }}
                className="px-4 py-2 border rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReview('rejected')}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Reject
              </button>
              <button
                onClick={() => handleReview('approved')}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
