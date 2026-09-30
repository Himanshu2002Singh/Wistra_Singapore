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
        title={<>NEWS<br /><em>&amp; STORIES</em></>}
        lead="Ideas, perspectives and people shaping the future of maritime, trade and logistics in Singapore."
        bgImage={newsHeroBg}
        bgPosition="center 30%"
        variant="framed"
      />
      <section className="route-section content-white news-editorial space-y-8">
        <ScrollReveal>
          {news[0] && (
            <article className="news-featured-story">
              <div className="news-featured-image">
                <img src={news[0].image} alt={news[0].title} onClick={() => setActiveLightbox({ src: news[0].image, title: news[0].title, caption: `${news[0].category} — ${news[0].author}` })} />
              </div>
              <div className="news-featured-copy">
                <p className="eyebrow">{news[0].category} <span>·</span> {news[0].date}</p>
                <h2>{news[0].title}</h2>
                <p>{news[0].excerpt}</p>
                <p className="news-byline">By {news[0].author}</p>
              </div>
            </article>
          )}
          <div className="news-secondary-stories">
            {news.slice(1).map((item) => (
              <article key={item.id} className="news-secondary-story">
                <div className="news-secondary-image">
                  <img src={item.image} alt={item.title} loading="lazy" onClick={() => setActiveLightbox({ src: item.image, title: item.title, caption: `${item.category} — ${item.author}` })} />
                </div>
                <div className="news-secondary-copy">
                  <p className="eyebrow">{item.category} <span>·</span> {item.date}</p>
                  <h3>{item.title}</h3>
                  <p>{item.excerpt}</p>
                  <p className="news-byline">By {item.author}</p>
                </div>
              </article>
            ))}
          </div>
        </ScrollReveal>
      </section>
    </PageShell>
  )
}
