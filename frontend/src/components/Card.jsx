export default function Card({ children, className = '' }) {
  return (
    <div className={`glass rounded-xl p-5 ${className}`}>
      {children}
    </div>
  )
}
