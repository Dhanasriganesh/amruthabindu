import React, { useEffect, useState, useCallback } from 'react'
import { useCart } from '../../contexts/CartContext'
import { fetchProducts } from '../../services/products'
import { fetchHeroSlides, HERO_SLIDES_UPDATED_EVENT } from '../../services/heroSlides'
import { loadHomeContent } from '../../services/cms'
import {
  DEFAULT_HOME_CONTENT,
  HOME_CONTENT_UPDATED_EVENT,
  mergeHomeContent,
  readHomeContentCache,
} from '../../utils/homeContent'
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
  const [homeContent, setHomeContent] = useState(DEFAULT_HOME_CONTENT)

  const refreshHomeContent = useCallback(async () => {
    const cached = readHomeContentCache()
    if (cached) setHomeContent(cached)
    try {
      const content = await loadHomeContent()
      if (content) setHomeContent(mergeHomeContent(content))
    } catch (error) {
      console.error('Failed to load home content:', error)
    }
  }, [])

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
    refreshHomeContent()
    const onUpdated = () => refreshHomeContent()
    window.addEventListener(HOME_CONTENT_UPDATED_EVENT, onUpdated)
    return () => window.removeEventListener(HOME_CONTENT_UPDATED_EVENT, onUpdated)
  }, [refreshHomeContent])

  const refreshHeroSlides = useCallback(async () => {
    const slides = await fetchHeroSlides()
    setHeroSlides(slides)
  }, [])

  useEffect(() => {
    refreshHeroSlides()
    const onUpdated = () => refreshHeroSlides()
    const onFocus = () => refreshHeroSlides()
    window.addEventListener(HERO_SLIDES_UPDATED_EVENT, onUpdated)
    window.addEventListener('focus', onFocus)
    return () => {
      window.removeEventListener(HERO_SLIDES_UPDATED_EVENT, onUpdated)
      window.removeEventListener('focus', onFocus)
    }
  }, [refreshHeroSlides])

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
      <ManifestoSection content={homeContent.manifesto} />
      <FeaturesSection
        heading={homeContent.featuresHeading}
        features={homeContent.features}
      />
      <CategoriesSection categories={homeContent.categories} />
      <ProductsSection
        heading={homeContent.productsHeading}
        products={featuredProducts}
        selectedSizes={selectedSizes}
        favorites={favorites}
        onSizeSelect={handleSizeSelect}
        onAddToCart={handleAddToCart}
        onToggleFavorite={toggleFavorite}
      />
      <TestimonialsSection
        heading={homeContent.testimonialsHeading}
        testimonials={homeContent.testimonials}
      />
      <NewsletterSection
        content={homeContent.newsletter}
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
