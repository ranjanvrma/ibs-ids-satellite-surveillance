const variants = {
  success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  warning: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  danger:  'bg-red-500/10   text-red-400   border-red-500/20',
  info:    'bg-blue-500/10  text-blue-400  border-blue-500/20',
  neutral: 'bg-zinc-500/10  text-zinc-400  border-zinc-500/20',
}

export default function StatusBadge({ variant = 'neutral', children }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono-dm uppercase tracking-wider border ${variants[variant]}`}>
      {children}
    </span>
  )
}
