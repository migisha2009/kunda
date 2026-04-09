'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Send, MessageCircle } from 'lucide-react'

const enquirySchema = z.object({
  message: z.string().min(10, 'Message must be at least 10 characters').max(1000, 'Message must be less than 1000 characters')
})

type EnquiryFormData = z.infer<typeof enquirySchema>

interface EnquiryModalProps {
  vendorName: string
  onClose: () => void
  onSubmit: (message: string) => void
}

export default function EnquiryModal({ vendorName, onClose, onSubmit }: EnquiryModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset
  } = useForm<EnquiryFormData>({
    resolver: zodResolver(enquirySchema)
  })

  const message = watch('message')

  const onFormSubmit = async (data: EnquiryFormData) => {
    setLoading(true)
    setError('')

    try {
      await onSubmit(data.message)
      reset()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send enquiry')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <MessageCircle className="w-5 h-5 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">
              Send Enquiry to {vendorName}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onFormSubmit)} className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Message *
            </label>
            <textarea
              {...register('message')}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={`Hi ${vendorName}, I'm interested in your services for my wedding. Could you please provide more information about...`}
              maxLength={1000}
            />
            {errors.message && (
              <p className="mt-1 text-sm text-red-600">{errors.message.message}</p>
            )}
            <p className="mt-1 text-sm text-gray-500 text-right">
              {message?.length || 0}/1000 characters
            </p>
          </div>

          {/* Tips */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Tips for a good enquiry:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Mention your wedding date and location</li>
              <li>• Describe what services you're interested in</li>
              <li>• Ask about availability and pricing</li>
              <li>• Include any specific questions you have</li>
            </ul>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Enquiry
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
