'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../../../context/AuthContext'
import { useRequireAuth } from '../../../../hooks/useRequireAuth'
import { db } from '../../../../lib/firebase'
import { collection, query, where, getDocs, doc, updateDoc, orderBy } from 'firebase/firestore'
import { Star, MessageSquare, ThumbsUp, Flag, CheckCircle, TrendingUp } from 'lucide-react'

const formatDate = (timestamp: any): string => {
  if (!timestamp) return 'Unknown'
  
  if (timestamp?.toDate) {
    return timestamp.toDate().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short', 
      day: 'numeric'
    })
  }
  
  if (timestamp instanceof Date) {
    return timestamp.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }
  
  try {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  } catch {
    return 'Unknown'
  }
}

interface Review {
  id: string
  vendorId: string
  coupleId: string
  coupleName: string
  rating: number
  comment: string
  createdAt: Date
  verifiedBooking: boolean
  helpful: number
  vendorReply?: string
  reported: boolean
}

export default function VendorReviewsPage() {
  const { loading: authLoading } = useRequireAuth('vendor')
  const { user, userProfile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [reviews, setReviews] = useState<Review[]>([])
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [averageRating, setAverageRating] = useState(0)
  const [ratingBreakdown, setRatingBreakdown] = useState({
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0
  })

  useEffect(() => {
    if (!user || !userProfile) return

    const loadReviews = async () => {
      try {
        // Get vendor data
        const vendorsQuery = query(
          collection(db, 'vendors'),
          where('userId', '==', user.uid)
        )
        const vendorsSnapshot = await getDocs(vendorsQuery)
        let vendorId = user.uid
        
        if (!vendorsSnapshot.empty) {
          vendorId = vendorsSnapshot.docs[0].id
        }

        // Load reviews data
        const reviewsQuery = query(
          collection(db, 'reviews'),
          where('vendorId', '==', vendorId),
          orderBy('createdAt', 'desc')
        )
        const reviewsSnapshot = await getDocs(reviewsQuery)
        const reviewsData: Review[] = []
        
        reviewsSnapshot.forEach((doc) => {
          const data = doc.data()
          reviewsData.push({
            id: doc.id,
            vendorId: data.vendorId,
            coupleId: data.coupleId,
            coupleName: data.coupleName || 'Anonymous',
            rating: data.rating,
            comment: data.comment,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
            verifiedBooking: data.verifiedBooking || false,
            helpful: data.helpful || 0,
            vendorReply: data.vendorReply,
            reported: data.reported || false
          })
        })

        setReviews(reviewsData)

        // Calculate average rating
        if (reviewsData.length > 0) {
          const totalRating = reviewsData.reduce((sum, review) => sum + review.rating, 0)
          setAverageRating(totalRating / reviewsData.length)

          // Calculate rating breakdown
          const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
          reviewsData.forEach(review => {
            breakdown[review.rating as keyof typeof breakdown]++
          })
          setRatingBreakdown(breakdown)
        }
      } catch (error) {
        console.error('Error loading reviews:', error)
      } finally {
        setLoading(false)
      }
    }

    loadReviews()
  }, [user, userProfile])

  const handleReply = async (reviewId: string) => {
    if (!replyText.trim()) return

    try {
      const reviewRef = doc(db, 'reviews', reviewId)
      await updateDoc(reviewRef, {
        vendorReply: replyText.trim()
      })

      setReviews(prev => prev.map(review => 
        review.id === reviewId 
          ? { ...review, vendorReply: replyText.trim() }
          : review
      ))

      setReplyText('')
      setReplyingTo(null)
    } catch (error) {
      console.error('Error replying to review:', error)
    }
  }

  const handleMarkHelpful = async (reviewId: string) => {
    try {
      const review = reviews.find(r => r.id === reviewId)
      if (!review) return

      const reviewRef = doc(db, 'reviews', reviewId)
      await updateDoc(reviewRef, {
        helpful: review.helpful + 1
      })

      setReviews(prev => prev.map(r => 
        r.id === reviewId 
          ? { ...r, helpful: r.helpful + 1 }
          : r
      ))
    } catch (error) {
      console.error('Error marking review as helpful:', error)
    }
  }

  const handleReportReview = async (reviewId: string) => {
    try {
      const reviewRef = doc(db, 'reviews', reviewId)
      await updateDoc(reviewRef, {
        reported: true
      })

      setReviews(prev => prev.map(review => 
        review.id === reviewId 
          ? { ...review, reported: true }
          : review
      ))
    } catch (error) {
      console.error('Error reporting review:', error)
    }
  }

  const renderStars = (rating: number, size = 'small') => {
    const starSize = size === 'large' ? 'w-6 h-6' : 'w-4 h-4'
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${starSize} ${
              star <= rating ? 'fill-[#b08850] text-[#b08850]' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    )
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#fdf9f5' }}>
        <div className="w-8 h-8 border-2 border-solid border-transparent border-t-[#b08850] rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!user || !userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#fdf9f5' }}>
        <div className="w-8 h-8 border-2 border-solid border-transparent border-t-[#b08850] rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fdf9f5' }}>
      
      {/* KUNDA NAVBAR */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 32px',
        background: '#ffffff',
        borderBottom: '0.5px solid rgba(180,140,90,0.2)'
      }}>
        {/* Left - Logo */}
        <div 
          className="flex items-center cursor-pointer"
          onClick={() => window.location.href = '/'}
        >
          <div style={{
            width: '8px',
            height: '8px',
            border: '1.5px solid #b08850',
            marginRight: '12px'
          }}></div>
          <span style={{
            fontFamily: 'Cormorant Garamond',
            fontSize: '20px',
            color: '#7a5c30',
            letterSpacing: '0.1em'
          }}>Kunda</span>
        </div>

        {/* Center - Navigation */}
        <div style={{ display: 'flex', gap: '32px' }}>
          <a 
            href="/dashboard/vendor" 
            style={{
              fontFamily: 'Jost',
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              color: '#9a7850',
              textDecoration: 'none'
            }}
          >
            Overview
          </a>
          <a 
            href="/dashboard/vendor/profile" 
            style={{
              fontFamily: 'Jost',
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              color: '#9a7850',
              textDecoration: 'none'
            }}
          >
            Profile
          </a>
          <a 
            href="/dashboard/vendor/bookings" 
            style={{
              fontFamily: 'Jost',
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              color: '#9a7850',
              textDecoration: 'none'
            }}
          >
            Bookings
          </a>
          <a 
            href="/dashboard/vendor/analytics" 
            style={{
              fontFamily: 'Jost',
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              color: '#9a7850',
              textDecoration: 'none'
            }}
          >
            Analytics
          </a>
        </div>

        {/* Right - User Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: '#f0e4d0',
            border: '1px solid #b08850',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <span style={{
              color: '#7a5c30',
              fontSize: '13px',
              fontFamily: 'Jost',
              fontWeight: 500
            }}>
              {userProfile.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <span style={{
            fontFamily: 'Jost',
            fontSize: '13px',
            color: '#7a5c30'
          }}>
            {userProfile.name}
          </span>
          <button
            onClick={() => {
              window.location.href = '/login'
            }}
            style={{
              border: '0.5px solid #b08850',
              color: '#b08850',
              background: 'transparent',
              padding: '6px 14px',
              fontFamily: 'Jost',
              fontSize: '11px',
              textTransform: 'uppercase',
              cursor: 'pointer'
            }}
          >
            Sign Out
          </button>
        </div>
      </nav>

      {/* HERO SECTION */}
      <div style={{ padding: '32px 32px 20px', backgroundColor: '#fdf9f5' }}>
        <div className="text-xs uppercase tracking-wider" style={{ color: '#b08850', fontFamily: 'Jost', fontWeight: 400 }}>
          Reviews & Ratings
        </div>
        <h1 
          className="text-4xl font-light mt-2 mb-3" 
          style={{ fontFamily: 'Cormorant Garamond', color: '#3a2a1a', fontWeight: 300 }}
        >
          Customer Feedback
        </h1>
        <p className="text-sm" style={{ fontFamily: 'Jost', color: '#9a7850' }}>
          Monitor and respond to customer reviews
        </p>
      </div>

      {/* RATING OVERVIEW */}
      <div className="grid grid-cols-3 gap-6 px-8 mb-8">
        {/* Average Rating */}
        <div 
          style={{
            backgroundColor: '#ffffff',
            border: '0.5px solid rgba(180,140,90,0.2)',
            padding: '24px',
            textAlign: 'center'
          }}
        >
          <div className="flex justify-center mb-3">
            {renderStars(Math.round(averageRating), 'large')}
          </div>
          <div className="text-3xl font-light mb-2" style={{ 
            fontFamily: 'Cormorant Garamond', 
            color: '#3a2a1a',
            fontWeight: 300,
            fontSize: '32px'
          }}>
            {averageRating.toFixed(1)}
          </div>
          <div className="text-sm" style={{ fontFamily: 'Jost', color: '#9a7850' }}>
            {reviews.length} {reviews.length === 1 ? 'Review' : 'Reviews'}
          </div>
        </div>

        {/* Rating Breakdown */}
        <div 
          style={{
            backgroundColor: '#ffffff',
            border: '0.5px solid rgba(180,140,90,0.2)',
            padding: '24px'
          }}
        >
          <h3 className="text-lg font-medium mb-4" style={{ fontFamily: 'Jost', color: '#3a2a1a' }}>
            Rating Breakdown
          </h3>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => (
              <div key={rating} className="flex items-center">
                <div className="flex items-center mr-3" style={{ width: '60px' }}>
                  <span className="text-sm" style={{ fontFamily: 'Jost', color: '#3a2a1a' }}>
                    {rating}
                  </span>
                  <Star className="w-3 h-3 ml-1 fill-[#b08850] text-[#b08850]" />
                </div>
                <div className="flex-1 mx-3">
                  <div className="h-2" style={{ background: '#f0e4d0' }}>
                    <div 
                      className="h-full"
                      style={{ 
                        width: `${reviews.length > 0 ? (ratingBreakdown[rating as keyof typeof ratingBreakdown] / reviews.length) * 100 : 0}%`, 
                        background: '#b08850' 
                      }}
                    ></div>
                  </div>
                </div>
                <div className="text-sm" style={{ fontFamily: 'Jost', color: '#9a7850', width: '30px', textAlign: 'right' }}>
                  {ratingBreakdown[rating as keyof typeof ratingBreakdown]}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div 
          style={{
            backgroundColor: '#ffffff',
            border: '0.5px solid rgba(180,140,90,0.2)',
            padding: '24px'
          }}
        >
          <h3 className="text-lg font-medium mb-4" style={{ fontFamily: 'Jost', color: '#3a2a1a' }}>
            Quick Stats
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm" style={{ fontFamily: 'Jost', color: '#9a7850' }}>
                Verified Bookings
              </span>
              <span className="text-sm font-medium" style={{ fontFamily: 'Jost', color: '#3a2a1a' }}>
                {reviews.filter(r => r.verifiedBooking).length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm" style={{ fontFamily: 'Jost', color: '#9a7850' }}>
                Avg Response Time
              </span>
              <span className="text-sm font-medium" style={{ fontFamily: 'Jost', color: '#3a2a1a' }}>
                2 days
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm" style={{ fontFamily: 'Jost', color: '#9a7850' }}>
                Response Rate
              </span>
              <span className="text-sm font-medium" style={{ fontFamily: 'Jost', color: '#3a2a1a' }}>
                85%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* REVIEWS LIST */}
      <div className="px-8 pb-8">
        <div 
          style={{
            backgroundColor: '#ffffff',
            border: '0.5px solid rgba(180,140,90,0.2)',
            padding: '24px'
          }}
        >
          <h3 className="text-lg font-medium mb-6" style={{ fontFamily: 'Jost', color: '#3a2a1a' }}>
            All Reviews
          </h3>

          {reviews.length > 0 ? (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div 
                  key={review.id}
                  style={{
                    borderBottom: '0.5px solid rgba(180,140,90,0.15)',
                    paddingBottom: '24px'
                  }}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium" style={{ fontFamily: 'Jost', color: '#3a2a1a' }}>
                          {review.coupleName}
                        </h4>
                        {review.verifiedBooking && (
                          <div 
                            className="flex items-center text-xs px-2 py-1"
                            style={{
                              fontFamily: 'Jost',
                              background: '#e8f5e0',
                              color: '#3b6d11',
                              border: '0.5px solid #c0dd97'
                            }}
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Verified Booking
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mb-2">
                        {renderStars(review.rating)}
                        <span className="text-xs" style={{ fontFamily: 'Jost', color: '#b4a090' }}>
                          {formatDate(review.createdAt)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleMarkHelpful(review.id)}
                        className="flex items-center text-xs px-2 py-1"
                        style={{
                          fontFamily: 'Jost',
                          background: '#f0e4d0',
                          color: '#7a5c30',
                          border: '0.5px solid rgba(180,140,90,0.3)',
                          cursor: 'pointer'
                        }}
                      >
                        <ThumbsUp className="w-3 h-3 mr-1" />
                        Helpful ({review.helpful})
                      </button>
                      <button
                        onClick={() => handleReportReview(review.id)}
                        disabled={review.reported}
                        className="flex items-center text-xs px-2 py-1"
                        style={{
                          fontFamily: 'Jost',
                          background: review.reported ? '#f0efef' : '#fef2f2',
                          color: review.reported ? '#5f5e5a' : '#dc2626',
                          border: review.reported ? '0.5px solid #d1d5db' : '0.5px solid #fecaca',
                          cursor: review.reported ? 'not-allowed' : 'pointer'
                        }}
                      >
                        <Flag className="w-3 h-3 mr-1" />
                        {review.reported ? 'Reported' : 'Report'}
                      </button>
                    </div>
                  </div>

                  <p className="text-sm mb-4" style={{ fontFamily: 'Jost', color: '#3a2a1a', lineHeight: '1.6' }}>
                    {review.comment}
                  </p>

                  {review.vendorReply && (
                    <div 
                      className="p-3 mb-4"
                      style={{
                        background: '#f8fafc',
                        border: '0.5px solid rgba(180,140,90,0.15)'
                      }}
                    >
                      <div className="text-xs font-medium mb-1" style={{ fontFamily: 'Jost', color: '#7a5c30' }}>
                        Your Reply
                      </div>
                      <p className="text-sm" style={{ fontFamily: 'Jost', color: '#3a2a1a' }}>
                        {review.vendorReply}
                      </p>
                    </div>
                  )}

                  {!review.vendorReply && (
                    <div>
                      {replyingTo === review.id ? (
                        <div className="space-y-3">
                          <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Write your reply..."
                            className="w-full"
                            style={{
                              border: '0.5px solid rgba(180,140,90,0.3)',
                              background: '#fdf9f5',
                              padding: '10px 14px',
                              fontFamily: 'Jost',
                              fontSize: '13px',
                              color: '#3a2a1a',
                              resize: 'vertical',
                              minHeight: '80px'
                            }}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleReply(review.id)}
                              disabled={!replyText.trim()}
                              className="text-xs px-4 py-2"
                              style={{
                                fontFamily: 'Jost',
                                background: replyText.trim() ? '#7a5c30' : '#f0e4d0',
                                color: replyText.trim() ? '#fdf9f5' : '#9a7850',
                                border: '0.5px solid #b08850',
                                cursor: replyText.trim() ? 'pointer' : 'not-allowed'
                              }}
                            >
                              Send Reply
                            </button>
                            <button
                              onClick={() => {
                                setReplyingTo(null)
                                setReplyText('')
                              }}
                              className="text-xs px-4 py-2"
                              style={{
                                fontFamily: 'Jost',
                                background: 'transparent',
                                color: '#7a5c30',
                                border: '0.5px solid #b08850',
                                cursor: 'pointer'
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setReplyingTo(review.id)}
                          className="text-xs px-4 py-2"
                          style={{
                            fontFamily: 'Jost',
                            background: 'transparent',
                            color: '#7a5c30',
                            border: '0.5px solid #b08850',
                            cursor: 'pointer'
                          }}
                        >
                          Reply to Review
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <MessageSquare size={48} style={{ color: '#b4a090' }} className="mx-auto mb-4" />
              <h3 
                className="text-xl font-light mb-3" 
                style={{ 
                  fontFamily: 'Cormorant Garamond', 
                  color: '#9a7850', 
                  fontWeight: 300,
                  fontSize: '20px'
                }}
              >
                No reviews yet
              </h3>
              <p style={{ fontFamily: 'Jost', color: '#b4a090', fontSize: '13px' }}>
                When couples leave reviews, they'll appear here
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
