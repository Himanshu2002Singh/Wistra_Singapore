export default function ImageBreak({ src, alt, children }) {
  return (
    <div className="image-break">
      <img src={src} alt={alt} loading="lazy" />
      {children && <div className="image-overlay">{children}</div>}
    </div>
  )
}
