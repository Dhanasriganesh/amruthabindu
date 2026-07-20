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
  const words = text.split(' ')
  let charIndex = 0

  return (
    <Tag className={`${className} flex flex-wrap justify-center gap-x-[0.35em]`} aria-label={text}>
      {words.map((word, wordIndex) => (
        <span key={`${word}-${wordIndex}`} className="inline-flex whitespace-nowrap">
          {word.split('').map((char) => {
            const index = charIndex
            charIndex += 1
            return (
              <motion.span
                key={`${char}-${index}`}
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
                  delay: delay + index * stagger,
                  type: 'spring',
                  stiffness: 140,
                  damping: 16,
                  mass: 0.8,
                }}
              >
                {char}
              </motion.span>
            )
          })}
        </span>
      ))}
    </Tag>
  )
}

export default FallingLetters
