import React from 'react'
import { FallingLetters } from './FallingLetters'
import { ScrollReveal } from './ScrollReveal'

export function SectionHeading({
  label,
  title,
  subtitle,
  align = 'center',
  dark = false,
  fallingTitle = true,
}) {
  const alignClass =
    align === 'center' ? 'text-center mx-auto' : align === 'right' ? 'text-right ml-auto' : 'text-left'

  return (
    <div className={`max-w-3xl mb-14 md:mb-20 ${alignClass}`}>
      {label && (
        <ScrollReveal delay={0}>
          <p className="home-section-label mb-4">{label}</p>
        </ScrollReveal>
      )}
      {fallingTitle ? (
        <FallingLetters
          text={title}
          as="h2"
          className={`font-display text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-medium leading-[1.05] tracking-tight ${
            dark ? 'text-white' : 'text-[var(--home-ink)]'
          }`}
        />
      ) : (
        <h2
          className={`font-display text-4xl sm:text-5xl lg:text-6xl font-medium leading-tight ${
            dark ? 'text-white' : 'text-[var(--home-ink)]'
          }`}
        >
          {title}
        </h2>
      )}
      {subtitle && (
        <ScrollReveal delay={0.2}>
          <p
            className={`mt-5 text-base sm:text-lg leading-relaxed font-body-premium max-w-2xl ${
              align === 'center' ? 'mx-auto' : ''
            } ${dark ? 'text-white/75' : 'text-stone-600'}`}
          >
            {subtitle}
          </p>
        </ScrollReveal>
      )}
    </div>
  )
}

export default SectionHeading
