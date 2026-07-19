import React from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight, ChevronDown } from 'lucide-react'
import homeMobHero from '../assets/home-mob-hero.jpeg'
import mainbg from '../assets/mainbg.jpeg'

function HeroCarousel() {
  return (
    <>
      {/* Mobile-only: full-bleed illustrative hero (unchanged) */}
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

      {/* Tablet / desktop: full-bleed image hero */}
      <section className="hero-full hidden md:block relative -mt-1 w-full overflow-hidden">
        <div className="relative w-full min-h-[min(100vh,920px)]">
          <img
            src={mainbg}
            alt="Amrutha Bindu — Pure by Nature. Goodness in Every Drop."
            className="absolute inset-0 h-full w-full object-cover object-center"
            fetchPriority="high"
          />

          {/* Gradient overlay for readability */}
          <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black/40 via-black/10 to-transparent pointer-events-none" />

          {/* CTA */}
          <div className="absolute inset-x-0 bottom-0 z-10 flex justify-center px-6 pb-16 pt-8">
            <Link
              to="/shop"
              className="hero-full__cta group inline-flex items-center justify-center gap-2 rounded-full bg-[#2d5f3f] px-8 py-3.5 text-sm sm:text-base font-semibold text-white shadow-lg shadow-emerald-950/30 ring-1 ring-white/25 transition hover:bg-[#234c33] active:scale-[0.98]"
            >
              Explore Products
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {/* Scroll indicator */}
          <motion.a
            href="#home-continue"
            className="hidden md:flex absolute bottom-6 right-8 z-10 items-center gap-2 text-sm text-white/80 hover:text-white font-body-premium"
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Scroll to explore <ChevronDown size={18} />
          </motion.a>
        </div>
      </section>

      <div id="home-continue" className="sr-only" />
    </>
  )
}

export default HeroCarousel