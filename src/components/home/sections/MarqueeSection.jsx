import React from 'react'

const ITEMS = [
  '100% Natural',
  'Ayurvedic Heritage',
  'Handcrafted',
  'Chemical-Free',
  'Family Safe',
  'Small Batch',
  'Timeless Rituals',
]

export function MarqueeSection() {
  const line = ITEMS.join('  ·  ')

  return (
    <div className="py-5 bg-[var(--home-ink)] text-[var(--home-gold-light)] overflow-hidden border-y border-[var(--home-gold)]/20">
      <div className="home-marquee-track font-body-premium text-xs sm:text-sm tracking-[0.2em] uppercase whitespace-nowrap">
        <span className="px-8">{line}</span>
        <span className="px-8" aria-hidden="true">
          {line}
        </span>
      </div>
    </div>
  )
}

export default MarqueeSection
