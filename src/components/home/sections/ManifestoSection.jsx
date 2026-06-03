import React from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { FallingLetters } from '../effects/FallingLetters'
import { ScrollReveal } from '../effects/ScrollReveal'

/** Full-width manifesto with falling letters + scroll-linked background shift */
export function ManifestoSection() {
  const ref = React.useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '25%'])
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.4, 1, 0.4])

  return (
    <section
      ref={ref}
      className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-[var(--home-forest-deep)] text-white home-grain"
    >
      <motion.div
        className="absolute inset-0 opacity-30"
        style={{
          y: bgY,
          backgroundImage:
            'radial-gradient(ellipse 80% 60% at 50% 120%, rgba(201, 162, 39, 0.35), transparent 70%)',
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-6 sm:px-10 py-24 md:py-32 text-center">
        <ScrollReveal>
          <p className="home-section-label text-[var(--home-gold-light)] mb-8">Our Philosophy</p>
        </ScrollReveal>

        <motion.div style={{ opacity }}>
          <FallingLetters
            text="Rooted in Ritual."
            as="p"
            className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-white block mb-2"
            stagger={0.05}
          />
          <FallingLetters
            text="Crafted by Hand."
            as="p"
            className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl home-shimmer-text block"
            delay={0.35}
            stagger={0.05}
          />
        </motion.div>

        <ScrollReveal delay={0.5}>
          <p className="mt-10 text-lg sm:text-xl text-white/70 font-body-premium max-w-2xl mx-auto leading-relaxed">
            Every powder tells a story of soil, sun, and generations of Ayurvedic wisdom — bottled without compromise.
          </p>
        </ScrollReveal>

        <motion.div
          className="mt-16 flex justify-center gap-3"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-2 h-2 rounded-full bg-[var(--home-gold)]"
              animate={{ y: [0, -10, 0], opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </motion.div>
      </div>
    </section>
  )
}

export default ManifestoSection
