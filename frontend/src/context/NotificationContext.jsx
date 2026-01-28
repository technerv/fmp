import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { useAuthStore } from '../stores/authStore'
import toast from 'react-hot-toast'

const NotificationContext = createContext(null)

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

export const NotificationProvider = ({ children }) => {
  const { token, isAuthenticated } = useAuthStore()
  const [socket, setSocket] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const reconnectTimeoutRef = useRef(null)

  useEffect(() => {
    let ws = null

    const connectWebSocket = () => {
      if (!isAuthenticated || !token) return

      // Adjust WebSocket URL based on environment
      const wsScheme = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const wsHost = 'localhost:8000' // Update this for production
      const wsUrl = `${wsScheme}//${wsHost}/ws/notifications/?token=${token}`

      console.log('Connecting to WebSocket:', wsUrl)

      try {
        ws = new WebSocket(wsUrl)
        
        ws.onopen = () => {
          console.log('WebSocket Connected')
          setIsConnected(true)
        }

        ws.onmessage = (event) => {
          console.log('WebSocket Message Received:', event.data)
          try {
            const data = JSON.parse(event.data)
            if (data.type === 'notification') {
              // Show toast
              toast(data.message, {
                icon: '🔔',
                duration: 5000,
              })
              // You could also update a notifications list state here
            }
          } catch (e) {
            console.error('Error parsing WebSocket message:', e)
          }
        }

        ws.onclose = (event) => {
          console.log('WebSocket Disconnected', event.code, event.reason)
          setIsConnected(false)
          setSocket(null)
          
          // Attempt to reconnect if authenticated and not manually closed
          if (isAuthenticated && event.code !== 1000) {
              console.log('Attempting to reconnect in 3s...')
              reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000)
          }
        }

        ws.onerror = (error) => {
          console.error('WebSocket Error:', error)
          // Don't close here, let onclose handle it
        }

        setSocket(ws)
      } catch (error) {
        console.error('WebSocket Connection Failed:', error)
      }
    }

    if (isAuthenticated && token) {
      connectWebSocket()
    }

    return () => {
      if (ws) {
        ws.close()
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [isAuthenticated, token])

  return (
    <NotificationContext.Provider value={{ socket, isConnected }}>
      {children}
    </NotificationContext.Provider>
  )
}
