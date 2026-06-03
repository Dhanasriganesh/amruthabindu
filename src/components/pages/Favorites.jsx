import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, X } from 'lucide-react'
import { fetchProducts } from '../../services/products'
import { useFavorites } from '../../contexts/FavoritesContext'

function Favorites() {
  const { favoriteIds, removeFavorite, loading } = useFavorites()
  const [favorites, setFavorites] = useState([])
  const [productsLoading, setProductsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setProductsLoading(true)
      const all = await fetchProducts({})
      if (!cancelled) {
        setFavorites(all.filter((p) => favoriteIds.includes(p.id)))
        setProductsLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [favoriteIds])

  if (loading || productsLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600 mx-auto"></div>
            <p className="mt-3 text-sm text-gray-600">Loading favorites...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Favorites</h1>
            <p className="text-sm text-gray-600 mt-1">
              {favorites.length > 0
                ? `${favorites.length} item${favorites.length !== 1 ? 's' : ''}`
                : 'No items saved'}
            </p>
          </div>
        </div>

        {favorites.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <Heart className="mx-auto text-gray-300 mb-4" size={48} />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">No favorites yet</h2>
            <p className="text-gray-600 mb-6">Save products you love by clicking the heart icon</p>
            <Link
              to="/shop"
              className="inline-block bg-emerald-800 text-white px-6 py-2 rounded-lg hover:bg-emerald-700"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((product) => (
              <div key={product.id} className="bg-white rounded-lg shadow overflow-hidden">
                <Link to={`/product/${product.id}`}>
                  <img
                    src={product.images?.[0] || '/placeholder.jpg'}
                    alt={product.name}
                    className="w-full h-48 object-cover"
                  />
                </Link>
                <div className="p-4">
                  <Link to={`/product/${product.id}`}>
                    <h3 className="font-semibold text-gray-900 hover:text-emerald-800">{product.name}</h3>
                  </Link>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{product.description}</p>
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-lg font-bold text-emerald-800">
                      ₹{product.sizes?.[0]?.price || '—'}
                    </span>
                    <button
                      onClick={() => removeFavorite(product.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-full"
                      aria-label="Remove from favorites"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Favorites
