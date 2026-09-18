import React from 'react'

export default function EditorialImage({ src, alt, className = '', onClick, caption }) {
  return (
    <figure 
      className={`editorial-image ${className} ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
      data-cursor={onClick ? 'VIEW' : undefined}
    >
      <img src={src} alt={alt} loading="lazy" />
      <span className="image-rule" />
    </figure>
  )
}
