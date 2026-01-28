import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import ChatWidget from './ChatWidget'

export default function Layout() {
  const { user, isAuthenticated, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="text-2xl font-bold text-primary-600">
                🌾 Farmer Market Pool
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link to="/products" className="text-gray-700 hover:text-primary-600">
                Products
              </Link>
              
              {isAuthenticated ? (
                <>
                  {(user?.is_staff || user?.is_superuser) && (
                    <Link
                      to="/admin"
                      className="text-red-600 hover:text-red-800 font-semibold"
                    >
                      Admin Panel
                    </Link>
                  )}
                  {user?.user_type === 'farmer' && (
                    <>
                      <Link
                        to="/farmer/dashboard"
                        className="text-gray-700 hover:text-primary-600"
                      >
                        Dashboard
                      </Link>
                      <Link
                        to="/farmer/orders"
                        className="text-gray-700 hover:text-primary-600"
                      >
                        Orders
                      </Link>
                    </>
                  )}
                  {user?.user_type === 'buyer' && (
                    <Link
                      to="/buyer/dashboard"
                      className="text-gray-700 hover:text-primary-600"
                    >
                      Dashboard
                    </Link>
                  )}
                  <Link
                    to="/orders"
                    className="text-gray-700 hover:text-primary-600"
                  >
                    Orders
                  </Link>
                  <Link
                    to="/profile"
                    className="text-gray-700 hover:text-primary-600"
                  >
                    Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="btn btn-outline"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="btn btn-outline">
                    Login
                  </Link>
                  <Link to="/register" className="btn btn-primary">
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-grow">
        <Outlet />
      </main>

      <footer className="bg-gray-800 text-white py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Farmer Market Pool</h3>
              <p className="text-gray-400">
                Connecting farmers with buyers across Kenya and East Africa.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/products">Browse Products</Link></li>
                <li><Link to="/register">Join as Farmer</Link></li>
                <li><Link to="/register">Join as Buyer</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact</h3>
              <p className="text-gray-400">
                Email: support@farmermarketpool.com
                <br />
                Phone: +254 700 000 000
              </p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-700 text-center text-gray-400">
            <p>&copy; 2026 Farmer Market Pool. All rights reserved.</p>
          </div>
        </div>
      </footer>
      {isAuthenticated && <ChatWidget />}
    </div>
  )
}
