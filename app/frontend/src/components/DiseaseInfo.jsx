import { Eye, FlaskConical, ShieldCheck, Sprout, Wind } from 'lucide-react'
import { TREATMENT_NOTE } from '../data/diseases.js'

function InfoCard({ icon: Icon, title, items, note, children }) {
  if (items && items.length === 0) return null
  return (
    <section className="card p-5">
      <h3 className="flex items-center gap-2.5 font-semibold">
        <span className="grid size-8 place-items-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
          <Icon size={17} />
        </span>
        {title}
      </h3>
      {children && <p className="mt-3 text-sm leading-relaxed text-stone-700 dark:text-stone-300">{children}</p>}
      {items && (
        <ul className="mt-3 space-y-2 text-sm leading-relaxed text-stone-700 dark:text-stone-300">
          {items.map((item) => (
            <li key={item} className="flex gap-2.5">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-emerald-500" />
              {item}
            </li>
          ))}
        </ul>
      )}
      {note && (
        <p className="mt-3 rounded-xl bg-stone-100 px-3 py-2 text-xs leading-relaxed text-stone-600 dark:bg-stone-800 dark:text-stone-400">
          {note}
        </p>
      )}
    </section>
  )
}

/** Symptoms, treatment and prevention for one disease. */
export default function DiseaseInfo({ disease }) {
  return (
    <div className="space-y-4">
      <InfoCard icon={Eye} title="Symptoms" items={disease.symptoms} />
      <InfoCard icon={FlaskConical} title="Treatment" items={disease.treatment} note={TREATMENT_NOTE} />
      <InfoCard icon={ShieldCheck} title="Prevention" items={disease.prevention} />
      {disease.spread && (
        <InfoCard icon={Wind} title="How it spreads">
          {disease.spread}
        </InfoCard>
      )}
    </div>
  )
}

/** Plant care tips, shown for a healthy leaf. */
export function CareTips({ items }) {
  return <InfoCard icon={Sprout} title="Keep it healthy" items={items} />
}
