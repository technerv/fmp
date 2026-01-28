import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import toast from 'react-hot-toast'
import { FaUpload, FaCheckCircle, FaTimesCircle, FaClock } from 'react-icons/fa'

export default function Verification() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [selectedFile, setSelectedFile] = useState(null)
  const [documentType, setDocumentType] = useState('national_id')

  const { data: documents, isLoading } = useQuery({
    queryKey: ['verification_documents'],
    queryFn: async () => {
      const response = await api.get('/farmers/verification/')
      return response.data.results || response.data
    },
  })

  const uploadMutation = useMutation({
    mutationFn: async (formData) => {
      const response = await api.post('/farmers/verification/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return response.data
    },
    onSuccess: () => {
      toast.success('Document uploaded successfully')
      setSelectedFile(null)
      queryClient.invalidateQueries(['verification_documents'])
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to upload document')
    },
  })

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0])
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!selectedFile) {
      toast.error('Please select a file')
      return
    }

    const formData = new FormData()
    formData.append('document_type', documentType)
    formData.append('document_file', selectedFile)

    uploadMutation.mutate(formData)
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <FaCheckCircle className="text-green-500" />
      case 'rejected':
        return <FaTimesCircle className="text-red-500" />
      default:
        return <FaClock className="text-yellow-500" />
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'approved':
        return <span className="text-green-600 font-medium">Approved</span>
      case 'rejected':
        return <span className="text-red-600 font-medium">Rejected</span>
      default:
        return <span className="text-yellow-600 font-medium">Pending Review</span>
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
            <h1 className="text-3xl font-bold">Account Verification</h1>
            <p className="text-gray-600 mt-2">Upload official documents to verify your identity.</p>
        </div>
        <button onClick={() => navigate('/profile')} className="btn btn-secondary">
            Back to Profile
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Upload Section */}
        <div className="card h-fit">
          <h2 className="text-xl font-semibold mb-4">Upload Document</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Document Type
              </label>
              <select
                className="input"
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
              >
                <option value="national_id">National ID</option>
                <option value="business_permit">Business Permit</option>
                <option value="certificate">Registration Certificate</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                File
              </label>
              <input
                type="file"
                onChange={handleFileChange}
                className="w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-primary-50 file:text-primary-700
                  hover:file:bg-primary-100"
                accept=".pdf,.jpg,.jpeg,.png"
              />
              <p className="text-xs text-gray-500 mt-1">Accepted formats: PDF, JPG, PNG</p>
            </div>

            <button
              type="submit"
              disabled={uploadMutation.isLoading || !selectedFile}
              className="btn btn-primary w-full flex items-center justify-center gap-2"
            >
              {uploadMutation.isLoading ? 'Uploading...' : (
                <>
                  <FaUpload /> Upload Document
                </>
              )}
            </button>
          </form>
        </div>

        {/* Documents List */}
        <div className="card h-fit">
          <h2 className="text-xl font-semibold mb-4">Submitted Documents</h2>
          {isLoading ? (
            <div className="text-center py-4">Loading...</div>
          ) : documents?.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No documents submitted yet.</p>
          ) : (
            <div className="space-y-4">
              {documents.map((doc) => (
                <div key={doc.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium capitalize">
                        {doc.document_type.replace('_', ' ')}
                      </p>
                      <p className="text-xs text-gray-500">
                        Submitted: {new Date(doc.submitted_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(doc.status)}
                      {getStatusText(doc.status)}
                    </div>
                  </div>
                  
                  {doc.admin_notes && (
                    <div className="mt-2 bg-gray-50 p-2 rounded text-sm">
                      <p className="font-medium text-gray-700">Admin Notes:</p>
                      <p className="text-gray-600">{doc.admin_notes}</p>
                    </div>
                  )}

                  <div className="mt-2 text-right">
                     <a 
                        href={doc.document_file} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 text-sm hover:underline"
                     >
                        View File
                     </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
