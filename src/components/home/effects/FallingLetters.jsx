import React from 'react'
import { motion } from 'framer-motion'

/**
 * Premium "letters falling" headline — each character drops in with spring physics.
 */
export function FallingLetters({
  text,
  className = '',
  delay = 0,
  as: Tag = 'h2',
  stagger = 0.035,
}) {
  const chars = text.split('')

  return (
    <Tag className={className} aria-label={text}>
      {chars.map((char, i) => (
        <motion.span
          key={`${char}-${i}`}
          className="inline-block origin-top"
          initial={{ y: -120, opacity: 0, rotateX: -90, filter: 'blur(8px)' }}
          whileInView={{
            y: 0,
            opacity: 1,
            rotateX: 0,
            filter: 'blur(0px)',
          }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{
            delay: delay + i * stagger,
            type: 'spring',
            stiffness: 140,
            damping: 16,
            mass: 0.8,
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </Tag>
  )
}

export default FallingLetters
