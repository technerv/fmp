import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../services/api'

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (phoneNumber, password) => {
        try {
          const response = await api.post('/auth/login/', {
            phone_number: phoneNumber,
            password: password,
          })
          const { user, access } = response.data
          set({
            user,
            token: access,
            isAuthenticated: true,
          })
          // Set token for future requests
          api.defaults.headers.common['Authorization'] = `Bearer ${access}`
          return { success: true }
        } catch (error) {
          return {
            success: false,
            error: error.response?.data?.error || 'Login failed',
          }
        }
      },

      register: async (phoneNumber, password, userType, email = '') => {
        try {
          const response = await api.post('/auth/register/', {
            phone_number: phoneNumber,
            password: password,
            user_type: userType,
            email: email,
          })
          const { user, access } = response.data
          set({
            user,
            token: access,
            isAuthenticated: true,
          })
          api.defaults.headers.common['Authorization'] = `Bearer ${access}`
          return { success: true }
        } catch (error) {
          return {
            success: false,
            error: error.response?.data || 'Registration failed',
          }
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        })
        delete api.defaults.headers.common['Authorization']
      },

      setToken: (token) => {
        set({ token })
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      },
    }),
    {
      name: 'auth-storage',
    }
  )
)

export default useAuthStore
export { useAuthStore }