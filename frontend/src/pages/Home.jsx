import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold mb-6">
            Connect Farmers with Buyers
          </h1>
          <p className="text-xl mb-8 text-primary-100">
            A unified digital marketplace for agricultural produce in Kenya and East Africa
          </p>
          <div className="space-x-4">
            <Link to="/register" className="btn bg-white text-primary-600 hover:bg-gray-100">
              Get Started
            </Link>
            <Link to="/products" className="btn btn-outline border-white text-white hover:bg-white/10">
              Browse Products
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why Farmer Market Pool?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card text-center">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="text-xl font-semibold mb-2">Fair Pricing</h3>
              <p className="text-gray-600">
                Transparent, market-driven prices with protection against exploitation
              </p>
            </div>
            <div className="card text-center">
              <div className="text-4xl mb-4">🚚</div>
              <h3 className="text-xl font-semibold mb-2">Easy Logistics</h3>
              <p className="text-gray-600">
                Collection points and delivery partners to streamline distribution
              </p>
            </div>
            <div className="card text-center">
              <div className="text-4xl mb-4">💳</div>
              <h3 className="text-xl font-semibold mb-2">Secure Payments</h3>
              <p className="text-gray-600">
                M-Pesa integration with escrow system for safe transactions
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-gray-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-primary-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="font-semibold mb-2">Register</h3>
              <p className="text-gray-600 text-sm">
                Sign up as a farmer or buyer
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="font-semibold mb-2">List/Browse</h3>
              <p className="text-gray-600 text-sm">
                Farmers list produce, buyers browse
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="font-semibold mb-2">Order & Pay</h3>
              <p className="text-gray-600 text-sm">
                Place orders and pay via M-Pesa
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                4
              </div>
              <h3 className="font-semibold mb-2">Delivery</h3>
              <p className="text-gray-600 text-sm">
                Receive products, confirm delivery
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
