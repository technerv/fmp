import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuthStore } from '../stores/authStore'

export default function Profile() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({})
  const [message, setMessage] = useState({ type: '', content: '' })

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', user?.user_type],
    queryFn: async () => {
      if (user?.user_type === 'farmer') {
        const response = await api.get('/farmers/profile/farmer/')
        return response.data
      } else if (user?.user_type === 'buyer') {
        const response = await api.get('/farmers/profile/buyer/')
        return response.data
      }
      return null
    },
    enabled: !!user,
  })

  useEffect(() => {
    if (user && profile) {
      setFormData({
        // User fields
        email: user.email || '',
        phone_number: user.phone_number || '',
        
        // Profile fields
        ...profile
      })
    }
  }, [user, profile])

  const updateProfileMutation = useMutation({
    mutationFn: async (data) => {
      // 1. Update User Details
      const userUpdates = {}
      if (data.email !== user.email) userUpdates.email = data.email
      if (data.phone_number !== user.phone_number) userUpdates.phone_number = data.phone_number
      
      if (Object.keys(userUpdates).length > 0) {
        await api.patch('/farmers/me/', userUpdates)
      }

      // 2. Update Profile Details
      const endpoint = user.user_type === 'farmer' 
        ? '/farmers/profile/farmer/' 
        : '/farmers/profile/buyer/'
      
      const formDataToSend = new FormData();
      
      Object.keys(data).forEach(key => {
        // Skip user fields and read-only fields
        if (['email', 'phone_number', 'user', 'id', 'rating', 'total_sales', 'total_purchases', 'created_at'].includes(key)) return;
        
        let value = data[key];

        // Sanitize numeric fields
        if (key === 'farm_size_acres' && value === '') value = null;
        if (key === 'years_farming' && value === '') value = 0;
        if (key === 'latitude' && value === '') return;
        if (key === 'longitude' && value === '') return;
        if (typeof value === 'string' && value.trim() === '') return;
        // Avoid sending arrays/objects via multipart unless explicitly edited
        if (Array.isArray(value)) return;
        if (value && typeof value === 'object' && !(value instanceof File)) return;

        // Handle profile_picture
        if (key === 'profile_picture') {
            if (value instanceof File) {
                formDataToSend.append(key, value);
            }
        } else if (value !== null && value !== undefined) {
            formDataToSend.append(key, value);
        }
      });

      const response = await api.patch(endpoint, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return response.data
    },
    onSuccess: () => {
      setMessage({ type: 'success', content: 'Profile updated successfully' })
      setIsEditing(false)
      queryClient.invalidateQueries(['profile'])
      // Ideally we should also refresh the user in authStore, but a page reload or re-fetch will do
      window.location.reload() 
    },
    onError: (error) => {
      setMessage({ 
        type: 'error', 
        content: error.response?.data?.message || 'Failed to update profile' 
      })
    }
  })

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      await api.delete('/farmers/me/')
    },
    onSuccess: () => {
      logout()
      navigate('/login')
    },
    onError: (error) => {
      setMessage({ 
        type: 'error', 
        content: error.response?.data?.message || 'Failed to delete account' 
      })
    }
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({ ...prev, profile_picture: e.target.files[0] }))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    updateProfileMutation.mutate(formData)
  }

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      deleteAccountMutation.mutate()
    }
  }

  if (isLoading) return <div className="text-center py-12">Loading...</div>

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden border flex items-center justify-center">
                {profile?.profile_picture ? (
                    <img 
                        src={profile.profile_picture} 
                        alt="Profile" 
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <span className="text-xl font-bold text-gray-500">
                        {user?.user_type?.[0]?.toUpperCase()}
                    </span>
                )}
            </div>
            <div>
                <h1 className="text-3xl font-bold">My Profile</h1>
                <div className="flex items-center gap-2 mt-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        user?.is_verified ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                        {user?.is_verified ? 'Verified Account' : 'Unverified'}
                    </span>
                    {!user?.is_verified && (
                        <button 
                            onClick={() => navigate('/verification')}
                            className="text-primary-600 hover:text-primary-700 text-sm font-medium underline"
                        >
                            Verify Now
                        </button>
                    )}
                </div>
            </div>
        </div>
        <div className="space-x-4">
          {!isEditing && (
            <button 
              onClick={() => setIsEditing(true)}
              className="btn btn-primary"
            >
              Edit Profile
            </button>
          )}
          <button 
            onClick={handleDelete}
            className="btn bg-red-600 text-white hover:bg-red-700"
          >
            Delete Account
          </button>
        </div>
      </div>

      {message.content && (
        <div className={`p-4 mb-6 rounded-md ${
          message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message.content}
        </div>
      )}

      {isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Account Information</h2>
            <div className="flex items-center gap-4 mb-4">
              {formData.profile_picture ? (
                <img
                  src={typeof formData.profile_picture === 'string' ? formData.profile_picture : URL.createObjectURL(formData.profile_picture)}
                  alt="Profile"
                  className="h-16 w-16 rounded-full object-cover border"
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-bold border">
                  {(user?.user_type === 'farmer' ? 'F' : 'B')}
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  name="phone_number"
                  value={formData.phone_number || ''}
                  onChange={handleInputChange}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email || ''}
                  onChange={handleInputChange}
                  className="input"
                />
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Profile Details</h2>
            
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Profile Picture</label>
                <div className="flex items-center space-x-4">
                    {formData.profile_picture && (
                        <img 
                            src={typeof formData.profile_picture === 'string' 
                                ? formData.profile_picture 
                                : URL.createObjectURL(formData.profile_picture)} 
                            alt="Profile" 
                            className="h-20 w-20 rounded-full object-cover border"
                        />
                    )}
                    <input
                        type="file"
                        name="profile_picture"
                        onChange={handleFileChange}
                        accept="image/*"
                        className="text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-full file:border-0
                        file:text-sm file:font-semibold
                        file:bg-primary-50 file:text-primary-700
                        hover:file:bg-primary-100"
                    />
                </div>
            </div>

            <div className="space-y-4">
              {user?.user_type === 'farmer' ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">County</label>
                      <input
                        type="text"
                        name="county"
                        value={formData.county || ''}
                        onChange={handleInputChange}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ward</label>
                      <input
                        type="text"
                        name="ward"
                        value={formData.ward || ''}
                        onChange={handleInputChange}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Farm Size (Acres)</label>
                      <input
                        type="number"
                        name="farm_size_acres"
                        value={formData.farm_size_acres || ''}
                        onChange={handleInputChange}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Years Farming</label>
                      <input
                        type="number"
                        name="years_farming"
                        value={formData.years_farming || ''}
                        onChange={handleInputChange}
                        className="input"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                    <textarea
                      name="bio"
                      value={formData.bio || ''}
                      onChange={handleInputChange}
                      rows="3"
                      className="input"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                      <input
                        type="text"
                        name="business_name"
                        value={formData.business_name || ''}
                        onChange={handleInputChange}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Buyer Type</label>
                      <select
                        name="buyer_type"
                        value={formData.buyer_type || ''}
                        onChange={handleInputChange}
                        className="input"
                      >
                        <option value="individual">Individual</option>
                        <option value="retailer">Retailer</option>
                        <option value="wholesaler">Wholesaler</option>
                        <option value="restaurant">Restaurant</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">County</label>
                      <input
                        type="text"
                        name="county"
                        value={formData.county || ''}
                        onChange={handleInputChange}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">License Number</label>
                      <input
                        type="text"
                        name="license_number"
                        value={formData.license_number || ''}
                        onChange={handleInputChange}
                        className="input"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="btn btn-outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateProfileMutation.isPending}
              className="btn btn-primary"
            >
              {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className="card mb-6">
            <h2 className="text-xl font-semibold mb-4">Account Information</h2>
            <div className="flex items-start gap-6">
                <div className="h-20 w-20 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden border flex items-center justify-center">
                    {profile?.profile_picture ? (
                        <img 
                            src={profile.profile_picture} 
                            alt="Profile" 
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <span className="text-2xl font-bold text-gray-500">
                            {user?.user_type?.[0]?.toUpperCase()}
                        </span>
                    )}
                </div>
                <div className="space-y-2 flex-1">
                    <p>
                        <span className="font-semibold">Phone:</span> {user?.phone_number}
                    </p>
                    <p>
                        <span className="font-semibold">Email:</span> {user?.email || 'Not set'}
                    </p>
                    <p>
                        <span className="font-semibold">User Type:</span> {user?.user_type}
                    </p>
                </div>
            </div>
          </div>

          {profile && (
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Profile Details</h2>
              {user?.user_type === 'farmer' ? (
                <div className="space-y-2">
                  <p>
                    <span className="font-semibold">County:</span> {profile.county}
                  </p>
                  <p>
                    <span className="font-semibold">Ward:</span> {profile.ward}
                  </p>
                  {profile.farm_size_acres && (
                    <p>
                      <span className="font-semibold">Farm Size:</span> {profile.farm_size_acres} acres
                    </p>
                  )}
                  {profile.years_farming && (
                    <p>
                      <span className="font-semibold">Years Farming:</span> {profile.years_farming}
                    </p>
                  )}
                   {profile.bio && (
                    <p>
                      <span className="font-semibold">Bio:</span> {profile.bio}
                    </p>
                  )}
                  <p>
                    <span className="font-semibold">Rating:</span> {profile.rating}/5.0
                  </p>
                  <p>
                    <span className="font-semibold">Total Sales:</span> KES {profile.total_sales?.toLocaleString() || 0}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p>
                    <span className="font-semibold">Business Name:</span> {profile.business_name || 'Not set'}
                  </p>
                  <p>
                    <span className="font-semibold">Buyer Type:</span> {profile.buyer_type}
                  </p>
                  <p>
                    <span className="font-semibold">County:</span> {profile.county}
                  </p>
                   {profile.license_number && (
                    <p>
                      <span className="font-semibold">License Number:</span> {profile.license_number}
                    </p>
                  )}
                  <p>
                    <span className="font-semibold">Rating:</span> {profile.rating}/5.0
                  </p>
                  <p>
                    <span className="font-semibold">Total Purchases:</span> KES {profile.total_purchases?.toLocaleString() || 0}
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
