import React from 'react'

export default function PageIntro({ eyebrow, title, lead, bgImage, bgPosition = 'center' }) {
  return (
    <section className="page-intro section-pad relative overflow-hidden bg-[#0b1f33] text-white">
      {bgImage && (
        <>
          <div 
            className="absolute inset-0 bg-cover scale-105 pointer-events-none transition-all duration-700"
            style={{ backgroundImage: `url(${bgImage})`, backgroundPosition: bgPosition }}
          />
          {/* Subtle gradient overlays for text legibility while preserving full original image color */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0b1f33]/92 via-[#0b1f33]/65 to-[#0b1f33]/20 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b1f33] via-transparent to-[#0b1f33]/45 pointer-events-none" />
        </>
      )}
      <div className="relative z-10">
        <p className="eyebrow text-[#ff856f]">
          <i />{eyebrow}
        </p>
        <h1 className="text-white drop-shadow-md">{title}</h1>
        <p className="page-lead text-[#e1ebed] drop-shadow">{lead}</p>
      </div>
    </section>
  )
}


