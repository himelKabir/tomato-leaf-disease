import { useState } from 'react'
import { Leaf } from 'lucide-react'

/** The example photo from public/library/<slug>.jpg, or a plain leaf drawing until that photo is added. */
export default function LeafPhoto({ disease, className = '' }) {
  const [failed, setFailed] = useState(!disease.slug)

  if (failed) {
    return (
      <div
        className={`grid place-items-center bg-linear-to-br from-emerald-100 to-lime-50 text-emerald-600/60 dark:from-emerald-950 dark:to-stone-900 dark:text-emerald-700 ${className}`}
      >
        <Leaf className="size-1/4" strokeWidth={1.25} />
      </div>
    )
  }
  return (
    <img
      src={`/library/${disease.slug}.jpg`}
      alt={`${disease.name}: example leaf`}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`object-cover ${className}`}
    />
  )
}
