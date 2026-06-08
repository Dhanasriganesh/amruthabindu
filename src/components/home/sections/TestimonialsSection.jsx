import React, { useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Star, Quote, ChevronLeft, ChevronRight } from 'lucide-react'
import { SectionHeading } from '../effects/SectionHeading'
import { ScrollReveal } from '../effects/ScrollReveal'
import { DEFAULT_HOME_CONTENT } from '../../../utils/homeContent'

const FALLBACK_TESTIMONIALS = [
  {
    name: 'Priya',
    location: 'Hyderabad, Telangana',
    avatar: 'P',
    customerImage: '/reviews/r1.jpg',
    rating: 5,
    comment:
      'The Sunnipindi transformed my skin! Completely natural and so effective. I have recommended it to all my friends.',
  },
  {
    name: 'Rajesh Kumar',
    location: 'Tirupati, Andhra Pradesh',
    avatar: 'RK',
    customerImage: '/reviews/r2.jpg',
    rating: 5,
    comment:
      'Anti Hairfall powder is a game-changer. Natural ingredients, visible results — my hair feels stronger than ever.',
  },
  {
    name: 'Sunita Reddy',
    location: 'Bangalore, Karnataka',
    avatar: 'SR',
    customerImage: '/reviews/r4.jpg',
    rating: 5,
    comment:
      'Authentic quality and traditional recipes. Chemical-free and safe for my entire family. Highly recommended!',
  },
  {
    name: 'Ramya',
    location: 'Hyderabad, Telangana',
    avatar: 'R',
    customerImage: '/reviews/r3.jpg',
    rating: 5,
    comment: 'A ritual I look forward to every morning. Pure, luxurious, and trustworthy.',
  },
]

function TestimonialCard({ testimonial, index }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ delay: index * 0.08, duration: 0.5 }}
      className="reviews-card snap-center flex-shrink-0 w-[min(92vw,400px)] md:w-[420px] home-glass rounded-3xl p-6 md:p-8 text-white flex flex-col"
    >
      <Quote className="text-[var(--home-gold)] mb-4 opacity-80 flex-shrink-0" size={32} />
      <p className="text-white/90 text-base leading-relaxed font-body-premium mb-6 flex-grow">
        {testimonial.comment}
      </p>
      <div className="relative rounded-2xl overflow-hidden aspect-[4/3] mb-6 flex-shrink-0 bg-white/10">
        <img
          src={testimonial.customerImage}
          alt={`${testimonial.name} review`}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.style.display = 'none'
          }}
        />
        <div className="absolute top-3 right-3 flex gap-0.5 bg-black/50 rounded-full px-2 py-1">
          {[...Array(testimonial.rating)].map((_, i) => (
            <Star key={i} size={12} className="text-[var(--home-gold)] fill-current" />
          ))}
        </div>
      </div>
      <div className="flex items-center gap-4 flex-shrink-0">
        <div className="w-12 h-12 rounded-full bg-[var(--home-gold)] flex items-center justify-center font-display text-lg text-[var(--home-forest-deep)]">
          {testimonial.avatar}
        </div>
        <div>
          <p className="font-display text-xl">{testimonial.name}</p>
          <p className="text-sm text-white/60 font-body-premium">{testimonial.location}</p>
        </div>
      </div>
    </motion.article>
  )
}

export function TestimonialsSection({
  heading = DEFAULT_HOME_CONTENT.testimonialsHeading,
  testimonials = DEFAULT_HOME_CONTENT.testimonials,
}) {
  const items = testimonials?.length ? testimonials : FALLBACK_TESTIMONIALS
  const trackRef = useRef(null)

  const scrollByCard = useCallback((direction) => {
    const el = trackRef.current
    if (!el) return
    const card = el.querySelector('.reviews-card')
    const gap = 24
    const step = (card?.offsetWidth || 400) + gap
    el.scrollBy({ left: direction * step, behavior: 'smooth' })
  }, [])

  /** Convert vertical wheel to horizontal scroll only while pointer is over the track */
  const handleWheel = useCallback((e) => {
    const el = trackRef.current
    if (!el || Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return

    const atStart = el.scrollLeft <= 0
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 2
    const scrollingDown = e.deltaY > 0
    const scrollingUp = e.deltaY < 0

    if ((scrollingDown && !atEnd) || (scrollingUp && !atStart)) {
      e.preventDefault()
      el.scrollLeft += e.deltaY
    }
  }, [])

  return (
    <section className="relative bg-[var(--home-forest-deep)] overflow-hidden pb-20 md:pb-28">
      <div className="absolute inset-0 home-grain opacity-50 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[var(--home-gold)]/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative pt-24 md:pt-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <SectionHeading
          label={heading.label}
          title={heading.title}
          subtitle={heading.subtitle}
          dark
        />
      </div>

      <div className="relative mt-4 md:mt-8">
        {/* Edge fades */}
        <div
          className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 md:w-24 z-10 bg-gradient-to-r from-[var(--home-forest-deep)] to-transparent"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 md:w-24 z-10 bg-gradient-to-l from-[var(--home-forest-deep)] to-transparent"
          aria-hidden
        />

        {/* Desktop arrows */}
        <button
          type="button"
          onClick={() => scrollByCard(-1)}
          className="hidden md:flex absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full home-glass items-center justify-center text-white hover:bg-white/20 transition-colors"
          aria-label="Previous review"
        >
          <ChevronLeft size={24} />
        </button>
        <button
          type="button"
          onClick={() => scrollByCard(1)}
          className="hidden md:flex absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full home-glass items-center justify-center text-white hover:bg-white/20 transition-colors"
          aria-label="Next review"
        >
          <ChevronRight size={24} />
        </button>

        <div
          ref={trackRef}
          onWheel={handleWheel}
          className="reviews-track flex gap-6 md:gap-8 overflow-x-auto overflow-y-visible home-horizontal-scroll snap-x snap-mandatory px-6 md:px-16 lg:px-24 py-4 md:py-8 scroll-pl-6 md:scroll-pl-16"
          role="region"
          aria-label="Customer reviews carousel"
        >
          {items.map((t, idx) => (
            <TestimonialCard key={`${t.name}-${idx}`} testimonial={t} index={idx} />
          ))}
        </div>

        <ScrollReveal>
          <p className="text-center text-white/50 text-xs sm:text-sm mt-6 font-body-premium tracking-wide">
            ← Swipe or use arrows · Scroll down when you reach the end →
          </p>
        </ScrollReveal>
      </div>
    </section>
  )
}

export default TestimonialsSection
