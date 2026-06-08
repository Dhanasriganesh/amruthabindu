import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Sparkles,
  Leaf,
  Droplets,
  Wind,
  ChevronDown,
} from 'lucide-react'

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

const RITUAL_CARDS = [
  {
    icon: Droplets,
    label: 'Skin Rituals',
    sub: 'Bath & face powders',
    gradient: 'from-emerald-400/90 via-teal-600/80 to-emerald-900',
    rotate: -8,
    y: 0,
  },
  {
    icon: Wind,
    label: 'Hair Vitality',
    sub: 'Root to tip care',
    gradient: 'from-amber-300/90 via-orange-500/75 to-amber-900',
    rotate: 6,
    y: -24,
  },
  {
    icon: Leaf,
    label: 'Oral Heritage',
    sub: 'Traditional powders',
    gradient: 'from-lime-300/80 via-green-600/75 to-emerald-950',
    rotate: -4,
    y: 12,
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

  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const smoothX = useSpring(mouseX, { stiffness: 60, damping: 20 })
  const smoothY = useSpring(mouseY, { stiffness: 60, damping: 20 })
  const orbX = useTransform(smoothX, [-0.5, 0.5], [-28, 28])
  const orbY = useTransform(smoothY, [-0.5, 0.5], [-20, 20])
  const orb2X = useTransform(smoothX, [-0.5, 0.5], [17, -17])
  const orb2Y = useTransform(smoothY, [-0.5, 0.5], [16, -16])
  const orb3X = useTransform(smoothX, [-0.5, 0.5], [-34, 34])
  const cardRotateY = useTransform(smoothX, [-0.5, 0.5], [-12, 12])
  const cardRotateX = useTransform(smoothY, [-0.5, 0.5], [8, -8])

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

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5)
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5)
  }

  return (
    <section
      className="hero-premium relative min-h-[min(100vh,920px)] flex flex-col overflow-hidden -mt-1"
      onMouseMove={handleMouseMove}
    >
      <div className="hero-premium__bg absolute inset-0" />
      {slide.image && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${slide.image})` }}
          aria-hidden="true"
        />
      )}
      <div className="hero-premium__mesh absolute inset-0" />
      <div className="hero-premium__grid absolute inset-0 opacity-[0.35]" />

      <motion.div
        className="hero-premium__orb hero-premium__orb--1"
        style={{ x: orbX, y: orbY }}
      />
      <motion.div
        className="hero-premium__orb hero-premium__orb--2"
        style={{ x: orb2X, y: orb2Y }}
      />
      <motion.div
        className="hero-premium__orb hero-premium__orb--3"
        style={{ x: orb3X, y: orbY }}
      />

      <div className="hero-premium__ring absolute right-[8%] top-1/2 -translate-y-1/2 hidden lg:block" />

      <div className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-8">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-6 items-center min-h-[calc(100vh-180px)] lg:min-h-0">
          {/* Copy */}
          <div className="order-2 lg:order-1 text-center lg:text-left">
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

          {/* Visual stage — 3D ritual cards */}
          <motion.div
            className="order-1 lg:order-2 relative h-[340px] sm:h-[400px] lg:h-[520px] home-perspective"
            style={{ rotateY: cardRotateY, rotateX: cardRotateX }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              {RITUAL_CARDS.map((card, i) => (
                <motion.div
                  key={card.label}
                  className={`absolute top-1/2 w-[38%] max-w-[190px] aspect-[3/4] rounded-3xl bg-gradient-to-br ${card.gradient} p-5 sm:p-6 shadow-2xl border border-white/20 flex flex-col justify-between overflow-hidden`}
                  style={{
                    left: `${8 + i * 24}%`,
                    rotate: card.rotate,
                    zIndex: i === 1 ? 30 : 20 - i,
                  }}
                  initial={{ opacity: 0, y: '-35%', scale: 0.85 }}
                  animate={{
                    opacity: 1,
                    y: `calc(-50% + ${card.y}px)`,
                    scale: 1,
                  }}
                  transition={{ delay: 0.2 + i * 0.15, type: 'spring', stiffness: 80 }}
                  whileHover={{ scale: 1.05, zIndex: 40 }}
                >
                  <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/15 blur-2xl" />
                  <card.icon className="text-white/90 w-10 h-10 sm:w-12 sm:h-12" strokeWidth={1.25} />
                  <div>
                    <p className="font-display text-xl sm:text-2xl text-white leading-tight">
                      {card.label}
                    </p>
                    <p className="text-white/75 text-xs sm:text-sm mt-1 font-body-premium">
                      {card.sub}
                    </p>
                  </div>
                  <div className="h-1 w-full rounded-full bg-white/30 overflow-hidden">
                    <motion.div
                      className="h-full bg-white/80 rounded-full"
                      animate={{ width: ['20%', '85%', '40%'] }}
                      transition={{ duration: 4 + i, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Center emblem */}
            <motion.div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 sm:w-36 sm:h-36 rounded-full border-2 border-[var(--home-gold)]/50 flex items-center justify-center bg-white/80 backdrop-blur-xl shadow-2xl z-50"
              animate={{ rotate: 360 }}
              transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
            >
              <motion.div
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="text-center"
              >
                <Leaf className="w-10 h-10 text-[var(--home-forest)] mx-auto" />
                <span className="font-display text-[10px] sm:text-xs text-[var(--home-forest)] tracking-widest mt-1 block">
                  PURE
                </span>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Bottom stats + scroll */}
      <div className="relative z-10 border-t border-stone-200/60 bg-white/50 backdrop-blur-md">
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

      <div id="home-continue" className="sr-only" />
    </section>
  )
}

export default HeroCarousel
