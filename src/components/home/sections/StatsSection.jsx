import React, { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { Users, Award, TrendingUp, Clock } from 'lucide-react'
import { FallingLetters } from '../effects/FallingLetters'

const STATS = [
  { icon: Users, value: 10000, suffix: '+', label: 'Happy Customers' },
  { icon: Award, value: 100, suffix: '%', label: 'Natural Products' },
  { icon: TrendingUp, value: 4.8, suffix: '/5', label: 'Customer Rating', decimal: true },
  { icon: Clock, value: 24, suffix: '/7', label: 'Support' },
]

function AnimatedStat({ stat, index }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (!inView) return
    const end = stat.value
    const duration = 1400
    const start = performance.now()
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1)
      const eased = 1 - (1 - p) ** 3
      setDisplay(stat.decimal ? Math.round(end * eased * 10) / 10 : Math.floor(end * eased))
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [inView, stat.value, stat.decimal])

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.1, duration: 0.6 }}
      className="text-center group"
    >
      <div className="inline-flex w-16 h-16 rounded-2xl bg-[var(--home-cream)] border border-stone-200 items-center justify-center text-[var(--home-forest)] mb-5 group-hover:scale-110 transition-transform">
        <stat.icon size={28} strokeWidth={1.5} />
      </div>
      <div className="font-display text-4xl md:text-5xl text-[var(--home-ink)] mb-2">
        {display}
        {stat.suffix}
      </div>
      <p className="text-stone-600 text-sm font-body-premium tracking-wide">{stat.label}</p>
    </motion.div>
  )
}

export function StatsSection() {
  return (
    <section className="py-24 md:py-28 bg-white border-t border-stone-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <FallingLetters
            text="Trusted Nationwide"
            as="h2"
            className="font-display text-4xl md:text-5xl text-[var(--home-ink)]"
          />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-12">
          {STATS.map((stat, idx) => (
            <AnimatedStat key={stat.label} stat={stat} index={idx} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default StatsSection
