import { Link } from 'react-router'
import { diseases } from '../data/diseases.js'
import LeafPhoto from '../components/LeafPhoto.jsx'
import PageHeader from '../components/PageHeader.jsx'
import TypeChip from '../components/TypeChip.jsx'

export default function LibraryPage() {
  return (
    <div>
      <PageHeader title="Tomato leaf diseases">
        The 10 classes the model knows: 9 diseases and pests, and the healthy leaf. Open one to see its symptoms,
        treatment and prevention.
      </PageHeader>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {diseases.map((d) => (
          <Link
            key={d.slug}
            to={`/diseases/${d.slug}`}
            className="card overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-emerald-500"
          >
            <LeafPhoto disease={d} className="aspect-4/3 w-full" />
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-semibold">{d.name}</h2>
                <TypeChip type={d.type} />
              </div>
              <p className="mt-1.5 text-sm text-stone-600 dark:text-stone-400">{d.short}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
