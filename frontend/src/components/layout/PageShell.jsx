import React from 'react'
import Header from './Header'
import Footer from './Footer'

export default function PageShell({ children, currentPage = 'GLOBAL NETWORK' }) {
  return (
    <main>
      <Header currentPage={currentPage} />
      {children}
      <Footer />
    </main>
  )
}
