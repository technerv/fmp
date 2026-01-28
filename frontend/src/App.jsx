import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import Layout from './components/Layout'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import FarmerDashboard from './pages/FarmerDashboard'
import FarmerPayments from './pages/FarmerPayments'
import BuyerDashboard from './pages/BuyerDashboard'
import Products from './pages/Products'
import ProductDetail from './pages/ProductDetail'
import AddProduct from './pages/AddProduct'
import EditProduct from './pages/EditProduct'
import FarmerOrders from './pages/FarmerOrders'
import Orders from './pages/Orders'
import Profile from './pages/Profile'
import Verification from './pages/Verification'
import AdminRoute from './components/AdminRoute'
import AdminDashboard from './pages/admin/Dashboard'
import AdminLayout from './pages/admin/Layout'
import AdminUsers from './pages/admin/Users'
import AdminVerifications from './pages/admin/Verifications'
import AdminProducts from './pages/admin/Products'

function ProtectedRoute({ children, allowedTypes = [] }) {
  const { user, isAuthenticated } = useAuthStore()
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  if (allowedTypes.length > 0 && !allowedTypes.includes(user?.user_type)) {
    return <Navigate to="/" replace />
  }
  
  return children
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="products" element={<Products />} />
        <Route path="products/:id" element={<ProductDetail />} />
        
        <Route
          path="farmer/dashboard"
          element={
            <ProtectedRoute allowedTypes={['farmer']}>
              <FarmerDashboard />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="farmer/payments"
          element={
            <ProtectedRoute allowedTypes={['farmer']}>
              <FarmerPayments />
            </ProtectedRoute>
          }
        />

        <Route
          path="farmer/orders"
          element={
            <ProtectedRoute allowedTypes={['farmer']}>
              <FarmerOrders />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="products/new"
          element={
            <ProtectedRoute allowedTypes={['farmer']}>
              <AddProduct />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="products/edit/:id"
          element={
            <ProtectedRoute allowedTypes={['farmer']}>
              <EditProduct />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="buyer/dashboard"
          element={
            <ProtectedRoute allowedTypes={['buyer']}>
              <BuyerDashboard />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="orders"
          element={
            <ProtectedRoute>
              <Orders />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route
          path="verification"
          element={
            <ProtectedRoute>
              <Verification />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Admin Routes */}
      <Route element={<AdminRoute />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="verification" element={<AdminVerifications />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App
