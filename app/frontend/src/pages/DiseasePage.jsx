import { Link, useParams } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import { diseases } from '../data/diseases.js'
import DiseaseInfo, { CareTips } from '../components/DiseaseInfo.jsx'
import LeafPhoto from '../components/LeafPhoto.jsx'
import TypeChip from '../components/TypeChip.jsx'
import NotFoundPage from './NotFoundPage.jsx'

export default function DiseasePage() {
  const { slug } = useParams()
  const disease = diseases.find((d) => d.slug === slug)
  if (!disease) return <NotFoundPage />

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        to="/diseases"
        className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400"
      >
        <ArrowLeft size={16} /> All diseases
      </Link>

      <div className="card mt-4 overflow-hidden sm:flex">
        <LeafPhoto key={slug} disease={disease} className="aspect-4/3 w-full sm:aspect-square sm:w-64 sm:shrink-0" />
        <div className="p-5 sm:p-6">
          <TypeChip type={disease.type} />
          <h1 className="mt-2 text-3xl font-bold tracking-tight">{disease.name}</h1>
          {disease.cause && <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">{disease.cause}</p>}
          <p className="mt-3 text-stone-700 dark:text-stone-300">{disease.short}</p>
        </div>
      </div>

      <div className="mt-4">{disease.care ? <CareTips items={disease.care} /> : <DiseaseInfo disease={disease} />}</div>
    </div>
  )
}
