import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import PageShell from '@/components/layout/PageShell'
import PageIntro from '@/components/editorial/PageIntro'
import ScrollReveal from '@/components/ui/ScrollReveal'
import { getPublishedNewsArticleApi } from '@/services/publicContentService'
import { resolveNewsImageUrl } from '@/services/adminContentService'
import newsHeroBg from '../assets/images/wista/client-provided/wista-news-hero-community.jpg'

const publishedDate = (value) => value
  ? new Intl.DateTimeFormat('en-SG', { dateStyle: 'long', timeZone: 'Asia/Singapore' }).format(new Date(value))
  : ''

export default function NewsArticle() {
  const { id } = useParams()
  const [state, setState] = useState({ id: null, article: null, error: '', notFound: false })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    getPublishedNewsArticleApi(id).then((response) => {
      if (!active) return
      const article = response?.data?.article || null
      setState({ id, article, error: '', notFound: !article })
    }).catch((error) => {
      if (!active) return
      const notFound = error.response?.status === 404
      setState({ id, article: null, error: notFound ? '' : 'This story is temporarily unavailable. Please try again.', notFound })
    })
    return () => { active = false }
  }, [id, attempt])

  const loading = state.id !== id
  const article = loading ? null : state.article
  return (
    <PageShell currentPage="NEWS & STORIES">
      {article ? <>
        <PageIntro
          eyebrow={`${article.category || 'NEWS'} — ${publishedDate(article.published_at)}`}
          title={<>{article.title}</>}
          lead={article.excerpt}
          bgImage={resolveNewsImageUrl(article.image_url) || newsHeroBg}
          bgPosition="center 30%"
          variant="framed"
        />
        <ScrollReveal>
          <article className="news-article-body section-pad">
            <p className="news-byline">By {article.author}</p>
            <div className="news-article-content">
              {(article.content || '').split(/\r?\n/).map((paragraph, index) => paragraph.trim()
                ? <p key={index}>{paragraph}</p>
                : <br key={index} />)}
            </div>
            <Link className="news-read-link" to="/news">← Back to News &amp; Stories</Link>
          </article>
        </ScrollReveal>
      </> : <section className="section-pad" aria-live="polite">
        {loading && <p role="status">Loading story…</p>}
        {!loading && state.error && <div role="alert"><p>{state.error}</p><button type="button" onClick={() => setAttempt((value) => value + 1)}>Try again</button></div>}
        {!loading && state.notFound && <div role="status"><h1>Story not found</h1><p>This story is unavailable or is no longer published.</p></div>}
        {!loading && <Link className="news-read-link" to="/news">← Back to News &amp; Stories</Link>}
      </section>}
    </PageShell>
  )
}
