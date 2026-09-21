import React, { useState } from 'react'
import PageShell from '@/components/layout/PageShell'
import PageIntro from '@/components/editorial/PageIntro'
import Lightbox from '@/components/ui/Lightbox'
import ScrollReveal from '@/components/ui/ScrollReveal'
import { news } from '@/data/news'

// Exclusive Curated Hero Background Image for News
import newsHeroBg from '../assets/images/wista/hero/news-hero-bg.jpg'

export default function News() {
  const [activeLightbox, setActiveLightbox] = useState(null)

  return (
    <PageShell currentPage="NEWS & STORIES">
      {activeLightbox && (
        <Lightbox 
          src={activeLightbox.src} 
          alt={activeLightbox.title} 
          caption={activeLightbox.caption} 
          onClose={() => setActiveLightbox(null)} 
        />
      )}
      <PageIntro 
        eyebrow="04 — NEWS & STORIES" 
        title={<>Stories from<br />the <em>industry.</em></>} 
        lead="Ideas, perspectives and people shaping the future of maritime, trade and logistics in Singapore."
        bgImage={newsHeroBg}
        bgPosition="center 30%"
      />
      <section className="route-section content-white space-y-8">
        <ScrollReveal>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {news.map((item) => (
              <article key={item.id} className="group bg-[#f5f3ee] border border-[#0b1f33]/10 rounded-sm overflow-hidden flex flex-col hover:border-[#1b9aaa] transition-colors">
                <div className="aspect-[16/9] overflow-hidden bg-[#0b1f33]/10">
                  <img 
                    src={item.image} 
                    alt={item.title} 
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer"
                    onClick={() => setActiveLightbox({ src: item.image, title: item.title, caption: `${item.category} — ${item.author}` })}
                  />
                </div>
                <div className="p-5 flex flex-col justify-between flex-1 space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-bold tracking-wider text-[#1b9aaa] uppercase mb-1">
                      <span>{item.category}</span>
                      <span>{item.date}</span>
                    </div>
                    <h3 className="text-lg font-bold font-display text-[#0b1f33] leading-snug">{item.title}</h3>
                    <p className="text-xs text-[#163d5a]/80 mt-2 leading-relaxed">{item.excerpt}</p>
                  </div>
                  <p className="text-[11px] font-semibold text-[#0b1f33]/60 border-t border-[#0b1f33]/10 pt-3">
                    By {item.author}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </ScrollReveal>
      </section>
    </PageShell>
  )
}



