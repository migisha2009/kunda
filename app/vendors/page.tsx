import { getAllVendors } from '../../lib/firestore'
import { Vendor } from '../../types'
import VendorCard from './VendorCard'
import VendorFilters from './VendorFilters'

interface VendorsPageProps {
  searchParams: {
    category?: string
    location?: string
  }
}

export default async function VendorsPage({ searchParams }: VendorsPageProps) {
  const vendors = await getAllVendors()

  // Filter vendors based on search params
  const filteredVendors = vendors.filter(vendor => {
    if (searchParams.category && vendor.category !== searchParams.category) {
      return false
    }
    if (searchParams.location && !vendor.location.toLowerCase().includes(searchParams.location.toLowerCase())) {
      return false
    }
    return true
  })

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-cream)' }}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Find Wedding Vendors</h1>
          <p className="text-gray-600">Discover the best wedding professionals for your special day</p>
        </div>

        {/* Filters */}
        <VendorFilters currentCategory={searchParams.category} currentLocation={searchParams.location} />

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            {filteredVendors.length} vendor{filteredVendors.length !== 1 ? 's' : ''} found
          </p>
        </div>

        {/* Vendor Grid */}
        {filteredVendors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredVendors.map((vendor) => (
              <VendorCard key={vendor.id} vendor={vendor} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No vendors found</h3>
            <p className="text-gray-600">Try adjusting your filters to see more results</p>
          </div>
        )}
      </div>
    </div>
  )
}
