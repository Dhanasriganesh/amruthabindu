import React from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, Sparkles } from 'lucide-react'
import { FallingLetters } from '../effects/FallingLetters'
import { ScrollReveal } from '../effects/ScrollReveal'

export function NewsletterSection({ email, onEmailChange, onSubmit, success }) {
  return (
    <section className="relative py-28 md:py-36 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--home-gold)] via-[#d4a574] to-[#a67c3d]" />
      <div className="absolute inset-0 home-grain" />

      <motion.div
        className="absolute -left-20 top-1/2 w-64 h-64 rounded-full bg-white/20 blur-3xl"
        animate={{ x: [0, 40, 0], y: [0, -20, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative max-w-4xl mx-auto px-6 text-center">
        <ScrollReveal>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 text-white text-sm font-body-premium mb-8">
            <Sparkles size={16} /> Exclusive offer
          </div>
        </ScrollReveal>

        <FallingLetters
          text="10% Off Your First Ritual"
          as="h2"
          className="font-display text-4xl sm:text-5xl lg:text-6xl text-white block mb-6"
          stagger={0.04}
        />

        <ScrollReveal delay={0.3}>
          <p className="text-lg text-white/90 font-body-premium mb-10 max-w-xl mx-auto">
            Join our circle for wellness wisdom, early access, and offers crafted for you.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.4}>
          <form onSubmit={onSubmit} className="max-w-lg mx-auto">
            <div className="flex flex-col sm:flex-row gap-3 p-2 rounded-2xl bg-white/15 home-glass">
              <input
                type="email"
                value={email}
                onChange={onEmailChange}
                placeholder="your@email.com"
                required
                className="flex-1 px-5 py-4 rounded-xl bg-white text-[var(--home-ink)] placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[var(--home-forest)] font-body-premium"
              />
              <button
                type="submit"
                className="px-8 py-4 rounded-xl bg-[var(--home-forest-deep)] text-white font-semibold hover:bg-[var(--home-ink)] transition-colors font-body-premium whitespace-nowrap"
              >
                Subscribe
              </button>
            </div>
            {success && (
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 flex items-center justify-center gap-2 text-white font-body-premium"
              >
                <CheckCircle size={18} /> Welcome to the family
              </motion.p>
            )}
          </form>
        </ScrollReveal>
      </div>
    </section>
  )
}

export default NewsletterSection
