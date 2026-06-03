import React, { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'

/**
 * Scroll-driven horizontal track — vertical scroll pushes cards sideways.
 */
export function HorizontalScrollSection({ children, className = '' }) {
  const targetRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ['start start', 'end end'],
  })
  const x = useTransform(scrollYProgress, [0, 1], ['2%', '-65%'])

  return (
    <section ref={targetRef} className={`relative ${className} h-[160vh] md:h-[200vh]`}>
      <div className="sticky top-0 h-screen flex items-center overflow-hidden">
        <motion.div className="flex gap-6 md:gap-8 px-6 md:px-12 will-change-transform" style={{ x }}>
          {children}
        </motion.div>
      </div>
    </section>
  )
}

export default HorizontalScrollSection
