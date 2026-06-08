import React from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import { SectionHeading } from '../effects/SectionHeading'
import { ScrollReveal } from '../effects/ScrollReveal'
import { buildHomeCategories, DEFAULT_HOME_CONTENT } from '../../../utils/homeContent'

export function CategoriesSection({ categories = DEFAULT_HOME_CONTENT.categories }) {
  const CATEGORIES = buildHomeCategories({ categories })
  const ref = React.useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.92, 1, 0.96])

  return (
    <section ref={ref} className="py-24 md:py-32 bg-[var(--home-cream)] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          label="Collections"
          title="Shop by Category"
          subtitle="Curated paths into natural wellness"
        />

        <motion.div style={{ scale }} className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6 home-perspective max-w-4xl mx-auto">
          {CATEGORIES.map((cat, idx) => (
            <ScrollReveal key={cat.name} delay={idx * 0.12} className={cat.span}>
              <Link to={cat.href} className="group block h-full">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                  className={`relative overflow-hidden rounded-3xl shadow-xl h-full min-h-[280px] ${cat.span}`}
                >
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--home-forest-deep)] via-[var(--home-forest-deep)]/40 to-transparent" />
                  <div className="absolute inset-0 p-8 flex flex-col justify-end">
                    <span className="home-section-label text-[var(--home-gold-light)] mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      Explore
                    </span>
                    <h3 className="font-display text-3xl md:text-4xl text-white mb-2">{cat.name}</h3>
                    <p className="text-white/80 text-sm font-body-premium mb-4">{cat.desc}</p>
                    <span className="inline-flex items-center gap-2 text-[var(--home-gold-light)] font-semibold text-sm group-hover:gap-3 transition-all">
                      View collection <ArrowUpRight size={18} />
                    </span>
                  </div>
                </motion.div>
              </Link>
            </ScrollReveal>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

export default CategoriesSection
