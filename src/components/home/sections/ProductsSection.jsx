import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Star, Heart, ShoppingCart, Leaf } from 'lucide-react'
import { SectionHeading } from '../effects/SectionHeading'
import { ScrollReveal } from '../effects/ScrollReveal'
import { DEFAULT_HOME_CONTENT } from '../../../utils/homeContent'

export function ProductsSection({
  heading = DEFAULT_HOME_CONTENT.productsHeading,
  products,
  selectedSizes,
  favorites,
  onSizeSelect,
  onAddToCart,
  onToggleFavorite,
}) {
  return (
    <section className="py-24 md:py-32 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-14 md:mb-20">
          <SectionHeading
            label={heading.label}
            title={heading.title}
            subtitle={heading.subtitle}
            align="left"
            fallingTitle
          />
          <ScrollReveal>
            <Link
              to="/shop"
              className="hidden lg:inline-flex items-center gap-3 px-8 py-4 rounded-full border-2 border-[var(--home-forest)] text-[var(--home-forest)] font-semibold hover:bg-[var(--home-forest)] hover:text-white transition-all duration-300 font-body-premium"
            >
              View all <ArrowRight size={20} />
            </Link>
          </ScrollReveal>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 md:gap-8">
          {products.slice(0, 4).map((product, idx) => {
            const selectedSize = selectedSizes[product.id] || product.sizes?.[0]?.size
            const sizeObj = product.sizes?.find((s) => s.size === selectedSize) || product.sizes?.[0]

            return (
              <ScrollReveal key={product.id} delay={idx * 0.08}>
                <motion.article
                  whileHover={{ y: -8 }}
                  className="home-card-lift group bg-[var(--home-cream)] rounded-3xl overflow-hidden border border-stone-200/60"
                >
                  <Link to={`/shop/product/${product.id}`} className="block relative aspect-square overflow-hidden">
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-stone-100 text-stone-400">
                        <Leaf size={40} />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        onToggleFavorite(product.id)
                      }}
                      className={`absolute top-3 right-3 w-10 h-10 rounded-full home-glass flex items-center justify-center transition-transform hover:scale-110 ${
                        favorites.includes(product.id) ? 'text-red-400' : 'text-white'
                      }`}
                    >
                      <Heart size={18} className={favorites.includes(product.id) ? 'fill-current' : ''} />
                    </button>
                  </Link>

                  <div className="p-5 md:p-6">
                    <Link to={`/shop/product/${product.id}`}>
                      <h3 className="font-display text-lg md:text-xl text-[var(--home-ink)] line-clamp-1 group-hover:text-[var(--home-forest)] transition-colors">
                        {product.name}
                      </h3>
                    </Link>
                    <div className="flex items-center gap-1.5 mt-2 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={12}
                          className={i < Math.floor(product.rating || 0) ? 'text-[var(--home-gold)] fill-current' : 'text-stone-300'}
                        />
                      ))}
                      <span className="text-xs text-stone-500 font-body-premium">({product.reviews || 0})</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <span className="font-display text-2xl text-[var(--home-forest)]">₹{sizeObj?.price || 0}</span>
                      <select
                        value={selectedSize}
                        onChange={(e) => onSizeSelect(product.id, e.target.value)}
                        className="text-xs border border-stone-300 rounded-lg px-2 py-1.5 bg-white font-body-premium focus:ring-2 focus:ring-[var(--home-forest)]"
                      >
                        {product.sizes?.map((size) => (
                          <option key={size.size} value={size.size}>
                            {size.size}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => onAddToCart(product)}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[var(--home-forest)] text-white text-sm font-semibold hover:bg-[var(--home-forest-deep)] transition-colors font-body-premium"
                    >
                      <ShoppingCart size={16} /> Add to cart
                    </button>
                  </div>
                </motion.article>
              </ScrollReveal>
            )
          })}
        </div>

        <div className="text-center mt-12 lg:hidden">
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[var(--home-forest)] text-white font-semibold font-body-premium"
          >
            View all products <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  )
}

export default ProductsSection
