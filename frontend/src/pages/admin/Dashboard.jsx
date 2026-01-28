import { useQuery } from '@tanstack/react-query'
import api from '../../services/api'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'
import { FaUsers, FaCartShopping, FaLeaf, FaClipboardCheck } from 'react-icons/fa6'

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const response = await api.get('/farmers/admin/stats/')
      return response.data
    },
  })

  if (isLoading) return <div className="p-8 text-center">Loading dashboard data...</div>

  // Prepare data for charts
  const userTypeData = [
    { name: 'Farmers', value: stats?.users?.farmers || 0 },
    { name: 'Buyers', value: stats?.users?.buyers || 0 },
  ]

  const orderStatusData = stats?.orders?.by_status?.map(item => ({
    name: item.status.charAt(0).toUpperCase() + item.status.slice(1),
    value: item.count
  })) || []

  const productCategoryData = stats?.products?.by_category?.map(item => ({
    name: item.category__name,
    count: item.count
  })) || []

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-2">Dashboard Overview</h1>
        <p className="text-gray-600">Welcome to the Super Admin control panel.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6 flex items-center space-x-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-full text-xl">
            <FaUsers />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Users</p>
            <p className="text-2xl font-bold">{stats?.users?.total}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 flex items-center space-x-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-full text-xl">
            <FaLeaf />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Products</p>
            <p className="text-2xl font-bold">{stats?.products?.total}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 flex items-center space-x-4">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-full text-xl">
            <FaCartShopping />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Revenue</p>
            <p className="text-2xl font-bold">KES {stats?.orders?.revenue?.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 flex items-center space-x-4">
          <div className="p-3 bg-yellow-100 text-yellow-600 rounded-full text-xl">
            <FaClipboardCheck />
          </div>
          <div>
            <p className="text-sm text-gray-500">Pending Verifications</p>
            <p className="text-2xl font-bold">{stats?.verifications?.pending}</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Product Categories Bar Chart */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-lg font-bold mb-4">Products by Category</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productCategoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#82ca9d" name="Products" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* User Distribution Pie Chart */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-lg font-bold mb-4">User Distribution</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={userTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {userTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

       {/* Recent Orders Status Bar Chart */}
       <div className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-lg font-bold mb-4">Orders by Status</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={orderStatusData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100}/>
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8" name="Orders" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
    </div>
  )
}
