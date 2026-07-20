import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Sparkles,
  ChevronDown,
} from 'lucide-react'
import homeMobHero from '../assets/home-mob-hero.jpeg'
import mainBg from '../assets/mainbg.jpeg'

const DEFAULT_SLIDES = [
  {
    id: 'default-1',
    title: 'Timeless Beauty,',
    titleAccent: 'Naturally Yours',
    description:
      'Ayurvedic powders handcrafted in small batches — pure, potent, and free from everything your skin should never meet.',
    ctaPrimary: 'Explore Collection',
    ctaPrimaryLink: '/shop',
    ctaSecondary: 'Our Story',
    ctaSecondaryLink: '/about',
  },
]

function HeroTitleLetters({ text, className, delay = 0 }) {
  return (
    <span className={className} aria-hidden="true">
      {text.split('').map((char, i) => (
        <motion.span
          key={`${text}-${i}`}
          className="inline-block origin-top"
          initial={{ y: -100, opacity: 0, rotateX: -75 }}
          animate={{ y: 0, opacity: 1, rotateX: 0 }}
          transition={{
            delay: delay + i * 0.03,
            type: 'spring',
            stiffness: 120,
            damping: 14,
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </span>
  )
}

function HeroCarousel({ slides = [] }) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const activeSlides = slides.length > 0 ? slides : DEFAULT_SLIDES
  const slide = activeSlides[currentSlide]

  useEffect(() => {
    setCurrentSlide(0)
  }, [slides])

  useEffect(() => {
    if (activeSlides.length <= 1) return undefined
    const id = setInterval(() => {
      setCurrentSlide((p) => (p + 1) % activeSlides.length)
    }, 5500)
    return () => clearInterval(id)
  }, [activeSlides.length])

  return (
    <>
      {/* Mobile-only: full-bleed illustrative hero */}
      <section className="hero-mobile md:hidden relative -mt-1 w-full overflow-hidden">
        <div className="relative w-full min-h-[100svh]">
          <img
            src={homeMobHero}
            alt="Amrutha Bindu — Pure by Nature. Goodness in Every Drop."
            className="absolute inset-0 h-full w-full object-cover object-center"
            fetchPriority="high"
          />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/35 via-black/10 to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 z-10 flex justify-center px-6 pb-[max(9.5rem,calc(env(safe-area-inset-bottom)+8.5rem))] pt-8">
            <Link
              to="/shop"
              className="hero-mobile__cta group inline-flex items-center justify-center gap-2 rounded-full bg-[#2d5f3f] px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-950/30 ring-1 ring-white/25 transition hover:bg-[#234c33] active:scale-[0.98]"
            >
              Explore Products
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Tablet / desktop hero */}
      <section className="hero-premium relative hidden min-h-[min(100vh,920px)] md:flex flex-col overflow-hidden -mt-1">
        <div
          className="hero-premium__bg absolute inset-0"
          style={{ backgroundImage: `url(${mainBg})` }}
        />

        <div className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-8">
          <div className="flex items-center min-h-[calc(100vh-180px)]">
            <div className="text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--home-gold)]/40 bg-white/60 backdrop-blur-md shadow-sm mb-6 sm:mb-8"
              >
                <Sparkles size={14} className="text-[var(--home-gold)]" />
                <span className="text-xs sm:text-sm font-semibold tracking-[0.2em] uppercase text-[var(--home-forest)] font-body-premium">
                  Ayurvedic Luxury
                </span>
              </motion.div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={slide.id || currentSlide}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <h1 className="font-display text-[2.5rem] sm:text-5xl md:text-6xl lg:text-7xl xl:text-[4.75rem] leading-[1.02] text-[var(--home-ink)] mb-1">
                    <HeroTitleLetters text={slide.title || ''} className="block" />
                    <span className="block mt-1 home-shimmer-text">
                      <HeroTitleLetters
                        text={slide.titleAccent || ''}
                        delay={0.25}
                        className="block"
                      />
                    </span>
                  </h1>

                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45, duration: 0.7 }}
                    className="mt-6 text-base sm:text-lg text-stone-600 max-w-lg mx-auto lg:mx-0 leading-relaxed font-body-premium"
                  >
                    {slide.description}
                  </motion.p>
                </motion.div>
              </AnimatePresence>

              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 }}
                className="mt-8 sm:mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
              >
                <Link
                  to={slide.ctaPrimaryLink || '/shop'}
                  className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-[var(--home-forest)] text-white font-semibold overflow-hidden shadow-xl shadow-emerald-900/25 font-body-premium hover:shadow-2xl transition-shadow"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  {slide.ctaPrimary || 'Shop Now'}
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to={slide.ctaSecondaryLink || '/about'}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full border-2 border-[var(--home-forest)]/30 text-[var(--home-forest)] font-semibold bg-white/70 backdrop-blur-sm hover:bg-white hover:border-[var(--home-forest)] transition-all font-body-premium"
                >
                  {slide.ctaSecondary || 'Discover More'}
                </Link>
              </motion.div>

              {activeSlides.length > 1 && (
                <div className="mt-10 flex items-center justify-center lg:justify-start gap-3">
                  {activeSlides.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setCurrentSlide(i)}
                      className={`h-2 rounded-full transition-all duration-500 ${
                        i === currentSlide
                          ? 'w-10 bg-[var(--home-forest)]'
                          : 'w-2 bg-stone-300 hover:bg-[var(--home-gold)]'
                      }`}
                      aria-label={`Slide ${i + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom stats + scroll */}
        <div className="relative z-10 border-t border-white/20 bg-black/20 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-6 sm:gap-10 text-center sm:text-left">
              {[
                { v: '10K+', l: 'Happy families' },
                { v: '100%', l: 'Natural' },
                { v: '4.8★', l: 'Rated' },
              ].map((s) => (
                <div key={s.l}>
                  <div className="font-display text-xl sm:text-2xl text-[var(--home-forest)]">{s.v}</div>
                  <div className="text-xs text-stone-500 font-body-premium tracking-wide">{s.l}</div>
                </div>
              ))}
            </div>
            <motion.a
              href="#home-continue"
              className="flex items-center gap-2 text-sm text-stone-500 hover:text-[var(--home-forest)] font-body-premium"
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              Scroll to explore <ChevronDown size={18} />
            </motion.a>
          </div>
        </div>
      </section>

      <div id="home-continue" className="sr-only" />
    </>
  )
}

export default HeroCarousel
