import React from 'react'
import { motion } from 'framer-motion'
import { Leaf, Shield, Award, CheckCircle } from 'lucide-react'
import { SectionHeading } from '../effects/SectionHeading'
import { ScrollReveal } from '../effects/ScrollReveal'
import { DEFAULT_HOME_CONTENT } from '../../../utils/homeContent'

const FEATURE_ICONS = [Leaf, Shield, Award, CheckCircle]
const FEATURE_ACCENTS = [
  'from-emerald-500/20 to-emerald-900/5',
  'from-sky-500/15 to-sky-900/5',
  'from-amber-500/20 to-amber-900/5',
  'from-violet-500/15 to-violet-900/5',
]

const FALLBACK_FEATURES = [
  {
    icon: Leaf,
    title: '100% Natural',
    description: 'Pure botanicals, zero synthetics — gentle enough for daily ritual.',
    accent: 'from-emerald-500/20 to-emerald-900/5',
  },
  {
    icon: Shield,
    title: 'Family Safe',
    description: 'Thoughtfully blended for every age and skin type in your home.',
    accent: 'from-sky-500/15 to-sky-900/5',
  },
  {
    icon: Award,
    title: 'Ancient Recipes',
    description: 'Formulas inherited from generations of traditional healers.',
    accent: 'from-amber-500/20 to-amber-900/5',
  },
  {
    icon: CheckCircle,
    title: 'Small Batches',
    description: 'Handcrafted in limited runs for uncompromising freshness.',
    accent: 'from-violet-500/15 to-violet-900/5',
  },
]

export function FeaturesSection({
  heading = DEFAULT_HOME_CONTENT.featuresHeading,
  features = DEFAULT_HOME_CONTENT.features,
}) {
  const items = (features?.length ? features : FALLBACK_FEATURES).slice(0, 4)

  return (
    <section className="relative py-24 md:py-32 bg-white overflow-hidden">
      <div className="absolute top-0 right-0 w-[480px] h-[480px] rounded-full bg-[var(--home-gold)]/5 blur-3xl -translate-y-1/2 translate-x-1/3" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <SectionHeading
          label={heading.label}
          title={heading.title}
          subtitle={heading.subtitle}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {items.map((feature, idx) => {
            const Icon = FEATURE_ICONS[idx] || Leaf
            const accent = FEATURE_ACCENTS[idx] || FEATURE_ACCENTS[0]
            return (
            <ScrollReveal key={`${feature.title}-${idx}`} delay={idx * 0.1}>
              <motion.article
                whileHover={{ y: -6 }}
                className={`home-card-lift relative rounded-3xl p-8 bg-gradient-to-br ${accent} border border-stone-200/80 overflow-hidden group`}
              >
                <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/40 blur-2xl group-hover:scale-150 transition-transform duration-700" />
                <div className="relative w-14 h-14 rounded-2xl bg-[var(--home-forest)] text-white flex items-center justify-center mb-6 shadow-lg">
                  <Icon size={28} strokeWidth={1.5} />
                </div>
                <h3 className="font-display text-2xl text-[var(--home-ink)] mb-3">{feature.title}</h3>
                <p className="text-stone-600 text-sm leading-relaxed font-body-premium">{feature.description}</p>
                <span className="absolute bottom-6 right-6 font-display text-6xl text-stone-900/5 font-bold">
                  {String(idx + 1).padStart(2, '0')}
                </span>
              </motion.article>
            </ScrollReveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default FeaturesSection
