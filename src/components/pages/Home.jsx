import React, { useEffect, useState } from 'react'
import { useCart } from '../../contexts/CartContext'
import { fetchProducts } from '../../services/products'
import { fetchHeroSlides } from '../../services/heroSlides'
import HeroCarousel from '../HeroCarousel'
import { MarqueeSection } from '../home/sections/MarqueeSection'
import { ManifestoSection } from '../home/sections/ManifestoSection'
import { FeaturesSection } from '../home/sections/FeaturesSection'
import { CategoriesSection } from '../home/sections/CategoriesSection'
import { ProductsSection } from '../home/sections/ProductsSection'
import { TestimonialsSection } from '../home/sections/TestimonialsSection'
import { NewsletterSection } from '../home/sections/NewsletterSection'
import { StatsSection } from '../home/sections/StatsSection'

function Home() {
  const { addToCart } = useCart()
  const [selectedSizes, setSelectedSizes] = useState({})
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('favorites') || '[]')
    } catch {
      return []
    }
  })
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [newsletterSuccess, setNewsletterSuccess] = useState(false)
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [heroSlides, setHeroSlides] = useState([])

  useEffect(() => {
    let cancelled = false
    async function load() {
      const list = await fetchProducts({})
      const top = [...list]
        .filter((p) => p.type !== 'bundle')
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 8)
      if (!cancelled) setFeaturedProducts(top)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function loadSlides() {
      const slides = await fetchHeroSlides()
      if (!cancelled) setHeroSlides(slides)
    }
    loadSlides()
    return () => {
      cancelled = true
    }
  }, [])

  const handleAddToCart = (product) => {
    const selectedSize = selectedSizes[product.id] || product.sizes[0].size
    const sizeObj = product.sizes.find((size) => size.size === selectedSize)
    addToCart(product, sizeObj, 1)
  }

  const handleSizeSelect = (productId, size) => {
    setSelectedSizes((prev) => ({ ...prev, [productId]: size }))
  }

  const toggleFavorite = (productId) => {
    setFavorites((prev) => {
      const exists = prev.includes(productId)
      const next = exists ? prev.filter((id) => id !== productId) : [...prev, productId]
      localStorage.setItem('favorites', JSON.stringify(next))
      return next
    })
  }

  const handleNewsletterSubmit = (e) => {
    e.preventDefault()
    if (newsletterEmail.trim()) {
      setNewsletterSuccess(true)
      setNewsletterEmail('')
      setTimeout(() => setNewsletterSuccess(false), 3000)
    }
  }

  return (
    <div className="home-page min-h-screen">
      <HeroCarousel slides={heroSlides} />
      <MarqueeSection />
      <ManifestoSection />
      <FeaturesSection />
      <CategoriesSection />
      <ProductsSection
        products={featuredProducts}
        selectedSizes={selectedSizes}
        favorites={favorites}
        onSizeSelect={handleSizeSelect}
        onAddToCart={handleAddToCart}
        onToggleFavorite={toggleFavorite}
      />
      <TestimonialsSection />
      <NewsletterSection
        email={newsletterEmail}
        onEmailChange={(e) => setNewsletterEmail(e.target.value)}
        onSubmit={handleNewsletterSubmit}
        success={newsletterSuccess}
      />
      <StatsSection />
    </div>
  )
}

export default Home
