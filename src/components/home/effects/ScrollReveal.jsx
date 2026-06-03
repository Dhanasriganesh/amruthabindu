import React from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'

export function ScrollReveal({
  children,
  className = '',
  direction = 'up',
  delay = 0,
  distance = 48,
}) {
  const offsets = {
    up: { y: distance },
    down: { y: -distance },
    left: { x: distance },
    right: { x: -distance },
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, ...offsets[direction] }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.85, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

/** Parallax wrapper — children move slower/faster than scroll */
export function ParallaxLayer({ children, className = '', speed = 0.3, offset = ['start end', 'end start'] }) {
  const ref = React.useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset,
  })
  const y = useTransform(scrollYProgress, [0, 1], [speed * -80, speed * 80])

  return (
    <div ref={ref} className={`relative ${className}`}>
      <motion.div style={{ y }}>{children}</motion.div>
    </div>
  )
}

export default ScrollReveal
