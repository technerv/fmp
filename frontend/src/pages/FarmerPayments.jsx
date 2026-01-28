import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'
import { useAuthStore } from '../stores/authStore'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'

export default function FarmerPayments() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [showPayoutModal, setShowPayoutModal] = useState(false)
  const [payoutAmount, setPayoutAmount] = useState('')
  const [payoutMethod, setPayoutMethod] = useState('mpesa')
  const [accountDetails, setAccountDetails] = useState('')

  // 1. Fetch Wallet Balance
  const { data: wallet, isLoading: walletLoading } = useQuery({
    queryKey: ['wallet'],
    queryFn: async () => {
      const response = await api.get('/payments/wallet/')
      return response.data.results?.[0] || response.data[0] || response.data
    }
  })

  // 2. Fetch Transactions (using the wallet ID from above, or separate endpoint if available)
  // Since we might not have wallet ID immediately, we can use dependent query or fetch from wallet details if nested.
  // Actually, WalletViewSet has 'transactions' action on detail. But we need wallet ID.
  // Let's assume /payments/wallet/ returns list, we take first.
  const walletId = wallet?.id

  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['wallet-transactions', walletId],
    queryFn: async () => {
      if (!walletId) return []
      const response = await api.get(`/payments/wallet/${walletId}/transactions/`)
      return response.data.results || response.data
    },
    enabled: !!walletId
  })

  // 3. Fetch Payouts
  const { data: payouts, isLoading: payoutsLoading } = useQuery({
    queryKey: ['payouts'],
    queryFn: async () => {
      const response = await api.get('/payments/payouts/')
      return response.data.results || response.data
    }
  })

  // Payout Mutation
  const payoutMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/payments/payouts/', data)
      return response.data
    },
    onSuccess: () => {
      toast.success('Payout request submitted successfully')
      setShowPayoutModal(false)
      setPayoutAmount('')
      setAccountDetails('')
      queryClient.invalidateQueries(['wallet'])
      queryClient.invalidateQueries(['wallet-transactions'])
      queryClient.invalidateQueries(['payouts'])
    },
    onError: (error) => {
      toast.error(error.response?.data?.amount?.[0] || error.response?.data?.error || 'Failed to request payout')
    }
  })

  const handlePayoutSubmit = (e) => {
    e.preventDefault()
    if (!payoutAmount || !accountDetails) {
        toast.error('Please fill in all fields')
        return
    }
    if (parseFloat(payoutAmount) > parseFloat(wallet?.balance || 0)) {
        toast.error('Insufficient balance')
        return
    }
    
    payoutMutation.mutate({
        amount: parseFloat(payoutAmount),
        method: payoutMethod,
        account_details: accountDetails
    })
  }

  if (walletLoading) return <div className="text-center py-12">Loading...</div>

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex justify-between items-center">
        <div>
            <Link to="/farmer/dashboard" className="text-primary hover:underline mb-2 block">&larr; Back to Dashboard</Link>
            <h1 className="text-3xl font-bold">Payments & Earnings</h1>
        </div>
        <button 
            onClick={() => setShowPayoutModal(true)}
            className="btn btn-primary"
        >
            Request Payout
        </button>
      </div>

      {/* Wallet Card */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-xl p-8 text-white shadow-lg mb-8">
        <p className="text-primary-100 mb-1">Total Balance</p>
        <h2 className="text-4xl font-bold mb-4">KES {parseFloat(wallet?.balance || 0).toLocaleString()}</h2>
        <div className="flex gap-4 text-sm">
            <div className="bg-white/20 px-4 py-2 rounded-lg backdrop-blur-sm">
                <p className="text-primary-100 text-xs">Pending Payouts</p>
                <p className="font-semibold">
                    KES {payouts?.filter(p => p.status === 'pending').reduce((sum, p) => sum + parseFloat(p.amount), 0).toLocaleString() || '0'}
                </p>
            </div>
            <div className="bg-white/20 px-4 py-2 rounded-lg backdrop-blur-sm">
                <p className="text-primary-100 text-xs">Total Withdrawn</p>
                <p className="font-semibold">
                    KES {payouts?.filter(p => p.status === 'processed').reduce((sum, p) => sum + parseFloat(p.amount), 0).toLocaleString() || '0'}
                </p>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Transactions History */}
        <div>
            <h2 className="text-xl font-bold mb-4">Transaction History</h2>
            <div className="bg-white rounded-lg shadow overflow-hidden">
                {transactionsLoading ? (
                    <div className="p-4 text-center">Loading transactions...</div>
                ) : transactions?.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">No transactions yet</div>
                ) : (
                    <div className="divide-y">
                        {transactions?.map((txn) => (
                            <div key={txn.id} className="p-4 hover:bg-gray-50 flex justify-between items-center">
                                <div>
                                    <p className="font-medium capitalize">{txn.description || txn.transaction_type}</p>
                                    <p className="text-xs text-gray-500">{new Date(txn.created_at).toLocaleDateString()}</p>
                                </div>
                                <span className={`font-bold ${txn.transaction_type === 'deposit' || txn.transaction_type === 'escrow_release' ? 'text-green-600' : 'text-red-600'}`}>
                                    {txn.transaction_type === 'deposit' || txn.transaction_type === 'escrow_release' ? '+' : '-'} KES {txn.amount}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>

        {/* Payout Requests */}
        <div>
            <h2 className="text-xl font-bold mb-4">Payout Requests</h2>
            <div className="bg-white rounded-lg shadow overflow-hidden">
                {payoutsLoading ? (
                    <div className="p-4 text-center">Loading payouts...</div>
                ) : payouts?.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">No payout requests</div>
                ) : (
                    <div className="divide-y">
                        {payouts?.map((payout) => (
                            <div key={payout.id} className="p-4 hover:bg-gray-50 flex justify-between items-center">
                                <div>
                                    <p className="font-medium">Withdrawal via {payout.method === 'mpesa' ? 'M-Pesa' : 'Bank'}</p>
                                    <p className="text-xs text-gray-500">{new Date(payout.created_at || Date.now()).toLocaleDateString()}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold">KES {payout.amount}</p>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                                        payout.status === 'processed' ? 'bg-green-100 text-green-800' :
                                        payout.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                        'bg-yellow-100 text-yellow-800'
                                    }`}>
                                        {payout.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* Payout Modal */}
      {showPayoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-md w-full">
                <h2 className="text-xl font-bold mb-4">Request Payout</h2>
                <form onSubmit={handlePayoutSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Amount (KES)</label>
                        <input 
                            type="number" 
                            value={payoutAmount}
                            onChange={(e) => setPayoutAmount(e.target.value)}
                            className="input"
                            max={wallet?.balance}
                            min="1"
                            required
                        />
                        <p className="text-xs text-gray-500 mt-1">Available: KES {wallet?.balance}</p>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
                        <select 
                            value={payoutMethod}
                            onChange={(e) => setPayoutMethod(e.target.value)}
                            className="input"
                        >
                            <option value="mpesa">M-Pesa</option>
                            <option value="bank">Bank Transfer</option>
                        </select>
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {payoutMethod === 'mpesa' ? 'Phone Number' : 'Bank Account Details'}
                        </label>
                        <input 
                            type="text" 
                            value={accountDetails}
                            onChange={(e) => setAccountDetails(e.target.value)}
                            className="input"
                            placeholder={payoutMethod === 'mpesa' ? '2547...' : 'Bank Name, Account Number'}
                            required
                        />
                    </div>

                    <div className="flex justify-end space-x-3">
                        <button 
                            type="button" 
                            onClick={() => setShowPayoutModal(false)}
                            className="btn btn-outline"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            className="btn btn-primary"
                            disabled={payoutMutation.isLoading}
                        >
                            {payoutMutation.isLoading ? 'Submitting...' : 'Submit Request'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  )
}
