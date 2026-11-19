const STYLES = {
  Bacterium: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300',
  Fungus: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300',
  'Water mould': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300',
  Pest: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
  Virus: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
  Healthy: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  Unknown: 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300',
}

/** A small coloured label for the kind of problem: fungus, virus, pest... */
export default function TypeChip({ type }) {
  return (
    <span className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${STYLES[type] ?? STYLES.Unknown}`}>
      {type}
    </span>
  )
}
