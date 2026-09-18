import React, { useEffect, useState, useRef } from 'react'

export default function CustomCursor() {
  const [position, setPosition] = useState({ x: -100, y: -100 })
  const [ringPos, setRingPos] = useState({ x: -100, y: -100 })
  const [isHovered, setIsHovered] = useState(false)
  const [viewModeText, setViewModeText] = useState('')
  const [isVisible, setIsVisible] = useState(false)
  const animFrame = useRef(null)

  useEffect(() => {
    // Only enable custom cursor on fine pointer devices (desktop mouse)
    if (!window.matchMedia('(pointer: fine)').matches) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    document.body.classList.add('has-custom-cursor')
    setIsVisible(true)

    const handleMouseMove = (e) => {
      const { clientX, clientY, target } = e
      setPosition({ x: clientX, y: clientY })

      // Check hover states
      const interactive = target.closest('a, button, input, textarea, select, .principle, .workflow-step, .editorial-image')
      if (interactive) {
        setIsHovered(true)
        const mode = interactive.getAttribute('data-cursor')
        setViewModeText(mode || '')
      } else {
        setIsHovered(false)
        setViewModeText('')
      }
    }

    const handleMouseLeave = () => {
      setIsVisible(false)
    }

    const handleMouseEnter = () => {
      setIsVisible(true)
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    document.addEventListener('mouseleave', handleMouseLeave)
    document.addEventListener('mouseenter', handleMouseEnter)

    return () => {
      document.body.classList.remove('has-custom-cursor')
      window.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseleave', handleMouseLeave)
      document.removeEventListener('mouseenter', handleMouseEnter)
      if (animFrame.current) cancelAnimationFrame(animFrame.current)
    }
  }, [])

  // Lerp smooth follow for the ring
  useEffect(() => {
    if (!isVisible) return

    const follow = () => {
      setRingPos((prev) => {
        const dx = position.x - prev.x
        const dy = position.y - prev.y
        return {
          x: prev.x + dx * 0.18,
          y: prev.y + dy * 0.18,
        }
      })
      animFrame.current = requestAnimationFrame(follow)
    }

    animFrame.current = requestAnimationFrame(follow)
    return () => {
      if (animFrame.current) cancelAnimationFrame(animFrame.current)
    }
  }, [position, isVisible])

  if (!isVisible) return null

  return (
    <>
      <div 
        className="custom-cursor-dot" 
        style={{ left: `${position.x}px`, top: `${position.y}px` }} 
      />
      <div 
        className={`custom-cursor-ring ${isHovered ? 'hovered' : ''} ${viewModeText ? 'view-mode' : ''}`} 
        style={{ left: `${ringPos.x}px`, top: `${ringPos.y}px` }}
      >
        {viewModeText}
      </div>
    </>
  )
}
