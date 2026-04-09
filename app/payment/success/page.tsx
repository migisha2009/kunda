'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle, Loader2, Home } from 'lucide-react'

export default function PaymentSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [verifying, setVerifying] = useState(true)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const status = searchParams.get('status')
    const txRef = searchParams.get('tx_ref')
    
    if (status === 'successful') {
      // Payment was successful
      setSuccess(true)
      setVerifying(false)
    } else if (status === 'cancelled') {
      // Payment was cancelled
      setError('Payment was cancelled')
      setVerifying(false)
    } else {
      // Unknown status or payment failed
      setError('Payment verification failed')
      setVerifying(false)
    }
  }, [searchParams])

  const handleGoHome = () => {
    router.push('/dashboard/couple')
  }

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-cream)' }}>
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Verifying Payment...</h2>
          <p className="text-gray-600">Please wait while we confirm your payment</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-cream)' }}>
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          {success ? (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
              <p className="text-gray-600 mb-6">
                Your payment has been processed successfully. The vendor will be notified and your booking is confirmed.
              </p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment {error.includes('cancelled') ? 'Cancelled' : 'Failed'}</h1>
              <p className="text-gray-600 mb-6">
                {error}
              </p>
            </>
          )}
          
          <div className="space-y-3">
            <button
              onClick={handleGoHome}
              className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Home className="w-4 h-4 mr-2" />
              Go to Dashboard
            </button>
            
            {success && (
              <button
                onClick={() => window.print()}
                className="w-full px-4 py-2 text-gray-700 bg-gray-100 font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                Print Receipt
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
