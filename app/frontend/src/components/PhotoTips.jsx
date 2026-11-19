import { Leaf, Square, Sun } from 'lucide-react'

const TIPS = [
  { icon: Leaf, title: 'One leaf', text: 'Lay a single leaf flat and let it fill most of the photo.' },
  { icon: Square, title: 'Plain background', text: 'Paper, a table or a wall, not other plants or soil.' },
  { icon: Sun, title: 'Good light', text: 'Daylight without strong shadows; hold the camera still.' },
]

/** How to take a photo the model can read well (it learned from single leaves on a plain background). */
export default function PhotoTips() {
  return (
    <ul className="grid gap-3 sm:grid-cols-3">
      {TIPS.map(({ icon: Icon, title, text }) => (
        <li key={title} className="card flex gap-3 p-4 sm:flex-col sm:gap-2">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-stone-100 text-emerald-700 dark:bg-stone-800 dark:text-emerald-400">
            <Icon size={18} />
          </span>
          <div>
            <p className="text-sm font-semibold">{title}</p>
            <p className="text-sm text-stone-600 dark:text-stone-400">{text}</p>
          </div>
        </li>
      ))}
    </ul>
  )
}
